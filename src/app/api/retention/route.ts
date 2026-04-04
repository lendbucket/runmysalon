import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/api-auth"
import { getAllRetentionData } from "@/lib/square-retention"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const { response } = await requireSession()
  if (response) return response

  const location = req.nextUrl.searchParams.get("location") as
    | "Corpus Christi"
    | "San Antonio"
    | null

  try {
    console.log("Starting retention analysis for location:", location || "Both")
    const data = await getAllRetentionData(location || undefined)
    console.log("Retention analysis complete:", {
      totalCustomers: data.totalCustomers,
      retentionScore: data.retentionScore,
    })
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("Retention API error:", error)
    const msg = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined
    return NextResponse.json(
      { error: msg, details: String(error), stack },
      { status: 500 }
    )
  }
}
