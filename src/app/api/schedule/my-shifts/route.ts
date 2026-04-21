import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function GET() {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const staffMember = await prisma.staffMember.findFirst({
    where: {
      OR: [
        { email: session.user.email },
        { userId: (session.user as { id?: string }).id },
      ],
    },
  })

  if (!staffMember) {
    return NextResponse.json({ shifts: [] })
  }

  const now = new Date()
  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const fourWeeksAhead = new Date(now)
  fourWeeksAhead.setDate(fourWeeksAhead.getDate() + 28)

  const shifts = await prisma.shift.findMany({
    where: {
      staffMemberId: staffMember.id,
      schedule: { status: "approved" },
      date: {
        gte: twoWeeksAgo,
        lte: fourWeeksAhead,
      },
    },
    include: {
      schedule: {
        include: { location: true },
      },
    },
    orderBy: { date: "asc" },
  })

  const formatted = shifts.map(s => ({
    id: s.id,
    date: s.date.toISOString().split("T")[0],
    startTime: s.startTime,
    endTime: s.endTime,
    isTimeOff: s.isTimeOff,
    schedule: {
      location: { name: s.schedule.location.name },
    },
  }))

  return NextResponse.json({ shifts: formatted })
}
