import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "runmysalon.com"
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "ceo@36west.org"

export const dynamic = "force-dynamic"

export default async function PostLoginPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/login")

  // Super admin fast-path from session (no DB needed)
  if (session.user.email === SUPER_ADMIN_EMAIL) {
    redirect("/admin")
  }

  // Lazy-import Prisma to prevent module-level crashes on cold start.
  // All DB calls are inside try/catch — if DB is unreachable, user
  // gets a graceful redirect instead of a 500.
  let target: string = "/login?error=session_lookup_failed"

  try {
    const { prisma } = await import("@/lib/prisma")
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        superAdmin: true,
        memberships: {
          where: { revokedAt: null },
          select: { tenant: { select: { slug: true } } },
          take: 10,
        },
      },
    })

    if (user?.superAdmin) {
      target = "/admin"
    } else {
      const slugs = (user?.memberships ?? [])
        .map(m => m.tenant?.slug)
        .filter((s): s is string => !!s)

      if (slugs.length === 0) {
        target = "/signup/salon"
      } else if (slugs.length === 1) {
        if (process.env.NODE_ENV === "production") {
          target = `https://${slugs[0]}.${ROOT_DOMAIN}/dashboard`
        } else {
          target = "/dashboard"
        }
      } else {
        target = "/switch-tenant"
      }
    }
  } catch (err) {
    console.error("[post-login] DB lookup failed:", err)
    target = "/login?error=session_lookup_failed"
  }

  redirect(target)
}
