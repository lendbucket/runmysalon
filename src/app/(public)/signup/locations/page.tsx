"use client"

import { Suspense, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { MapPin, AlertTriangle } from "lucide-react"
import { SignupShell, btnStyle } from "@/components/signup-shell"

const options = [
  { label: "Just one location", value: "1", range: null },
  { label: "2-5 locations", value: "2_5", range: [2, 5] },
  { label: "6-10 locations", value: "6_10", range: [6, 10] },
  { label: "10+ locations", value: "10_plus", range: [11, 999] },
]

export default function LocationsPage() {
  return (
    <Suspense fallback={null}>
      <LocationsForm />
    </Suspense>
  )
}

function LocationsForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session") || ""

  const [selected, setSelected] = useState<string | null>(null)
  const [count, setCount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsInput = selected && selected !== "1"
  const isEnterprise = selected === "10_plus"
  const finalCount = selected === "1" ? 1 : parseInt(count) || 0
  const canSubmit = selected && (selected === "1" || finalCount > 0) && !loading

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/signup/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, locationCount: finalCount }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }
      router.push(`/signup/software?session=${sessionId}`)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }, [canSubmit, sessionId, finalCount, router])

  return (
    <SignupShell currentStep={7} showBack onBack={() => router.push(`/signup/entity-details?session=${sessionId}`)}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 6px", textAlign: "center" }}>
        How many locations?
      </h1>
      <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 28px", textAlign: "center" }}>
        Pricing is per location. You can add more later.
      </p>

      {error && (
        <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center", margin: "0 0 16px" }}>{error}</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt) => {
          const isSelected = selected === opt.value
          return (
            <div key={opt.value}>
              <button
                type="button"
                onClick={() => { setSelected(opt.value); setCount("") }}
                style={{
                  width: "100%", height: 52, boxSizing: "border-box",
                  backgroundColor: isSelected ? "rgba(96,110,116,0.08)" : "#0d1117",
                  border: `1px solid ${isSelected ? "#606E74" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 10, cursor: "pointer",
                  color: "#ffffff", fontSize: 14, fontWeight: 500, fontFamily: "inherit",
                  transition: "border-color 150ms, background-color 150ms",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "#606E74"
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                }}
              >
                <MapPin size={16} strokeWidth={1.5} color={isSelected ? "#ffffff" : "#6b7280"} />
                {opt.label}
              </button>

              {isSelected && opt.range && (
                <div style={{ marginTop: 8, marginBottom: 4 }}>
                  <input
                    type="number"
                    min={opt.range[0]}
                    max={opt.range[1]}
                    placeholder={`Enter number (${opt.range[0]}-${opt.range[1] === 999 ? "..." : opt.range[1]})`}
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    autoFocus
                    style={{
                      width: "100%", height: 44, boxSizing: "border-box",
                      backgroundColor: "#06080d", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8, padding: "0 14px",
                      color: "#ffffff", fontSize: 14, fontFamily: "inherit", outline: "none",
                      transition: "border-color 150ms",
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}

        {isEnterprise && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 8, padding: "12px 14px", marginTop: 4,
          }}>
            <AlertTriangle size={18} strokeWidth={1.5} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "#f59e0b", margin: 0, lineHeight: 1.5 }}>
              That&apos;s enterprise territory. A human from our team will reach out within 24 hours.
            </p>
          </div>
        )}

        <button type="submit" disabled={!canSubmit} style={{ ...btnStyle(!!canSubmit), marginTop: 8 }}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </SignupShell>
  )
}
