"use client"

import { useState, useCallback } from "react"
import { Scissors, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

const emailRegex = /.+@.+\..+/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const [touched, setTouched] = useState(false)

  const emailError = touched && !emailRegex.test(email) ? "Enter a valid email address" : ""
  const canSubmit = emailRegex.test(email) && !loading

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        setError("Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }, [canSubmit, email])

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      width: "100%",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, backgroundColor: "#606E74",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
      }}>
        <Scissors size={24} strokeWidth={1.5} color="#ffffff" />
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 600, color: "#ffffff", margin: "0 0 4px", textAlign: "center" }}>
        Reset your password
      </h1>
      <p style={{ fontSize: 14, fontWeight: 400, color: "#9ca3af", margin: "0 0 32px", textAlign: "center" }}>
        {sent ? "" : "Enter your email and we\u2019ll send you a reset link."}
      </p>

      <div style={{
        width: 420, maxWidth: "90vw",
        backgroundColor: "#0d1117",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: 40,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle size={32} strokeWidth={1.5} color="#22c55e" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.6, margin: "0 0 24px" }}>
              Check your email &mdash; we sent reset instructions to{" "}
              <strong style={{ color: "#ffffff" }}>{email}</strong>
            </p>
            <a href="/login" style={{
              display: "inline-block", padding: "10px 24px",
              backgroundColor: "#606E74", color: "#ffffff",
              borderRadius: 8, fontSize: 14, fontWeight: 600,
              textDecoration: "none",
            }}>Back to login</a>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8, padding: "12px 14px", marginBottom: 20,
              }}>
                <AlertCircle size={16} strokeWidth={1.5} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#fca5a5" }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="you@salon.com"
                  autoComplete="email"
                  style={{
                    width: "100%", height: 44, boxSizing: "border-box",
                    backgroundColor: "#06080d",
                    border: `1px solid ${emailError ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 8, padding: "0 14px",
                    color: "#ffffff", fontSize: 14, fontFamily: "inherit", outline: "none",
                  }}
                />
                {emailError && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{emailError}</p>}
              </div>

              <button type="submit" disabled={!canSubmit} style={{
                width: "100%", height: 44,
                backgroundColor: canSubmit ? "#606E74" : "#2a2f33",
                color: canSubmit ? "#ffffff" : "#6b7280",
                border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                cursor: canSubmit ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {loading ? (
                  <><Loader2 size={16} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} /> Sending...</>
                ) : "Send reset link"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <a href="/login" style={{ fontSize: 13, color: "#7a8f96", textDecoration: "none" }}>Back to login</a>
            </div>
          </>
        )}
      </div>

      <p style={{ fontSize: 11, color: "#4b5563", marginTop: 24, textAlign: "center" }}>Powered by RunMySalon</p>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        input::placeholder { color: #6b7280; }
      `}</style>
    </div>
  )
}
