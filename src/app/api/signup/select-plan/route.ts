import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PLAN_TIERS } from "@/lib/validation/signup"

export async function POST(req: Request) {
  try {
    const { sessionId, planTier } = await req.json()
    if (!sessionId) return NextResponse.json({ error: "Session required" }, { status: 400 })
    if (!planTier || !PLAN_TIERS.includes(planTier as any)) {
      return NextResponse.json({ error: "Select a valid plan" }, { status: 400 })
    }

    const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    const businessData = { ...(session.businessData as object || {}), planTier }

    await prisma.signupSession.update({
      where: { id: sessionId },
      data: { businessData, currentStep: "plan_selection" },
    })

    return NextResponse.json({ success: true, step: "plan_selection" })
  } catch (error) {
    console.error("[signup/select-plan] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
