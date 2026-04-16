import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, enrollmentId, action, code } = body as {
      email?: string
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
      if (enrollment.emailVerificationCode !== code) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
      }
      if (enrollment.emailVerificationExpiry && new Date() > enrollment.emailVerificationExpiry) {
        return NextResponse.json({ error: "Verification code expired. Please request a new one." }, { status: 400 })
      }
      await prisma.onboardingEnrollment.update({
        where: { id: enrollmentId },
        data: { emailVerified: true },
      })
      return NextResponse.json({ verified: true })
    }

    // Send action — generate and email OTP
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.onboardingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        emailVerificationCode: otp,
        emailVerificationExpiry: expiry,
        emailVerified: false,
      },
    })

    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Salon Envy Portal <noreply@salonenvyusa.com>",
        to: email,
        subject: "Your Salon Envy Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; text-align: center;">
            <h2 style="color: #000; margin: 0 0 8px;">Verification Code</h2>
            <p style="color: #666; font-size: 14px; margin: 0 0 24px;">Enter this code to verify your email address.</p>
            <div style="background: #f5f5f5; border: 2px solid #e0e0e0; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
              <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #000; font-family: monospace;">${otp}</div>
            </div>
            <p style="color: #999; font-size: 12px; margin: 0;">This code expires in 10 minutes.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error("Email verification error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
