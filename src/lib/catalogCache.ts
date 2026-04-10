import { SquareClient, SquareEnvironment } from "square"

function getSquare() {
  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production,
  })
}

// variation_id → { name (item name, not "Regular"), price (cents), durationMinutes }
let catalogCache: Record<string, { name: string; price: number; durationMinutes: number }> = {}
let cacheExpiry = 0

export async function getServiceName(variationId: string): Promise<string> {
  if (Date.now() > cacheExpiry || Object.keys(catalogCache).length === 0) {
    await refreshCatalogCache()
  }
  return catalogCache[variationId]?.name || "Service"
}

export async function getServiceInfo(variationId: string): Promise<{ name: string; price: number; durationMinutes: number }> {
  if (Date.now() > cacheExpiry || Object.keys(catalogCache).length === 0) {
    await refreshCatalogCache()
  }
  return catalogCache[variationId] || { name: "Service", price: 0, durationMinutes: 60 }
}

export async function getBulkServiceNames(variationIds: string[]): Promise<Record<string, string>> {
  if (Date.now() > cacheExpiry || Object.keys(catalogCache).length === 0) {
    await refreshCatalogCache()
  }
  const result: Record<string, string> = {}
  for (const id of variationIds) {
    result[id] = catalogCache[id]?.name || "Service"
  }
  return result
}

export async function getFullCache(): Promise<Record<string, { name: string; price: number; durationMinutes: number }>> {
  if (Date.now() > cacheExpiry || Object.keys(catalogCache).length === 0) {
    await refreshCatalogCache()
  }
  return { ...catalogCache }
}

/** Fetch a single variation directly from Square API (fallback for cache misses) */
export async function fetchVariationDirect(variationId: string): Promise<{ name: string; price: number; durationMinutes: number }> {
  try {
    const square = getSquare()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await square.catalog.object.get({ objectId: variationId }) as any
    const obj = res.object
    if (!obj) return { name: "Service", price: 0, durationMinutes: 0 }

    const vData = obj.itemVariationData
    if (!vData) return { name: "Service", price: 0, durationMinutes: 0 }

    let itemName = vData.name || "Service"
    if (vData.itemId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parentRes = await square.catalog.object.get({ objectId: vData.itemId }) as any
        if (parentRes.object?.itemData?.name) {
          itemName = parentRes.object.itemData.name
        }
      } catch { /* use variation name */ }
    }

    const price = vData.priceMoney?.amount ? Number(vData.priceMoney.amount) : 0
    const durationMs = vData.serviceDuration ? Number(vData.serviceDuration) : 0
    const durationMinutes = durationMs > 0 ? Math.round(durationMs / 60000) : 0

    catalogCache[variationId] = { name: itemName, price, durationMinutes }
    return { name: itemName, price, durationMinutes }
  } catch {
    return { name: "Service", price: 0, durationMinutes: 0 }
  }
}

export async function refreshCatalogCache() {
  try {
    const square = getSquare()
    const newCache: Record<string, { name: string; price: number; durationMinutes: number }> = {}

    // Use catalog.search with objectTypes: ["ITEM"] to get all items
    // with full nested variation data including prices in one pass
    let cursor: string | undefined
    do {
      const response = await square.catalog.search({
        objectTypes: ["ITEM"],
        limit: 100,
        ...(cursor ? { cursor } : {}),
      })

      cursor = response.cursor || undefined
      const objects = response.objects || []

      for (const item of objects) {
        if (item.type !== "ITEM") continue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemData = (item as any).itemData
        if (!itemData) continue
        const itemName = itemData.name || "Service"

        for (const variation of itemData.variations || []) {
          if (!variation.id) continue

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vData = (variation as any).itemVariationData
          if (!vData) continue

          // Price in cents (callers divide by 100)
          const priceAmount = vData.priceMoney?.amount
          const price = priceAmount ? Number(priceAmount) : 0

          // Duration: Square stores as milliseconds in serviceDuration
          const durationMs = vData.serviceDuration ? Number(vData.serviceDuration) : 0
          const durationMinutes = durationMs > 0 ? Math.round(durationMs / 60000) : 0

          // Use ITEM name (e.g. "Envy Cut®") not variation name (e.g. "Regular")
          newCache[variation.id] = { name: itemName, price, durationMinutes }
        }
      }
    } while (cursor)

    catalogCache = newCache
    cacheExpiry = Date.now() + 30 * 60 * 1000 // 30 min TTL

    const entries = Object.entries(newCache)
    const withPrice = entries.filter(([, v]) => v.price > 0)
    console.log(`[CatalogCache] Loaded ${entries.length} variations, ${withPrice.length} with price > 0`)

    // Log known service IDs to verify prices in Vercel logs
    const check = ["POE6SDZB3ISP2MPUO6TV2K3T", "QMPSENCSASW4UIOPTQFJPUED", "KIEQ7NE6EKITICOUCKGVAO3K"]
    for (const id of check) {
      console.log(`[CatalogCache] ${id}:`, newCache[id] || "NOT FOUND")
    }
  } catch (e) {
    console.error("[CatalogCache] refresh failed:", e)
  }
}
