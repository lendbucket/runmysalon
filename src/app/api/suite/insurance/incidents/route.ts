import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function GET(_req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string

  const incidents = await prisma.incidentReport.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ incidents })
}

export async function POST(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const body = await req.json()

  const incident = await prisma.incidentReport.create({
    data: {
      userId,
      incidentDate: new Date(body.incidentDate),
      clientName: body.clientName || null,
      incidentType: body.incidentType,
      description: body.description,
      witnessName: body.witnessName || null,
      witnessContact: body.witnessContact || null,
      medicalAttention: body.medicalAttention || false,
      claimFiled: false,
      status: "documented",
    },
  })
  return NextResponse.json({ incident })
}
