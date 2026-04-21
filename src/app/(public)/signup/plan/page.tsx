"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Sparkles, Zap, Crown } from "lucide-react"
import { SignupShell, btnStyle } from "@/components/signup-shell"

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanForm />
    </Suspense>
  )
}

interface Plan {
  id: string
  name: string
  price: number
  icon: React.ReactNode
  features: string[]
  users: string
  highlighted?: boolean
}

const plans: Plan[] = [
  {
    id: "solo",
    name: "Solo",
    price: 49,
    icon: <Zap size={20} strokeWidth={1.5} />,
    features: [
      "Appointments",
      "Clients",
      "Basic reports",
      "SMS reminders (100/mo)",
      "Email (1,000/mo)",
    ],
    users: "1 user",
  },
  {
    id: "growth",
    name: "Growth",
    price: 79,
    icon: <Sparkles size={20} strokeWidth={1.5} />,
    features: [
      "Everything in Solo +",
      "Payroll",
      "Invoicing",
      "Staff management",
      "Performance dashboards",
      "Inventory",
      "Purchase orders",
      "SMS (500/mo)",
      "Email (5,000/mo)",
      "AI scheduling",
    ],
    users: "10 users",
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    icon: <Crown size={20} strokeWidth={1.5} />,
    features: [
      "Everything in Growth +",
      "AI agent (Envy Advisor)",
      "Memberships",
      "Gift cards",
      "Loyalty",
      "Marketing",
      "Social scheduling",
      "Custom reporting",
      "API access",
      "Unlimited users",
      "Priority support",
      "SMS/Email unlimited",
    ],
    users: "Unlimited users",
  },
]

function PlanForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = searchParams.get("session") || ""
  const [loading, setLoading] = useState<string | null>(null)
  const [locationCount, setLocationCount] = useState(1)

  useEffect(() => {
    if (!session) return
    fetch(`/api/signup/session?session=${session}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.locationCount) setLocationCount(d.locationCount)
      })
      .catch(() => {})
  }, [session])

  const handleSelect = async (plan: Plan) => {
    setLoading(plan.id)
    try {
      await fetch("/api/signup/select-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session, planId: plan.id, price: plan.price }),
      })
      router.push(`/signup/phone?session=${session}`)
    } catch {
      setLoading(null)
    }
  }

  return (
    <SignupShell currentStep={10} showBack onBack={() => router.back()}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 8px", textAlign: "center" }}>
        Pick your plan
      </h1>
      <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 28px", textAlign: "center" }}>
        7 days free. No credit card until day 7. Change tiers anytime.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
      }}>
        {plans.map((plan) => {
          const selected = loading === plan.id
          return (
            <div
              key={plan.id}
              style={{
                backgroundColor: "#06080d",
                border: plan.highlighted
                  ? "2px solid #C9A84C"
                  : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "20px 16px 16px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* 7-day free trial pill */}
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#34d399",
                backgroundColor: "rgba(52,211,153,0.1)",
                padding: "3px 8px",
                borderRadius: 4,
                alignSelf: "flex-start",
                marginBottom: 12,
              }}>
                7-day free trial
              </div>

              {/* Most Popular badge */}
              {plan.highlighted && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 12,
                  backgroundColor: "#C9A84C",
                  color: "#000000",
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  padding: "4px 10px",
                  borderRadius: "0 0 6px 6px",
                }}>
                  Most Popular
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ color: plan.highlighted ? "#C9A84C" : "#9ca3af" }}>{plan.icon}</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", margin: 0 }}>
                  {plan.name}
                </h3>
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={{
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#ffffff",
                  fontFamily: "'Fira Code', monospace",
                  lineHeight: 1,
                }}>
                  ${plan.price}
                </span>
                <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 2 }}>/mo per location</span>
              </div>

              <div style={{ flex: 1, marginBottom: 16 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                    <Check size={13} strokeWidth={2} color={plan.highlighted ? "#C9A84C" : "#7a8f96"} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                  <Check size={13} strokeWidth={2} color={plan.highlighted ? "#C9A84C" : "#7a8f96"} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.4 }}>{plan.users}</span>
                </div>
              </div>

              <button
                onClick={() => handleSelect(plan)}
                disabled={loading !== null}
                style={{
                  width: "100%",
                  height: 38,
                  border: "none",
                  borderRadius: 8,
                  backgroundColor: plan.highlighted
                    ? "#C9A84C"
                    : loading !== null ? "#2a2f33" : "#606E74",
                  color: plan.highlighted ? "#000000" : loading !== null ? "#6b7280" : "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: loading !== null ? "not-allowed" : "pointer",
                  transition: "background-color 150ms",
                }}
              >
                {selected ? "Selecting..." : `Start with ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Total cost summary */}
      <div style={{
        textAlign: "center",
        marginTop: 20,
        padding: "12px 16px",
        backgroundColor: "rgba(255,255,255,0.02)",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.04)",
      }}>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
          {locationCount} location{locationCount !== 1 ? "s" : ""} selected — pricing shown is per location, free for 7 days
        </p>
      </div>
    </SignupShell>
  )
}
