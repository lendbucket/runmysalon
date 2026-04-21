import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { salonName, ownerName, email, phone, address, city, state, zip, password } = body

    if (!salonName || !ownerName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // Generate unique slug
    const baseSlug = salonName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    let slug = baseSlug
    let counter = 1
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    // Create tenant with new schema
    const tenant = await prisma.tenant.create({
      data: {
        name: salonName,
        slug,
        ownerEmail: email,
        ownerPhone: phone || null,
        addressLine1: address || null,
        city: city || null,
        state: state || "TX",
        postalCode: zip || null,
        status: "TRIAL",
        trialEndsAt,
      },
    })

    // Create branding with defaults
    await prisma.tenantBranding.create({
      data: { tenantId: tenant.id, emailFromName: salonName },
    })

    // Create subscription record
    await prisma.tenantSubscription.create({
      data: { tenantId: tenant.id, status: "trialing", trialEndsAt },
    })

    // Create owner user
    const passwordHash = await hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        name: ownerName,
        passwordHash,
        role: "OWNER",
        inviteStatus: "ACCEPTED",
        tenantId: tenant.id,
      },
    })

    // Create tenant membership
    await prisma.tenantMembership.create({
      data: { tenantId: tenant.id, userId: user.id, role: "OWNER" },
    })

    // Send welcome email (non-blocking)
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "RunMySalon <noreply@runmysalon.com>",
        to: email,
        subject: `Welcome to RunMySalon — your portal is ready!`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#06080d;color:#fff;padding:40px;">
          <h1 style="color:#CDC9C0;">Welcome to RunMySalon!</h1>
          <p>Hi ${ownerName},</p>
          <p>Your salon portal for <strong>${salonName}</strong> is ready.</p>
          <p>Your portal URL: <a href="https://${slug}.runmysalon.com" style="color:#7a8f96;">${slug}.runmysalon.com</a></p>
          <p>Your 14-day free trial has started.</p>
        </div>`,
      })
      // Notify super admin
      const adminEmail = process.env.SUPER_ADMIN_EMAIL || "ceo@36west.org"
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "RunMySalon <alerts@runmysalon.com>",
        to: adminEmail,
        subject: `New RunMySalon signup: ${salonName}`,
        html: `<p>New salon: ${salonName}<br>Owner: ${ownerName} (${email})<br>Slug: ${slug}</p>`,
      })
    } catch (emailErr) {
      console.error("[signup] Email error:", emailErr)
    }

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      userId: user.id,
      slug,
      portalUrl: `https://${slug}.runmysalon.com`,
    })
  } catch (error) {
    console.error("[signup] Error:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
