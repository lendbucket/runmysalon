import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-04-30.basil" as any })

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || "")
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id
        const tenant = await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } })
        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              stripeSubscriptionId: sub.id,
              subscriptionStatus: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : sub.status === "trialing" ? "trial" : sub.status,
              subscriptionStartedAt: new Date(sub.start_date * 1000),
            },
          })
        }
        break
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id
        const tenant = await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } })
        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { subscriptionStatus: "cancelled" },
          })
        }
        break
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
        if (customerId) {
          const tenant = await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } })
          if (tenant) {
            await prisma.billingEvent.create({
              data: {
                tenantId: tenant.id,
                type: "payment_succeeded",
                amount: (invoice.amount_paid || 0) / 100,
                stripeEventId: event.id,
                metadata: { invoiceId: invoice.id },
              },
            })
          }
        }
        break
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
        if (customerId) {
          const tenant = await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } })
          if (tenant) {
            await prisma.tenant.update({
              where: { id: tenant.id },
              data: { subscriptionStatus: "past_due" },
            })
            await prisma.billingEvent.create({
              data: {
                tenantId: tenant.id,
                type: "payment_failed",
                amount: (invoice.amount_due || 0) / 100,
                stripeEventId: event.id,
              },
            })
          }
        }
        break
      }
    }
  } catch (error) {
    console.error("[stripe webhook] Processing error:", error)
  }

  return NextResponse.json({ received: true })
}
