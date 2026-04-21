"use client"

import { Suspense, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SignupShell } from "@/components/signup-shell"

const brackets = [
  { label: "Less than $100K", value: "under_100k" },
  { label: "$100K \u2013 $250K", value: "100k_250k" },
  { label: "$250K \u2013 $1M", value: "250k_1m" },
  { label: "$1M \u2013 $5M", value: "1m_5m" },
  { label: "$5M+", value: "5m_plus" },
  { label: "Not sure yet / Starting new business", value: "not_sure", italic: true },
]

export default function RevenuePage() {
  return (
    <Suspense fallback={null}>
      <RevenueForm />
    </Suspense>
  )
}

function RevenueForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session") || ""
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = useCallback(async (value: string) => {
    setSelected(value)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/signup/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, bracket: value }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }
      router.push(`/signup/entity-details?session=${sessionId}`)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }, [sessionId, router])

  return (
    <SignupShell currentStep={5} showBack onBack={() => router.push(`/signup/business-category?session=${sessionId}`)}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 6px", textAlign: "center" }}>
        What&apos;s your annual revenue?
      </h1>
      <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 28px", textAlign: "center" }}>
        This helps us recommend the right tier. Your answer stays private.
      </p>

      {error && (
        <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center", margin: "0 0 16px" }}>{error}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {brackets.map((b) => {
          const isSelected = selected === b.value
          return (
            <button
              key={b.value}
              disabled={loading}
              onClick={() => handleSelect(b.value)}
              style={{
                width: "100%", height: 52, boxSizing: "border-box",
                backgroundColor: isSelected ? "rgba(96,110,116,0.08)" : "#0d1117",
                border: `1px solid ${isSelected ? "#606E74" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10, cursor: loading ? "wait" : "pointer",
                color: b.value === "not_sure" ? "#9ca3af" : "#ffffff",
                fontStyle: b.italic ? "italic" : "normal",
                fontSize: 14, fontWeight: 500, fontFamily: "inherit",
                transition: "border-color 150ms, background-color 150ms",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = "#606E74"
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
              }}
            >
              {b.label}
            </button>
          )
        })}
      </div>
    </SignupShell>
  )
}
