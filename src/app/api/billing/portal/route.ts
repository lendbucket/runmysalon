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

  const subscription = await prisma.tenantSubscription.findUnique({ where: { tenantId } })
  if (!subscription?.stripeCustomerId) return NextResponse.json({ error: "No billing account" }, { status: 400 })

  try {
    const appUrl = process.env.APP_URL || "https://portal.runmysalon.com"
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    })
    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("[billing] portal error:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
