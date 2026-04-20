"use client"
import { useEffect, useState } from "react"
import { useUserRole } from "@/hooks/useUserRole"

const ACC = "#606E74", ACC_B = "#7a8f96", ACC_DIM = "rgba(96,110,116,0.08)", ACC_BDR = "rgba(96,110,116,0.2)"
const BORDER = "rgba(255,255,255,0.06)", CARD_BG = "#0d1117"
const CARD_SHADOW = "inset 0 1px 0 rgba(255,255,255,0.02), inset 1px 0 0 rgba(255,255,255,0.01), 0 0 0 1px rgba(0,0,0,0.25)"
const MUTED = "rgba(255,255,255,0.3)", MID = "rgba(255,255,255,0.6)"
const GREEN = "#10B981", AMBER = "#ffb347", BLUE = "#4da6ff", RED = "#ff6b6b"
const GOLD_BG = "#CDC9C0", GOLD_TEXT = "#0f1d24"
const mono: React.CSSProperties = { fontFamily: "'Fira Code', monospace" }
const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

type Tab = "campaigns" | "segments" | "templates"
type CampaignStatus = "draft" | "scheduled" | "sent" | "always-on"
type Channel = "sms" | "email" | "both"
type ScheduleType = "now" | "schedule" | "always-on"

interface Campaign {
  id: string
  name: string
  segment: string
  channel: Channel
  status: CampaignStatus
  sentCount: number
  openRate: number
  createdAt: string
  scheduledAt?: string
}

interface Segment {
  id: string
  name: string
  description: string
  count: number
  icon: string
}

const SEGMENTS: Segment[] = [
  { id: "lapsed_60", name: "Lapsed 60+ Days", description: "Clients who have not visited in over 60 days", count: 127, icon: "schedule" },
  { id: "birthday", name: "Birthday This Month", description: "Clients with birthdays in the current month", count: 34, icon: "cake" },
  { id: "high_spend", name: "High Spenders $500+", description: "Clients who have spent over $500 lifetime", count: 89, icon: "paid" },
  { id: "new_clients", name: "New Clients", description: "Clients who visited for the first time in the last 30 days", count: 42, icon: "person_add" },
  { id: "no_rebook", name: "Haven't Rebooked", description: "Clients whose last appointment had no follow-up booked", count: 156, icon: "event_busy" },
]

const DEMO_CAMPAIGNS: Campaign[] = [
  { id: "1", name: "Win-Back: 60+ Days", segment: "Lapsed 60+ Days", channel: "sms", status: "always-on", sentCount: 312, openRate: 0.68, createdAt: "2026-03-15" },
  { id: "2", name: "Birthday Special", segment: "Birthday This Month", channel: "both", status: "scheduled", sentCount: 0, openRate: 0, createdAt: "2026-04-18", scheduledAt: "2026-04-21" },
  { id: "3", name: "VIP Appreciation", segment: "High Spenders $500+", channel: "email", status: "sent", sentCount: 89, openRate: 0.45, createdAt: "2026-04-10" },
  { id: "4", name: "Spring Refresh Promo", segment: "Haven't Rebooked", channel: "sms", status: "draft", sentCount: 0, openRate: 0, createdAt: "2026-04-19" },
]

