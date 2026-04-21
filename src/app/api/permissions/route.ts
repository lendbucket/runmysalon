import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { DEFAULT_PERMISSIONS, FEATURES } from "@/lib/permissions"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"

export async function GET(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = session.user as Record<string, unknown>
  const userRole = user.role as string

  const queryRole = req.nextUrl.searchParams.get("role")
  const queryLocationId = req.nextUrl.searchParams.get("locationId") || undefined

  // Non-owners can only view their own permissions
  if (queryRole && userRole !== "OWNER") {
    return NextResponse.json({ error: "Only owners can view other roles' permissions" }, { status: 403 })
  }

  const targetRole = queryRole || userRole

  // Start from defaults
  const matrix: Record<string, Record<string, boolean>> = {}
  for (const f of FEATURES) {
    matrix[f.key] = { ...(DEFAULT_PERMISSIONS[targetRole]?.[f.key] || {}) }
  }

  // Apply DB overrides for this role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    role: targetRole,
    staffMemberId: null,
  }

  if (queryLocationId) {
    where.OR = [{ locationId: null }, { locationId: queryLocationId }]
  } else {
    where.locationId = null
  }

  const overrides = await prisma.portalPermission.findMany({ where })

  // Location-specific overrides take precedence over global
  // Sort so global comes first, then location-specific overwrites
  overrides.sort((a, b) => {
    if (a.locationId === null && b.locationId !== null) return -1
    if (a.locationId !== null && b.locationId === null) return 1
    return 0
  })

  for (const perm of overrides) {
    if (!matrix[perm.feature]) matrix[perm.feature] = {}
    matrix[perm.feature][perm.action] = perm.granted
  }

  return NextResponse.json({ role: targetRole, locationId: queryLocationId || null, permissions: matrix })
}

export async function POST(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = session.user as Record<string, unknown>
  const userRole = user.role as string
  const userId = user.id as string

  if (userRole !== "OWNER") {
    return NextResponse.json({ error: "Only owners can update permissions" }, { status: 403 })
  }

  const body = await req.json()
  const { role, feature, action, granted, staffMemberId, locationId } = body as {
    role: string
    feature: string
    action: string
    granted: boolean
    staffMemberId?: string
    locationId?: string
  }

  if (!role || !feature || !action || typeof granted !== "boolean") {
    return NextResponse.json({ error: "Missing required fields: role, feature, action, granted" }, { status: 400 })
  }

  // Validate feature and action exist
  const featureDef = FEATURES.find(f => f.key === feature)
  if (!featureDef) {
    return NextResponse.json({ error: `Invalid feature: ${feature}` }, { status: 400 })
  }
  if (!featureDef.actions.includes(action as never)) {
    return NextResponse.json({ error: `Invalid action '${action}' for feature '${feature}'` }, { status: 400 })
  }

  // Upsert the permission — find existing first since compound unique has nullable fields
  const existing = await prisma.portalPermission.findFirst({
    where: {
      locationId: locationId || null,
      staffMemberId: staffMemberId || null,
      role,
      feature,
      action,
    },
  })

  const permission = existing
    ? await prisma.portalPermission.update({
        where: { id: existing.id },
        data: { granted, createdBy: userId },
      })
    : await prisma.portalPermission.create({
        data: {
          locationId: locationId || null,
          staffMemberId: staffMemberId || null,
          role,
          feature,
          action,
          granted,
          createdBy: userId,
        },
      })

  return NextResponse.json({ success: true, permission })
}
