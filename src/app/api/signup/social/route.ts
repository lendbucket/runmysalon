import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: "Session required" }, { status: 400 })

    await prisma.signupSession.update({
      where: { id: sessionId },
      data: { currentStep: "social_connect" },
    })

    return NextResponse.json({ success: true, step: "social_connect" })
  } catch (error) {
    console.error("[signup/social] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
