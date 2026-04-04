import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getComparisonMetrics } from "@/lib/square-metrics"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const period = req.nextUrl.searchParams.get("period") || "30days"
    const role = (session.user as any).role as string
    const sessionLocationName = (session.user as any).locationName as string | undefined

    // MANAGER: forced to their own location
    let loc: string | null
    if (role === "MANAGER" && sessionLocationName) {
      loc = sessionLocationName
    } else {
      loc = req.nextUrl.searchParams.get("location")
    }

    const data = await getComparisonMetrics(
      period,
      loc === "Corpus Christi" || loc === "San Antonio" ? loc : undefined
    )
    return NextResponse.json(data)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
