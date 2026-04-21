"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import { SignupShell, labelStyle, inputStyle, btnStyle } from "@/components/signup-shell"

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const hasLetter = /[a-zA-Z]/
const hasNumber = /[0-9]/
const hasSpecial = /[^a-zA-Z0-9]/

function strength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0
  if (pw.length < 8) return 1
  if (hasLetter.test(pw) && hasNumber.test(pw)) {
    if (pw.length >= 12 && hasSpecial.test(pw)) return 3
    return 2
  }
  return 1
}

const sColor = ["", "#ef4444", "#f59e0b", "#22c55e"]
const sLabel = ["", "Weak", "Medium", "Strong"]

const focusIn = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "#606E74"
  e.target.style.boxShadow = "0 0 0 3px rgba(96,110,116,0.15)"
}
const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "rgba(255,255,255,0.08)"
  e.target.style.boxShadow = "none"
}

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorLink, setErrorLink] = useState<string | null>(null)
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const [pwErr, setPwErr] = useState<string | null>(null)

  const s = strength(password)
  const canSubmit = emailRe.test(email) && s === 3 && !loading

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    let valid = true
    if (!emailRe.test(email)) { setEmailErr("Enter a valid email"); valid = false }
    if (s < 3) { setPwErr("Password needs 12+ chars, a letter, a number, and a special character"); valid = false }
    if (!valid) return

    setLoading(true); setError(null); setErrorLink(null)
    try {
      const res = await fetch("/api/signup/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        router.push(`/signup/verify-email?email=${encodeURIComponent(email)}`)
      } else if (res.status === 409) {
        setError("An account with this email already exists.")
        setErrorLink("/login")
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Check your connection.")
    } finally {
      setLoading(false)
    }
  }, [email, password, s, router])

  return (
    <SignupShell currentStep={0}>
      <h1 style={{ fontSize: 28, fontWeight: 600, color: "#ffffff", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
        Let&apos;s get you set up.
      </h1>
      <p style={{ fontSize: 15, color: "#9ca3af", margin: "0 0 32px" }}>
        Takes about 8 minutes. You can pause and come back anytime.
      </p>

      {error && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8, padding: "12px 14px", marginBottom: 20,
          animation: "fadeInUp 150ms ease-out",
        }}>
          <AlertCircle size={16} strokeWidth={1.5} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#fca5a5" }}>
            {error}
            {errorLink && (
              <>{" "}<a href={errorLink} style={{ color: "#7a8f96", fontWeight: 600 }}>Sign in instead</a></>
            )}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Email</label>
          <div style={{ position: "relative" }}>
            <Mail size={14} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setEmailErr(null) }}
              onBlur={() => { if (email && !emailRe.test(email)) setEmailErr("Enter a valid email") }}
              placeholder="you@salon.com" autoComplete="email"
              style={{ ...inputStyle, borderColor: emailErr ? "#ef4444" : undefined }}
              onFocus={focusIn} onBlurCapture={focusOut}
            />
          </div>
          {emailErr && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{emailErr}</p>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: "relative" }}>
            <Lock size={14} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type={showPw ? "text" : "password"} value={password}
              onChange={e => { setPassword(e.target.value); setPwErr(null) }}
              placeholder="Minimum 12 characters" autoComplete="new-password"
              style={{ ...inputStyle, padding: "0 44px 0 40px" }}
              onFocus={focusIn} onBlurCapture={focusOut}
            />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", padding: 4,
              display: "flex", color: "#6b7280",
            }}>
              {showPw ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
            </button>
          </div>

          {/* Strength meter */}
          {password.length > 0 && (
            <>
              <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    backgroundColor: s >= i ? sColor[s] : "rgba(255,255,255,0.06)",
                    transition: "background-color 200ms",
                  }} />
                ))}
              </div>
              {s > 0 && <p style={{ fontSize: 11, fontWeight: 500, color: sColor[s], margin: "6px 0 0" }}>{sLabel[s]}</p>}
            </>
          )}
          {pwErr && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{pwErr}</p>}
        </div>

        <button
          type="submit" disabled={!canSubmit}
          style={btnStyle(canSubmit)}
          onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#7a8f96" }}
          onMouseLeave={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#606E74" }}
          onMouseDown={e => { if (canSubmit) e.currentTarget.style.transform = "scale(0.98)" }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)" }}
        >
          {loading ? <><Loader2 size={16} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />Continue...</> : "Continue"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <span style={{ fontSize: 13, color: "#9ca3af" }}>Already have a portal? </span>
        <a href="/login" style={{ fontSize: 13, fontWeight: 600, color: "#7a8f96", textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
        >Sign in</a>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
        input::placeholder { color: #6b7280 !important; }
      `}</style>
    </SignupShell>
  )
}
