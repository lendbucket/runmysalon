"use client"

import { Suspense, useState, useCallback } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Scissors, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"

const emailRegex = /.+@.+\..+/

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#06080d" }} />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const urlError = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [touched, setTouched] = useState({ email: false, password: false })

  const errorMap: Record<string, string> = {
    PendingApproval: "Your account is pending approval. Contact your salon owner.",
    NotFound: "No account found with that email.",
    OAuthAccountNotLinked: "This email uses a different sign-in method.",
  }

  const displayError = error || (urlError ? errorMap[urlError] || "Sign-in failed. Please try again." : "")

  const emailError = touched.email && !emailRegex.test(email) ? "Enter a valid email address" : ""
  const passwordError = touched.password && !password ? "Password is required" : ""
  const canSubmit = emailRegex.test(email) && password.length > 0 && !loading

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!canSubmit) return

    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    })

    setLoading(false)

    if (result?.ok) {
      router.push(callbackUrl)
    } else {
      setError("Invalid email or password")
    }
  }, [email, password, callbackUrl, canSubmit, router])

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl })
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#06080d",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    }}>
      {/* Logo mark */}
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        backgroundColor: "#606E74",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16,
      }}>
        <Scissors size={24} strokeWidth={1.5} color="#ffffff" />
      </div>

      {/* Heading */}
      <h1 style={{ fontSize: 24, fontWeight: 600, color: "#ffffff", margin: "0 0 4px", textAlign: "center" }}>
        Welcome back
      </h1>
      <p style={{ fontSize: 14, fontWeight: 400, color: "#9ca3af", margin: "0 0 32px", textAlign: "center" }}>
        Sign in to your salon portal
      </p>

      {/* Card */}
      <div style={{
        width: 420, maxWidth: "90vw",
        backgroundColor: "#0d1117",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 40,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {/* Error banner */}
        {displayError && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8, padding: "12px 14px",
            marginBottom: 20,
            animation: "fadeInUp 150ms ease-out",
          }}>
            <AlertCircle size={16} strokeWidth={1.5} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#fca5a5" }}>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              placeholder="you@salon.com"
              autoComplete="email"
              style={{
                width: "100%", height: 44, boxSizing: "border-box",
                backgroundColor: "#06080d",
                border: `1px solid ${emailError ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 8, padding: "0 14px",
                color: "#ffffff", fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 150ms, box-shadow 150ms",
              }}
              onFocus={e => {
                if (!emailError) {
                  e.target.style.borderColor = "#606E74"
                  e.target.style.boxShadow = "0 0 0 3px rgba(96,110,116,0.15)"
                }
              }}
              onBlurCapture={e => {
                e.target.style.borderColor = emailError ? "#ef4444" : "rgba(255,255,255,0.08)"
                e.target.style.boxShadow = emailError ? "0 0 0 3px rgba(239,68,68,0.15)" : "none"
              }}
            />
            {emailError && (
              <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{emailError}</p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af" }}>Password</label>
              <a href="/forgot-password" style={{ fontSize: 12, color: "#7a8f96", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
              >
                Forgot?
              </a>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  width: "100%", height: 44, boxSizing: "border-box",
                  backgroundColor: "#06080d",
                  border: `1px solid ${passwordError ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8, padding: "0 44px 0 14px",
                  color: "#ffffff", fontSize: 14,
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 150ms, box-shadow 150ms",
                }}
                onFocus={e => {
                  if (!passwordError) {
                    e.target.style.borderColor = "#606E74"
                    e.target.style.boxShadow = "0 0 0 3px rgba(96,110,116,0.15)"
                  }
                }}
                onBlurCapture={e => {
                  e.target.style.borderColor = passwordError ? "#ef4444" : "rgba(255,255,255,0.08)"
                  e.target.style.boxShadow = passwordError ? "0 0 0 3px rgba(239,68,68,0.15)" : "none"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center",
                }}
              >
                {showPassword
                  ? <EyeOff size={16} strokeWidth={1.5} color="#6b7280" />
                  : <Eye size={16} strokeWidth={1.5} color="#6b7280" />
                }
              </button>
            </div>
            {passwordError && (
              <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{passwordError}</p>
            )}
          </div>

          {/* Remember me */}
          <label style={{
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 24,
          }}>
            <div
              onClick={() => setRememberMe(v => !v)}
              style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                backgroundColor: rememberMe ? "#606E74" : "transparent",
                border: `1px solid ${rememberMe ? "#606E74" : "rgba(255,255,255,0.15)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 150ms",
              }}
            >
              {rememberMe && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>Keep me signed in for 30 days</span>
          </label>

          {/* Sign in button */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: "100%", height: 44,
              backgroundColor: canSubmit ? "#606E74" : "#2a2f33",
              color: canSubmit ? "#ffffff" : "#6b7280",
              border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              fontFamily: "inherit",
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background-color 150ms",
            }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#7a8f96" }}
            onMouseLeave={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#606E74" }}
          >
            {loading ? (
              <>
                <Loader2 size={16} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
        }}>
          <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
          <span style={{
            fontSize: 12, color: "#6b7280",
            padding: "0 12px",
          }}>or</span>
          <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          style={{
            width: "100%", height: 44,
            backgroundColor: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            cursor: "pointer",
            transition: "background-color 150ms",
            fontFamily: "inherit",
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Continue with Google</span>
        </button>

        {/* Bottom link */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>Don&apos;t have a salon portal? </span>
          <a href="/signup" style={{ fontSize: 13, fontWeight: 600, color: "#7a8f96", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
          >
            Start free trial
          </a>
        </div>
      </div>

      {/* Powered by */}
      <p style={{ fontSize: 11, color: "#4b5563", marginTop: 24, textAlign: "center" }}>
        Powered by RunMySalon
      </p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
        input::placeholder { color: #6b7280; }
      `}</style>
    </div>
  )
}
