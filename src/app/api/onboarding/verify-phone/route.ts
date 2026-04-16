import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, enrollmentId, action, code } = body as {
      phone?: string
      enrollmentId?: string
      action?: string
      code?: string
    }

    if (!enrollmentId) {
      return NextResponse.json({ error: "Missing enrollmentId" }, { status: 400 })
    }

    const enrollment = await prisma.onboardingEnrollment.findUnique({
      where: { id: enrollmentId },
    })
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    // Confirm action — verify the code
    if (action === "confirm") {
      if (!code) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 })
      }
      if (enrollment.phoneVerificationCode !== code) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
      }
      if (enrollment.phoneVerificationExpiry && new Date() > enrollment.phoneVerificationExpiry) {
        return NextResponse.json({ error: "Verification code expired. Please request a new one." }, { status: 400 })
      }
      await prisma.onboardingEnrollment.update({
        where: { id: enrollmentId },
        data: { phoneVerified: true },
      })
      return NextResponse.json({ verified: true })
    }

    // Send action — generate and SMS OTP
    if (!phone) {
      return NextResponse.json({ error: "Missing phone" }, { status: 400 })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.onboardingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        phoneVerificationCode: otp,
        phoneVerificationExpiry: expiry,
        phoneVerified: false,
      },
    })

    try {
      const { sendSMS } = await import("@/lib/twilio")
      await sendSMS(phone, `Your Salon Envy verification code is: ${otp}. Expires in 10 minutes.`)
    } catch (smsErr) {
      console.error("Failed to send verification SMS:", smsErr)
      return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 })
    }

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error("Phone verification error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
