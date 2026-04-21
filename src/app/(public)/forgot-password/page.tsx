"use client"

import { useState, useCallback } from "react"
import { Scissors, Mail, AlertCircle, Loader2, CheckCircle } from "lucide-react"

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
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      // Always show success to prevent email enumeration
      setSent(true)
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
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      {/* Logo mark */}
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
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {/* Card */}
      <div style={{
        width: 420, maxWidth: "90vw",
        backgroundColor: "#0d1117",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: 40,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {sent ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CheckCircle size={48} strokeWidth={1.5} color="#22c55e" />
            <div style={{ height: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", margin: 0, textAlign: "center" }}>
              Check your email
            </h2>
            <div style={{ height: 8 }} />
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0, textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
              We sent reset instructions to {email}. The link expires in 1 hour.
            </p>
            <div style={{ height: 24 }} />
            <a href="/login" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", height: 44,
              backgroundColor: "#606E74", color: "#ffffff",
              border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              textDecoration: "none",
              fontFamily: "inherit",
            }}>Back to sign in</a>
          </div>
        ) : (
          <>
            {/* Error banner */}
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
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af",
                  letterSpacing: "0.2px", textTransform: "uppercase" as const, marginBottom: 6,
                }}>Email</label>
                <div style={{ position: "relative" }}>
                  <Mail size={14} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="you@salon.com"
                    autoComplete="email"
                    style={{
                      width: "100%", height: 44, boxSizing: "border-box",
                      backgroundColor: "#06080d",
                      border: `1px solid ${emailError ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 8, padding: "0 14px 0 40px",
                      color: "#ffffff", fontSize: 14, fontFamily: "inherit", outline: "none",
                    }}
                  />
                </div>
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
                transition: "background-color 150ms ease, transform 50ms ease",
              }}
                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#7a8f96" }}
                onMouseLeave={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#606E74" }}
                onMouseDown={e => { if (canSubmit) e.currentTarget.style.transform = "scale(0.98)" }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1)" }}
              >
                {loading ? (
                  <><Loader2 size={16} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} /> Sending...</>
                ) : "Send reset link"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: "#7a8f96", textDecoration: "none" }}>
                Back to sign in
              </a>
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
