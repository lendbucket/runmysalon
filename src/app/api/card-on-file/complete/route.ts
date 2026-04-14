import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendSMS } from "@/lib/twilio"

export async function POST(req: NextRequest) {
  try {
    const { token, paymentMethodId, customerId } = await req.json() as {
      token: string
      paymentMethodId: string
      customerId: string
    }

    if (!token || !paymentMethodId) {
      return NextResponse.json({ error: "Token and paymentMethodId required" }, { status: 400 })
    }

    const request = await prisma.cardOnFileRequest.findUnique({ where: { token } })
    if (!request) return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    if (request.tokenExpiry < new Date()) return NextResponse.json({ error: "Token expired" }, { status: 410 })
    if (request.status !== "pending") return NextResponse.json({ error: "Already completed" }, { status: 409 })

    // Update the request as completed
    await prisma.cardOnFileRequest.update({
      where: { token },
      data: {
        status: "completed",
        completedAt: new Date(),
        stripePaymentMethodId: paymentMethodId,
        stripeCustomerId: customerId || request.stripeCustomerId,
      },
    })

    // Send confirmation SMS
    if (request.clientPhone) {
      await sendSMS(
        request.clientPhone,
        `Your card has been saved and your appointment at Salon Envy is confirmed. See you soon! Reply STOP to unsubscribe.`
      ).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[card-on-file/complete] Error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
