import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCatalogItems } from "@/lib/catalogCache"

export const maxDuration = 30

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const items = await getCatalogItems()
    // Map to the format the frontend expects
    const services = items.map(item => ({
      id: item.id,
      name: item.variationName !== "Regular" ? `${item.name} — ${item.variationName}` : item.name,
      price: item.price,
      durationMinutes: item.durationMinutes,
    }))
    return NextResponse.json({ services })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Catalog fetch failed", services: [] }, { status: 500 })
  }
}
