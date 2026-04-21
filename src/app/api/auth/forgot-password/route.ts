import { NextResponse } from "next/server"

// Stub: always returns success. Real email-sending wiring is a later prompt.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const email = body.email

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  // In production, this would:
  // 1. Find user by email
  // 2. Generate a time-limited reset token
  // 3. Send reset email via Resend
  // For now, return success to keep the UX working.
  console.log(`[forgot-password] Reset requested for: ${email}`)

  return NextResponse.json({ success: true })
}
