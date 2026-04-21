import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function GET(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = session.user as { role?: string }
  if (!user.role || !["OWNER", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const locationId = searchParams.get("locationId") || undefined
  const status = searchParams.get("status") || undefined
  const ratingParam = searchParams.get("rating")
  const rating = ratingParam ? parseInt(ratingParam, 10) : undefined
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200)
  const offset = parseInt(searchParams.get("offset") || "0", 10)

  // Build where clause
  const where: Record<string, unknown> = {}
  if (locationId) where.locationId = locationId
  if (status) where.status = status
  if (rating !== undefined && !isNaN(rating)) where.rating = rating

  const [requests, totalCount] = await Promise.all([
    prisma.reviewRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.reviewRequest.count({ where }),
  ])

  // Compute aggregate stats (across the filtered location, ignoring status/rating filters for stats)
  const statsWhere: Record<string, unknown> = {}
  if (locationId) statsWhere.locationId = locationId

  const [totalSent, respondedCount, ratingAgg, googleReviewCount] = await Promise.all([
    prisma.reviewRequest.count({
      where: { ...statsWhere, status: "sent" },
    }),
    prisma.reviewRequest.count({
      where: { ...statsWhere, responseAt: { not: null } },
    }),
    prisma.reviewRequest.aggregate({
      where: { ...statsWhere, rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.reviewRequest.count({
      where: { ...statsWhere, googleReviewSent: true },
    }),
  ])

  const responseRate = totalSent > 0 ? Math.round((respondedCount / totalSent) * 100) : 0
  const avgRating = ratingAgg._avg.rating
    ? Math.round(ratingAgg._avg.rating * 10) / 10
    : null

  return NextResponse.json({
    requests,
    total: totalCount,
    stats: {
      totalSent,
      responseRate,
      avgRating,
      googleReviewCount,
      totalResponses: respondedCount,
    },
  })
}
