import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function GET(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as Record<string, unknown>
  if (user.role !== "OWNER" && user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const locationId = req.nextUrl.searchParams.get("locationId")
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 })

  const token = await prisma.socialToken.findUnique({ where: { locationId } })
  if (!token) return NextResponse.json({ comments: [], error: "No social token" })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comments: any[] = []

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${token.fbPageId}/feed?fields=comments{message,from,created_time,id},message,created_time&limit=25&access_token=${token.fbAccessToken}`
    )
    const data = await res.json()
    for (const post of (data.data || [])) {
      for (const c of (post.comments?.data || [])) {
        // Upsert into DB for tracking
        const existing = await prisma.socialComment.findFirst({ where: { externalId: c.id, locationId } })
        const record = existing || await prisma.socialComment.create({
          data: {
            platform: "facebook",
            externalId: c.id,
            postId: post.id,
            authorName: c.from?.name || "Unknown",
            message: c.message || "",
            locationId,
            createdAt: c.created_time ? new Date(c.created_time) : new Date(),
          },
        })
        comments.push({
          id: record.id,
          externalId: c.id,
          platform: "facebook",
          authorName: c.from?.name || "Unknown",
          message: c.message || "",
          postMessage: (post.message || "").slice(0, 80),
          createdAt: c.created_time || record.createdAt,
          replied: record.replied,
          replyText: record.replyText,
          repliedAt: record.repliedAt,
        })
      }
    }
  } catch (err) {
    console.error("Comments fetch error:", err)
  }

  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as Record<string, unknown>
  if (user.role !== "OWNER" && user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { commentId, replyText, locationId, externalCommentId } = await req.json()
  if (!replyText || !locationId || !externalCommentId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const token = await prisma.socialToken.findUnique({ where: { locationId } })
  if (!token) return NextResponse.json({ error: "No social token" }, { status: 400 })

  try {
    await fetch(`https://graph.facebook.com/v19.0/${externalCommentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyText, access_token: token.fbAccessToken }),
    })

    if (commentId) {
      await prisma.socialComment.update({
        where: { id: commentId },
        data: { replied: true, replyText, repliedAt: new Date() },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Reply error:", err)
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 })
  }
}
