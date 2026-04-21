"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Loader2 } from "lucide-react"
import { SignupShell } from "@/components/signup-shell"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResend = async () => {
    setResending(true); setError(null); setResent(false)
    try {
      const res = await fetch("/api/signup/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setResent(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Could not resend. Please try again.")
      }
    } catch {
      setError("Network error. Check your connection.")
    } finally {
      setResending(false)
    }
  }

  return (
    <SignupShell currentStep={1}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <CheckCircle size={48} strokeWidth={1.5} color="#22c55e" style={{ marginBottom: 20 }} />

        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#ffffff", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
          Check your email
        </h1>
        <p style={{ fontSize: 15, color: "#9ca3af", margin: "0 0 32px", maxWidth: 380 }}>
          We just sent a verification link to{" "}
          <span style={{ color: "#ffffff", fontWeight: 500 }}>{email}</span>.
        </p>

        <div style={{ fontSize: 14, color: "#9ca3af" }}>
          Didn&apos;t get it?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: "none", border: "none", color: "#7a8f96",
              fontWeight: 600, fontSize: 14, fontFamily: "inherit",
              cursor: resending ? "not-allowed" : "pointer",
              textDecoration: "underline", padding: 0,
            }}
          >
            {resending ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Loader2 size={14} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />
                Sending...
              </span>
            ) : "Resend"}
          </button>
        </div>

        {resent && (
          <p style={{ fontSize: 13, color: "#22c55e", marginTop: 12 }}>
            Verification email resent!
          </p>
        )}
        {error && (
          <p style={{ fontSize: 13, color: "#ef4444", marginTop: 12 }}>
            {error}
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </SignupShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <SignupShell currentStep={1}>
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 size={24} strokeWidth={1.5} color="#6b7280" style={{ animation: "spin 1s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </SignupShell>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
