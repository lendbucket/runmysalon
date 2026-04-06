"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUserRole } from "@/hooks/useUserRole"

type Subscription = { id: string; plan: string; price: number; status: string } | null
type Stats = { totalSubscribers: number; monthlyRevenue: number } | null

const APPS = [
  {
    id: "style-tax",
    name: "StyleTax",
    tagline: "AI-powered tax management for stylists",
    color: "#22c55e",
    gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    icon: "receipt_long",
    price: "Included",
    available: true,
    benefits: [
      "AI receipt scanner with instant categorization",
      "Mileage tracker at IRS $0.70/mile rate",
      "Quarterly tax estimates & payment reminders",
      "Comprehensive deduction guide for stylists",
      "Year-end tax summary export",
    ],
  },
  {
    id: "style-credit",
    name: "StyleCredit",
    tagline: "Build business credit as you grow",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    icon: "credit_score",
    price: "Coming Soon",
    available: false,
    benefits: [
      "Business credit score monitoring",
      "Tradeline reporting to bureaus",
      "Credit-building payment plans",
      "Loan pre-qualification tools",
    ],
  },
  {
    id: "style-insure",
    name: "StyleInsure",
    tagline: "Professional liability & health coverage",
    color: "#eab308",
    gradient: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
    icon: "shield",
    price: "Coming Soon",
    available: false,
    benefits: [
      "Professional liability insurance",
      "Health insurance marketplace",
      "Equipment protection plans",
      "Workers comp alternatives",
    ],
  },
  {
    id: "style-edu",
    name: "StyleEdu",
    tagline: "Continuing education & certifications",
    color: "#a855f7",
    gradient: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",
    icon: "school",
    price: "Coming Soon",
    available: false,
    benefits: [
      "CE credit tracking",
      "Online course library",
      "Certification management",
      "Tax-deductible education expenses",
    ],
  },
  {
    id: "style-health",
    name: "StyleHealth",
    tagline: "Wellness & ergonomic support",
    color: "#ef4444",
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    icon: "favorite",
    price: "Coming Soon",
    available: false,
    benefits: [
      "Ergonomic assessment tools",
      "Mental health resources",
      "Fitness & wellness discounts",
      "Health savings account integration",
    ],
  },
]

/* ─── Design tokens ─── */
const C = {
  bg: "#06080d",
  accent: "#606E74",
  bright: "#7a8f96",
  glow: "rgba(96,110,116,0.2)",
  dim: "rgba(96,110,116,0.08)",
  surface: "rgba(255,255,255,0.03)",
  surfaceHover: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.12)",
  stone: "#CDC9C0",
  amber: "#ffb347",
  blue: "#4da6ff",
  purple: "#a78bfa",
  red: "#ff6b6b",
  green: "#10B981",
}

