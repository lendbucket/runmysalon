"use client"
import { useState, useEffect, useCallback, useMemo } from "react"

type Loc = { id: string; name: string; address: string; phone: string }
type Item = {
  id: string
  brand: string
  productName: string
  category: string
  shadeOrVolume: string | null
  quantityOnHand: number
  reorderThreshold: number
  isLowStock: boolean
  location: Loc
}

const CATEGORIES = ["All", "bleach", "color", "toner", "shampoo", "conditioner", "styling", "tools", "supplies", "other"] as const

function getStatus(qty: number, threshold: number): { label: string; color: string } {
  if (qty <= 0) return { label: "Out", color: "#EF4444" }
  if (qty <= threshold) return { label: "Low", color: "#F59E0B" }
  return { label: "OK", color: "#10B981" }
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("All")
  const [lowOnly, setLowOnly] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/inventory")
      const data = await res.json()
      setItems(data.items ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (category !== "All" && it.category.toLowerCase() !== category.toLowerCase()) return false
      if (lowOnly && !it.isLowStock && it.quantityOnHand > 0) return false
      if (search.trim()) {
        const s = search.trim().toLowerCase()
        const hay = `${it.brand} ${it.productName} ${it.category} ${it.shadeOrVolume || ""}`.toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [items, category, lowOnly, search])

  const adjustQty = async (item: Item, delta: number) => {
    const newQty = Math.max(0, item.quantityOnHand + delta)
    setUpdating(item.id)
    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantityOnHand: newQty }),
      })
      if (res.ok) {
        const data = await res.json()
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...data.item } : i))
      }
    } catch { /* ignore */ }
    setUpdating(null)
  }

  const pill = (active: boolean) => ({
    padding: "6px 14px", fontSize: "10px", fontWeight: 700 as const,
    letterSpacing: "0.08em", textTransform: "uppercase" as const,
    borderRadius: "20px", border: "none", cursor: "pointer" as const,
    backgroundColor: active ? "#CDC9C0" : "rgba(205,201,192,0.06)",
    color: active ? "#0f1d24" : "rgba(205,201,192,0.5)", transition: "all 0.15s",
  })

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />

      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Inventory</h1>
          <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>Track and manage product stock levels</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", color: "rgba(205,201,192,0.3)" }}>search</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search brand, product, shade..."
          style={{
            width: "100%", padding: "10px 14px 10px 38px", boxSizing: "border-box",
            backgroundColor: "#1a2a32", border: "1px solid rgba(205,201,192,0.12)",
            borderRadius: "10px", color: "#FFFFFF", fontSize: "13px", outline: "none",
          }}
        />
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={pill(category === c)}>
            {c}
          </button>
        ))}
        <button
          onClick={() => setLowOnly(!lowOnly)}
          style={{
            ...pill(lowOnly),
            backgroundColor: lowOnly ? "#F59E0B" : "rgba(205,201,192,0.06)",
            color: lowOnly ? "#0f1d24" : "rgba(245,158,11,0.6)",
          }}
        >
          Low Stock
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#94A3B8", textAlign: "center", padding: "40px 0" }}>Loading inventory...</p>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: "#1a2a32", border: "1px solid rgba(205,201,192,0.12)", borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "rgba(205,201,192,0.2)", display: "block", marginBottom: "16px" }}>inventory_2</span>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", margin: "0 0 8px" }}>No items found</p>
          <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
          {filtered.map(item => {
            const st = getStatus(item.quantityOnHand, item.reorderThreshold)
            const pct = item.reorderThreshold > 0
              ? Math.min(100, (item.quantityOnHand / (item.reorderThreshold * 3)) * 100)
              : item.quantityOnHand > 0 ? 100 : 0
            return (
              <div key={item.id} style={{
                backgroundColor: "#1a2a32",
                border: `1px solid ${st.label === "Out" ? "rgba(239,68,68,0.25)" : st.label === "Low" ? "rgba(245,158,11,0.2)" : "rgba(205,201,192,0.12)"}`,
                borderRadius: "12px", padding: "16px 20px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(205,201,192,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "2px" }}>{item.brand}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", marginBottom: "2px" }}>{item.productName}</div>
                    {item.shadeOrVolume && (
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>{item.shadeOrVolume}</div>
                    )}
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: "10px", fontSize: "10px", fontWeight: 700,
                    backgroundColor: `${st.color}15`, color: st.color, letterSpacing: "0.05em",
                  }}>{st.label}</span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ width: "100%", height: "4px", borderRadius: "2px", backgroundColor: "rgba(205,201,192,0.08)" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: "2px", backgroundColor: st.color, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                    <span style={{ fontSize: "10px", color: "rgba(205,201,192,0.4)" }}>Qty: {item.quantityOnHand}</span>
                    <span style={{ fontSize: "10px", color: "rgba(205,201,192,0.3)" }}>Reorder: {item.reorderThreshold}</span>
                  </div>
                </div>

                {/* +/- buttons */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => adjustQty(item, -1)}
                    disabled={updating === item.id || item.quantityOnHand <= 0}
                    style={{
                      width: "32px", height: "32px", borderRadius: "8px",
                      backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                      color: "#EF4444", fontSize: "16px", fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: (updating === item.id || item.quantityOnHand <= 0) ? 0.4 : 1,
                    }}
                  >-</button>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF", minWidth: "32px", textAlign: "center" }}>
                    {item.quantityOnHand}
                  </span>
                  <button
                    onClick={() => adjustQty(item, 1)}
                    disabled={updating === item.id}
                    style={{
                      width: "32px", height: "32px", borderRadius: "8px",
                      backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                      color: "#10B981", fontSize: "16px", fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: updating === item.id ? 0.4 : 1,
                    }}
                  >+</button>
                  <span style={{ marginLeft: "auto", fontSize: "10px", color: "rgba(205,201,192,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.location.name}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
