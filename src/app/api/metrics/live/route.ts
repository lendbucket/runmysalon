import { NextRequest, NextResponse } from "next/server"
import { getMetricsByPeriod } from "@/lib/square-metrics"

export async function GET(req: NextRequest) {
  const period = (req.nextUrl.searchParams.get("period") || "week") as "week" | "month" | "year"
  const loc = req.nextUrl.searchParams.get("location") as "Corpus Christi" | "San Antonio" | undefined

  try {
    const metrics = await getMetricsByPeriod(period, loc || undefined)
    return NextResponse.json({ metrics })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
