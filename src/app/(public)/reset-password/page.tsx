"use client"

import { Suspense, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Scissors, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

const hasLetter = /[a-zA-Z]/
const hasNumber = /[0-9]/

function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (hasLetter.test(pw) && hasNumber.test(pw)) score++
  if (pw.length >= 12 && /[^a-zA-Z0-9]/.test(pw)) score++
  return score as 0 | 1 | 2 | 3
}

const strengthColor = ["#ef4444", "#ef4444", "#f59e0b", "#22c55e"]

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#06080d" }} />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [touched, setTouched] = useState({ password: false, confirm: false })

  const strength = passwordStrength(password)
  const passwordError = touched.password && password.length > 0 && password.length < 8 ? "At least 8 characters" : ""
  const confirmError = touched.confirm && confirmPassword && confirmPassword !== password ? "Passwords don\u2019t match" : ""
  const canSubmit = password.length >= 8 && hasLetter.test(password) && hasNumber.test(password) && password === confirmPassword && token && !loading

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ password: true, confirm: true })
    if (!canSubmit) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Reset link is invalid or expired.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [canSubmit, token, password])

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#06080d",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, backgroundColor: "#606E74",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
      }}>
        <Scissors size={24} strokeWidth={1.5} color="#ffffff" />
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 600, color: "#ffffff", margin: "0 0 4px", textAlign: "center" }}>
        {success ? "Password reset" : "Set a new password"}
      </h1>
      {!success && (
        <p style={{ fontSize: 14, fontWeight: 400, color: "#9ca3af", margin: "0 0 32px", textAlign: "center" }}>
          Choose a strong password for your account.
        </p>
      )}

      <div style={{
        width: 420, maxWidth: "90vw",
        backgroundColor: "#0d1117",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: 40,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {success ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle size={32} strokeWidth={1.5} color="#22c55e" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.6, margin: "0 0 24px" }}>
              Your password has been reset successfully.
            </p>
            <a href="/login" style={{
              display: "inline-block", padding: "10px 24px",
              backgroundColor: "#606E74", color: "#ffffff",
              borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>Sign in</a>
          </div>
        ) : !token ? (
          <div style={{ textAlign: "center" }}>
            <AlertCircle size={32} strokeWidth={1.5} color="#ef4444" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 24px" }}>
              Invalid or missing reset token. Please request a new reset link.
            </p>
            <a href="/forgot-password" style={{
              display: "inline-block", padding: "10px 24px",
              backgroundColor: "#606E74", color: "#ffffff",
              borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>Request new link</a>
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
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>New password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  style={{
                    width: "100%", height: 44, boxSizing: "border-box",
                    backgroundColor: "#06080d",
                    border: `1px solid ${passwordError ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 8, padding: "0 14px",
                    color: "#ffffff", fontSize: 14, fontFamily: "inherit", outline: "none",
                  }}
                />
                {password.length > 0 && (
                  <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        backgroundColor: strength >= i ? strengthColor[strength] : "rgba(255,255,255,0.06)",
                      }} />
                    ))}
                  </div>
                )}
                {passwordError && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{passwordError}</p>}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>Confirm new password</label>
                <input
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  style={{
                    width: "100%", height: 44, boxSizing: "border-box",
                    backgroundColor: "#06080d",
                    border: `1px solid ${confirmError ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 8, padding: "0 14px",
                    color: "#ffffff", fontSize: 14, fontFamily: "inherit", outline: "none",
                  }}
                />
                {confirmError && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{confirmError}</p>}
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
                  <><Loader2 size={16} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} /> Resetting...</>
                ) : "Reset password"}
              </button>
            </form>
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
