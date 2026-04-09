import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatPeriodLabel } from "@/lib/payrollUtils"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const periodId = req.nextUrl.searchParams.get("periodId")
  if (!periodId) return NextResponse.json({ error: "No periodId" }, { status: 400 })

  const period = await prisma.payrollPeriod.findUnique({ where: { id: periodId }, include: { entries: { orderBy: { commission: "desc" } } } })
  if (!period) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const label = formatPeriodLabel(period.periodStart, period.periodEnd)
  const loc = period.locationId === "CC" ? "Corpus Christi" : "San Antonio"

  const rows = [
    [`Salon Envy ${loc} — Payroll: ${label}`],
    [`Status: ${period.status.toUpperCase()}`],
    [],
    ["Stylist", "Services", "Service Subtotal", "Commission (40%)", "Tips", "Total Payout"],
    ...period.entries.map(e => [e.teamMemberName, String(e.serviceCount), `$${e.serviceSubtotal.toFixed(2)}`, `$${e.commission.toFixed(2)}`, `$${e.tips.toFixed(2)}`, `$${e.totalPayout.toFixed(2)}`]),
    [],
    ["TOTAL", String(period.totalServices), "", `$${period.totalCommission.toFixed(2)}`, `$${period.totalTips.toFixed(2)}`, `$${(period.totalCommission + period.totalTips).toFixed(2)}`],
  ]

  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="payroll-${period.locationId}-${period.periodStart.toISOString().split("T")[0]}.csv"` } })
}
