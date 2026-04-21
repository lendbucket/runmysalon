"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Scissors, AlertCircle, Loader2, User, Mail, Lock, Eye, EyeOff } from "lucide-react"

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const hasLetter = /[a-zA-Z]/
const hasNumber = /[0-9]/
const hasSpecial = /[^a-zA-Z0-9]/

function strength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw || pw.length < 8) return pw.length > 0 ? 1 : 0
  if (hasLetter.test(pw) && hasNumber.test(pw)) {
    if (pw.length >= 12 && hasSpecial.test(pw)) return 3
    return 2
  }
  return 1
}

const sColor = ["", "#ef4444", "#f59e0b", "#22c55e"]
const sLabel = ["", "Weak", "Medium", "Strong"]

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorLink, setErrorLink] = useState<string | null>(null)
  const [nameErr, setNameErr] = useState<string | null>(null)
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const [pwErr, setPwErr] = useState<string | null>(null)

  const s = strength(password)
  const canSubmit = name.trim().length > 0 && emailRe.test(email) && s >= 2 && agreed && !loading

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    let valid = true
    if (!name.trim()) { setNameErr("Full name is required"); valid = false }
    if (!emailRe.test(email)) { setEmailErr("Enter a valid email"); valid = false }
    if (s < 2) { setPwErr("Password needs a letter and a number, 8+ chars"); valid = false }
    if (!valid) return

    setLoading(true); setError(null); setErrorLink(null)
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName: name, salonName: name.split(" ")[0] + "'s Salon", email, password }),
      })
      if (res.ok) {
        router.push("/signup/salon")
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
  }, [name, email, password, s, router])

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af",
    letterSpacing: "0.2px", textTransform: "uppercase", marginBottom: 6,
  }
  const inputBase: React.CSSProperties = {
    width: "100%", height: 44, boxSizing: "border-box",
    backgroundColor: "#06080d", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, color: "#ffffff", fontSize: 14, fontFamily: "inherit", outline: "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  }
  const focusIn = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#606E74"; e.target.style.boxShadow = "0 0 0 3px rgba(96,110,116,0.15)" }
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none" }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#606E74", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Scissors size={24} strokeWidth={1.5} color="#ffffff" />
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: "#ffffff", margin: "0 0 4px", textAlign: "center", letterSpacing: "-0.3px" }}>Start your salon portal</h1>
      <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 32px", textAlign: "center" }}>14 days free. No credit card required.</p>

      <div style={{ width: 420, maxWidth: "90vw", backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 40, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 24px 64px rgba(0,0,0,0.5)" }}>
        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "12px 14px", marginBottom: 20, animation: "fadeInUp 150ms ease-out" }}>
            <AlertCircle size={16} strokeWidth={1.5} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#fca5a5" }}>
              {error}{errorLink && <>{" "}<a href={errorLink} style={{ color: "#7a8f96", fontWeight: 600 }}>Sign in instead</a></>}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Full name</label>
            <div style={{ position: "relative" }}>
              <User size={14} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input value={name} onChange={e => { setName(e.target.value); setNameErr(null) }}
                onBlur={() => { if (!name.trim()) setNameErr("Full name is required") }}
                placeholder="Jane Smith" autoComplete="name"
                style={{ ...inputBase, padding: "0 14px 0 40px", borderColor: nameErr ? "#ef4444" : undefined }}
                onFocus={focusIn} onBlurCapture={focusOut}
              />
            </div>
            {nameErr && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{nameErr}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Work email</label>
            <div style={{ position: "relative" }}>
              <Mail size={14} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailErr(null) }}
                onBlur={() => { if (email && !emailRe.test(email)) setEmailErr("Enter a valid email") }}
                placeholder="you@salon.com" autoComplete="email"
                style={{ ...inputBase, padding: "0 14px 0 40px", borderColor: emailErr ? "#ef4444" : undefined }}
                onFocus={focusIn} onBlurCapture={focusOut}
              />
            </div>
            {emailErr && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{emailErr}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={14} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input type={showPw ? "text" : "password"} value={password}
                onChange={e => { setPassword(e.target.value); setPwErr(null) }}
                placeholder="Minimum 8 characters" autoComplete="new-password"
                style={{ ...inputBase, padding: "0 44px 0 40px" }}
                onFocus={focusIn} onBlurCapture={focusOut}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: "#6b7280" }}>
                {showPw ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
            {/* Strength meter */}
            {password.length > 0 && (
              <>
                <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: s >= i ? sColor[s] : "rgba(255,255,255,0.06)", transition: "background-color 200ms" }} />
                  ))}
                </div>
                {s > 0 && <p style={{ fontSize: 11, fontWeight: 500, color: sColor[s], margin: "6px 0 0" }}>{sLabel[s]}</p>}
              </>
            )}
            {pwErr && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{pwErr}</p>}
          </div>

          {/* Terms */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 24 }} onClick={() => setAgreed(v => !v)}>
            <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1, backgroundColor: agreed ? "#606E74" : "transparent", border: `1.5px solid ${agreed ? "#606E74" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms" }}>
              {agreed && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.4 }}>
              I agree to the{" "}
              <a href="/terms" style={{ color: "#7a8f96", textDecoration: "none" }} onClick={e => e.stopPropagation()} onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" style={{ color: "#7a8f96", textDecoration: "none" }} onClick={e => e.stopPropagation()} onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>Privacy Policy</a>
            </span>
          </label>

          <button type="submit" disabled={!canSubmit} style={{ width: "100%", height: 44, backgroundColor: canSubmit ? "#606E74" : "#2a2f33", color: canSubmit ? "#ffffff" : "#6b7280", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: canSubmit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background-color 150ms, transform 50ms" }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#7a8f96" }}
            onMouseLeave={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#606E74" }}
            onMouseDown={e => { if (canSubmit) e.currentTarget.style.transform = "scale(0.98)" }}
            onMouseUp={e => { e.currentTarget.style.transform = "scale(1)" }}
          >
            {loading ? <><Loader2 size={16} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />Creating account...</> : "Create account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>Already have a portal? </span>
          <a href="/login" style={{ fontSize: 13, fontWeight: 600, color: "#7a8f96", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>Sign in</a>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#4b5563", marginTop: 24, textAlign: "center", letterSpacing: "0.3px" }}>Powered by RunMySalon</p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
        input::placeholder { color: #6b7280 !important; }
      `}</style>
    </div>
  )
}
