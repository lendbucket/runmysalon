import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/signup?error=invalid_token", req.url))
  }

  const session = await prisma.signupSession.findUnique({ where: { emailVerifyToken: token } })

  if (!session) {
    return NextResponse.redirect(new URL("/signup?error=invalid_token", req.url))
  }

  if (session.emailVerifyExpires && session.emailVerifyExpires < new Date()) {
    return NextResponse.redirect(new URL("/signup?error=token_expired", req.url))
  }

  if (session.emailVerifiedAt) {
    // Already verified — redirect to current step
    return NextResponse.redirect(new URL(`/signup/terms?session=${session.id}`, req.url))
  }

  await prisma.signupSession.update({
    where: { id: session.id },
    data: {
      emailVerifiedAt: new Date(),
      currentStep: "email_verified",
      emailVerifyToken: null, // consume the token
    },
  })

  return NextResponse.redirect(new URL(`/signup/terms?session=${session.id}`, req.url))
}
