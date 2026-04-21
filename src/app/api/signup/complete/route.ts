import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { generateSlug, findUniqueSlug } from "@/lib/validation/signup"
import { sign } from "jsonwebtoken"

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "runmysalon.com"
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || ""

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: "Session required" }, { status: 400 })

    const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })
    if (!session.emailVerifiedAt) return NextResponse.json({ error: "Email not verified" }, { status: 400 })
    if (!session.tosAcceptedAt) return NextResponse.json({ error: "ToS not accepted" }, { status: 400 })

    const data = (session.businessData || {}) as Record<string, any>
    const businessName = data.businessName || session.email.split("@")[0]

    // Generate unique slug
    const baseSlug = generateSlug(businessName)
    const slug = await findUniqueSlug(baseSlug, prisma)

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const ua = req.headers.get("user-agent") || "unknown"

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          slug,
          ownerEmail: session.email,
          ownerPhone: session.phoneNumber || null,
          status: "TRIAL",
          trialEndsAt,
          addressLine1: data.formattedAddress || null,
          city: data.addressComponents?.city || null,
          state: data.addressComponents?.state || null,
          postalCode: data.addressComponents?.postalCode || null,
          placeId: data.placeId || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          businessCategory: data.businessCategory || null,
          annualRevenueBracket: data.annualRevenueBracket || null,
          entityType: data.entityType || null,
          ein: data.ein || null,
          yearsInBusiness: data.yearsInBusiness || null,
          employeeCount: (data.fullTimeCount || 0) + (data.partTimeCount || 0),
          locationCount: data.locationCount || 1,
          planTier: data.planTier || "growth",
          softwareProviderSlug: data.softwareProviderSlug || null,
          kasseWaitlist: data.kasseWaitlist || false,
          signupSourceIp: ip,
          signupUserAgent: ua,
        },
      })

      // 2. Create TenantBranding
      await tx.tenantBranding.create({
        data: {
          tenantId: tenant.id,
          emailFromName: businessName,
        },
      })

      // 3. Create TenantSubscription
      await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          status: "trialing",
          trialEndsAt,
        },
      })

      // 4. Create or find User
      let user = await tx.user.findUnique({ where: { email: session.email } })
      if (!user) {
        user = await tx.user.create({
          data: {
            email: session.email,
            name: session.tosSignedName || session.email.split("@")[0],
            passwordHash: session.passwordHash || await hash("temp-" + Date.now(), 12),
            role: "OWNER",
            inviteStatus: "ACCEPTED",
            tenantId: tenant.id,
          },
        })
      } else {
        await tx.user.update({
          where: { id: user.id },
          data: { tenantId: tenant.id },
        })
      }

      // 5. Create OWNER membership
      await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: "OWNER",
        },
      })

      // 6. Create TenantAIAgent scaffold
      await tx.tenantAIAgent.create({
        data: {
          tenantId: tenant.id,
          personality: "encouraging",
          knowledgeBase: { businessCategory: data.businessCategory, planTier: data.planTier },
        },
      })

      // 7. Mark session complete
      await tx.signupSession.update({
        where: { id: sessionId },
        data: { currentStep: "complete", createdTenantId: tenant.id },
      })

      return { tenant, user }
    })

    // Post-transaction async work (non-blocking)

    // Add subdomain to Vercel
    const vercelToken = process.env.VERCEL_API_TOKEN
    const vercelProjectId = process.env.VERCEL_PROJECT_ID
    if (vercelToken && vercelProjectId) {
      try {
        const domainUrl = `https://api.vercel.com/v10/projects/${vercelProjectId}/domains`
        const headers: Record<string, string> = {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        }
        const teamId = process.env.VERCEL_TEAM_ID
        const url = teamId ? `${domainUrl}?teamId=${teamId}` : domainUrl

        await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ name: `${slug}.${ROOT_DOMAIN}` }),
        })
        console.log(`[provisioning] Added domain: ${slug}.${ROOT_DOMAIN}`)

        // Trigger SSL warmup
        setTimeout(() => {
          fetch(`https://${slug}.${ROOT_DOMAIN}/api/health`).catch(() => {})
        }, 5000)
      } catch (vercelErr) {
        console.error("[provisioning] Vercel domain error:", vercelErr)
      }
    }

    // Send welcome email
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      const firstName = (result.user.name || "").split(" ")[0] || "there"

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "RunMySalon <noreply@runmysalon.com>",
        to: session.email,
        subject: "Your RunMySalon portal is ready!",
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#06080d;color:#fff;padding:48px;">
          <div style="text-align:center;margin-bottom:32px;"><div style="display:inline-block;width:48px;height:48px;background:#606E74;border-radius:12px;line-height:48px;font-size:24px;">✂</div></div>
          <h1 style="font-size:24px;text-align:center;">Welcome, ${firstName}!</h1>
          <p style="color:#9ca3af;text-align:center;margin:8px 0 32px;">Your salon portal is ready at:</p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="https://${slug}.${ROOT_DOMAIN}" style="display:inline-block;padding:14px 32px;background:#606E74;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">${slug}.${ROOT_DOMAIN}</a>
          </div>
          <h3 style="font-size:16px;margin:0 0 12px;">Quick start:</h3>
          <ol style="color:#9ca3af;padding-left:20px;line-height:2;">
            <li>Visit your portal link above</li>
            <li>Explore the dashboard</li>
            <li>Invite your team from Settings</li>
          </ol>
          <p style="color:#6b7280;font-size:12px;margin-top:32px;text-align:center;">Reply to this email if you need anything — a real human will respond.</p>
        </div>`,
      })
    } catch (emailErr) {
      console.error("[provisioning] Welcome email error:", emailErr)
    }

    // Generate signed redirect token (JWT)
    const redirectToken = sign(
      { userId: result.user.id, tenantId: result.tenant.id, purpose: "signup-redirect" },
      NEXTAUTH_SECRET,
      { expiresIn: "60s" }
    )

    return NextResponse.json({
      success: true,
      subdomain: `${slug}.${ROOT_DOMAIN}`,
      slug,
      tenantId: result.tenant.id,
      redirectToken,
    })
  } catch (error) {
    console.error("[signup/complete] Error:", error)
    return NextResponse.json({ error: "Failed to create your portal" }, { status: 500 })
  }
}
