"use client"

import { useState, useRef, useCallback, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, Loader2 } from "lucide-react"
import { SignupShell, labelStyle, inputStyle, btnStyle } from "@/components/signup-shell"

const focusIn = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "#606E74"
  e.target.style.boxShadow = "0 0 0 3px rgba(96,110,116,0.15)"
}
const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "rgba(255,255,255,0.08)"
  e.target.style.boxShadow = "none"
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 14 }} onClick={onChange}>
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
        backgroundColor: checked ? "#606E74" : "transparent",
        border: `1.5px solid ${checked ? "#606E74" : "rgba(255,255,255,0.15)"}`,
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms",
      }}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.4 }}>{label}</span>
    </label>
  )
}

function TermsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = searchParams.get("session") || ""

  const [tosContent, setTosContent] = useState("")
  const [tosVersion, setTosVersion] = useState("")
  const [loadingTos, setLoadingTos] = useState(true)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [agree1, setAgree1] = useState(false)
  const [agree2, setAgree2] = useState(false)
  const [legalName, setLegalName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/signup/tos-content")
      .then(r => r.json())
      .then(data => {
        setTosContent(data.content || "Terms not available.")
        setTosVersion(data.version || "unknown")
      })
      .catch(() => setTosContent("Failed to load terms. Please refresh."))
      .finally(() => setLoadingTos(false))
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20
    if (atBottom && !scrolledToBottom) setScrolledToBottom(true)
  }, [scrolledToBottom])

  const canSubmit = scrolledToBottom && agree1 && agree2 && legalName.trim().length > 0 && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/signup/accept-tos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, legalName: legalName.trim(), tosVersion }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        const nextSession = data.session || session
        router.push(`/signup/business-info${nextSession ? `?session=${encodeURIComponent(nextSession)}` : ""}`)
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
    <SignupShell currentStep={2} showBack onBack={() => router.back()}>
      <h1 style={{ fontSize: 28, fontWeight: 600, color: "#ffffff", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
        The legal bit
      </h1>
      <p style={{ fontSize: 15, color: "#9ca3af", margin: "0 0 24px" }}>
        Quick read, then you&apos;re done with this part forever.
      </p>

      {/* Placeholder warning */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        backgroundColor: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)",
        borderRadius: 8, padding: "10px 14px", marginBottom: 20,
      }}>
        <AlertTriangle size={16} strokeWidth={1.5} color="#eab308" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#eab308" }}>
          PLACEHOLDER TERMS — Replace before production
        </span>
      </div>

      {/* Scrollable ToS */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          maxHeight: 400, overflowY: "auto", backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
          padding: 20, marginBottom: 20, fontSize: 13, lineHeight: 1.7, color: "#9ca3af",
          whiteSpace: "pre-wrap",
        }}
      >
        {loadingTos ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Loader2 size={20} strokeWidth={1.5} color="#6b7280" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : tosContent}
      </div>

      {!scrolledToBottom && (
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16, fontStyle: "italic" }}>
          Scroll to the bottom to continue.
        </p>
      )}

      {error && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8, padding: "12px 14px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#fca5a5" }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20, opacity: scrolledToBottom ? 1 : 0.4, transition: "opacity 200ms" }}>
          <Checkbox
            checked={agree1}
            onChange={() => { if (scrolledToBottom) setAgree1(v => !v) }}
            label="I have read and agree to the Terms of Service and Privacy Policy"
          />
          <Checkbox
            checked={agree2}
            onChange={() => { if (scrolledToBottom) setAgree2(v => !v) }}
            label="I have authority to bind my business to these Terms"
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Type your full legal name to sign</label>
          <div style={{ position: "relative" }}>
            <input
              type="text" value={legalName}
              onChange={e => setLegalName(e.target.value)}
              placeholder="Jane Smith"
              autoComplete="name"
              style={{ ...inputStyle, padding: "0 14px" }}
              onFocus={focusIn} onBlurCapture={focusOut}
            />
          </div>
        </div>

        <button
          type="submit" disabled={!canSubmit}
          style={btnStyle(canSubmit)}
          onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#7a8f96" }}
          onMouseLeave={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#606E74" }}
          onMouseDown={e => { if (canSubmit) e.currentTarget.style.transform = "scale(0.98)" }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)" }}
        >
          {loading ? (
            <><Loader2 size={16} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />Accepting...</>
          ) : "Accept and continue"}
        </button>
      </form>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        input::placeholder { color: #6b7280 !important; }
      `}</style>
    </SignupShell>
  )
}

export default function TermsPage() {
  return (
    <Suspense fallback={
      <SignupShell currentStep={2}>
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 size={24} strokeWidth={1.5} color="#6b7280" style={{ animation: "spin 1s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </SignupShell>
    }>
      <TermsContent />
    </Suspense>
  )
}
