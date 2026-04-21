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
  if (!token) return NextResponse.json({ facebook: null, instagram: null, error: "No social token configured" })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let facebook: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let instagram: any = null

  try {
    // Facebook page info
    const pageRes = await fetch(`https://graph.facebook.com/v19.0/${token.fbPageId}?fields=fan_count,followers_count,name&access_token=${token.fbAccessToken}`)
    const pageData = await pageRes.json()

    // Facebook recent posts
    const postsRes = await fetch(`https://graph.facebook.com/v19.0/${token.fbPageId}/posts?fields=message,created_time,likes.summary(true),comments.summary(true),shares&limit=10&access_token=${token.fbAccessToken}`)
    const postsData = await postsRes.json()

    facebook = {
      fanCount: pageData.fan_count || 0,
      followersCount: pageData.followers_count || 0,
      pageName: pageData.name || "",
      recentPosts: (postsData.data || []).map((p: Record<string, unknown>) => ({
        message: (p.message as string || "").slice(0, 100),
        createdTime: p.created_time,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        likes: (p.likes as any)?.summary?.total_count || 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        comments: (p.comments as any)?.summary?.total_count || 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shares: (p.shares as any)?.count || 0,
      })),
    }
  } catch (err) {
    console.error("Facebook insights error:", err)
  }

  try {
    if (token.igAccountId) {
      const igRes = await fetch(`https://graph.facebook.com/v19.0/${token.igAccountId}?fields=followers_count,media_count,name&access_token=${token.fbAccessToken}`)
      const igData = await igRes.json()
      instagram = {
        followersCount: igData.followers_count || 0,
        mediaCount: igData.media_count || 0,
        name: igData.name || "",
      }
    }
  } catch (err) {
    console.error("Instagram insights error:", err)
  }

  return NextResponse.json({ facebook, instagram })
}
