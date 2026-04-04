import { NextResponse } from "next/server"
import { requireSession } from "@/lib/api-auth"

export async function POST(req: Request) {
  const { response } = await requireSession()
  if (response) return response

  let body: { email?: string; name?: string; location?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { email, name, location } = body
  if (!email || !name) {
    return NextResponse.json({ error: "email and name are required" }, { status: 400 })
  }

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)

    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Salon Envy Portal <noreply@salonenvyusa.com>",
      to: email,
      subject: "You're invited to Salon Envy\u00ae Portal",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #0f1d24; color: #ffffff; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #CDC9C0; font-size: 28px; margin: 0 0 8px; font-weight: 900; letter-spacing: 0.05em;">SALON</h1>
            <h1 style="color: #CDC9C0; font-size: 36px; margin: 0; font-style: italic; font-family: Georgia, serif; font-weight: 400;">Envy</h1>
          </div>
          <h2 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 8px;">Welcome, ${name}!</h2>
          <p style="color: #94A3B8; margin: 0 0 8px; font-size: 14px; line-height: 1.6;">
            You've been invited to join the Salon Envy\u00ae team${location ? ` at ${location}` : ""}.
          </p>
          <p style="color: #94A3B8; margin: 0 0 24px; font-size: 14px; line-height: 1.6;">
            Click the button below to set up your account and get started.
          </p>
          <a href="${baseUrl}/onboarding" style="display: block; background: #CDC9C0; color: #0f1d24; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; text-align: center; margin-bottom: 24px;">
            Get Started
          </a>
          <p style="color: #555; font-size: 12px; text-align: center; margin: 0;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Failed to send invite email:", err)
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 })
  }
}
