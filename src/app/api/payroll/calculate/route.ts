import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SquareClient, SquareEnvironment } from "square"
import { TEAM_MEMBERS, CC_LOCATION_ID, SA_LOCATION_ID } from "@/lib/payrollUtils"

function getSquare() {
  return new SquareClient({ token: process.env.SQUARE_ACCESS_TOKEN!, environment: SquareEnvironment.Production })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (session.user as Record<string, unknown>).role as string
  if (role !== "OWNER" && role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { locationId, start, end } = await req.json()
  const sqLocId = locationId === "CC" ? CC_LOCATION_ID : SA_LOCATION_ID
  const startDate = new Date(start)
  const endDate = new Date(end)
  const square = getSquare()

  const members = Object.entries(TEAM_MEMBERS).filter(([, v]) => v.location === locationId)
  const data: Record<string, { name: string; serviceCount: number; serviceSubtotal: number; tips: number }> = {}
  for (const [id, v] of members) data[id] = { name: v.name, serviceCount: 0, serviceSubtotal: 0, tips: 0 }

  // Fetch bookings for team member attribution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings: { teamMemberId: string; startAt: Date }[] = []
  let chunkStart = new Date(startDate)
  while (chunkStart < endDate) {
    const chunkEnd = new Date(chunkStart); chunkEnd.setDate(chunkEnd.getDate() + 28)
    if (chunkEnd > endDate) chunkEnd.setTime(endDate.getTime())
    let page = await square.bookings.list({ startAtMin: chunkStart.toISOString(), startAtMax: chunkEnd.toISOString(), locationId: sqLocId, limit: 200 })
    for (const b of page.data) {
      const tm = b.appointmentSegments?.[0]?.teamMemberId
      if (tm && data[tm] && b.startAt && b.status === "ACCEPTED") bookings.push({ teamMemberId: tm, startAt: new Date(b.startAt) })
    }
    while (page.hasNextPage()) { page = await page.getNextPage(); for (const b of page.data) { const tm = b.appointmentSegments?.[0]?.teamMemberId; if (tm && data[tm] && b.startAt && b.status === "ACCEPTED") bookings.push({ teamMemberId: tm, startAt: new Date(b.startAt) }) } }
    chunkStart = new Date(chunkEnd)
  }

  // Fetch completed orders with pagination
  let orderCursor: string | undefined
  do {
    const ordersRes = await square.orders.search({
      locationIds: [sqLocId],
      query: { filter: { dateTimeFilter: { closedAt: { startAt: startDate.toISOString(), endAt: endDate.toISOString() } }, stateFilter: { states: ["COMPLETED"] } } },
      limit: 500,
      cursor: orderCursor,
    })
    for (const o of (ordersRes.orders || [])) {
      // Match order to team member via booking time proximity
      const orderTime = new Date(o.closedAt || o.createdAt || "")
      let tm: string | undefined
      for (const b of bookings) {
        const diff = (orderTime.getTime() - b.startAt.getTime()) / 3600000
        if (diff >= -0.5 && diff <= 5) { tm = b.teamMemberId; break }
      }
      if (!tm || !data[tm]) continue

      // Sum service line items (gross_sales_money)
      for (const li of (o.lineItems || [])) {
        const amt = Number(li.grossSalesMoney?.amount || li.totalMoney?.amount || 0) / 100
        if (amt > 0) { data[tm].serviceSubtotal += amt; data[tm].serviceCount++ }
      }
      // Tips
      data[tm].tips += Number(o.totalTipMoney?.amount || 0) / 100
    }
    orderCursor = ordersRes.cursor || undefined
  } while (orderCursor)

  // Upsert period
  let period = await prisma.payrollPeriod.findFirst({ where: { locationId, periodStart: startDate, periodEnd: endDate } })
  let totalComm = 0, totalTips = 0, totalSvc = 0
  const entries = Object.entries(data).map(([id, d]) => {
    const comm = Math.round(d.serviceSubtotal * 0.40 * 100) / 100
    totalComm += comm; totalTips += d.tips; totalSvc += d.serviceCount
    return { teamMemberId: id, teamMemberName: d.name, locationId, serviceCount: d.serviceCount, serviceSubtotal: Math.round(d.serviceSubtotal * 100) / 100, commission: comm, tips: Math.round(d.tips * 100) / 100, totalPayout: Math.round((comm + d.tips) * 100) / 100 }
  })

  if (period) {
    await prisma.payrollEntry.deleteMany({ where: { periodId: period.id } })
    period = await prisma.payrollPeriod.update({ where: { id: period.id }, data: { totalCommission: Math.round(totalComm * 100) / 100, totalTips: Math.round(totalTips * 100) / 100, totalServices: totalSvc, updatedAt: new Date() } })
  } else {
    period = await prisma.payrollPeriod.create({ data: { locationId, periodStart: startDate, periodEnd: endDate, status: "pending", totalCommission: Math.round(totalComm * 100) / 100, totalTips: Math.round(totalTips * 100) / 100, totalServices: totalSvc } })
  }

  await prisma.payrollEntry.createMany({ data: entries.map(e => ({ ...e, periodId: period!.id })) })
  const result = await prisma.payrollPeriod.findUnique({ where: { id: period.id }, include: { entries: { orderBy: { commission: "desc" } } } })
  return NextResponse.json({ period: result })
}
