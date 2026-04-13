import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as Record<string, unknown>).role as string
  const userLocationId = (session.user as Record<string, unknown>).locationId as string | undefined

  let locationId = req.nextUrl.searchParams.get("locationId")
  if (role === "MANAGER" && userLocationId) locationId = userLocationId

  const showAll = req.nextUrl.searchParams.get("all") === "true"

  try {
  const staff = await prisma.staffMember.findMany({
    where: {
      ...(!showAll ? { isActive: true } : {}),
      ...(locationId ? { locationId } : {}),
    },
    include: {
      location: true,
      user: { select: { email: true } },
    },
    orderBy: [{ position: "asc" }, { fullName: "asc" }],
  })

  const result = staff.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    email: s.email || s.user?.email || null,
    phone: s.phone,
    position: s.position,
    isActive: s.isActive,
    inviteStatus: s.inviteStatus,
    squareTeamMemberId: s.squareTeamMemberId,
    createdAt: s.createdAt,
    location: { id: s.location.id, name: s.location.name },
    tdlrLicenseNumber: s.tdlrLicenseNumber,
    tdlrStatus: s.tdlrStatus,
    tdlrExpirationDate: s.tdlrExpirationDate,
    tdlrVerifiedAt: s.tdlrVerifiedAt,
    tdlrHolderName: s.tdlrHolderName,
  }))

  return NextResponse.json({ staff: result })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[staff/by-location] error:", msg)
    return NextResponse.json({ error: msg, staff: [] }, { status: 500 })
  }
}
