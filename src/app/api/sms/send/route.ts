import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendSMS } from "@/lib/twilio"
import { logAction, AUDIT_ACTIONS } from "@/lib/auditLogger"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as Record<string, unknown>
  const role = user.role as string
  if (role !== "OWNER" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { to, message, type } = await req.json() as { to?: string; message?: string; type?: string }

  if (!to || !message) {
    return NextResponse.json({ error: "to and message are required" }, { status: 400 })
  }

  const digits = to.replace(/\D/g, "")
  if (digits.length < 10) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
  }

  const result = await sendSMS(to, message)

  logAction({
    action: AUDIT_ACTIONS.SMS_SENT,
    entity: "SMS",
    userId: user.id as string,
    userEmail: user.email as string,
    userRole: role,
    metadata: { toLast4: digits.slice(-4), type: type || "custom", messageLength: message.length },
  })

  return NextResponse.json(result)
}
