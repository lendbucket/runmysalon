"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useUserRole } from "@/hooks/useUserRole"

const ACC = "#606E74", ACC_B = "#7a8f96", ACC_DIM = "rgba(96,110,116,0.08)", ACC_BDR = "rgba(96,110,116,0.2)"
const BORDER = "rgba(255,255,255,0.06)", CARD_BG = "#0d1117"
const CARD_SHADOW = "inset 0 1px 0 rgba(255,255,255,0.02), inset 1px 0 0 rgba(255,255,255,0.01), 0 0 0 1px rgba(0,0,0,0.25)"
const MUTED = "rgba(255,255,255,0.3)", MID = "rgba(255,255,255,0.6)"
const GREEN = "#10B981", AMBER = "#ffb347", RED = "#ff6b6b", GRAY = "#6b7280"
const mono: React.CSSProperties = { fontFamily: "'Fira Code', monospace" }
const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }
const GOLD_BG = "#CDC9C0", GOLD_TEXT = "#0f1d24"

interface Invoice {
  id: string
  date: string
  amount: number
  status: string
  description: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = any

export default function BillingPage() {
  const { data: session } = useSession()
  const { isOwner } = useUserRole()
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)

  const tenant = (session?.user as AnyObj)?.tenant as AnyObj | undefined

