import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const key = process.env.ANTHROPIC_API_KEY?.trim()
    if (!key || key === "your-key-here") {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 })
    }

    const { currentMetrics, previousMetrics, period, question } = await req.json()

    const systemPrompt = `You are a salon business analyst for Salon Envy\u00ae, a premium hair salon with two locations in Texas (Corpus Christi and San Antonio). You analyze Square POS data and provide actionable business insights. Be specific, data-driven, and practical. Keep responses concise \u2014 3-5 bullet points max unless asked for more detail.`

    interface MetricSummary { location: string; revenue: number; serviceCount: number; avgTicket: number; stylistBreakdown: Array<{ name: string; revenue: number; serviceCount: number }> }

    const dataContext = `
CURRENT PERIOD (${period}):
${(currentMetrics as MetricSummary[]).map((m) => `
${m.location}: $${m.revenue.toFixed(0)} revenue, ${m.serviceCount} services, $${m.avgTicket.toFixed(0)} avg ticket
Top stylists: ${m.stylistBreakdown.slice(0, 3).map((s) => `${s.name} ($${s.revenue.toFixed(0)}, ${s.serviceCount} svcs)`).join(", ")}
`).join("")}

PREVIOUS PERIOD:
${(previousMetrics as MetricSummary[]).map((m) => `
${m.location}: $${m.revenue.toFixed(0)} revenue, ${m.serviceCount} services, $${m.avgTicket.toFixed(0)} avg ticket
`).join("")}

REVENUE CHANGES:
${(currentMetrics as MetricSummary[]).map((m) => {
  const prev = (previousMetrics as MetricSummary[]).find((p) => p.location === m.location)
  if (!prev || prev.revenue === 0) return `${m.location}: No previous data`
  const change = ((m.revenue - prev.revenue) / prev.revenue * 100).toFixed(1)
  return `${m.location}: ${Number(change) >= 0 ? "+" : ""}${change}% vs previous period`
}).join("\n")}
`

    const userMessage = question || "Analyze this salon performance data and give me the top 3-5 actionable insights to improve revenue. Focus on what's working, what needs attention, and specific actions the managers should take this week."

    const client = new Anthropic({ apiKey: key })
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: dataContext + "\n\n" + userMessage }],
    })

    const insight = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")

    return NextResponse.json({ insight })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
