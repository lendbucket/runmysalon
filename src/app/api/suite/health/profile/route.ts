import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function GET(_req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string

  let profile = await prisma.healthProfile.findUnique({ where: { userId } })
  if (!profile) {
    profile = await prisma.healthProfile.create({
      data: { userId, enrollmentStatus: "none" },
    })
  }
  return NextResponse.json({ profile })
}

export async function PATCH(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const body = await req.json()

  const profile = await prisma.healthProfile.upsert({
    where: { userId },
    update: { ...body, updatedAt: new Date() },
    create: { userId, ...body },
  })
  return NextResponse.json({ profile })
}
