import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const period = await prisma.payrollPeriod.findUnique({ where: { id }, include: { entries: { orderBy: { commission: "desc" } } } })
  if (!period) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ period })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (session.user as Record<string, unknown>).role as string
  if (role !== "OWNER" && role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const userId = (session.user as Record<string, unknown>).id as string
  const period = await prisma.payrollPeriod.update({
    where: { id },
    data: { status: body.status || "paid", paidAt: body.status === "paid" ? new Date() : null, paidBy: body.status === "paid" ? userId : null, notes: body.notes, updatedAt: new Date() },
    include: { entries: { orderBy: { commission: "desc" } } },
  })
  return NextResponse.json({ period })
}
