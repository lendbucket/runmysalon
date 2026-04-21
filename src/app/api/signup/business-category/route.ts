import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { BUSINESS_CATEGORIES } from "@/lib/validation/signup"

export async function POST(req: Request) {
  try {
    const { sessionId, category } = await req.json()
    if (!sessionId) return NextResponse.json({ error: "Session required" }, { status: 400 })
    if (!category || !BUSINESS_CATEGORIES.includes(category as any)) {
      return NextResponse.json({ error: "Select a valid business category" }, { status: 400 })
    }

    const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    const businessData = { ...(session.businessData as object || {}), businessCategory: category }
    await prisma.signupSession.update({
      where: { id: sessionId },
      data: { businessData, currentStep: "business_category" },
    })

    return NextResponse.json({ success: true, step: "business_category" })
  } catch (error) {
    console.error("[signup/business-category] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
