import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      salonName, ownerName, email, phone, address, city, state, zip,
      posProvider, posToken, posApiKey, meevoSiteId,
      businessModel, commissionRate, stylistCount, locationCount,
      password,
    } = body

    // Validate required fields
    if (!salonName || !ownerName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // Generate slug from salon name
    const baseSlug = salonName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    let slug = baseSlug
    let counter = 1
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create tenant
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const tenant = await prisma.tenant.create({
      data: {
        name: salonName,
        slug,
        subdomain: `${slug}.runmysalon.com`,
        brandName: salonName,
        ownerName,
        ownerEmail: email,
        ownerPhone: phone || null,
        businessAddress: address || null,
        businessCity: city || null,
        businessState: state || "TX",
        businessZip: zip || null,
        posProvider: posProvider || "kasse",
        posConnected: posProvider === "kasse",
        squareAccessToken: posProvider === "square" ? posToken : null,
        glossGeniusApiKey: posProvider === "glossgenius" ? posApiKey : null,
        meevoApiKey: posProvider === "meevo" ? posApiKey : null,
        meevoSiteId: posProvider === "meevo" ? meevoSiteId : null,
        commissionRate: commissionRate ? commissionRate / 100 : 0.40,
        trialEndsAt,
        subscriptionStatus: "trial",
      },
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

    // Create default location
    await prisma.tenantLocation.create({
      data: {
        tenantId: tenant.id,
        name: "Main Location",
        address: address || null,
        city: city || null,
        state: state || "TX",
        zip: zip || null,
      },
    })

    // Send welcome email (non-blocking)
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: "RunMySalon <welcome@runmysalon.com>",
        to: email,
        subject: `Welcome to RunMySalon — your portal is ready!`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#06080d;color:#fff;padding:40px;">
          <h1 style="color:#CDC9C0;">Welcome to RunMySalon!</h1>
          <p>Hi ${ownerName},</p>
          <p>Your salon portal for <strong>${salonName}</strong> is ready.</p>
          <p>Your portal URL: <a href="https://${slug}.runmysalon.com" style="color:#7a8f96;">${slug}.runmysalon.com</a></p>
          <p>Your 14-day free trial has started. Here's how to get started:</p>
          <ol>
            <li>Log in to your portal</li>
            <li>Customize your branding (logo, colors)</li>
            <li>Add your first location</li>
            <li>Invite your stylists</li>
          </ol>
          <a href="https://portal.runmysalon.com/login" style="display:inline-block;background:#CDC9C0;color:#06080d;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:20px;">Log In Now</a>
          <p style="color:#666;font-size:12px;margin-top:40px;">RunMySalon — Powered by Reyna Technology</p>
        </div>`,
      })
      // Notify super admin
      await resend.emails.send({
        from: "RunMySalon <alerts@runmysalon.com>",
        to: process.env.RUNMYSALON_SUPER_ADMIN_EMAIL || "ceo@36west.org",
        subject: `New RunMySalon signup: ${salonName}`,
        html: `<p>New salon: ${salonName}<br>Owner: ${ownerName} (${email})<br>POS: ${posProvider || "kasse"}<br>Slug: ${slug}</p>`,
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
