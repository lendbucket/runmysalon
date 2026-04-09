import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as Record<string, unknown>).role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  await prisma.socialPost.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ success: true })
}
