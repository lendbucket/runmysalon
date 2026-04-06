import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string

  let profile = await prisma.insuranceProfile.findUnique({ where: { userId } })
  if (!profile) {
    profile = await prisma.insuranceProfile.create({
      data: { userId, status: "none", provider: "Next Insurance", coverageAmount: 1000000, monthlyPremium: 15 },
    })
  }
  return NextResponse.json({ profile })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const body = await req.json()

  const profile = await prisma.insuranceProfile.upsert({
    where: { userId },
    update: { ...body, updatedAt: new Date() },
    create: { userId, ...body },
  })
  return NextResponse.json({ profile })
}
