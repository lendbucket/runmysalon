import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as any).role
  const email = session.user.email
  const superAdminEmail = process.env.RUNMYSALON_SUPER_ADMIN_EMAIL || "ceo@36west.org"
  if (role !== "SUPER_ADMIN" && role !== "OWNER" && email !== superAdminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { locations: true, invites: true } },
    },
  })

  // Get staff counts per tenant
  const tenantIds = tenants.map(t => t.id)
  const staffCounts = await prisma.user.groupBy({
    by: ["tenantId"],
    where: { tenantId: { in: tenantIds } },
    _count: true,
  })
  const staffMap = new Map(staffCounts.map(s => [s.tenantId, s._count]))

  const activeSubs = tenants.filter(t => t.subscriptionStatus === "active").length
  const trialSubs = tenants.filter(t => t.subscriptionStatus === "trial").length
  const mrr = activeSubs * 99

  return NextResponse.json({
    tenants: tenants.map(t => ({
      ...t,
      staffCount: staffMap.get(t.id) || 0,
      locationCount: t._count.locations,
    })),
    stats: {
      total: tenants.length,
      active: activeSubs,
      trial: trialSubs,
      mrr,
    },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as any).role
  const email = session.user.email
  const superAdminEmail = process.env.RUNMYSALON_SUPER_ADMIN_EMAIL || "ceo@36west.org"
  if (role !== "SUPER_ADMIN" && role !== "OWNER" && email !== superAdminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { name, ownerName, ownerEmail, posProvider } = body

  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  let slug = baseSlug
  let counter = 1
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      subdomain: `${slug}.runmysalon.com`,
      brandName: name,
      ownerName: ownerName || name,
      ownerEmail: ownerEmail || "",
      posProvider: posProvider || "kasse",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  })

  return NextResponse.json({ tenant })
}
