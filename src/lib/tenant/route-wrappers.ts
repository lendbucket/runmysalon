import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { tenantDb } from "./prisma"
import type { Tenant, TenantMembership, TenantRole, User } from "@prisma/client"

// ─── Context types ───────────────────────────────────────────

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
  db: typeof prisma
}

export interface PublicRouteContext {
  req: Request
}

export interface WebhookRouteContext {
  req: Request
  tenantId: string
  db: ReturnType<typeof tenantDb>
}

// ─── withTenant ──────────────────────────────────────────────

type TenantHandler = (ctx: TenantRouteContext) => Promise<NextResponse | Response>

export function withTenant(
  handler: TenantHandler,
  opts?: { roles?: TenantRole[]; suspendIfPastDue?: boolean }
) {
  return async (req: Request, routeContext?: any): Promise<NextResponse | Response> => {
    const start = Date.now()
    const tenantId = req.headers.get("x-tenant-id")
    const pathname = new URL(req.url).pathname

    try {
      if (!tenantId) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, slug: true, status: true, timezone: true, currency: true, name: true, legalName: true, ownerEmail: true, ownerPhone: true, addressLine1: true, addressLine2: true, city: true, state: true, postalCode: true, country: true, locale: true, trialEndsAt: true, createdAt: true, updatedAt: true, suspendedAt: true, suspendedReason: true },
      })
      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
      }
      if (tenant.status === "SUSPENDED" || tenant.status === "CANCELED") {
        return NextResponse.json({ error: "Tenant not accessible" }, { status: 403 })
      }
      if (opts?.suspendIfPastDue && tenant.status === "PAST_DUE") {
        return NextResponse.json({ error: "Subscription past due" }, { status: 402 })
      }

      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      let membership: TenantMembership

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
        const m = await prisma.tenantMembership.findUnique({
          where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
        })
        if (!m || m.revokedAt) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
        if (opts?.roles && opts.roles.length > 0 && !opts.roles.includes(m.role)) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }
        membership = m
      }

      const db = tenantDb(tenant.id)
      return await handler({ req, tenant: tenant as unknown as Tenant, user, membership, db })
    } catch (err) {
      if (err instanceof Response || err instanceof NextResponse) return err
      console.error(`[withTenant] tenantId=${tenantId} userId=? path=${pathname} method=${req.method}`, err)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
      if (process.env.NODE_ENV === "development") {
        const slug = tenantId ? "?" : "none"
        console.log(`[${req.method}] ${pathname} — tenant=${slug} took ${Date.now() - start}ms`)
      }
    }
  }
}

// ─── withSuperAdmin ──────────────────────────────────────────

type SuperAdminHandler = (ctx: SuperAdminRouteContext) => Promise<NextResponse | Response>

export function withSuperAdmin(handler: SuperAdminHandler) {
  return async (req: Request): Promise<NextResponse | Response> => {
    const start = Date.now()
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (!user?.superAdmin || user.email !== process.env.SUPER_ADMIN_EMAIL) {
        return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
      }
      return await handler({ req, user, db: prisma })
    } catch (err) {
      if (err instanceof Response || err instanceof NextResponse) return err
      console.error("[withSuperAdmin] error:", err)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
      if (process.env.NODE_ENV === "development") {
        console.log(`[withSuperAdmin] ${req.method} ${new URL(req.url).pathname} ${Date.now() - start}ms`)
      }
    }
  }
}

// ─── withPublic ──────────────────────────────────────────────

type PublicHandler = (ctx: PublicRouteContext) => Promise<NextResponse | Response>

export function withPublic(handler: PublicHandler) {
  return async (req: Request): Promise<NextResponse | Response> => {
    try {
      return await handler({ req })
    } catch (err) {
      if (err instanceof Response || err instanceof NextResponse) return err
      console.error("[withPublic] error:", err)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}

// ─── withWebhook ─────────────────────────────────────────────

type WebhookVerifier = (req: Request) => Promise<{ tenantId: string } | null>
type WebhookHandler = (ctx: WebhookRouteContext) => Promise<NextResponse | Response>

export function withWebhook(
  opts: { verify: WebhookVerifier },
  handler: WebhookHandler
) {
  return async (req: Request): Promise<NextResponse | Response> => {
    try {
      const result = await opts.verify(req)
      if (!result) {
        return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 })
      }
      const db = tenantDb(result.tenantId)
      return await handler({ req, tenantId: result.tenantId, db })
    } catch (err) {
      if (err instanceof Response || err instanceof NextResponse) return err
      console.error("[withWebhook] error:", err)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}

// Example usage — do not uncomment, reference only:
// export const GET = withTenant(async ({ db, tenant }) => {
//   const clients = await db.client.findMany({ take: 10 });
//   return NextResponse.json({ clients });
// });
