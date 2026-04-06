import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const { id } = await params

  const log = await prisma.mileageLog.findFirst({ where: { id, userId } })
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.mileageLog.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
