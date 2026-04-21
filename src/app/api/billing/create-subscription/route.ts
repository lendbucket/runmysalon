import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tenantId = (session.user as any).tenantId
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true },
  })
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

  try {
    let customerId = tenant.subscription?.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.ownerEmail,
        name: tenant.name,
        metadata: { tenantId: tenant.id, slug: tenant.slug },
      })
      customerId = customer.id
      await prisma.tenantSubscription.upsert({
        where: { tenantId },
        update: { stripeCustomerId: customerId },
        create: { tenantId, stripeCustomerId: customerId, status: "trialing" },
      })
    }

    const priceId = process.env.STRIPE_RUNMYSALON_PRICE_ID
    if (!priceId) return NextResponse.json({ error: "Price not configured" }, { status: 500 })

    const appUrl = process.env.APP_URL || "https://portal.runmysalon.com"
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing?success=true`,
      cancel_url: `${appUrl}/billing?cancelled=true`,
      metadata: { tenantId },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("[billing] create-subscription error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
