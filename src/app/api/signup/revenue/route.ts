import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { REVENUE_BRACKETS } from "@/lib/validation/signup"

export async function POST(req: Request) {
  try {
    const { sessionId, bracket } = await req.json()
    if (!sessionId) return NextResponse.json({ error: "Session required" }, { status: 400 })
    if (!bracket || !REVENUE_BRACKETS.includes(bracket as any)) {
      return NextResponse.json({ error: "Select a revenue bracket" }, { status: 400 })
    }

    const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    const businessData = { ...(session.businessData as object || {}), annualRevenueBracket: bracket }
    await prisma.signupSession.update({
      where: { id: sessionId },
      data: { businessData, currentStep: "revenue" },
    })

    return NextResponse.json({ success: true, step: "revenue" })
  } catch (error) {
    console.error("[signup/revenue] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
