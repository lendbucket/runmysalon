"use client"

import { Suspense, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Scissors, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

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
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const strength = passwordStrength(password)
  const confirmError = confirmPassword && confirmPassword !== password ? "Passwords don\u2019t match" : ""
  const canSubmit = strength >= 2 && password === confirmPassword && confirmPassword.length > 0 && token && !loading

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
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

  // No token state
  if (!token) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        width: "100%",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, backgroundColor: "#606E74",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <Scissors size={24} strokeWidth={1.5} color="#ffffff" />
        </div>

        <div style={{
          width: 420, maxWidth: "90vw",
          backgroundColor: "#0d1117",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16, padding: 40,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 24px 64px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <AlertCircle size={48} strokeWidth={1.5} color="#ef4444" />
            <div style={{ height: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", margin: 0, textAlign: "center" }}>
              Invalid reset link
            </h2>
            <div style={{ height: 16 }} />
            <a href="/forgot-password" style={{ fontSize: 14, fontWeight: 500, color: "#7a8f96", textDecoration: "none" }}>
              Request a new one
            </a>
          </div>
        </div>

        <p style={{ fontSize: 11, color: "#4b5563", marginTop: 24, textAlign: "center" }}>Powered by RunMySalon</p>
      </div>
    )
  }

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
        Create new password
      </h1>
      <p style={{ fontSize: 14, fontWeight: 400, color: "#9ca3af", margin: "0 0 32px", textAlign: "center" }}>
        Your new password must be different from previous passwords.
      </p>

      {/* Card */}
      <div style={{
        width: 420, maxWidth: "90vw",
        backgroundColor: "#0d1117",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: 40,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {success ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CheckCircle size={48} strokeWidth={1.5} color="#22c55e" />
            <div style={{ height: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", margin: 0, textAlign: "center" }}>
              Password updated
            </h2>
            <div style={{ height: 8 }} />
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0, textAlign: "center", lineHeight: 1.6 }}>
              Your password has been updated. Sign in with your new password.
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
            }}>Sign in</a>
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
              {/* New password */}
              <div style={{ marginBottom: 18 }}>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af",
                  letterSpacing: "0.2px", textTransform: "uppercase" as const, marginBottom: 6,
                }}>New password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input
                    type={showPassword ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    style={{
                      width: "100%", height: 44, boxSizing: "border-box",
                      backgroundColor: "#06080d",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8, padding: "0 44px 0 40px",
                      color: "#ffffff", fontSize: 14, fontFamily: "inherit", outline: "none",
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 4,
                    display: "flex", color: "#6b7280",
                  }}>
                    {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                  </button>
                </div>
                {/* Strength meter */}
                {password.length > 0 && (
                  <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        backgroundColor: strength >= i ? strengthColor[strength] : "rgba(255,255,255,0.06)",
                        transition: "background-color 200ms",
                      }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af",
                  letterSpacing: "0.2px", textTransform: "uppercase" as const, marginBottom: 6,
                }}>Confirm new password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input
                    type={showConfirm ? "text" : "password"} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    style={{
                      width: "100%", height: 44, boxSizing: "border-box",
                      backgroundColor: "#06080d",
                      border: `1px solid ${confirmError ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 8, padding: "0 44px 0 40px",
                      color: "#ffffff", fontSize: 14, fontFamily: "inherit", outline: "none",
                    }}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 4,
                    display: "flex", color: "#6b7280",
                  }}>
                    {showConfirm ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                  </button>
                </div>
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
                transition: "background-color 150ms ease, transform 50ms ease",
              }}
                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#7a8f96" }}
                onMouseLeave={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#606E74" }}
                onMouseDown={e => { if (canSubmit) e.currentTarget.style.transform = "scale(0.98)" }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1)" }}
              >
                {loading ? (
                  <><Loader2 size={16} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} /> Updating...</>
                ) : "Update password"}
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
