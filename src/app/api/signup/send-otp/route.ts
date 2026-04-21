import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validatePhone } from "@/lib/validation/signup"

export async function POST(req: Request) {
  try {
    const { sessionId, phone } = await req.json()
    if (!sessionId) return NextResponse.json({ error: "Session required" }, { status: 400 })

    const phoneErr = validatePhone(phone)
    if (phoneErr) return NextResponse.json({ error: phoneErr }, { status: 400 })

    const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    // Normalize phone
    const digits = phone.replace(/\D/g, "")
    const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`

    // Send OTP via Twilio Verify
    try {
      const twilio = await import("twilio")
      const client = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

      // Optional: Lookup to reject VOIP numbers
      try {
        const lookup = await client.lookups.v2.phoneNumbers(e164).fetch({ fields: "line_type_intelligence" })
        const lineType = (lookup as any).lineTypeIntelligence?.type
        if (lineType === "voip" || lineType === "nonFixedVoip") {
          return NextResponse.json({ error: "Please use a real mobile number, not a VOIP/internet number" }, { status: 400 })
        }
      } catch {
        // Lookup failed — continue anyway (Twilio Lookup is optional)
      }

      await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SID || "")
        .verifications.create({ to: e164, channel: "sms" })
    } catch (twilioErr) {
      console.error("[signup/send-otp] Twilio error:", twilioErr)
      // In dev, generate a code and store it directly
      if (process.env.NODE_ENV === "development") {
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        await prisma.signupSession.update({
          where: { id: sessionId },
          data: { phoneNumber: e164, phoneVerifyCode: code, phoneVerifyExpires: new Date(Date.now() + 10 * 60 * 1000) },
        })
        console.log(`[DEV] OTP for ${e164}: ${code}`)
        return NextResponse.json({ success: true, dev: true })
      }
      return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
    }

    await prisma.signupSession.update({
      where: { id: sessionId },
      data: { phoneNumber: e164 },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[signup/send-otp] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
