import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/api-auth"
import { logAction, AUDIT_ACTIONS } from "@/lib/auditLogger"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { db: prisma } = await getTenantPrisma()
  const { session, response } = await requireSession()
  if (response) return response

  const user = session!.user as Record<string, unknown>
  const role = user.role as string
  if (role !== "OWNER" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const method = req.nextUrl.searchParams.get("method") || "email"

  const enrollment = await prisma.onboardingEnrollment.findUnique({
    where: { id },
    include: { location: true },
  })

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
  }

  if (enrollment.status === "completed" || enrollment.status === "cancelled") {
    return NextResponse.json({ error: `Cannot resend to a ${enrollment.status} enrollment` }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  const enrollLink = `${baseUrl}/onboarding/enroll/${enrollment.inviteToken}`

  if (method === "email") {
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: "waivers@salonenvyusa.com",
        to: enrollment.email,
        subject: "Reminder: Complete Your Salon Envy Onboarding",
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; background: #0f1d24; color: #ffffff; padding: 40px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://portal.salonenvyusa.com/images/logo-white.png" alt="Salon Envy" width="160" style="display:block;height:auto;margin:0 auto;" />
            </div>
            <h2 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 8px;">Reminder, ${enrollment.firstName}!</h2>
            <p style="color: #94A3B8; margin: 0 0 8px; font-size: 14px; line-height: 1.6;">
              You have a pending onboarding enrollment for Salon Envy ${enrollment.location.name}.
            </p>
            <p style="color: #94A3B8; margin: 0 0 24px; font-size: 14px; line-height: 1.6;">
              Please complete your enrollment by clicking the button below. ${enrollment.expiresAt ? `This link expires ${new Date(enrollment.expiresAt).toLocaleDateString()}.` : ""}
            </p>
            <a href="${enrollLink}" style="display: block; background: #CDC9C0; color: #0f1d24; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; text-align: center; margin-bottom: 24px;">
              Complete Enrollment
            </a>
            <p style="color: #555; font-size: 12px; text-align: center; margin: 0;">
              Questions? Call (361) 889-1102
            </p>
          </div>
        `,
      })
    } catch (e) {
      console.error("[resend] Failed to send reminder email:", e)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }
  } else if (method === "sms") {
    if (!enrollment.phone) {
      return NextResponse.json({ error: "No phone number on file" }, { status: 400 })
    }
    try {
      const { sendSMS } = await import("@/lib/twilio")
      await sendSMS(
        enrollment.phone,
        `Hi ${enrollment.firstName}! Reminder to complete your Salon Envy onboarding. Click here: ${enrollLink} — Questions? Call (361) 889-1102. Reply STOP to unsubscribe.`
      )
    } catch (e) {
      console.error("[resend] Failed to send reminder SMS:", e)
      return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 })
    }
  } else {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 })
  }

  await prisma.onboardingEnrollment.update({
    where: { id },
    data: {
      lastReminderSentAt: new Date(),
      reminderCount: { increment: 1 },
    },
  })

  logAction({
    action: AUDIT_ACTIONS.ENROLLMENT_REMINDER_SENT,
    entity: "OnboardingEnrollment",
    entityId: id,
    userId: user.id as string,
    userEmail: user.email as string,
    userRole: role,
    metadata: { method, enrolleeName: `${enrollment.firstName} ${enrollment.lastName}` },
  })

  return NextResponse.json({ success: true, method })
}
