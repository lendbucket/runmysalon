import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Prisma } from "@prisma/client"
import Anthropic from "@anthropic-ai/sdk"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"

const EXTRACTION_SYSTEM_PROMPT = `You are an insight extraction engine for Salon Envy, a salon business. Given a conversation between a user and Reyna AI (the salon's AI assistant), extract structured insights.

Return ONLY valid JSON with this exact shape:
{
  "topics": ["string array of topics discussed, e.g. color_correction, pricing, scheduling, client_retention"],
  "insights": [
    {
      "category": "business_pattern" | "faq" | "preference" | "insight" | "metric_trend",
      "key": "unique_snake_case_identifier",
      "summary": "concise description of the insight",
      "value": { any structured data relevant to this insight },
      "confidence": 0.0-1.0
    }
  ]
}

Categories:
- business_pattern: recurring operational patterns (e.g. frequent cancellations on Mondays)
- faq: questions asked repeatedly by staff
- preference: user/stylist preferences for formulas, techniques, products
- insight: actionable business intelligence derived from the conversation
- metric_trend: trends in revenue, bookings, client counts, etc.

Rules:
- Extract 1-5 insights per conversation (only meaningful ones)
- Use descriptive, unique keys (e.g. "shades_eq_level9_yellow_correction", "monday_cancellation_pattern")
- Confidence: 0.9+ for explicit statements, 0.5-0.8 for inferred patterns, below 0.5 for weak signals
- Do NOT extract trivial greetings or generic questions as insights
- If the conversation has no extractable insights, return {"topics": [...], "insights": []}`

interface ConversationMessage {
  role: string
  content: string
  timestamp?: string
}

interface ExtractedInsight {
  category: string
  key: string
  summary: string
  value: Record<string, unknown>
  confidence: number
}

interface ExtractionResult {
  topics: string[]
  insights: ExtractedInsight[]
}

export async function POST(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const key = process.env.ANTHROPIC_API_KEY?.trim()
    if (!key || key === "your-key-here" || key === "your-anthropic-api-key-here") {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 503 }
      )
    }

    let body: {
      sessionId?: string
      userId?: string
      locationId?: string
      messages?: ConversationMessage[]
      userIntent?: string
    }

    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { sessionId, userId, locationId, messages, userIntent } = body

    if (!sessionId || !userId || !messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "sessionId, userId, and messages are required" },
        { status: 400 }
      )
    }

    // 1. Upsert conversation into ReynaConversation
    await prisma.reynaConversation.upsert({
      where: { sessionId },
      create: {
        sessionId,
        userId,
        locationId: locationId || null,
        messages: messages as unknown as Prisma.InputJsonValue,
        topics: [],
        userIntent: userIntent || null,
      },
      update: {
        messages: messages as unknown as Prisma.InputJsonValue,
        userIntent: userIntent || null,
      },
    })

    // 2. Use Anthropic API to extract insights
    const client = new Anthropic({ apiKey: key })

    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n\n")

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extract insights from this conversation:\n\n${conversationText}`,
        },
      ],
    })

    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")

    let extraction: ExtractionResult
    try {
      extraction = JSON.parse(responseText)
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        extraction = JSON.parse(jsonMatch[1].trim())
      } else {
        console.error("Failed to parse extraction response:", responseText)
        extraction = { topics: [], insights: [] }
      }
    }

    // 3. Update ReynaConversation with extracted topics and insights
    await prisma.reynaConversation.update({
      where: { sessionId },
      data: {
        topics: extraction.topics || [],
        insights: extraction.insights as unknown as Prisma.InputJsonValue,
      },
    })

    // 4. Upsert each insight into ReynaKnowledge
    const knowledgeResults = []
    for (const insight of extraction.insights) {
      const validCategories = ["business_pattern", "faq", "preference", "insight", "metric_trend"]
      if (!validCategories.includes(insight.category)) continue

      try {
        // Check if existing entry exists (use findFirst for nullable composite unique)
        const existing = await prisma.reynaKnowledge.findFirst({
          where: {
            category: insight.category,
            key: insight.key,
            locationId: locationId || null,
          },
        })

        let result
        if (existing) {
          result = await prisma.reynaKnowledge.update({
            where: { id: existing.id },
            data: {
              value: insight.value as unknown as Prisma.InputJsonValue,
              confidence: Math.min(
                1.0,
                existing.confidence + insight.confidence * 0.1
              ),
              sourceCount: existing.sourceCount + 1,
              lastUpdated: new Date(),
            },
          })
        } else {
          result = await prisma.reynaKnowledge.create({
            data: {
              category: insight.category,
              key: insight.key,
              value: insight.value as unknown as Prisma.InputJsonValue,
              confidence: insight.confidence,
              sourceCount: 1,
              locationId: locationId || null,
              lastUpdated: new Date(),
            },
          })
        }

        knowledgeResults.push({
          category: insight.category,
          key: insight.key,
          action: existing ? "updated" : "created",
          id: result.id,
        })
      } catch (err) {
        console.error(`Failed to upsert knowledge entry ${insight.key}:`, err)
      }
    }

    return NextResponse.json({
      sessionId,
      topics: extraction.topics,
      insightsExtracted: extraction.insights.length,
      knowledgeUpdates: knowledgeResults,
    })
  } catch (error: unknown) {
    console.error("Extract insights error:", error)
    const errMsg = error instanceof Error ? error.message : "Extraction error"
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

