import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as Record<string, unknown>
  if (user.role !== "OWNER" && user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { prompt, platform, locationName, tone } = await req.json()
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 })

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Generate a ${tone || "engaging"} ${platform || "social media"} caption for ${locationName || "Salon Envy"} salon. Context: ${prompt}. Include relevant hashtags at the end. Keep it under ${platform === "twitter" ? "280" : "2200"} characters.`,
      }],
      system: "You are a social media expert for Salon Envy, a premium hair salon in Texas. Generate compelling social media captions that drive engagement and bookings. Keep captions authentic, on-brand, and appropriate for the specified platform. Return only the caption text, no explanations.",
    })

    const caption = response.content[0].type === "text" ? response.content[0].text : ""
    return NextResponse.json({ caption })
  } catch (err) {
    console.error("Caption generation error:", err)
    return NextResponse.json({ error: "Failed to generate caption" }, { status: 500 })
  }
}
