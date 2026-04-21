import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const formData = await req.formData()
  const callSid = formData.get("CallSid") as string
  const from = formData.get("From") as string
  const to = formData.get("To") as string

  // Find tenant by phone number
  // For now, use a basic lookup — in production, map Twilio numbers to tenants
  const tenant = await prisma.tenant.findFirst({
    where: { status: "ACTIVE" },
  })

  if (!tenant) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, this number is not configured. Please try again later.</Say>
  <Hangup/>
</Response>`
    return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } })
  }

  const aiName = "Nova"
  const greeting = `Thank you for calling ${tenant.name}. I'm ${aiName}, your virtual receptionist. How can I help you today?`

  // Log the call
  await prisma.voiceCallLog.create({
    data: {
      tenantId: tenant.id,
      callSid,
      callerNumber: from,
      calledNumber: to,
      direction: "inbound",
      status: "in_progress",
    },
  })

  // Return TwiML with Gather for speech input
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="/api/voice/process" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="alice">${greeting}</Say>
  </Gather>
  <Say voice="alice">I didn't hear anything. Goodbye.</Say>
  <Hangup/>
</Response>`

  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } })
}
