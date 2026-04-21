import { NextRequest, NextResponse } from "next/server"
import { sendSMS } from "@/lib/twilio"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"

export async function GET(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const token = req.nextUrl.searchParams.get("token")

  if (!token) {
    return new NextResponse(renderHTML("Invalid Link", "No token provided. Please use the link from your SMS."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    })
  }

  const entry = await prisma.waitlistEntry.findUnique({
    where: { notificationToken: token },
  })

  if (!entry) {
    return new NextResponse(renderHTML("Invalid Link", "This link is invalid or has already been used."), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    })
  }

  if (entry.notificationStatus !== "notified") {
    return new NextResponse(
      renderHTML("Already Processed", "This waitlist spot has already been claimed or expired."),
      { status: 400, headers: { "Content-Type": "text/html" } },
    )
  }

  const now = new Date()
  if (entry.notificationExpiry && entry.notificationExpiry < now) {
    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: { notificationStatus: "expired", status: "expired", updatedAt: now },
    })
    return new NextResponse(
      renderHTML("Expired", "Sorry, your 15-minute hold has expired. Please contact us to check availability."),
      { status: 410, headers: { "Content-Type": "text/html" } },
    )
  }

  // Mark as accepted
  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: {
      status: "fulfilled",
      notificationStatus: "accepted",
      updatedAt: now,
    },
  })

  // Send confirmation SMS
  if (entry.customerPhone) {
    await sendSMS(
      entry.customerPhone,
      "Your spot at Salon Envy is confirmed! We'll see you soon.",
    )
  }

  return new NextResponse(
    renderHTML(
      "Spot Confirmed!",
      `Thank you, ${entry.customerName}! Your appointment at Salon Envy is confirmed. We'll see you soon!`,
    ),
    { status: 200, headers: { "Content-Type": "text/html" } },
  )
}

function renderHTML(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - Salon Envy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 12px; }
    p { color: #555; font-size: 16px; line-height: 1.6; }
    .logo { font-size: 32px; margin-bottom: 20px; font-weight: bold; color: #764ba2; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Salon Envy</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
}
