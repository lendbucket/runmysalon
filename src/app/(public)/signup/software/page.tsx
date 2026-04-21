"use client"

import { Suspense, useState, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, FileSpreadsheet, Rocket, HelpCircle } from "lucide-react"
import { SignupShell, inputStyle, btnStyle } from "@/components/signup-shell"

interface Provider {
  id: string
  slug: string
  name: string
  category: string
  logoUrl: string | null
  integrationState: string
}

const statusBadge = (state: string): { label: string; bg: string; color: string } => {
  switch (state) {
    case "live": return { label: "Live", bg: "rgba(34,197,94,0.12)", color: "#22c55e" }
    case "in_development": return { label: "In development", bg: "rgba(245,158,11,0.12)", color: "#f59e0b" }
    default: return { label: "Coming soon", bg: "rgba(255,255,255,0.04)", color: "#6b7280" }
  }
}

const bottomOptions = [
  { label: "Spreadsheets / paper", value: "spreadsheets_paper", icon: FileSpreadsheet },
  { label: "Starting fresh", value: "starting_fresh", icon: Rocket },
  { label: "Other \u2014 not listed", value: "other", icon: HelpCircle },
]

export default function SoftwarePage() {
  return (
    <Suspense fallback={null}>
      <SoftwareForm />
    </Suspense>
  )
}

function SoftwareForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session") || ""

  const [providers, setProviders] = useState<Provider[]>([])
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const [customName, setCustomName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const fetchProviders = async () => {
      try {
        const url = query
          ? `/api/signup/software-list?q=${encodeURIComponent(query)}`
          : "/api/signup/software-list"
        const res = await fetch(url, { signal: controller.signal })
        if (res.ok) {
          const data = await res.json()
          setProviders(data.providers || [])
        }
      } catch {
        // Ignore abort errors
      }
    }
    const timer = setTimeout(fetchProviders, query ? 300 : 0)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query])

  const canSubmit = !!selected && (selected !== "other" || customName.trim().length > 0) && !loading

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/signup/software", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          softwareId: selected !== "spreadsheets_paper" && selected !== "starting_fresh" && selected !== "other" ? selected : undefined,
          softwareChoice: selected,
          customSoftwareName: selected === "other" ? customName.trim() : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }
      router.push(`/signup/social?session=${sessionId}`)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }, [canSubmit, sessionId, selected, customName, router])

  return (
    <SignupShell currentStep={8} showBack onBack={() => router.push(`/signup/locations?session=${sessionId}`)}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 6px", textAlign: "center" }}>
        Which software do you currently use?
      </h1>
      <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 24px", textAlign: "center" }}>
        We&apos;ll connect to it so your data flows in automatically.
      </p>

      {error && (
        <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center", margin: "0 0 16px" }}>{error}</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={16} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 13, top: 14, pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search software..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={inputStyle}
          />
        </div>

        {/* Provider Grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
          maxHeight: 280, overflowY: "auto",
        }}>
          {providers.map((p) => {
            const badge = statusBadge(p.integrationState)
            const isSelected = selected === p.id
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => setSelected(p.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 6, padding: "14px 10px", boxSizing: "border-box",
                  backgroundColor: isSelected ? "rgba(96,110,116,0.08)" : "#0d1117",
                  border: `1px solid ${isSelected ? "#606E74" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                  transition: "border-color 150ms, background-color 150ms",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "#606E74"
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                }}
              >
                {/* Logo placeholder */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#6b7280",
                }}>
                  {p.logoUrl
                    ? <img src={p.logoUrl} alt={p.name} style={{ width: 28, height: 28, objectFit: "contain" }} />
                    : p.name.charAt(0).toUpperCase()
                  }
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#ffffff", textAlign: "center" }}>{p.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 500, padding: "2px 8px",
                  borderRadius: 99, backgroundColor: badge.bg, color: badge.color,
                }}>
                  {badge.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Bottom options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {bottomOptions.map((opt) => {
            const Icon = opt.icon
            const isSelected = selected === opt.value
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                style={{
                  width: "100%", height: 44, boxSizing: "border-box",
                  backgroundColor: isSelected ? "rgba(96,110,116,0.08)" : "transparent",
                  border: `1px solid ${isSelected ? "#606E74" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 8, cursor: "pointer",
                  color: "#9ca3af", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "border-color 150ms, background-color 150ms",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "#606E74"
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"
                }}
              >
                <Icon size={15} strokeWidth={1.5} />
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Custom software name */}
        {selected === "other" && (
          <input
            type="text"
            placeholder="What software do you use?"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            autoFocus
            style={{
              ...inputStyle,
              paddingLeft: 14,
            }}
          />
        )}

        <button type="submit" disabled={!canSubmit} style={btnStyle(!!canSubmit)}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </SignupShell>
  )
}
