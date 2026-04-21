import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { tenantDb } from "./prisma"
import type { Tenant, TenantMembership, TenantRole, User } from "@prisma/client"

export interface TenantRouteContext {
  req: Request
  tenant: Tenant
  user: User
  membership: TenantMembership
  db: ReturnType<typeof tenantDb>
}

export interface SuperAdminRouteContext {
  req: Request
  user: User
}

export interface PublicRouteContext {
  req: Request
}

type TenantHandler = (ctx: TenantRouteContext) => Promise<NextResponse | Response>
type SuperAdminHandler = (ctx: SuperAdminRouteContext) => Promise<NextResponse | Response>
type PublicHandler = (ctx: PublicRouteContext) => Promise<NextResponse | Response>

/**
 * Wraps an API route handler with tenant resolution + membership verification.
 * Provides handler with { req, tenant, user, membership, db } where db is already tenant-scoped.
 */
export function withTenant(
  handler: TenantHandler,
  opts?: { roles?: TenantRole[] }
) {
  return async (req: Request): Promise<NextResponse | Response> => {
    const start = Date.now()
    const tenantId = req.headers.get("x-tenant-id")

    try {
      if (!tenantId) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
      }

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
      }
      if (tenant.status === "SUSPENDED" || tenant.status === "CANCELED") {
        return NextResponse.json({ error: "Tenant is " + tenant.status.toLowerCase() }, { status: 403 })
      }

      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      let membership: TenantMembership | null = null

      // Super admins bypass membership check
      if (user.superAdmin && user.email === process.env.SUPER_ADMIN_EMAIL) {
        membership = {
          id: "super-admin",
          tenantId: tenant.id,
          userId: user.id,
          role: "OWNER" as TenantRole,
          invitedBy: null,
          joinedAt: new Date(),
          revokedAt: null,
        }
      } else {
        membership = await prisma.tenantMembership.findUnique({
          where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
        })

        if (!membership || membership.revokedAt) {
          return NextResponse.json({ error: "Not a member of this tenant" }, { status: 403 })
        }

        if (opts?.roles && opts.roles.length > 0 && !opts.roles.includes(membership.role)) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }
      }

      const db = tenantDb(tenant.id)
      return await handler({ req, tenant, user, membership, db })
    } catch (err) {
      if (err instanceof Response || err instanceof NextResponse) {
        return err
      }
      console.error(`[withTenant] ${tenantId || "unknown"} error:`, err)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
      if (process.env.NODE_ENV === "development") {
        console.log(`[withTenant] ${req.method} ${new URL(req.url).pathname} ${Date.now() - start}ms`)
      }
    }
  }
}

/**
 * Wraps an API route handler restricted to the super admin.
 */
export function withSuperAdmin(handler: SuperAdminHandler) {
  return async (req: Request): Promise<NextResponse | Response> => {
    const start = Date.now()
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (!user?.superAdmin || user.email !== process.env.SUPER_ADMIN_EMAIL) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      return await handler({ req, user })
    } catch (err) {
      if (err instanceof Response || err instanceof NextResponse) {
        return err
      }
      console.error("[withSuperAdmin] error:", err)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
      if (process.env.NODE_ENV === "development") {
        console.log(`[withSuperAdmin] ${req.method} ${new URL(req.url).pathname} ${Date.now() - start}ms`)
      }
    }
  }
}

/**
 * Wraps a public API route handler with error handling.
 */
export function withPublic(handler: PublicHandler) {
  return async (req: Request): Promise<NextResponse | Response> => {
    try {
      return await handler({ req })
    } catch (err) {
      if (err instanceof Response || err instanceof NextResponse) {
        return err
      }
      console.error("[withPublic] error:", err)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}

// Example usage — do not uncomment, reference only:
// export const GET = withTenant(async ({ db, tenant }) => {
//   const clients = await db.client.findMany({ take: 10 });
//   return NextResponse.json({ clients });
// });
