import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  try {
    const { token } = await req.json() as { token: string }
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

    const request = await prisma.cardOnFileRequest.findUnique({ where: { token } })
    if (!request) return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    if (request.tokenExpiry < new Date()) return NextResponse.json({ error: "Token expired" }, { status: 410 })
    if (request.status !== "pending") return NextResponse.json({ error: "Already completed" }, { status: 409 })

    // Create or retrieve Stripe customer
    const customer = await stripe.customers.create({
      name: request.clientName,
      phone: request.clientPhone || undefined,
      email: request.clientEmail || undefined,
      metadata: { salonEnvyToken: token, locationId: request.locationId },
    })

    // Create SetupIntent for card collection
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
      metadata: { token, clientName: request.clientName },
    })

    // Save Stripe customer ID to the request
    await prisma.cardOnFileRequest.update({
      where: { token },
      data: { stripeCustomerId: customer.id, stripeSetupIntentId: setupIntent.id },
    })

    return NextResponse.json({ clientSecret: setupIntent.client_secret, customerId: customer.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[card-on-file/setup-intent] Error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
