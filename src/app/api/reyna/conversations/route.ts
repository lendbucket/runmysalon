import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as Record<string, unknown>
    const role = user.role as string
    const currentUserId = user.id as string

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const locationId = searchParams.get("locationId")
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50)

    // Build where clause with role-based access control
    const where: Record<string, unknown> = {}

    if (role === "OWNER") {
      // Owner can see all conversations, optionally filtered
      if (userId) where.userId = userId
      if (locationId) where.locationId = locationId
    } else if (role === "MANAGER") {
      // Manager sees their location's conversations
      const managerLocationId = user.locationId as string
      if (locationId && locationId !== managerLocationId) {
        return NextResponse.json(
          { error: "You can only view conversations for your location." },
          { status: 403 }
        )
      }
      where.locationId = managerLocationId
      if (userId) where.userId = userId
    } else {
      // STYLIST can only see their own conversations
      if (userId && userId !== currentUserId) {
        return NextResponse.json(
          { error: "You can only view your own conversations." },
          { status: 403 }
        )
      }
      where.userId = currentUserId
    }

    const conversations = await prisma.reynaConversation.findMany({
      where,
      select: {
        id: true,
        sessionId: true,
        userId: true,
        locationId: true,
        topics: true,
        userIntent: true,
        resolved: true,
        feedbackRating: true,
        createdAt: true,
        updatedAt: true,
        // Exclude full messages for the list view (they can be large)
        // Include insights summary
        insights: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({
      conversations,
      count: conversations.length,
    })
  } catch (error: unknown) {
    console.error("Conversations API error:", error)
    const errMsg = error instanceof Error ? error.message : "Conversations API error"
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
