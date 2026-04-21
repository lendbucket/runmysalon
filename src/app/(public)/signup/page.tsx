"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Scissors, AlertCircle, Loader2, Check } from "lucide-react"

const emailRegex = /.+@.+\..+/
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
const strengthLabel = ["", "Weak", "Medium", "Strong"]

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [touched, setTouched] = useState({ name: false, email: false, password: false })

  const nameError = touched.name && !name.trim() ? "Full name is required" : ""
  const emailError = touched.email && !emailRegex.test(email) ? "Enter a valid email address" : ""
  const passwordError = touched.password && password.length > 0 && (
    password.length < 8 ? "At least 8 characters" :
    !hasLetter.test(password) || !hasNumber.test(password) ? "Must contain a letter and a number" : ""
  )
  const strength = passwordStrength(password)
  const canSubmit = name.trim() && emailRegex.test(email) && password.length >= 8 && hasLetter.test(password) && hasNumber.test(password) && agreedToTerms && !loading

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, email: true, password: true })
    if (!canSubmit) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName: name, salonName: name.split(" ")[0] + "'s Salon", email, password }),
      })

      if (res.ok) {
        router.push("/signup/salon")
      } else if (res.status === 409) {
        setError("exists")
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }, [canSubmit, name, email, password, router])

  const inputStyle = (hasError: string | boolean | undefined): React.CSSProperties => ({
    width: "100%", height: 44, boxSizing: "border-box",
    backgroundColor: "#06080d",
    border: `1px solid ${hasError ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 8, padding: "0 14px",
    color: "#ffffff", fontSize: 14,
    fontFamily: "inherit", outline: "none",
    transition: "border-color 150ms, box-shadow 150ms",
  })

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#06080d",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    }}>
      {/* Logo mark */}
      <div style={{
        width: 48, height: 48, borderRadius: 12, backgroundColor: "#606E74",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
      }}>
        <Scissors size={24} strokeWidth={1.5} color="#ffffff" />
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 600, color: "#ffffff", margin: "0 0 4px", textAlign: "center" }}>
        Start your salon portal
      </h1>
      <p style={{ fontSize: 14, fontWeight: 400, color: "#9ca3af", margin: "0 0 32px", textAlign: "center" }}>
        14 days free. No credit card required.
      </p>

      {/* Card */}
      <div style={{
        width: 420, maxWidth: "90vw",
        backgroundColor: "#0d1117",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: 40,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {/* Error banner */}
        {error && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8, padding: "12px 14px", marginBottom: 20,
            animation: "fadeInUp 150ms ease-out",
          }}>
            <AlertCircle size={16} strokeWidth={1.5} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: "#fca5a5" }}>
              {error === "exists" ? (
                <>An account with this email already exists. <a href="/login" style={{ color: "#7a8f96", fontWeight: 600 }}>Sign in instead</a></>
              ) : error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>Full name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              placeholder="Jane Smith"
              autoComplete="name"
              style={inputStyle(nameError)}
            />
            {nameError && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{nameError}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>Work email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              placeholder="you@salon.com"
              autoComplete="email"
              style={inputStyle(emailError)}
            />
            {emailError && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{emailError}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              placeholder="Min 8 characters, letter + number"
              autoComplete="new-password"
              style={inputStyle(passwordError)}
            />
            {/* Strength meter */}
            {password.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <div style={{ display: "flex", gap: 3, flex: 1 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      backgroundColor: strength >= i ? strengthColor[strength] : "rgba(255,255,255,0.06)",
                      transition: "background-color 200ms",
                    }} />
                  ))}
                </div>
                {strength > 0 && (
                  <span style={{ fontSize: 11, color: strengthColor[strength], fontWeight: 500 }}>
                    {strengthLabel[strength]}
                  </span>
                )}
              </div>
            )}
            {passwordError && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{passwordError}</p>}
          </div>

          {/* Terms checkbox */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", marginBottom: 24 }}>
            <div
              onClick={() => setAgreedToTerms(v => !v)}
              style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                backgroundColor: agreedToTerms ? "#606E74" : "transparent",
                border: `1px solid ${agreedToTerms ? "#606E74" : "rgba(255,255,255,0.15)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 150ms",
              }}
            >
              {agreedToTerms && <Check size={10} strokeWidth={2} color="#ffffff" />}
            </div>
            <span style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.4 }}>
              I agree to the{" "}
              <a href="#" style={{ color: "#7a8f96", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
              >Terms of Service</a>{" "}and{" "}
              <a href="#" style={{ color: "#7a8f96", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
              >Privacy Policy</a>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit" disabled={!canSubmit}
            style={{
              width: "100%", height: 44,
              backgroundColor: canSubmit ? "#606E74" : "#2a2f33",
              color: canSubmit ? "#ffffff" : "#6b7280",
              border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background-color 150ms",
            }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#7a8f96" }}
            onMouseLeave={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#606E74" }}
          >
            {loading ? (
              <><Loader2 size={16} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} /> Creating account...</>
            ) : "Create account"}
          </button>
        </form>

        {/* Bottom link */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>Already have a portal? </span>
          <a href="/login" style={{ fontSize: 13, fontWeight: 600, color: "#7a8f96", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
          >Sign in</a>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#4b5563", marginTop: 24, textAlign: "center" }}>Powered by RunMySalon</p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
        input::placeholder { color: #6b7280; }
      `}</style>
    </div>
  )
}
