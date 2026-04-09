import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as Record<string, unknown>
  if (user.role !== "OWNER" && user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const locationId = searchParams.get("locationId")
  const status = searchParams.get("status")
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
  const page = parseInt(searchParams.get("page") || "1")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (locationId) where.locationId = locationId
  if (status) where.status = status

  const [posts, total] = await Promise.all([
    prisma.socialPost.findMany({
      where,
      include: { location: { select: { name: true } }, createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.socialPost.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as Record<string, unknown>
  if (user.role !== "OWNER" && user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { message, platform, locationId, scheduledAt, imageUrl } = await req.json()
  if (!message || !platform || !locationId) return NextResponse.json({ error: "message, platform, locationId required" }, { status: 400 })

  // Create draft
  let post = await prisma.socialPost.create({
    data: {
      platform,
      message,
      imageUrl: imageUrl || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt && new Date(scheduledAt) > new Date() ? "scheduled" : "draft",
      locationId,
      createdById: user.id as string,
    },
  })

  // Publish immediately if no future schedule
  if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
    const token = await prisma.socialToken.findUnique({ where: { locationId } })
    if (!token) return NextResponse.json({ error: "No social token for this location. Configure Meta API credentials first." }, { status: 400 })

    let fbPostId: string | null = null
    let igPostId: string | null = null

    try {
      // Facebook
      if (platform === "facebook" || platform === "both") {
        const fbRes = await fetch(`https://graph.facebook.com/v19.0/${token.fbPageId}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, access_token: token.fbAccessToken }),
        })
        const fbData = await fbRes.json()
        if (fbData.id) fbPostId = fbData.id
      }

      // Instagram
      if ((platform === "instagram" || platform === "both") && token.igAccountId) {
        // Step 1: Create media container
        const containerRes = await fetch(`https://graph.facebook.com/v19.0/${token.igAccountId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caption: message, access_token: token.fbAccessToken, ...(imageUrl ? { image_url: imageUrl } : {}) }),
        })
        const containerData = await containerRes.json()
        if (containerData.id) {
          // Step 2: Publish
          const publishRes = await fetch(`https://graph.facebook.com/v19.0/${token.igAccountId}/media_publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creation_id: containerData.id, access_token: token.fbAccessToken }),
          })
          const publishData = await publishRes.json()
          if (publishData.id) igPostId = publishData.id
        }
      }

      post = await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "published", postedAt: new Date(), fbPostId, igPostId },
      })
    } catch (err) {
      console.error("Social publish error:", err)
      return NextResponse.json({ post, error: "Post created but publishing failed" })
    }
  }

  return NextResponse.json({ post })
}
