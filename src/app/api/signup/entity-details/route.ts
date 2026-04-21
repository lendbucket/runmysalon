import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateEIN, ENTITY_TYPES } from "@/lib/validation/signup"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sessionId, entityType, ein, dba, yearsInBusiness, fullTimeCount, partTimeCount, noEinYet } = body

    if (!sessionId) return NextResponse.json({ error: "Session required" }, { status: 400 })
    if (!entityType || !ENTITY_TYPES.includes(entityType as any)) {
      return NextResponse.json({ error: "Select a valid entity type" }, { status: 400 })
    }

    // EIN validation
    if (!noEinYet) {
      const einErr = validateEIN(ein, entityType)
      if (einErr) return NextResponse.json({ error: einErr }, { status: 400 })
    }

    const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    const businessData = {
      ...(session.businessData as object || {}),
      entityType,
      ein: noEinYet ? null : (ein || null),
      dba: dba?.trim() || null,
      yearsInBusiness: typeof yearsInBusiness === "number" ? yearsInBusiness : 0,
      fullTimeCount: typeof fullTimeCount === "number" ? fullTimeCount : 0,
      partTimeCount: typeof partTimeCount === "number" ? partTimeCount : 0,
      noEinYet: !!noEinYet,
    }

    await prisma.signupSession.update({
      where: { id: sessionId },
      data: { businessData, currentStep: "entity_details" },
    })

    return NextResponse.json({ success: true, step: "entity_details" })
  } catch (error) {
    console.error("[signup/entity-details] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