  const subscriptionStatus: string = tenant?.subscriptionStatus || "trial"
  const planType: string = tenant?.planType || "starter"
  const trialEndsAt: string | null = tenant?.trialEndsAt || null

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    fetch("/api/billing/events")
      .then(r => r.json())
      .then(d => {
        if (d.invoices) setInvoices(d.invoices)
      })
      .catch(() => {})
      .finally(() => setInvoicesLoading(false))
  }, [])

  const trialDaysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const statusColor = {
    active: GREEN,
    trial: AMBER,
    past_due: RED,
    cancelled: GRAY,
    trialing: AMBER,
  }[subscriptionStatus] || GRAY

  const statusLabel = {
    active: "Active",
    trial: "Trial",
    past_due: "Past Due",
    cancelled: "Cancelled",
    trialing: "Trial",
  }[subscriptionStatus] || subscriptionStatus

  const nextBillingDate = (() => {
    if (subscriptionStatus === "trial" || subscriptionStatus === "trialing") {
      return trialEndsAt ? new Date(trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "End of trial"
    }
    const next = new Date()
    next.setMonth(next.getMonth() + 1)
    next.setDate(1)
    return next.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  })()

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || "Failed to open billing portal")
    } catch {
      alert("Failed to open billing portal")
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/billing/create-subscription", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || "Failed to create subscription")
    } catch {
      alert("Failed to start upgrade")
    } finally {
      setLoading(false)
    }
  }

  if (!isOwner) {
    return <div style={{ padding: "40px", textAlign: "center", color: MID, ...jakarta }}>Access restricted to salon owners.</div>
  }

  return (
    <div style={{ padding: isMobile ? "16px" : "24px 32px", maxWidth: "900px", margin: "0 auto", ...jakarta }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1" rel="stylesheet" />

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>Billing & Subscription</h1>
        <p style={{ color: MUTED, fontSize: "12px", marginTop: "4px" }}>Manage your plan, billing, and invoices</p>
      </div>

      {/* Trial banner */}
      {(subscriptionStatus === "trial" || subscriptionStatus === "trialing") && trialDaysRemaining !== null && (
        <div style={{
          background: `linear-gradient(135deg, rgba(255,179,71,0.12), rgba(255,179,71,0.04))`,
          border: `1px solid rgba(255,179,71,0.25)`,
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px", color: AMBER }}>schedule</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>
              {trialDaysRemaining > 0
                ? <>{" "}<span style={{ ...mono, color: AMBER }}>{trialDaysRemaining}</span> day{trialDaysRemaining !== 1 ? "s" : ""} remaining in your trial</>
                : "Your trial has expired"
              }
            </div>
            <div style={{ color: MUTED, fontSize: "11px", marginTop: "2px" }}>
              Upgrade to keep all features and avoid service interruption
            </div>
          </div>
          <button onClick={handleUpgrade} disabled={loading} style={{
            padding: "8px 20px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            cursor: loading ? "wait" : "pointer",
            border: "none",
            background: GOLD_BG,
            color: GOLD_TEXT,
          }}>Upgrade Now</button>
        </div>
      )}

      {/* Current Plan Card */}
      <div style={{
        background: CARD_BG,
        borderRadius: "12px",
        border: `1px solid ${BORDER}`,
        boxShadow: CARD_SHADOW,
        padding: isMobile ? "20px" : "28px",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: ACC_B }}>credit_card</span>
              <span style={{ color: MUTED, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Current Plan</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
              <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: 700, margin: 0 }}>RunMySalon Starter</h2>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 10px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                background: `${statusColor}18`,
                color: statusColor,
                border: `1px solid ${statusColor}40`,
              }}>{statusLabel}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ color: "#fff", fontSize: "28px", fontWeight: 800, ...mono }}>$99</span>
              <span style={{ color: MUTED, fontSize: "13px" }}>/month</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: isMobile ? "stretch" : "flex-end" }}>
            <button onClick={handleManageBilling} disabled={loading} style={{
              padding: "10px 24px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              cursor: loading ? "wait" : "pointer",
              border: `1px solid ${ACC_BDR}`,
              background: ACC_DIM,
              color: ACC_B,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>settings</span>
              Manage Billing
            </button>
            {subscriptionStatus !== "active" && (
              <button onClick={handleUpgrade} disabled={loading} style={{
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                cursor: loading ? "wait" : "pointer",
                border: "none",
                background: GOLD_BG,
                color: GOLD_TEXT,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>upgrade</span>
                Upgrade Plan
              </button>
            )}
          </div>
        </div>

        {/* Plan details row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
          gap: "16px",
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: `1px solid ${BORDER}`,
        }}>
          <div>
            <div style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Next Billing</div>
            <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>{nextBillingDate}</div>
          </div>
          <div>
            <div style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Plan Type</div>
            <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600, textTransform: "capitalize" as const }}>{planType}</div>
          </div>
          {!isMobile && (
            <div>
              <div style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Salon</div>
              <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>{tenant?.brandName || tenant?.slug || "Your Salon"}</div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice History */}
      <div style={{
        background: CARD_BG,
        borderRadius: "12px",
        border: `1px solid ${BORDER}`,
        boxShadow: CARD_SHADOW,
        padding: isMobile ? "20px" : "28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: ACC_B }}>receipt_long</span>
          <h3 style={{ color: "#fff", fontSize: "15px", fontWeight: 700, margin: 0 }}>Invoice History</h3>
        </div>

        {invoicesLoading ? (
          <div style={{ textAlign: "center", padding: "32px", color: MUTED, fontSize: "12px" }}>Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
            border: `1px dashed ${BORDER}`,
            borderRadius: "8px",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "32px", color: MUTED, marginBottom: "8px", display: "block" }}>description</span>
            <div style={{ color: MID, fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>No invoices yet</div>
            <div style={{ color: MUTED, fontSize: "11px" }}>Invoices will appear here once billing begins</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 100px 80px",
              gap: "12px",
              padding: "8px 12px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: MUTED,
            }}>
              <div>Date</div>
              <div>Description</div>
              <div style={{ textAlign: "right" }}>Amount</div>
              <div style={{ textAlign: "right" }}>Status</div>
            </div>
            {invoices.map(inv => (
              <div key={inv.id} style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 100px 80px",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${BORDER}`,
                alignItems: "center",
              }}>
                <div style={{ color: MID, fontSize: "12px" }}>
                  {new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div style={{ color: "#fff", fontSize: "12px" }}>{inv.description}</div>
                <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600, textAlign: "right", ...mono }}>
                  ${(inv.amount / 100).toFixed(2)}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase" as const,
                    background: inv.status === "paid" ? `${GREEN}18` : `${RED}18`,
                    color: inv.status === "paid" ? GREEN : RED,
                  }}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
