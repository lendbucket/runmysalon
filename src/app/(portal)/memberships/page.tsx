"use client"
import { useState } from "react"

const fontLink = "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
const iconLink = "https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined"

interface MembershipPlan {
  id: string
  name: string
  price: number
  benefits: string
  billingCycle: string
  memberCount: number
  revenue: number
}

interface ActiveMember {
  client: string
  plan: string
  startDate: string
  nextBilling: string
  status: "Active" | "Past Due" | "Cancelled"
}

export default function MembershipsPage() {
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [newBenefits, setNewBenefits] = useState("")
  const [newCycle, setNewCycle] = useState("monthly")

  const stats = {
    activeMembers: 84,
    monthlyRevenue: 6720,
    avgLength: "7.2 mo",
    churnRate: "4.8%",
  }

  const [plans] = useState<MembershipPlan[]>([
    { id: "1", name: "Essential", price: 49, benefits: "1 Haircut/month\n10% off products\nPriority booking", billingCycle: "Monthly", memberCount: 38, revenue: 1862 },
    { id: "2", name: "Premium", price: 89, benefits: "2 Services/month\n20% off products\nPriority booking\nFree deep conditioning", billingCycle: "Monthly", memberCount: 28, revenue: 2492 },
    { id: "3", name: "VIP", price: 149, benefits: "Unlimited blowouts\n30% off all services\nFree products monthly\nExclusive events", billingCycle: "Monthly", memberCount: 18, revenue: 2682 },
  ])

  const activeMembers: ActiveMember[] = [
    { client: "Maria Santos", plan: "VIP", startDate: "Sep 15, 2025", nextBilling: "Apr 25, 2026", status: "Active" },
    { client: "Jessica Chen", plan: "Premium", startDate: "Nov 3, 2025", nextBilling: "Apr 22, 2026", status: "Active" },
    { client: "Taylor Brooks", plan: "Essential", startDate: "Jan 8, 2026", nextBilling: "Apr 28, 2026", status: "Active" },
    { client: "Amina Diallo", plan: "Premium", startDate: "Dec 1, 2025", nextBilling: "Apr 20, 2026", status: "Past Due" },
    { client: "Sarah Kim", plan: "Essential", startDate: "Oct 20, 2025", nextBilling: "Apr 20, 2026", status: "Cancelled" },
  ]

  const card: React.CSSProperties = {
    backgroundColor: "#0d1117",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "24px",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(205,201,192,0.1)",
    borderRadius: "8px",
    color: "#CDC9C0",
    fontSize: "14px",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#7a8f96",
    marginBottom: "6px",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  }

  const statusColor = (s: string) => {
    if (s === "Active") return { bg: "rgba(34,197,94,0.1)", text: "#22c55e" }
    if (s === "Past Due") return { bg: "rgba(234,179,8,0.1)", text: "#eab308" }
    return { bg: "rgba(239,68,68,0.1)", text: "#ef4444" }
  }

  return (
    <>
      <link href={fontLink} rel="stylesheet" />
      <link href={iconLink} rel="stylesheet" />
      <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif", color: "#CDC9C0", minHeight: "100vh", padding: "32px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", margin: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px", verticalAlign: "middle", marginRight: "10px", color: "#7a8f96" }}>card_membership</span>
              Memberships
            </h1>
            <p style={{ fontSize: "14px", color: "#7a8f96", margin: "4px 0 0" }}>Recurring membership plans for predictable revenue</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#606E74",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            Create Membership
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Active Members", value: stats.activeMembers.toString(), icon: "people" },
            { label: "Monthly Revenue", value: `$${stats.monthlyRevenue.toLocaleString()}`, icon: "payments" },
            { label: "Avg Membership Length", value: stats.avgLength, icon: "schedule" },
            { label: "Churn Rate", value: stats.churnRate, icon: "trending_down" },
          ].map((s) => (
            <div key={s.label} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#7a8f96" }}>{s.icon}</span>
                <span style={{ fontSize: "13px", color: "#7a8f96" }}>{s.label}</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "Fira Code, monospace", color: "#fff" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Plans Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {plans.map((p) => (
            <div key={p.id} style={{ ...card, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 600, color: "#fff" }}>{p.name}</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "Fira Code, monospace", color: "#CDC9C0", marginTop: "4px" }}>
                    ${p.price}<span style={{ fontSize: "14px", color: "#7a8f96" }}>/mo</span>
                  </div>
                </div>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  backgroundColor: "rgba(122,143,150,0.15)",
                  color: "#7a8f96",
                }}>{p.billingCycle}</span>
              </div>
              <div style={{ fontSize: "13px", color: "#7a8f96", lineHeight: 1.6, flex: 1, whiteSpace: "pre-line", marginBottom: "16px" }}>
                {p.benefits}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#7a8f96" }}>Members</div>
                  <div style={{ fontSize: "18px", fontWeight: 600, fontFamily: "Fira Code, monospace", color: "#fff" }}>{p.memberCount}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "#7a8f96" }}>Revenue</div>
                  <div style={{ fontSize: "18px", fontWeight: 600, fontFamily: "Fira Code, monospace", color: "#CDC9C0" }}>${p.revenue.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Members Table */}
        <div style={card}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "8px", color: "#7a8f96" }}>people</span>
            Active Members
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Client", "Plan", "Start Date", "Next Billing", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#7a8f96", fontWeight: 500, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeMembers.map((m, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 500 }}>{m.client}</td>
                    <td style={{ padding: "12px 16px" }}>{m.plan}</td>
                    <td style={{ padding: "12px 16px", color: "#7a8f96" }}>{m.startDate}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "Fira Code, monospace" }}>{m.nextBilling}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 500,
                        backgroundColor: statusColor(m.status).bg,
                        color: statusColor(m.status).text,
                      }}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                backgroundColor: "#0d1117",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "32px",
                width: "480px",
                maxHeight: "90vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 0 24px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px", color: "#7a8f96" }}>add_circle</span>
                Create Membership
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={labelStyle}>Plan Name</div>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} placeholder="e.g. Premium" />
                </div>
                <div>
                  <div style={labelStyle}>Price / Month</div>
                  <input type="text" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ ...inputStyle, fontFamily: "Fira Code, monospace" }} placeholder="$89" />
                </div>
                <div>
                  <div style={labelStyle}>Benefits</div>
                  <textarea
                    value={newBenefits}
                    onChange={(e) => setNewBenefits(e.target.value)}
                    style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                    placeholder="One benefit per line..."
                  />
                </div>
                <div>
                  <div style={labelStyle}>Billing Cycle</div>
                  <select
                    value={newCycle}
                    onChange={(e) => setNewCycle(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(205,201,192,0.1)",
                      borderRadius: "8px",
                      color: "#7a8f96",
                      fontSize: "14px",
                      cursor: "pointer",
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                    }}
                  >Cancel</button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: "#606E74",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                    }}
                  >Create Plan</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
