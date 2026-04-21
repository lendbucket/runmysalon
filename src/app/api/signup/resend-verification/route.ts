import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const session = await prisma.signupSession.findUnique({ where: { email } })
    if (!session) return NextResponse.json({ error: "No signup found for this email" }, { status: 404 })
    if (session.emailVerifiedAt) return NextResponse.json({ error: "Already verified" }, { status: 400 })

    const newToken = crypto.randomBytes(32).toString("hex")
    await prisma.signupSession.update({
      where: { id: session.id },
      data: {
        emailVerifyToken: newToken,
        emailVerifyExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      const appUrl = process.env.APP_URL || "https://portal.runmysalon.com"

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "RunMySalon <noreply@runmysalon.com>",
        to: email,
        subject: "Verify your email — RunMySalon",
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#06080d;color:#fff;padding:48px;">
          <div style="text-align:center;margin-bottom:32px;"><div style="display:inline-block;width:48px;height:48px;background:#606E74;border-radius:12px;line-height:48px;font-size:24px;">&#9986;</div></div>
          <h1 style="font-size:24px;font-weight:600;text-align:center;">Verify your email</h1>
          <p style="font-size:14px;color:#9ca3af;text-align:center;margin:0 0 32px;">Click below to verify and continue.</p>
          <div style="text-align:center;"><a href="${appUrl}/api/signup/verify-email?token=${newToken}" style="display:inline-block;padding:14px 32px;background:#606E74;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Verify Email</a></div>
        </div>`,
      })
    } catch (e) {
      console.error("[signup/resend] Email error:", e)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[signup/resend] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
