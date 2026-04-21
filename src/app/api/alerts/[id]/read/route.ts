import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const { id } = await params

  await prisma.alertRead.upsert({
    where: { alertId_userId: { alertId: id, userId } },
    update: { readAt: new Date() },
    create: { alertId: id, userId },
  })

  return NextResponse.json({ success: true })
}
