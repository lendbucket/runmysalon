import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { sessionId, locationCount } = await req.json()
    if (!sessionId) return NextResponse.json({ error: "Session required" }, { status: 400 })

    const count = typeof locationCount === "number" ? locationCount : 1
    if (count < 1 || count > 999) {
      return NextResponse.json({ error: "Location count must be between 1 and 999" }, { status: 400 })
    }

    const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    const businessData = {
      ...(session.businessData as object || {}),
      locationCount: count,
      isEnterprise: count >= 10,
    }

    await prisma.signupSession.update({
      where: { id: sessionId },
      data: { businessData, currentStep: "locations" },
    })

    return NextResponse.json({ success: true, step: "locations", isEnterprise: count >= 10 })
  } catch (error) {
    console.error("[signup/locations] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
