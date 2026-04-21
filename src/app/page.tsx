import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "runmysalon.com"

function isApex(hostname: string): boolean {
  return (
    hostname === ROOT_DOMAIN ||
    hostname === `portal.${ROOT_DOMAIN}` ||
    hostname === `www.${ROOT_DOMAIN}` ||
    hostname === "localhost" ||
    hostname.endsWith(".vercel.app")
  )
}

export default async function RootPage() {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const hostname = host.split(":")[0]

  // Tenant subdomain — go straight to dashboard (middleware handles auth)
  if (!isApex(hostname)) {
    redirect("/dashboard")
  }

  // Apex domain — resolve user intent
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/login")
  }

  // Check super admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, superAdmin: true },
  })

  if (user?.superAdmin) {
    redirect("/admin")
  }

  // Check tenant memberships
  if (user) {
    const memberships = await prisma.tenantMembership.findMany({
      where: { userId: user.id, revokedAt: null },
      include: { tenant: { select: { slug: true } } },
      take: 2, // only need to know if 0, 1, or many
    })

    if (memberships.length === 0) {
      redirect("/signup")
    }

    if (memberships.length === 1) {
      const first = memberships[0]
      const slug = first?.tenant?.slug
      if (slug && process.env.NODE_ENV === "production") {
        redirect(`https://${slug}.${ROOT_DOMAIN}/dashboard`)
      }
      // Dev: redirect locally (middleware will resolve tenant from cookie/header)
      redirect("/dashboard")
    }

    // Multiple memberships
    redirect("/switch-tenant")
  }

  redirect("/login")
}