export default function SuitePage() {
  const { data: session } = useSession()
  const { isOwner } = useUserRole()
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription>(null)
  const [stats, setStats] = useState<Stats>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    fetch("/api/suite/subscription")
      .then((r) => r.json())
      .then((data) => {
        setHasAccess(data.hasAccess)
        setSubscription(data.subscription)
        setStats(data.stats)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSubscribe = async (plan: "monthly" | "annual") => {
    setSubscribing(true)
    try {
      const res = await fetch("/api/suite/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      setSubscription(data.subscription)
      setHasAccess(true)
      setShowModal(false)
    } catch {
      // handle error
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: `${C.stone}80` }}>
          <span className="material-symbols-outlined" style={{ fontSize: "32px", animation: "spin 1s linear infinite" }}>progress_activity</span>
          <p style={{ marginTop: "12px", fontSize: "13px" }}>Loading Envy Suite...</p>
        </div>
      </div>
    )
  }

  const styleTaxApp = APPS[0]
  const comingSoonApps = APPS.filter((a) => !a.available)

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Radial glow at top */}
      <div style={{
        position: "absolute", top: "-200px", left: "50%", transform: "translateX(-50%)",
        width: "800px", height: "600px",
        background: `radial-gradient(ellipse at center, ${C.glow} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, padding: "48px 24px", maxWidth: "960px", margin: "0 auto" }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 16px", borderRadius: "999px",
            background: C.dim, border: `1px solid ${C.border}`,
            marginBottom: "20px",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: C.accent }}>diamond</span>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.bright }}>
              {hasAccess ? (isOwner ? "Owner Access" : "Active Subscription") : "Premium Suite"}
            </span>
          </div>

          <h1 style={{
            fontSize: "42px", fontWeight: 800, margin: "0 0 14px",
            background: `linear-gradient(135deg, #FFFFFF 0%, ${C.bright} 50%, ${C.accent} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1.15,
          }}>
            Envy Suite
          </h1>
          <p style={{ color: `${C.stone}99`, fontSize: "15px", maxWidth: "520px", margin: "0 auto 28px", lineHeight: 1.6 }}>
            Premium tools designed exclusively for beauty professionals. Manage taxes, build credit, and grow your career.
          </p>

          {!hasAccess && !isOwner && (
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "12px 32px", borderRadius: "10px",
                  background: `linear-gradient(135deg, ${C.accent} 0%, ${C.bright} 100%)`,
                  border: "none", color: "#FFFFFF", fontSize: "12px", fontWeight: 800,
                  letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
                  boxShadow: `0 4px 24px ${C.glow}`,
                }}
              >
                Subscribe Now
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("pricing-section")
                  el?.scrollIntoView({ behavior: "smooth" })
                }}
                style={{
                  padding: "12px 32px", borderRadius: "10px",
                  background: "transparent",
                  border: `1px solid ${C.border}`, color: `${C.stone}99`,
                  fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                View Pricing
              </button>
            </div>
          )}
        </div>

        {/* ── Owner Stats ── */}
        {isOwner && stats && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "40px",
          }}>
            <div style={{
              padding: "24px", borderRadius: "14px",
              background: C.surface, border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: `${C.stone}80`, marginBottom: "10px" }}>Active Subscribers</div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#FFFFFF", fontFamily: "monospace" }}>{stats.totalSubscribers}</div>
            </div>
            <div style={{
              padding: "24px", borderRadius: "14px",
              background: C.surface, border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: `${C.stone}80`, marginBottom: "10px" }}>Monthly Revenue</div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: C.green, fontFamily: "monospace" }}>${stats.monthlyRevenue.toFixed(0)}</div>
            </div>
          </div>
        )}

        {/* ── Credit Building Callout ── */}
        {!isOwner && !hasAccess && (
          <div style={{
            padding: "24px 28px", borderRadius: "14px",
            background: `linear-gradient(135deg, rgba(77,166,255,0.06) 0%, rgba(167,139,250,0.06) 100%)`,
            border: `1px solid rgba(77,166,255,0.15)`,
            marginBottom: "40px",
            display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "36px", color: C.blue }}>trending_up</span>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>Build Your Financial Future</div>
              <div style={{ fontSize: "13px", color: `${C.stone}99`, lineHeight: 1.5 }}>
                Envy Suite members see an average credit score increase of{" "}
                <span style={{ fontFamily: "monospace", fontWeight: 800, color: C.blue, fontSize: "15px" }}>+40-80</span>{" "}
                points within their first year.
              </div>
            </div>
          </div>
        )}

        {/* ── StyleTax Featured Card ── */}
        <div style={{
          borderRadius: "16px", overflow: "hidden", marginBottom: "32px",
          background: C.surface,
          border: `1px solid ${C.border}`,
          position: "relative",
        }}>
          {/* Gradient border top */}
          <div style={{
            height: "2px",
            background: `linear-gradient(90deg, ${C.accent}, ${C.bright}, ${C.accent})`,
          }} />

          <div style={{ padding: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: C.dim,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "24px", color: C.bright }}>{styleTaxApp.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#FFFFFF" }}>{styleTaxApp.name}</div>
                <div style={{ fontSize: "12px", color: `${C.stone}80` }}>{styleTaxApp.tagline}</div>
              </div>
              <div style={{
                marginLeft: "auto",
                padding: "4px 14px", borderRadius: "20px",
                background: "rgba(16,185,129,0.12)", color: C.green,
                fontSize: "10px", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                {styleTaxApp.price}
              </div>
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px",
              marginBottom: "24px",
            }}>
              {styleTaxApp.benefits.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "6px 0" }}>
                  <div style={{
                    width: "6px", height: "6px", borderRadius: "50%", marginTop: "5px", flexShrink: 0,
                    background: C.accent,
                  }} />
                  <span style={{ fontSize: "12px", color: `${C.stone}aa`, lineHeight: 1.4 }}>{b}</span>
                </div>
              ))}
            </div>

            {(hasAccess || isOwner) ? (
              <Link
                href={`/suite/${styleTaxApp.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "12px 28px", borderRadius: "10px",
                  background: `linear-gradient(135deg, ${C.accent} 0%, ${C.bright} 100%)`,
                  color: "#FFFFFF", textDecoration: "none",
                  fontSize: "12px", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                  boxShadow: `0 4px 24px ${C.glow}`,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>open_in_new</span>
                Open {styleTaxApp.name}
              </Link>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "12px 28px", borderRadius: "10px",
                  background: C.dim, border: `1px solid ${C.border}`,
                  color: `${C.stone}80`,
                  fontSize: "12px", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Subscribe to Unlock
              </button>
            )}
          </div>

          {/* Lock overlay for non-subscribers */}
          {!hasAccess && !isOwner && (
            <div
              onClick={() => setShowModal(true)}
              style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(180deg, rgba(6,8,13,0.3) 0%, rgba(6,8,13,0.7) 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", borderRadius: "16px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "44px", color: `${C.stone}55` }}>lock</span>
                <div style={{ color: `${C.stone}66`, fontSize: "11px", fontWeight: 700, marginTop: "8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Subscribe to Access
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Coming Soon 2x2 Grid ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px",
          marginBottom: "56px",
        }}>
          {comingSoonApps.map((app) => (
            <div
              key={app.id}
              style={{
                borderRadius: "14px", overflow: "hidden", position: "relative",
                background: C.surface, border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "10px",
                    background: C.dim,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: C.bright }}>{app.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>{app.name}</div>
                    <div style={{ fontSize: "11px", color: `${C.stone}66` }}>{app.tagline}</div>
                  </div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {app.benefits.slice(0, 3).map((b, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "4px 0", fontSize: "11px", color: `${C.stone}77` }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", marginTop: "5px", flexShrink: 0, background: `${C.accent}88` }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Lock overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(180deg, rgba(6,8,13,0.2) 0%, rgba(6,8,13,0.65) 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "14px",
              }}>
                <div style={{ textAlign: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px", color: `${C.stone}44` }}>hourglass_top</span>
                  <div style={{ color: `${C.stone}55`, fontSize: "10px", fontWeight: 700, marginTop: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Coming Soon
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pricing Section ── */}
        {!hasAccess && !isOwner && (
          <div id="pricing-section" style={{ marginBottom: "56px" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px" }}>Simple Pricing</h2>
              <p style={{ fontSize: "13px", color: `${C.stone}77`, margin: 0 }}>One subscription unlocks every tool in the suite.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", maxWidth: "560px", margin: "0 auto" }}>
              {/* Monthly */}
              <button
                onClick={() => handleSubscribe("monthly")}
                disabled={subscribing}
                style={{
                  padding: "28px 20px", borderRadius: "14px",
                  background: C.surface, border: `1px solid ${C.border}`,
                  cursor: subscribing ? "not-allowed" : "pointer",
                  textAlign: "center", opacity: subscribing ? 0.6 : 1,
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: `${C.stone}66`, marginBottom: "10px" }}>Monthly</div>
                <div style={{ fontSize: "36px", fontWeight: 800, color: "#FFFFFF", fontFamily: "monospace" }}>$40</div>
                <div style={{ fontSize: "11px", color: `${C.stone}55` }}>per month</div>
              </button>

              {/* Annual */}
              <button
                onClick={() => handleSubscribe("annual")}
                disabled={subscribing}
                style={{
                  padding: "28px 20px", borderRadius: "14px",
                  background: C.surface,
                  border: `1px solid ${C.accent}44`,
                  cursor: subscribing ? "not-allowed" : "pointer",
                  textAlign: "center", opacity: subscribing ? 0.6 : 1,
                  position: "relative",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                  padding: "3px 14px", borderRadius: "20px",
                  background: `linear-gradient(135deg, ${C.accent} 0%, ${C.bright} 100%)`,
                  color: "#FFFFFF", fontSize: "9px", fontWeight: 800,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  boxShadow: `0 2px 12px ${C.glow}`,
                }}>
                  Best Value
                </div>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: `${C.stone}66`, marginBottom: "10px" }}>Annual</div>
                <div style={{ fontSize: "36px", fontWeight: 800, color: "#FFFFFF", fontFamily: "monospace" }}>$399</div>
                <div style={{ fontSize: "11px", color: `${C.stone}55` }}>per year ($33.25/mo)</div>
                <div style={{ fontSize: "10px", color: C.green, fontWeight: 700, marginTop: "6px" }}>Save $81/yr</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Subscribe Modal ── */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0d1117",
              borderRadius: "18px",
              border: `1px solid ${C.border}`,
              padding: "36px",
              maxWidth: "480px", width: "100%",
              boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 60px ${C.glow}`,
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "36px", color: C.bright }}>diamond</span>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", margin: "14px 0 8px" }}>Subscribe to Envy Suite</h2>
              <p style={{ fontSize: "13px", color: `${C.stone}80`, margin: 0 }}>
                Unlock all premium tools and start optimizing your business today.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              <button
                onClick={() => handleSubscribe("monthly")}
                disabled={subscribing}
                style={{
                  flex: 1, minWidth: "180px", padding: "22px",
                  borderRadius: "12px",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  cursor: subscribing ? "not-allowed" : "pointer",
                  textAlign: "center", opacity: subscribing ? 0.6 : 1,
                }}
              >
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: `${C.stone}66`, marginBottom: "8px" }}>Monthly</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#FFFFFF", fontFamily: "monospace" }}>$40</div>
                <div style={{ fontSize: "11px", color: `${C.stone}55` }}>per month</div>
              </button>

              <button
                onClick={() => handleSubscribe("annual")}
                disabled={subscribing}
                style={{
                  flex: 1, minWidth: "180px", padding: "22px",
                  borderRadius: "12px",
                  background: C.dim,
                  border: `1px solid ${C.accent}44`,
                  cursor: subscribing ? "not-allowed" : "pointer",
                  textAlign: "center", opacity: subscribing ? 0.6 : 1,
                  position: "relative",
                }}
              >
                <div style={{
                  position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                  padding: "2px 12px", borderRadius: "10px",
                  background: `linear-gradient(135deg, ${C.accent} 0%, ${C.bright} 100%)`,
                  color: "#FFFFFF", fontSize: "9px", fontWeight: 800,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  Save $81/yr
                </div>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: `${C.stone}66`, marginBottom: "8px" }}>Annual</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#FFFFFF", fontFamily: "monospace" }}>$399</div>
                <div style={{ fontSize: "11px", color: `${C.stone}55` }}>per year ($33.25/mo)</div>
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              style={{
                width: "100%", padding: "10px",
                borderRadius: "8px", backgroundColor: "transparent",
                border: `1px solid ${C.border}`, color: `${C.stone}55`,
                fontSize: "11px", fontWeight: 700, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
