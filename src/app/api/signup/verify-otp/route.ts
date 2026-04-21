import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { sessionId, code } = await req.json()
    if (!sessionId || !code) return NextResponse.json({ error: "Session and code required" }, { status: 400 })

    const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
    if (!session?.phoneNumber) return NextResponse.json({ error: "Phone not set" }, { status: 400 })

    // Dev mode: check stored code
    if (process.env.NODE_ENV === "development" && session.phoneVerifyCode) {
      if (code === session.phoneVerifyCode) {
        await prisma.signupSession.update({
          where: { id: sessionId },
          data: { phoneVerifiedAt: new Date(), phoneVerifyCode: null, currentStep: "phone_verify" },
        })
        return NextResponse.json({ success: true, step: "phone_verify" })
      }
      return NextResponse.json({ error: "Invalid code" }, { status: 400 })
    }

    // Production: verify via Twilio
    try {
      const twilio = await import("twilio")
      const client = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

      const check = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SID || "")
        .verificationChecks.create({ to: session.phoneNumber, code })

      if (check.status === "approved") {
        await prisma.signupSession.update({
          where: { id: sessionId },
          data: { phoneVerifiedAt: new Date(), currentStep: "phone_verify" },
        })
        return NextResponse.json({ success: true, step: "phone_verify" })
      }

      return NextResponse.json({ error: "Invalid code" }, { status: 400 })
    } catch (twilioErr) {
      console.error("[signup/verify-otp] Twilio error:", twilioErr)
      return NextResponse.json({ error: "Verification failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("[signup/verify-otp] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
