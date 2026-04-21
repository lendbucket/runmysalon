import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "ceo@36west.org"

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.superAdmin || user.email !== SUPER_ADMIN_EMAIL) return null
  return user
}

export async function GET() {
  const admin = await checkSuperAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true, locations: true } },
      subscription: { select: { status: true } },
    },
  })

  const activeSubs = tenants.filter(t => t.status === "ACTIVE").length
  const trialSubs = tenants.filter(t => t.status === "TRIAL").length
  const mrr = activeSubs * 99

  return NextResponse.json({
    tenants: tenants.map(t => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      status: t.status,
      ownerEmail: t.ownerEmail,
      createdAt: t.createdAt,
      trialEndsAt: t.trialEndsAt,
      memberCount: t._count.memberships,
      locationCount: t._count.locations,
      subscriptionStatus: t.subscription?.status || null,
    })),
    stats: { total: tenants.length, active: activeSubs, trial: trialSubs, mrr },
  })
}

export async function POST(req: Request) {
  const admin = await checkSuperAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { name, ownerEmail } = body

  if (!name || !ownerEmail) {
    return NextResponse.json({ error: "name and ownerEmail are required" }, { status: 400 })
  }

  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  let slug = baseSlug
  let counter = 1
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 14)

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      ownerEmail,
      status: "TRIAL",
      trialEndsAt,
    },
  })

  return NextResponse.json({ tenant })
}
