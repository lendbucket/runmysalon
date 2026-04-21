import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function GET(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const { searchParams } = new URL(req.url)
  const year = searchParams.get("year") || new Date().getFullYear().toString()

  const otherIncome = await prisma.otherIncome.findMany({
    where: { userId, taxYear: parseInt(year) },
    orderBy: { date: "desc" },
  })
  return NextResponse.json({ otherIncome })
}

export async function POST(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const body = await req.json()

  const income = await prisma.otherIncome.create({
    data: {
      userId,
      source: body.source,
      amount: parseFloat(body.amount),
      date: new Date(body.date),
      notes: body.notes || null,
      taxYear: body.taxYear || new Date().getFullYear(),
    },
  })
  return NextResponse.json({ income })
}
