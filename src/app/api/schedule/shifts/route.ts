import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
interface ShiftInput {
  staffMemberId: string
  date: string
  startTime: string
  endTime: string
  isTimeOff?: boolean
  notes?: string
}

export async function POST(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { scheduleId, shifts } = (await req.json()) as { scheduleId: string; shifts: ShiftInput[] }

  await prisma.shift.deleteMany({ where: { scheduleId } })

  const created = await prisma.shift.createMany({
    data: shifts.map((s) => ({
      scheduleId,
      staffMemberId: s.staffMemberId,
      date: new Date(s.date),
      startTime: s.startTime,
      endTime: s.endTime,
      isTimeOff: s.isTimeOff || false,
      notes: s.notes || null,
    })),
  })

  return NextResponse.json({ created })
}
