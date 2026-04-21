import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { sessionId, providerSlug, customSoftwareName, customWebsiteUrl, kasseWaitlist } = await req.json()
    if (!sessionId) return NextResponse.json({ error: "Session required" }, { status: 400 })

    const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    // If custom software
    if (providerSlug === "other" && customSoftwareName) {
      await prisma.customSoftwareRequest.create({
        data: {
          signupEmail: session.email,
          softwareName: customSoftwareName.trim(),
          websiteUrl: customWebsiteUrl?.trim() || null,
        },
      })
    }

    const businessData = {
      ...(session.businessData as object || {}),
      softwareProviderSlug: providerSlug || null,
      kasseWaitlist: !!kasseWaitlist,
    }

    await prisma.signupSession.update({
      where: { id: sessionId },
      data: { businessData, currentStep: "software_picker" },
    })

    return NextResponse.json({ success: true, step: "software_picker" })
  } catch (error) {
    console.error("[signup/software] Error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
