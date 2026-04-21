import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SquareClient, SquareEnvironment } from "square"
import { CC_LOCATION_ID, SA_LOCATION_ID } from "@/lib/staff"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"

const LOCATION_IDS = [CC_LOCATION_ID, SA_LOCATION_ID] as const

function getSquare() {
  return new SquareClient({ token: process.env.SQUARE_ACCESS_TOKEN!, environment: SquareEnvironment.Production })
}

/** Legacy GET endpoint — kept for backwards compatibility with dashboard */
export async function GET(request: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as Record<string, unknown>
  if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  let startParam = searchParams.get("start")
  let endParam = searchParams.get("end")

  if (!startParam || !endParam) {
    // Default to current Wed-Tue period
    const now = new Date()
    const cst = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }))
    const day = cst.getDay()
    const daysBack = day >= 3 ? day - 3 : day + 4
    const wed = new Date(cst); wed.setDate(cst.getDate() - daysBack)
    const tue = new Date(wed); tue.setDate(wed.getDate() + 6)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    startParam = fmt(wed); endParam = fmt(tue)
  }

  const staffMembers = await prisma.staffMember.findMany({
    where: { isActive: true, squareTeamMemberId: { not: null } },
    select: { squareTeamMemberId: true, fullName: true, location: { select: { name: true } } },
  })

  const TEAM: Record<string, { name: string; location: string }> = {}
  for (const s of staffMembers) {
    if (s.squareTeamMemberId) TEAM[s.squareTeamMemberId] = { name: s.fullName, location: s.location.name }
  }

  const startAt = new Date(`${startParam}T00:00:00-06:00`).toISOString()
  const endAt = new Date(`${endParam}T23:59:59-06:00`).toISOString()
  const square = getSquare()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookings: { teamMemberId: string; startAt: Date }[] = []
    const startDate = new Date(startAt); const endDate = new Date(endAt)
    let chunkStart = new Date(startDate)
    while (chunkStart < endDate) {
      const chunkEnd = new Date(chunkStart); chunkEnd.setDate(chunkEnd.getDate() + 28)
      if (chunkEnd > endDate) chunkEnd.setTime(endDate.getTime())
      let page = await square.bookings.list({ startAtMin: chunkStart.toISOString(), startAtMax: chunkEnd.toISOString(), limit: 200 })
      for (const b of page.data) { const tm = b.appointmentSegments?.[0]?.teamMemberId; if (tm && TEAM[tm] && b.startAt && b.status === "ACCEPTED") bookings.push({ teamMemberId: tm, startAt: new Date(b.startAt) }) }
      while (page.hasNextPage()) { page = await page.getNextPage(); for (const b of page.data) { const tm = b.appointmentSegments?.[0]?.teamMemberId; if (tm && TEAM[tm] && b.startAt && b.status === "ACCEPTED") bookings.push({ teamMemberId: tm, startAt: new Date(b.startAt) }) } }
      chunkStart = new Date(chunkEnd)
    }

    interface OrderEntry { subtotal: number; tip: number; createdAt: Date; locationId: string }
    const orders: OrderEntry[] = []
    let ordersCursor: string | undefined
    do {
      const ordersRes = await square.orders.search({ locationIds: [...LOCATION_IDS], query: { filter: { dateTimeFilter: { closedAt: { startAt, endAt } }, stateFilter: { states: ["COMPLETED"] } } }, limit: 500, cursor: ordersCursor })
      for (const o of (ordersRes.orders || [])) {
        const totalAmt = Number(o.totalMoney?.amount || 0); const taxAmt = Number(o.totalTaxMoney?.amount || 0); const tipAmt = Number(o.totalTipMoney?.amount || 0)
        const subtotal = (totalAmt - taxAmt - tipAmt) / 100; const tip = tipAmt / 100
        if (subtotal > 0 && (o.closedAt || o.createdAt)) orders.push({ subtotal, tip, createdAt: new Date(o.closedAt || o.createdAt!), locationId: o.locationId || "" })
      }
      ordersCursor = ordersRes.cursor || undefined
    } while (ordersCursor)

    const data: Record<string, { services: number; subtotal: number; tips: number }> = {}
    for (const id of Object.keys(TEAM)) data[id] = { services: 0, subtotal: 0, tips: 0 }
    for (const b of bookings) data[b.teamMemberId].services += 1
    const used = new Set<number>()
    for (const order of orders) {
      let best: { idx: number; diff: number } | null = null
      for (let i = 0; i < bookings.length; i++) { if (used.has(i)) continue; const d = order.createdAt.getTime() - bookings[i].startAt.getTime(); const h = d / 3600000; if (h >= -0.5 && h <= 5) { if (!best || Math.abs(d) < Math.abs(best.diff)) best = { idx: i, diff: d } } }
      if (best) { used.add(best.idx); data[bookings[best.idx].teamMemberId].subtotal += order.subtotal; data[bookings[best.idx].teamMemberId].tips += order.tip }
    }

    const payroll = Object.entries(TEAM).map(([id, info]) => ({
      teamMemberId: id, name: info.name, location: info.location, services: data[id].services,
      subtotal: Math.round(data[id].subtotal * 100) / 100, commission: Math.round(data[id].subtotal * 0.40 * 100) / 100,
      tips: Math.round(data[id].tips * 100) / 100, totalPay: Math.round((data[id].subtotal * 0.40 + data[id].tips) * 100) / 100,
    }))

    return NextResponse.json({ period: { start: startParam, end: endParam }, payroll, paidInfo: null })
  } catch (error) {
    console.error("Payroll API error:", error)
    return NextResponse.json({ error: "Failed to compute payroll" }, { status: 500 })
  }
}
