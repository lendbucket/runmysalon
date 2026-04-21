import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendSMS } from "@/lib/twilio"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"

export async function GET(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = session.user as Record<string, unknown>
  const role = user.role as string

  if (role !== "OWNER" && role !== "MANAGER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const locationId = req.nextUrl.searchParams.get("locationId") || undefined
  const riskLevel = req.nextUrl.searchParams.get("riskLevel") || undefined
  const limitParam = req.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 50

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (locationId) where.locationId = locationId
  if (riskLevel) where.riskLevel = riskLevel

  const predictions = await prisma.churnPrediction.findMany({
    where,
    orderBy: { riskScore: "desc" },
    take: limit,
  })

  const total = await prisma.churnPrediction.count({ where })

  return NextResponse.json({
    predictions,
    total,
    limit,
  })
}

export async function POST(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = session.user as Record<string, unknown>
  const role = user.role as string

  if (role !== "OWNER" && role !== "MANAGER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await req.json()
  const { predictionId, message, channel } = body as {
    predictionId: string
    message?: string
    channel?: string
  }

  if (!predictionId) {
    return NextResponse.json({ error: "predictionId is required" }, { status: 400 })
  }

  const prediction = await prisma.churnPrediction.findUnique({
    where: { id: predictionId },
  })

  if (!prediction) {
    return NextResponse.json({ error: "Prediction not found" }, { status: 404 })
  }

  // Default to SMS channel
  const outreachChannel = channel || "sms"

  if (outreachChannel === "sms") {
    if (!prediction.clientPhone) {
      return NextResponse.json({ error: "Client has no phone number on file" }, { status: 400 })
    }

    const outreachMessage = message ||
      `Hi ${prediction.clientName}! We miss you at Salon Envy! It's been ${prediction.daysSinceLastVisit || "a while"} days since your last visit. Book now: salonenvyusa.com Reply STOP to opt out.`

    const result = await sendSMS(prediction.clientPhone, outreachMessage)

    if (!result.success) {
      return NextResponse.json({ error: `SMS failed: ${result.error}` }, { status: 500 })
    }

    // Update prediction record
    await prisma.churnPrediction.update({
      where: { id: predictionId },
      data: {
        outreachSent: true,
        outreachSentAt: new Date(),
        outreachResponse: `SMS sent (${result.sid})`,
      },
    })

    return NextResponse.json({
      success: true,
      channel: "sms",
      sid: result.sid,
      clientName: prediction.clientName,
    })
  }

  return NextResponse.json({ error: `Unsupported channel: ${outreachChannel}` }, { status: 400 })
}
