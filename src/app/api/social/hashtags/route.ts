import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { topic, platform } = await req.json()
  if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 })

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Generate 15-20 relevant hashtags for a ${platform || "Instagram"} post about: ${topic}. Focus on beauty, hair, salon, Texas local, and engagement hashtags. Return only the hashtags separated by spaces, no explanation.`,
      }],
      system: "You are a social media hashtag expert for beauty and salon industry content. Return only hashtags, nothing else.",
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const hashtags = text.split(/\s+/).filter((h: string) => h.startsWith("#"))
    return NextResponse.json({ hashtags })
  } catch (err) {
    console.error("Hashtag generation error:", err)
    return NextResponse.json({ error: "Failed to generate hashtags" }, { status: 500 })
  }
}
