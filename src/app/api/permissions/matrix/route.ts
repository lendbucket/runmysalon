import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DEFAULT_PERMISSIONS, FEATURES } from "@/lib/permissions"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = session.user as Record<string, unknown>
  const userRole = user.role as string

  if (userRole !== "OWNER") {
    return NextResponse.json({ error: "Only owners can view the full permission matrix" }, { status: 403 })
  }

  // Build the full matrix from defaults
  const matrix: Record<string, Record<string, Record<string, boolean>>> = {}

  for (const role of ["OWNER", "MANAGER", "STYLIST"]) {
    matrix[role] = {}
    for (const f of FEATURES) {
      matrix[role][f.key] = { ...(DEFAULT_PERMISSIONS[role]?.[f.key] || {}) }
    }
  }

  // Fetch all role-global overrides (no staffMemberId, no locationId)
  const overrides = await prisma.portalPermission.findMany({
    where: {
      staffMemberId: null,
      locationId: null,
    },
  })

  // Apply overrides on top of defaults
  for (const perm of overrides) {
    if (!matrix[perm.role]) continue
    if (!matrix[perm.role][perm.feature]) {
      matrix[perm.role][perm.feature] = {}
    }
    matrix[perm.role][perm.feature][perm.action] = perm.granted
  }

  return NextResponse.json(matrix)
}
