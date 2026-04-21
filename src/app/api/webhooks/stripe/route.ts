import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || "")
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id
        const subscription = await prisma.tenantSubscription.findUnique({ where: { stripeCustomerId: customerId } })
        if (subscription) {
          const statusMap: Record<string, string> = {
            active: "ACTIVE", past_due: "PAST_DUE", trialing: "TRIAL", canceled: "CANCELED",
          }
          const tenantStatus = statusMap[sub.status] || sub.status
          await prisma.tenantSubscription.update({
            where: { tenantId: subscription.tenantId },
            data: {
              stripeSubscriptionId: sub.id,
              status: sub.status,
              currentPeriodStart: (sub as any).current_period_start ? new Date((sub as any).current_period_start * 1000) : undefined,
              currentPeriodEnd: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000) : undefined,
            },
          })
          // Sync tenant status
          if (tenantStatus === "ACTIVE" || tenantStatus === "TRIAL" || tenantStatus === "PAST_DUE" || tenantStatus === "CANCELED") {
            await prisma.tenant.update({
              where: { id: subscription.tenantId },
              data: { status: tenantStatus as any },
            })
          }
        }
        break
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id
        const subscription = await prisma.tenantSubscription.findUnique({ where: { stripeCustomerId: customerId } })
        if (subscription) {
          await prisma.tenantSubscription.update({
            where: { tenantId: subscription.tenantId },
            data: { status: "canceled", canceledAt: new Date() },
          })
          await prisma.tenant.update({
            where: { id: subscription.tenantId },
            data: { status: "CANCELED" },
          })
        }
        break
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
        if (customerId) {
          const subscription = await prisma.tenantSubscription.findUnique({ where: { stripeCustomerId: customerId } })
          if (subscription) {
            await prisma.tenantSubscription.update({
              where: { tenantId: subscription.tenantId },
              data: { status: "past_due" },
            })
            await prisma.tenant.update({
              where: { id: subscription.tenantId },
              data: { status: "PAST_DUE" },
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
