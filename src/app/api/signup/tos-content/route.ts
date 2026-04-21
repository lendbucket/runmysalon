import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const tos = await prisma.termsOfServiceVersion.findFirst({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ content: tos?.content || "Terms not available.", version: tos?.version || "unknown" })
}
