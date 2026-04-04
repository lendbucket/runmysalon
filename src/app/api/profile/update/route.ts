import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, phone } = await req.json()

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { name: name || undefined },
    })

    // Also update staffMember if linked
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { staffMember: true },
    })

    if (user?.staffMember) {
      await prisma.staffMember.update({
        where: { id: user.staffMember.id },
        data: {
          fullName: name || undefined,
          phone: phone || undefined,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
