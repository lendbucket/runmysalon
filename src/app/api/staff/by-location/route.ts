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

  const staff = await prisma.staffMember.findMany({
    where: {
      isActive: true,
      ...(locationId ? { locationId } : {}),
    },
    orderBy: [{ position: "asc" }, { fullName: "asc" }],
  })

  return NextResponse.json({ staff })
}
