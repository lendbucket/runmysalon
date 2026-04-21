import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import crypto from "crypto"
import { validateEmail, validatePassword } from "@/lib/validation/signup"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    const emailErr = validateEmail(email)
    if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 })
    const pwErr = validatePassword(password)
    if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 })

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists", code: "EMAIL_EXISTS" }, { status: 409 })
    }

    // Check for existing session, delete if expired
    const existing = await prisma.signupSession.findUnique({ where: { email } })
    if (existing) {
      if (existing.expiresAt < new Date()) {
        await prisma.signupSession.delete({ where: { email } })
      } else if (existing.emailVerifiedAt) {
        // Already verified — let them resume
        return NextResponse.json({ sessionId: existing.id, step: existing.currentStep, resuming: true })
      } else {
        await prisma.signupSession.delete({ where: { email } })
      }
    }

    const passwordHash = await hash(password, 12)
    const emailVerifyToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const session = await prisma.signupSession.create({
      data: {
        email,
        passwordHash,
        emailVerifyToken,
        emailVerifyExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        currentStep: "email_pending",
        expiresAt,
      },
    })

    // Send verification email via Resend
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      const appUrl = process.env.APP_URL || "https://portal.runmysalon.com"

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "RunMySalon <noreply@runmysalon.com>",
        to: email,
        subject: "Verify your email — RunMySalon",
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#06080d;color:#fff;padding:48px;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="display:inline-block;width:48px;height:48px;background:#606E74;border-radius:12px;line-height:48px;font-size:24px;">&#9986;</div>
          </div>
          <h1 style="font-size:24px;font-weight:600;text-align:center;margin:0 0 8px;">Verify your email</h1>
          <p style="font-size:14px;color:#9ca3af;text-align:center;margin:0 0 32px;">Click below to verify your email and continue setting up your salon portal.</p>
          <div style="text-align:center;">
            <a href="${appUrl}/api/signup/verify-email?token=${emailVerifyToken}" style="display:inline-block;padding:14px 32px;background:#606E74;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Verify Email</a>
          </div>
          <p style="font-size:12px;color:#6b7280;text-align:center;margin-top:32px;">Didn't sign up for RunMySalon? Ignore this email.</p>
          <p style="font-size:11px;color:#4b5563;text-align:center;margin-top:16px;">Or copy this link: ${appUrl}/api/signup/verify-email?token=${emailVerifyToken}</p>
        </div>`,
      })
    } catch (emailErr) {
      console.error("[signup/email] Failed to send verification:", emailErr)
    }

    return NextResponse.json({ sessionId: session.id, step: "email_pending" })
  } catch (error) {
    console.error("[signup/email] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
