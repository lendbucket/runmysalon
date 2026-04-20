import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-04-30.basil" as any })

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tenantId = (session.user as any).tenantId
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

  try {
    // Create or get Stripe customer
    let customerId = tenant.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.ownerEmail,
        name: tenant.name,
        metadata: { tenantId: tenant.id, slug: tenant.slug },
      })
      customerId = customer.id
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create checkout session
    const priceId = process.env.STRIPE_RUNMYSALON_PRICE_ID
    if (!priceId) return NextResponse.json({ error: "Price not configured" }, { status: 500 })

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://portal.runmysalon.com"}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://portal.runmysalon.com"}/billing?cancelled=true`,
      metadata: { tenantId },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("[billing] create-subscription error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
