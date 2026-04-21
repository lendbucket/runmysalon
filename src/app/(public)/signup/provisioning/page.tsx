"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Loader2, Scissors } from "lucide-react"

export default function ProvisioningPage() {
  return (
    <Suspense fallback={null}>
      <ProvisioningScreen />
    </Suspense>
  )
}

const STEPS = [
  { label: "Creating your account...", delay: 0 },
  { label: "Provisioning your subdomain...", delay: 1000 },
  { label: "Warming up SSL certificates...", delay: 2000 },
  { label: "Initializing your AI agent...", delay: 3000 },
  { label: "Configuring your plan...", delay: 4000 },
  { label: "Almost done...", delay: 5000 },
]

const MIN_DURATION = 6000

function ProvisioningScreen() {
  const searchParams = useSearchParams()
  const session = searchParams.get("session") || ""

  const [visibleStep, setVisibleStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [apiDone, setApiDone] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const startTime = useRef(Date.now())

  // Animation: reveal steps one by one
  useEffect(() => {
    const timers = STEPS.map((step, i) =>
      setTimeout(() => {
        setVisibleStep(i + 1)
        // Mark previous step as "completed" when next appears
        if (i > 0) {
          setCompletedSteps((prev) => [...prev, i - 1])
        }
      }, step.delay)
    )

    // Mark last step done at 5.5s
    const finalTimer = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, STEPS.length - 1])
    }, 5500)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(finalTimer)
    }
  }, [])

  // API call on mount
  useEffect(() => {
    if (!session) return
    fetch("/api/signup/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session }),
    })
      .then((r) => r.json())
      .then((data) => {
        setRedirectUrl(data.redirectUrl || data.url || null)
        setApiDone(true)
      })
      .catch(() => {
        setApiDone(true)
      })
  }, [session])

  // Redirect after animation completes + API done
  useEffect(() => {
    if (!apiDone || !redirectUrl) return
    const elapsed = Date.now() - startTime.current
    const remaining = Math.max(0, MIN_DURATION - elapsed)

    const timer = setTimeout(() => {
      window.location.href = redirectUrl
    }, remaining)

    return () => clearTimeout(timer)
  }, [apiDone, redirectUrl])

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#06080d",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: 24,
    }}>
      {/* Logo */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: "#606E74",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 40,
      }}>
        <Scissors size={28} strokeWidth={1.5} color="#ffffff" />
      </div>

      <h1 style={{
        fontSize: 24,
        fontWeight: 700,
        color: "#ffffff",
        margin: "0 0 8px",
        textAlign: "center",
      }}>
        Setting up your salon
      </h1>
      <p style={{
        fontSize: 14,
        color: "#6b7280",
        margin: "0 0 48px",
        textAlign: "center",
      }}>
        This usually takes a few seconds...
      </p>

      <div style={{ width: 360, maxWidth: "90vw" }}>
        {STEPS.map((step, i) => {
          const visible = i < visibleStep
          const completed = completedSteps.includes(i)

          if (!visible) return null

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 400ms ease, transform 400ms ease",
              }}
            >
              {completed ? (
                <CheckCircle size={20} strokeWidth={2} color="#34d399" />
              ) : (
                <Loader2
                  size={20}
                  strokeWidth={2}
                  color="#606E74"
                  style={{ animation: "spin 1s linear infinite" }}
                />
              )}
              <span style={{
                fontSize: 15,
                color: completed ? "#34d399" : "#d1d5db",
                fontWeight: 500,
                transition: "color 300ms",
              }}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
