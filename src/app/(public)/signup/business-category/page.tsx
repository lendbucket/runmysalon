"use client"

import { Suspense, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Scissors, Sparkles, Syringe, Flower2, Waves, Boxes, Eye, Zap, Hand, Palette, Star } from "lucide-react"
import { SignupShell } from "@/components/signup-shell"

const categories = [
  { label: "Hair Salon", value: "hair_salon", icon: Scissors },
  { label: "Nail Salon", value: "nail_salon", icon: Sparkles },
  { label: "Barbershop", value: "barbershop", icon: Scissors },
  { label: "Med Spa", value: "med_spa", icon: Syringe },
  { label: "Esthetician", value: "esthetician", icon: Flower2 },
  { label: "Full-Service Spa", value: "full_service_spa", icon: Waves },
  { label: "Combination", value: "combination", icon: Boxes },
  { label: "Brow/Lash", value: "brow_lash", icon: Eye },
  { label: "Waxing", value: "waxing", icon: Zap },
  { label: "Massage", value: "massage", icon: Hand },
  { label: "Tattoo/Piercing", value: "tattoo_piercing", icon: Palette },
  { label: "Other Beauty", value: "other_beauty", icon: Star },
]

export default function BusinessCategoryPage() {
  return (
    <Suspense fallback={null}>
      <BusinessCategoryForm />
    </Suspense>
  )
}

function BusinessCategoryForm() {
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
      const res = await fetch("/api/signup/business-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, category: value }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }
      router.push(`/signup/revenue?session=${sessionId}`)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }, [sessionId, router])

  return (
    <SignupShell currentStep={4} showBack onBack={() => router.push(`/signup/business-info?session=${sessionId}`)}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 6px", textAlign: "center" }}>
        What kind of business is this?
      </h1>
      <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 28px", textAlign: "center" }}>
        We&apos;ll tailor the portal to your specific industry.
      </p>

      {error && (
        <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center", margin: "0 0 16px" }}>{error}</p>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
      }}>
        {categories.map((cat) => {
          const Icon = cat.icon
          const isSelected = selected === cat.value
          return (
            <button
              key={cat.value}
              disabled={loading}
              onClick={() => handleSelect(cat.value)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 8, width: "100%", height: 100, boxSizing: "border-box",
                backgroundColor: isSelected ? "rgba(96,110,116,0.08)" : "#0d1117",
                border: `1px solid ${isSelected ? "#606E74" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10, cursor: loading ? "wait" : "pointer",
                transition: "border-color 150ms, background-color 150ms",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = "#606E74"
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
              }}
            >
              <Icon size={22} strokeWidth={1.5} color={isSelected ? "#ffffff" : "#9ca3af"} />
              <span style={{ fontSize: 12, fontWeight: 500, color: isSelected ? "#ffffff" : "#9ca3af" }}>
                {cat.label}
              </span>
            </button>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 480px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </SignupShell>
  )
}
