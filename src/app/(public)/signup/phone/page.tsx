"use client"

import { Suspense, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Phone, ArrowRight, Loader2, RotateCcw } from "lucide-react"
import { SignupShell, btnStyle } from "@/components/signup-shell"

export default function PhonePage() {
  return (
    <Suspense fallback={null}>
      <PhoneForm />
    </Suspense>
  )
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10)
  if (digits.length === 0) return ""
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function PhoneForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = searchParams.get("session") || ""

  const [step, setStep] = useState<"phone" | "code">("phone")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const rawDigits = phone.replace(/\D/g, "")
  const phoneValid = rawDigits.length === 10

  const handleSendOtp = async () => {
    if (!phoneValid) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/signup/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session, phone: rawDigits }),
      })
      if (!res.ok) throw new Error("Failed to send code")
      setStep("code")
    } catch {
      setError("Failed to send verification code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = useCallback(async (digits: string[]) => {
    const otp = digits.join("")
    if (otp.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session, code: otp }),
      })
      if (!res.ok) throw new Error("Invalid code")
      router.push(`/signup/provisioning?session=${session}`)
    } catch {
      setError("Invalid code. Please try again.")
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }, [session, router])

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newCode.every((d) => d !== "")) {
      handleVerify(newCode)
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError(null)
    try {
      await fetch("/api/signup/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session, phone: rawDigits }),
      })
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } catch {
      setError("Failed to resend code.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SignupShell currentStep={11} showBack onBack={() => step === "code" ? setStep("phone") : router.back()}>
      {step === "phone" ? (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 8px", textAlign: "center" }}>
            One more thing — phone verification
          </h1>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 32px", textAlign: "center" }}>
            Security. We&apos;ll text you if anything weird happens.
          </p>

          <div style={{ position: "relative", marginBottom: 20 }}>
            <Phone size={16} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 14, top: 14 }} />
            <input
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              style={{
                width: "100%",
                height: 48,
                boxSizing: "border-box",
                backgroundColor: "#06080d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "0 14px 0 40px",
                color: "#ffffff",
                fontSize: 16,
                fontFamily: "inherit",
                outline: "none",
                letterSpacing: "0.5px",
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#ef4444", margin: "0 0 16px", textAlign: "center" }}>{error}</p>
          )}

          <button
            onClick={handleSendOtp}
            disabled={!phoneValid || loading}
            style={btnStyle(phoneValid && !loading)}
          >
            {loading ? <Loader2 size={16} strokeWidth={2} className="animate-spin" /> : <ArrowRight size={16} strokeWidth={2} />}
            {loading ? "Sending..." : "Send verification code"}
          </button>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 8px", textAlign: "center" }}>
            Enter the code
          </h1>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 32px", textAlign: "center" }}>
            We sent a 6-digit code to {phone}
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                style={{
                  width: 48,
                  height: 56,
                  textAlign: "center",
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: "'Fira Code', monospace",
                  backgroundColor: "#06080d",
                  border: digit
                    ? "2px solid #606E74"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  color: "#ffffff",
                  outline: "none",
                  transition: "border-color 150ms",
                }}
              />
            ))}
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#ef4444", margin: "0 0 16px", textAlign: "center" }}>{error}</p>
          )}

          {loading && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <Loader2 size={20} strokeWidth={2} color="#606E74" className="animate-spin" />
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleResend}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                color: "#7a8f96",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "inherit",
                cursor: loading ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
              }}
            >
              <RotateCcw size={13} strokeWidth={2} />
              Resend code
            </button>
          </div>
        </>
      )}
    </SignupShell>
  )
}
