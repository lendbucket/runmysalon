import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sessionId, signedName, readConfirm, authorityConfirm } = body

    if (!sessionId || !signedName || !readConfirm || !authorityConfirm) {
      return NextResponse.json({ error: "All fields and confirmations are required" }, { status: 400 })
    }

    if (signedName.trim().length < 2) {
      return NextResponse.json({ error: "Please type your full legal name" }, { status: 400 })
    }

    const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })
    if (!session.emailVerifiedAt) return NextResponse.json({ error: "Email not verified" }, { status: 400 })

    // Get current ToS version
    const tos = await prisma.termsOfServiceVersion.findFirst({ orderBy: { createdAt: "desc" } })

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const ua = req.headers.get("user-agent") || "unknown"

    await prisma.signupSession.update({
      where: { id: sessionId },
      data: {
        tosAcceptedAt: new Date(),
        tosIpAddress: ip,
        tosUserAgent: ua,
        tosVersion: tos?.version || "v0-placeholder",
        tosSignedName: signedName.trim(),
        currentStep: "tos_accepted",
      },
    })

    return NextResponse.json({ success: true, step: "tos_accepted" })
  } catch (error) {
    console.error("[signup/accept-tos] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
