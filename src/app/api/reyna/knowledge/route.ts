import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function GET(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as Record<string, unknown>
    const role = user.role as string

    // OWNER/MANAGER only
    if (role !== "OWNER" && role !== "MANAGER") {
      return NextResponse.json(
        { error: "Insufficient permissions. OWNER or MANAGER role required." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get("locationId")
    const category = searchParams.get("category")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100)

    // Build where clause
    const where: Record<string, unknown> = {}

    if (locationId) {
      where.locationId = locationId
    } else if (role === "MANAGER") {
      // Managers can only see their own location
      where.locationId = user.locationId as string
    }

    if (category) {
      const validCategories = ["business_pattern", "faq", "preference", "insight", "metric_trend"]
      if (validCategories.includes(category)) {
        where.category = category
      }
    }

    const entries = await prisma.reynaKnowledge.findMany({
      where,
      orderBy: [
        { confidence: "desc" },
        { sourceCount: "desc" },
      ],
      take: limit,
    })

    return NextResponse.json({
      entries,
      count: entries.length,
    })
  } catch (error: unknown) {
    console.error("Knowledge API error:", error)
    const errMsg = error instanceof Error ? error.message : "Knowledge API error"
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
