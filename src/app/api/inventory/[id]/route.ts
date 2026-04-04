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

  const data: Record<string, unknown> = {
    quantityOnHand: qty,
    reorderThreshold: threshold,
    isLowStock: qty <= threshold,
  }

  // Pass through all optional fields if present
  if (typeof json.brand === "string") data.brand = json.brand
  if (typeof json.productName === "string") data.productName = json.productName
  if (typeof json.category === "string") data.category = json.category
  if (typeof json.shadeOrVolume === "string" || json.shadeOrVolume === null) data.shadeOrVolume = json.shadeOrVolume
  if (typeof json.unitType === "string" || json.unitType === null) data.unitType = json.unitType
  if (typeof json.costPerUnit === "number" || json.costPerUnit === null) data.costPerUnit = json.costPerUnit
  if (typeof json.ouncesPerUnit === "number" || json.ouncesPerUnit === null) data.ouncesPerUnit = json.ouncesPerUnit
  if (typeof json.ouncesPerService === "number" || json.ouncesPerService === null) data.ouncesPerService = json.ouncesPerService
  if (typeof json.ouncesOnHand === "number" || json.ouncesOnHand === null) data.ouncesOnHand = json.ouncesOnHand
  if (typeof json.supplier === "string" || json.supplier === null) data.supplier = json.supplier
  if (typeof json.sku === "string" || json.sku === null) data.sku = json.sku
  if (typeof json.notes === "string" || json.notes === null) data.notes = json.notes
  if (typeof json.reorderQty === "number") data.reorderQty = json.reorderQty
  if (typeof json.locationId === "string") data.locationId = json.locationId

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data,
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
