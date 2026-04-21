import { NextResponse } from "next/server"

// Stub: validates input shape but doesn't actually reset.
// Real token validation + password update is a later prompt.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { token, password } = body

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  // In production, this would:
  // 1. Validate the reset token against DB
  // 2. Hash the new password with bcrypt
  // 3. Update the user record
  // 4. Invalidate the token
  console.log(`[reset-password] Reset attempted with token: ${token.slice(0, 8)}...`)

  return NextResponse.json({ success: true })
}
