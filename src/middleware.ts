import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "runmysalon.com"
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "ceo@36west.org"

const RESERVED_SLUGS = new Set([
  "www", "portal", "admin", "api", "app", "auth", "signup", "login",
  "help", "support", "status", "docs", "blog", "mail", "email", "smtp",
  "ftp", "cdn", "assets", "static", "public", "salonenvy", "runmysalon",
  "kasse", "reynapay", "reynainsure", "reynatech", "sepa",
])

// In-memory tenant cache (per serverless instance, 60s TTL)
const tenantCache = new Map<string, { data: any; expiresAt: number }>()
const CACHE_TTL = 60_000 // 60 seconds

async function lookupTenantBySlug(slug: string): Promise<{ id: string; status: string } | null> {
  const cached = tenantCache.get(slug)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  try {
    // Use Supabase REST API for lightweight lookup from Edge
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_ID || "eaoiaargatewucuihctk"}.supabase.co`
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!supabaseKey) {
      // Fallback: try an internal API call (works in dev, not ideal for prod)
      return null
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&select=id,status&limit=1`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 60 },
      }
    )

    if (!res.ok) return null
    const rows = await res.json()
    const tenant = rows[0] || null

    tenantCache.set(slug, { data: tenant, expiresAt: Date.now() + CACHE_TTL })
    return tenant
  } catch {
    return null
  }
}

async function lookupTenantByDomain(domain: string): Promise<{ id: string; status: string; slug: string } | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_ID || "eaoiaargatewucuihctk"}.supabase.co`
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    if (!supabaseKey) return null

    const res = await fetch(
      `${supabaseUrl}/rest/v1/tenant_brandings?customDomain=eq.${encodeURIComponent(domain)}&select=tenantId,tenant:tenants(id,status,slug)&limit=1`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    )

    if (!res.ok) return null
    const rows = await res.json()
    return rows[0]?.tenant || null
  } catch {
    return null
  }
}

function isApexDomain(hostname: string): boolean {
  return (
    hostname === ROOT_DOMAIN ||
    hostname === `portal.${ROOT_DOMAIN}` ||
    hostname === `www.${ROOT_DOMAIN}` ||
    hostname === "localhost" ||
    hostname.endsWith(".vercel.app")
  )
}

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host")?.split(":")[0] || ""
  const pathname = req.nextUrl.pathname

  // Skip static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/manifest.json") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff2?)$/)
  ) {
    return NextResponse.next()
  }

  // Determine if this is the apex domain or a tenant subdomain
  if (isApexDomain(hostname)) {
    // Apex domain — allow public routes, admin routes, and API auth routes
    // Auth protection for admin routes
    if (pathname.startsWith("/admin")) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
      if (!token?.email || token.email !== SUPER_ADMIN_EMAIL) {
        return NextResponse.redirect(new URL("/login", req.url))
      }
    }
    return NextResponse.next()
  }

  // Check for tenant subdomain
  const subdomainMatch = hostname.match(new RegExp(`^([^.]+)\\.${ROOT_DOMAIN.replace(".", "\\.")}$`))
  let tenantSlug: string | null = null
  let tenantId: string | null = null
  let tenantStatus: string | null = null

  if (subdomainMatch) {
    tenantSlug = subdomainMatch[1]

    if (RESERVED_SLUGS.has(tenantSlug)) {
      return NextResponse.rewrite(new URL("/tenant-not-found", req.url))
    }

    const tenant = await lookupTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.rewrite(new URL("/tenant-not-found", req.url))
    }

    tenantId = tenant.id
    tenantStatus = tenant.status
  } else {
    // Custom domain lookup
    const tenant = await lookupTenantByDomain(hostname)
    if (tenant) {
      tenantId = tenant.id
      tenantSlug = tenant.slug
      tenantStatus = tenant.status
    } else {
      // Unknown hostname — not found
      return NextResponse.rewrite(new URL("/tenant-not-found", req.url))
    }
  }

  // Check tenant status
  if (tenantStatus === "SUSPENDED") {
    return NextResponse.rewrite(new URL("/tenant-suspended", req.url))
  }
  if (tenantStatus === "CANCELED") {
    return NextResponse.rewrite(new URL("/tenant-canceled", req.url))
  }

  // Inject tenant headers
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-tenant-id", tenantId!)
  requestHeaders.set("x-tenant-slug", tenantSlug!)

  // Auth protection for tenant routes (except public paths)
  const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password", "/api/auth", "/tenant-not-found", "/tenant-suspended", "/tenant-canceled", "/switch-tenant"]
  const isPublicPath = publicPaths.some(p => pathname.startsWith(p))

  if (!isPublicPath) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Set a cookie for the tenant slug (used by NextAuth session callback)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.cookies.set("rms-tenant", tenantSlug!, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  })

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
