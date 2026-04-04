import { NextResponse, type NextRequest } from "next/server"
import { requireSession } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession()
  if (response) return response

  const { id } = await params

  let json: Record<string, unknown>
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id } })
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const qty = typeof json.quantityOnHand === "number" ? json.quantityOnHand : item.quantityOnHand
  const threshold = typeof json.reorderThreshold === "number" ? json.reorderThreshold : item.reorderThreshold

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: {
      quantityOnHand: qty,
      reorderThreshold: threshold,
      isLowStock: qty <= threshold,
    },
    include: { location: true },
  })

  return NextResponse.json({ item: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession()
  if (response) return response

  const { id } = await params

  const item = await prisma.inventoryItem.findUnique({ where: { id } })
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.inventoryItem.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
