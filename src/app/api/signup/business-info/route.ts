import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateBusinessName } from "@/lib/validation/signup"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sessionId, businessName, placeId, formattedAddress, addressComponents, latitude, longitude, isMobile, mobileArea } = body

    if (!sessionId) return NextResponse.json({ error: "Session required" }, { status: 400 })

    const nameErr = validateBusinessName(businessName)
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 })

    if (!isMobile && !placeId) {
      return NextResponse.json({ error: "Please select an address from the suggestions" }, { status: 400 })
    }

    const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    const businessData = {
      ...(session.businessData as object || {}),
      businessName: businessName.trim(),
      placeId: placeId || null,
      formattedAddress: formattedAddress || null,
      addressComponents: addressComponents || null,
      latitude: latitude || null,
      longitude: longitude || null,
      isMobile: !!isMobile,
      mobileArea: mobileArea || null,
    }

    await prisma.signupSession.update({
      where: { id: sessionId },
      data: { businessData, currentStep: "business_info" },
    })

    return NextResponse.json({ success: true, step: "business_info" })
  } catch (error) {
    console.error("[signup/business-info] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
