import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q") || ""

  const providers = await prisma.softwareProvider.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : { isActive: true },
    orderBy: { displayOrder: "asc" },
    take: 100,
  })

  return NextResponse.json({ providers })
}
