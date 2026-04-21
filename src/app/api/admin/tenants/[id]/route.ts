import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      memberships: { include: { user: { select: { id: true, email: true, name: true } } } },
      branding: true,
      subscription: true,
      posConnections: true,
    },
  })
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ tenant })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const tenant = await prisma.tenant.update({
    where: { id },
    data: body,
  })

  return NextResponse.json({ tenant })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.tenant.update({
    where: { id },
    data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: "Deleted by admin" },
  })

  return NextResponse.json({ success: true })
}
