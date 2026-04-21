/**
 * Drop-in replacement for raw prisma in tenant-scoped routes.
 *
 * Usage:
 *   // BEFORE: import { prisma } from '@/lib/prisma'
 *   // AFTER:
 *   import { getTenantPrisma } from '@/lib/tenant/get-tenant-prisma'
 *
 *   export async function GET(req: Request) {
 *     const { db, session, user } = await getTenantPrisma()
 *     const clients = await db.client.findMany()
 *     return NextResponse.json({ clients })
 *   }
 *
 * This resolves the tenant from the x-tenant-id header (set by middleware),
 * verifies the user's session and membership, then returns a tenant-scoped
 * Prisma client that auto-injects tenantId into all queries.
 *
 * For routes that need the full withTenant wrapper (role checks, etc.),
 * use withTenant from route-wrappers.ts instead.
 */

import { headers } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { tenantDb, assertTenantId } from "./prisma"
import type { User } from "@prisma/client"

export async function getTenantPrisma(): Promise<{
  db: ReturnType<typeof tenantDb>
  tenantId: string
  session: any
  user: User
}> {
  const h = await headers()
  const tenantId = h.get("x-tenant-id")

  // If no tenant header (apex domain, dev localhost), fall back to user's tenantId
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Error("Not authenticated")
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error("User not found")

  // Try header first, then user's tenantId, then their first membership
  let resolvedTenantId = tenantId
  if (!resolvedTenantId && user.tenantId) {
    resolvedTenantId = user.tenantId
  }
  if (!resolvedTenantId) {
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId: user.id, revokedAt: null },
      select: { tenantId: true },
    })
    resolvedTenantId = membership?.tenantId || null
  }

  assertTenantId(resolvedTenantId)

  return {
    db: tenantDb(resolvedTenantId),
    tenantId: resolvedTenantId,
    session,
    user,
  }
}
