"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Rocket, Users, ArrowRight, Sparkles } from "lucide-react"

const FUN_FACTS = [
  "The global salon industry generates over $190 billion in revenue annually.",
  "The average salon client visits every 6\u20138 weeks \u2014 that\u2019s about 7 visits per year.",
  "80% of salon revenue comes from repeat clients, not new walk-ins.",
  "Salons that send automated reminders see a 30% reduction in no-shows.",
  "The beauty industry employs over 1.8 million professionals in the U.S. alone.",
]

export default function WelcomePage() {
  const router = useRouter()
  const [fact] = useState(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      {/* Celebration icon */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: "linear-gradient(135deg, #606E74, #7a8f96)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "scale(1)" : "scale(0.8)",
        transition: "all 500ms ease",
      }}>
        <Rocket size={32} strokeWidth={1.5} color="#ffffff" />
      </div>

      <h1 style={{
        fontSize: 32,
        fontWeight: 700,
        color: "#ffffff",
        margin: "0 0 8px",
        textAlign: "center",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transition: "all 600ms ease 100ms",
      }}>
        Welcome to RunMySalon!
      </h1>

      <p style={{
        fontSize: 16,
        color: "#9ca3af",
        margin: "0 0 48px",
        textAlign: "center",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transition: "all 600ms ease 200ms",
      }}>
        Your portal is ready. Let&apos;s take a quick tour.
      </p>

      {/* Action tiles */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: 400,
        maxWidth: "90vw",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "all 600ms ease 300ms",
      }}>
        {/* Primary: Take the tour */}
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            width: "100%",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: "#606E74",
            border: "none",
            borderRadius: 12,
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "background-color 150ms",
          }}
        >
          <Sparkles size={18} strokeWidth={1.5} />
          Take the 2-minute tour
          <ArrowRight size={16} strokeWidth={2} />
        </button>

        {/* Outlined: Go to dashboard */}
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            width: "100%",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#d1d5db",
            fontSize: 16,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "border-color 150ms",
          }}
        >
          Go straight to dashboard
        </button>

        {/* Outlined: Invite team */}
        <button
          onClick={() => router.push("/settings")}
          style={{
            width: "100%",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#d1d5db",
            fontSize: 16,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "border-color 150ms",
          }}
        >
          <Users size={18} strokeWidth={1.5} />
          Invite my team
        </button>
      </div>

      {/* Fun fact */}
      <div style={{
        marginTop: 56,
        maxWidth: 420,
        textAlign: "center",
        opacity: mounted ? 1 : 0,
        transition: "opacity 800ms ease 600ms",
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "#4b5563",
          margin: "0 0 8px",
        }}>
          Fun fact
        </p>
        <p style={{
          fontSize: 13,
          color: "#6b7280",
          margin: 0,
          lineHeight: 1.6,
          fontStyle: "italic",
        }}>
          {fact}
        </p>
      </div>
    </div>
  )
}
