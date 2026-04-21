"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, MapPin, Loader2 } from "lucide-react"
import { SignupShell, labelStyle, inputStyle, btnStyle } from "@/components/signup-shell"

const focusIn = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "#606E74"
  e.target.style.boxShadow = "0 0 0 3px rgba(96,110,116,0.15)"
}
const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "rgba(255,255,255,0.08)"
  e.target.style.boxShadow = "none"
}

function validateBusinessName(name: string): string | null {
  const trimmed = name.trim()
  const lower = trimmed.toLowerCase()
  if (!trimmed) return "Business name is required"
  if (lower.length < 3) return "Business name must be at least 3 characters"
  if (lower.length > 80) return "Business name must be 80 characters or less"
  const DUMMY_NAMES = new Set(["test","asdf","123","business","my business","salon","the salon","test salon","abc","xxx","zzz","none","na","n/a"])
  if (DUMMY_NAMES.has(lower)) return "Please enter your real business name"
  if (/^(.)\1+$/.test(lower)) return "Please enter your real business name"
  if (/^[0-9]+$/.test(lower)) return "Business name can't be only numbers"
  return null
}

function BusinessInfoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = searchParams.get("session") || ""

  const [businessName, setBusinessName] = useState("")
  const [address, setAddress] = useState("")
  const [noAddress, setNoAddress] = useState(false)
  const [serviceArea, setServiceArea] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameErr, setNameErr] = useState<string | null>(null)

  const canSubmit =
    !loading &&
    businessName.trim().length >= 3 &&
    (noAddress ? serviceArea.trim().length > 0 : address.trim().length > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameValidation = validateBusinessName(businessName)
    if (nameValidation) { setNameErr(nameValidation); return }

    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/signup/business-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          businessName: businessName.trim(),
          address: noAddress ? null : address.trim(),
          noAddress,
          serviceArea: noAddress ? serviceArea.trim() : null,
        }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        const nextSession = data.session || session
        router.push(`/signup/business-category${nextSession ? `?session=${encodeURIComponent(nextSession)}` : ""}`)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Check your connection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SignupShell currentStep={3} showBack onBack={() => router.back()}>
      <h1 style={{ fontSize: 28, fontWeight: 600, color: "#ffffff", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
        Tell me about your business
      </h1>
      <p style={{ fontSize: 15, color: "#9ca3af", margin: "0 0 32px" }}>
        We use this on receipts, customer messages, and to personalize your portal.
      </p>

      {error && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8, padding: "12px 14px", marginBottom: 20,
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#fca5a5" }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Business name */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Business name</label>
          <div style={{ position: "relative" }}>
            <Building2 size={14} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text" value={businessName}
              onChange={e => { setBusinessName(e.target.value); setNameErr(null) }}
              onBlur={() => {
                if (businessName.trim()) {
                  const v = validateBusinessName(businessName)
                  if (v) setNameErr(v)
                }
              }}
              placeholder="Luxe Hair Studio"
              autoComplete="organization"
              style={{ ...inputStyle, borderColor: nameErr ? "#ef4444" : undefined }}
              onFocus={focusIn} onBlurCapture={focusOut}
            />
          </div>
          {nameErr && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{nameErr}</p>}
        </div>

        {/* No permanent address checkbox */}
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 18 }}
          onClick={() => setNoAddress(v => !v)}
        >
          <div style={{
            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
            backgroundColor: noAddress ? "#606E74" : "transparent",
            border: `1.5px solid ${noAddress ? "#606E74" : "rgba(255,255,255,0.15)"}`,
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms",
          }}>
            {noAddress && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>My business doesn&apos;t have a permanent address</span>
        </label>

        {/* Address or service area */}
        {noAddress ? (
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Mobile service area</label>
            <div style={{ position: "relative" }}>
              <MapPin size={14} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                type="text" value={serviceArea}
                onChange={e => setServiceArea(e.target.value)}
                placeholder="e.g. Greater Miami area"
                style={inputStyle}
                onFocus={focusIn} onBlurCapture={focusOut}
              />
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Business address</label>
            <div style={{ position: "relative" }}>
              <MapPin size={14} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                type="text" value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Main St, Suite 4, Miami, FL 33101"
                autoComplete="street-address"
                style={inputStyle}
                onFocus={focusIn} onBlurCapture={focusOut}
              />
            </div>
          </div>
        )}

        <button
          type="submit" disabled={!canSubmit}
          style={btnStyle(canSubmit)}
          onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#7a8f96" }}
          onMouseLeave={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#606E74" }}
          onMouseDown={e => { if (canSubmit) e.currentTarget.style.transform = "scale(0.98)" }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)" }}
        >
          {loading ? (
            <><Loader2 size={16} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />Saving...</>
          ) : "Continue"}
        </button>
      </form>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        input::placeholder { color: #6b7280 !important; }
      `}</style>
    </SignupShell>
  )
}

export default function BusinessInfoPage() {
  return (
    <Suspense fallback={
      <SignupShell currentStep={3}>
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 size={24} strokeWidth={1.5} color="#6b7280" style={{ animation: "spin 1s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </SignupShell>
    }>
      <BusinessInfoContent />
    </Suspense>
  )
}