export default function MarketingPage() {
  const { isOwner, isManager } = useUserRole()
  const [tab, setTab] = useState<Tab>("campaigns")
  const [campaigns, setCampaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS)
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // New campaign form
  const [formName, setFormName] = useState("")
  const [formSegment, setFormSegment] = useState(SEGMENTS[0].id)
  const [formChannel, setFormChannel] = useState<Channel>("sms")
  const [formMessage, setFormMessage] = useState("")
  const [formSchedule, setFormSchedule] = useState<ScheduleType>("now")

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  if (!isOwner && !isManager) {
    return <div style={{ padding: "40px", textAlign: "center", color: MID, ...jakarta }}>Access restricted to owners and managers.</div>
  }

  const statusColor: Record<CampaignStatus, string> = { draft: MUTED, scheduled: AMBER, sent: GREEN, "always-on": BLUE }
  const statusLabel: Record<CampaignStatus, string> = { draft: "Draft", scheduled: "Scheduled", sent: "Sent", "always-on": "Always On" }

  const stats = {
    totalSent: campaigns.reduce((a, c) => a + c.sentCount, 0),
    avgOpen: campaigns.filter(c => c.sentCount > 0).length > 0
      ? campaigns.filter(c => c.sentCount > 0).reduce((a, c) => a + c.openRate, 0) / campaigns.filter(c => c.sentCount > 0).length
      : 0,
    clickRate: 0.12,
    revenue: 4280,
  }

  const handleCreateCampaign = () => {
    if (!formName.trim()) return
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: formName,
      segment: SEGMENTS.find(s => s.id === formSegment)?.name || "",
      channel: formChannel,
      status: formSchedule === "now" ? "sent" : formSchedule === "always-on" ? "always-on" : "scheduled",
      sentCount: 0,
      openRate: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }
    setCampaigns(prev => [newCampaign, ...prev])
    setShowModal(false)
    setFormName("")
    setFormMessage("")
    setFormSchedule("now")
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "campaigns", label: "Campaigns", icon: "campaign" },
    { key: "segments", label: "Segments", icon: "group" },
    { key: "templates", label: "Templates", icon: "article" },
  ]

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,0.03)",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
    ...jakarta,
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: "32px",
  }

  return (
    <div style={{ padding: isMobile ? "16px" : "24px 32px", maxWidth: "1100px", margin: "0 auto", ...jakarta }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>Marketing</h1>
          <p style={{ color: MUTED, fontSize: "12px", marginTop: "4px" }}>Campaigns, segments, and client outreach</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "10px 24px", borderRadius: "8px",
          fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" as const,
          cursor: "pointer", border: "none", background: GOLD_BG, color: GOLD_TEXT,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
          Create Campaign
        </button>
      </div>

      {/* Stats Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
        gap: "12px",
        marginBottom: "24px",
      }}>
        {[
          { label: "Total Sent", value: stats.totalSent.toLocaleString(), icon: "send", color: BLUE },
          { label: "Open Rate", value: `${(stats.avgOpen * 100).toFixed(1)}%`, icon: "visibility", color: GREEN },
          { label: "Click Rate", value: `${(stats.clickRate * 100).toFixed(1)}%`, icon: "ads_click", color: AMBER },
          { label: "Revenue Generated", value: `$${stats.revenue.toLocaleString()}`, icon: "payments", color: GREEN },
        ].map(s => (
          <div key={s.label} style={{
            background: CARD_BG,
            borderRadius: "10px",
            border: `1px solid ${BORDER}`,
            boxShadow: CARD_SHADOW,
            padding: "16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: s.color }}>{s.icon}</span>
              <span style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{s.label}</span>
            </div>
            <div style={{ color: "#fff", fontSize: "20px", fontWeight: 800, ...mono }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
            borderRadius: "8px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const,
            cursor: "pointer", border: "1px solid",
            backgroundColor: tab === t.key ? ACC_DIM : "transparent",
            borderColor: tab === t.key ? ACC_BDR : "transparent",
            color: tab === t.key ? "#fff" : MUTED,
            transition: "all 0.15s ease",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Campaigns Tab */}
      {tab === "campaigns" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {campaigns.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: MUTED }}>
              <span className="material-symbols-outlined" style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>campaign</span>
              <div style={{ fontSize: "14px", fontWeight: 600, color: MID, marginBottom: "4px" }}>No campaigns yet</div>
              <div style={{ fontSize: "12px" }}>Create your first campaign to start reaching clients</div>
            </div>
          ) : campaigns.map(c => (
            <div key={c.id} style={{
              background: CARD_BG,
              borderRadius: "10px",
              border: `1px solid ${BORDER}`,
              boxShadow: CARD_SHADOW,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ color: "#fff", fontSize: "14px", fontWeight: 700 }}>{c.name}</span>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                    background: `${statusColor[c.status]}18`,
                    color: statusColor[c.status],
                  }}>{statusLabel[c.status]}</span>
                </div>
                <div style={{ color: MUTED, fontSize: "11px" }}>
                  {c.segment} &middot; {c.channel.toUpperCase()} &middot; {c.createdAt}
                </div>
              </div>
              <div style={{ display: "flex", gap: "24px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: MUTED, fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Sent</div>
                  <div style={{ color: "#fff", fontSize: "14px", fontWeight: 700, ...mono }}>{c.sentCount.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: MUTED, fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Open Rate</div>
                  <div style={{ color: "#fff", fontSize: "14px", fontWeight: 700, ...mono }}>{c.sentCount > 0 ? `${(c.openRate * 100).toFixed(0)}%` : "--"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Segments Tab */}
      {tab === "segments" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
          {SEGMENTS.map(seg => (
            <div key={seg.id} style={{
              background: CARD_BG,
              borderRadius: "10px",
              border: `1px solid ${BORDER}`,
              boxShadow: CARD_SHADOW,
              padding: "20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  background: ACC_DIM, border: `1px solid ${ACC_BDR}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: ACC_B }}>{seg.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>{seg.name}</div>
                  <div style={{ color: MUTED, fontSize: "11px" }}>{seg.description}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: BLUE }}>group</span>
                <span style={{ color: "#fff", fontSize: "16px", fontWeight: 800, ...mono }}>{seg.count.toLocaleString()}</span>
                <span style={{ color: MUTED, fontSize: "11px" }}>clients</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Templates Tab */}
      {tab === "templates" && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "40px", color: MUTED, display: "block", marginBottom: "12px" }}>article</span>
          <div style={{ color: MID, fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Message Templates</div>
          <div style={{ color: MUTED, fontSize: "12px", marginBottom: "20px" }}>Create reusable templates for your campaigns</div>
          <div style={{ color: MUTED, fontSize: "11px", ...mono }}>Coming soon</div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: "#111820",
            borderRadius: "14px",
            border: `1px solid ${BORDER}`,
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            width: "100%",
            maxWidth: "520px",
            maxHeight: "90vh",
            overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px", borderBottom: `1px solid ${BORDER}`,
            }}>
              <h3 style={{ color: "#fff", fontSize: "16px", fontWeight: 700, margin: 0 }}>Create Campaign</h3>
              <button onClick={() => setShowModal(false)} style={{
                background: "transparent", border: "none", cursor: "pointer", color: MUTED, padding: "4px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" }}>Campaign Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Spring Win-Back" style={inputStyle} />
              </div>

              <div>
                <label style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" }}>Target Segment</label>
                <select value={formSegment} onChange={e => setFormSegment(e.target.value)} style={selectStyle}>
                  {SEGMENTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" }}>Channel</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["sms", "email", "both"] as Channel[]).map(ch => (
                    <button key={ch} onClick={() => setFormChannel(ch)} style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase" as const,
                      cursor: "pointer",
                      border: `1px solid ${formChannel === ch ? ACC_BDR : BORDER}`,
                      background: formChannel === ch ? ACC_DIM : "transparent",
                      color: formChannel === ch ? ACC_B : MUTED,
                    }}>{ch}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" }}>Message</label>
                <textarea
                  value={formMessage}
                  onChange={e => setFormMessage(e.target.value)}
                  placeholder="Hi {client_name}, we miss you at {salon_name}! Book your next visit: {booking_link}"
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
                <div style={{ color: MUTED, fontSize: "10px", marginTop: "6px" }}>
                  Variables: <span style={{ ...mono, color: ACC_B, fontSize: "10px" }}>{"{client_name}"} {"{salon_name}"} {"{stylist_name}"} {"{booking_link}"}</span>
                </div>
              </div>

              <div>
                <label style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" }}>Schedule</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {([
                    { key: "now" as ScheduleType, label: "Send Now" },
                    { key: "schedule" as ScheduleType, label: "Schedule" },
                    { key: "always-on" as ScheduleType, label: "Always-On" },
                  ]).map(s => (
                    <button key={s.key} onClick={() => setFormSchedule(s.key)} style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase" as const,
                      cursor: "pointer",
                      border: `1px solid ${formSchedule === s.key ? ACC_BDR : BORDER}`,
                      background: formSchedule === s.key ? ACC_DIM : "transparent",
                      color: formSchedule === s.key ? ACC_B : MUTED,
                    }}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              display: "flex", gap: "12px", padding: "20px 24px",
              borderTop: `1px solid ${BORDER}`,
            }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: "10px", borderRadius: "8px",
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                cursor: "pointer", border: `1px solid ${BORDER}`, background: "transparent", color: MUTED,
              }}>Cancel</button>
              <button onClick={handleCreateCampaign} style={{
                flex: 2, padding: "10px", borderRadius: "8px",
                fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" as const,
                cursor: "pointer", border: "none", background: GOLD_BG, color: GOLD_TEXT,
                opacity: formName.trim() ? 1 : 0.5,
              }}>Create Campaign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
