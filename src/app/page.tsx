import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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

export const dynamic = "force-dynamic"

export default async function RootPage() {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const hostname = host.split(":")[0]

  const session = await getServerSession(authOptions)

  if (!isApex(hostname)) {
    // Tenant subdomain
    if (!session) redirect("/login")
    redirect("/dashboard")
  }

  // Apex domain — no Prisma here, keep this page lightweight
  if (!session) redirect("/login")
  redirect("/post-login")
}
