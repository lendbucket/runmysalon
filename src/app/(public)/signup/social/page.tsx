"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Facebook, Music2, Linkedin, X } from "lucide-react"
import { SignupShell, btnStyle } from "@/components/signup-shell"

export default function SocialPage() {
  return (
    <Suspense fallback={null}>
      <SocialForm />
    </Suspense>
  )
}

function SocialForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = searchParams.get("session") || ""
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSkip = async () => {
    setLoading(true)
    try {
      await fetch("/api/signup/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session, skipped: true }),
      })
      router.push(`/signup/plan?session=${session}`)
    } catch {
      setLoading(false)
    }
  }

  const socialButtons = [
    { label: "Connect Facebook + Instagram", icon: <Facebook size={20} strokeWidth={1.5} />, gradient: true },
    { label: "Connect TikTok", icon: <Music2 size={20} strokeWidth={1.5} />, gradient: false },
    { label: "Connect LinkedIn", icon: <Linkedin size={20} strokeWidth={1.5} />, gradient: false },
  ]

  return (
    <SignupShell currentStep={9} showBack onBack={() => router.back()}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 8px", textAlign: "center" }}>
        Connect your social accounts
      </h1>
      <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 32px", textAlign: "center" }}>
        Optional — you can skip this and do it later in Settings.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {socialButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={() => setModal(true)}
            style={{
              width: "100%",
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              backgroundColor: "#06080d",
              border: btn.gradient
                ? "2px solid transparent"
                : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              position: "relative",
              background: btn.gradient
                ? "linear-gradient(#06080d, #06080d) padding-box, linear-gradient(135deg, #0081FB, #E1306C, #FCAF45) border-box"
                : "#06080d",
              transition: "opacity 150ms",
            }}
          >
            {btn.icon}
            {btn.label}
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              backgroundColor: "rgba(255,255,255,0.06)",
              color: "#6b7280",
              padding: "3px 8px",
              borderRadius: 4,
              marginLeft: 4,
            }}>
              Coming soon
            </span>
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button
          onClick={handleSkip}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            color: "#7a8f96",
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "inherit",
            cursor: loading ? "not-allowed" : "pointer",
            padding: "8px 16px",
          }}
        >
          {loading ? "Saving..." : "Skip this for now \u2192"}
        </button>
      </div>

      {/* Coming Soon Modal */}
      {modal && (
        <div
          onClick={() => setModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 380,
              maxWidth: "90vw",
              backgroundColor: "#161b22",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: 32,
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#ffffff", margin: "0 0 12px" }}>
              Coming soon
            </h2>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 24px", lineHeight: 1.6 }}>
              Coming soon — Meta app is in review. We&apos;ll email you when it&apos;s live.
            </p>
            <button
              onClick={() => setModal(false)}
              style={{
                ...btnStyle(true),
                width: "auto",
                padding: "0 32px",
                height: 40,
                display: "inline-flex",
              }}
            >
              <X size={14} strokeWidth={2} />
              Got it
            </button>
          </div>
        </div>
      )}
    </SignupShell>
  )
}
