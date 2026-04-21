import { headers } from "next/headers"
import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { tenantDb } from "./prisma"
import type { Tenant, TenantMembership, TenantRole, User } from "@prisma/client"

export interface TenantContext {
  tenant: Tenant
  user: User
  membership: TenantMembership
  db: ReturnType<typeof tenantDb>
}

/**
 * Read tenant ID from request headers set by middleware.
 */
export async function getTenantFromHeaders(): Promise<Tenant | null> {
  const h = await headers()
  const tenantId = h.get("x-tenant-id")
  if (!tenantId) return null
  return prisma.tenant.findUnique({ where: { id: tenantId } })
}

/**
 * For server components — throws redirect/404 if no tenant in headers.
 */
export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenantFromHeaders()
  if (!tenant) notFound()
  return tenant
}

/**
 * Verifies user has a membership in the current tenant.
 * Optionally restricts to specific roles.
 */
export async function requireTenantMembership(
  roles?: TenantRole[]
): Promise<TenantContext> {
  const tenant = await requireTenant()

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })
  if (!user) redirect("/login")

  // Super admins bypass membership check
  if (user.superAdmin && user.email === process.env.SUPER_ADMIN_EMAIL) {
    const virtualMembership: TenantMembership = {
      id: "super-admin",
      tenantId: tenant.id,
      userId: user.id,
      role: "OWNER" as TenantRole,
      invitedBy: null,
      joinedAt: new Date(),
      revokedAt: null,
    }
    return { tenant, user, membership: virtualMembership, db: tenantDb(tenant.id) }
  }

  const membership = await prisma.tenantMembership.findUnique({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
  })

  if (!membership || membership.revokedAt) redirect("/switch-tenant")

  if (roles && roles.length > 0 && !roles.includes(membership.role)) {
    notFound()
  }

  return { tenant, user, membership, db: tenantDb(tenant.id) }
}

/**
 * Verifies user is the super admin (ceo@36west.org with superAdmin: true).
 */
export async function requireSuperAdmin(): Promise<User> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user?.superAdmin || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    notFound()
  }

  return user
}
