import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function GET(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const locationId = req.nextUrl.searchParams.get("locationId")
  const status = req.nextUrl.searchParams.get("status")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (locationId) where.locationId = locationId
  if (status) where.status = status

  const periods = await prisma.payrollPeriod.findMany({
    where,
    include: { entries: { orderBy: { commission: "desc" } } },
    orderBy: { periodStart: "desc" },
    take: 20,
  })

  return NextResponse.json({ periods })
}
