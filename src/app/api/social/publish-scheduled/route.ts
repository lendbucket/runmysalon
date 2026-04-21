import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
import { NextResponse } from "next/server"
export async function POST() {
  const { db: prisma } = await getTenantPrisma()
  const now = new Date()
  const duePosts = await prisma.socialPost.findMany({
    where: { status: "scheduled", scheduledAt: { lte: now } },
  })

  const results = []
  for (const post of duePosts) {
    try {
      // Mark as published — actual Meta API publishing would go here
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "published", publishedAt: new Date() },
      })
      results.push({ id: post.id, success: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "failed", errorMessage: msg },
      })
      results.push({ id: post.id, success: false, error: msg })
    }
  }

  return NextResponse.json({ published: results.length, results })
}
