import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const { id } = await params
  const body = await req.json()

  const receipt = await prisma.taxReceipt.findFirst({ where: { id, userId } })
  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const businessAmount = body.businessPercent !== undefined
    ? ((body.amount !== undefined ? body.amount : receipt.amount) || 0) * (body.businessPercent / 100)
    : receipt.businessAmount

  const updated = await prisma.taxReceipt.update({
    where: { id },
    data: {
      category: body.category !== undefined ? body.category : receipt.category,
      amount: body.amount !== undefined ? body.amount : receipt.amount,
      businessPercent: body.businessPercent !== undefined ? body.businessPercent : receipt.businessPercent,
      businessAmount,
      description: body.description !== undefined ? body.description : receipt.description,
      vendor: body.vendor !== undefined ? body.vendor : receipt.vendor,
    },
  })
  return NextResponse.json({ receipt: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const { id } = await params

  const receipt = await prisma.taxReceipt.findFirst({ where: { id, userId } })
  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.taxReceipt.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
