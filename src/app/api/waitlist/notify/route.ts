import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendSMS } from "@/lib/twilio"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = session.user as { role?: string }
  if (!user.role || !["OWNER", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { entryId } = body

  if (!entryId) {
    return NextResponse.json({ error: "entryId is required" }, { status: 400 })
  }

  const entry = await prisma.waitlistEntry.findUnique({
    where: { id: entryId },
  })

  if (!entry) {
    return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 })
  }

  if (!entry.customerPhone) {
    return NextResponse.json({ error: "Customer has no phone number" }, { status: 400 })
  }

  const now = new Date()
  const token = generateToken()
  const expiry = new Date(now.getTime() + 15 * 60 * 1000)

  const dateStr = entry.requestedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const timeStr = entry.requestedDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  const message =
    `Hi ${entry.customerName}! A spot just opened at Salon Envy on ${dateStr} at ${timeStr}. ` +
    `Book now (15 min hold): https://portal.salonenvyusa.com/waitlist/accept?token=${token} ` +
    `\u2014 Reply STOP to opt out.`

  const smsResult = await sendSMS(entry.customerPhone, message)

  if (!smsResult.success) {
    return NextResponse.json({ error: `SMS failed: ${smsResult.error}` }, { status: 500 })
  }

  const updated = await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: {
      notifiedAt: now,
      notificationExpiry: expiry,
      notificationStatus: "notified",
      notificationToken: token,
      status: "contacted",
      updatedAt: now,
    },
  })

  return NextResponse.json({ success: true, entry: updated })
}

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}
