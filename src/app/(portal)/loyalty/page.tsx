"use client"
import { useState } from "react"

const fontLink = "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
const iconLink = "https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined"

interface LoyaltyMember {
  client: string
  points: number
  tier: "Bronze" | "Silver" | "Gold" | "Platinum"
  totalEarned: number
  lastActivity: string
}

const tierColors: Record<string, { bg: string; text: string }> = {
  Bronze: { bg: "rgba(205,127,50,0.15)", text: "#cd7f32" },
  Silver: { bg: "rgba(192,192,192,0.15)", text: "#c0c0c0" },
  Gold: { bg: "rgba(205,201,192,0.2)", text: "#CDC9C0" },
  Platinum: { bg: "rgba(122,143,150,0.2)", text: "#7a8f96" },
}

export default function LoyaltyPage() {
  const [pointsPerDollar, setPointsPerDollar] = useState("1")
  const [redemptionRate, setRedemptionRate] = useState("100")
  const [birthdayBonus, setBirthdayBonus] = useState("250")
  const [referralBonus, setReferralBonus] = useState("500")

  const stats = {
    totalMembers: 342,
    pointsIssued: 187450,
    pointsRedeemed: 64200,
    rewardsValue: 642,
  }

  const members: LoyaltyMember[] = [
    { client: "Maria Santos", points: 5280, tier: "Platinum", totalEarned: 8400, lastActivity: "Apr 18, 2026" },
    { client: "Jessica Chen", points: 2150, tier: "Gold", totalEarned: 4300, lastActivity: "Apr 15, 2026" },
    { client: "Taylor Brooks", points: 1420, tier: "Silver", totalEarned: 2100, lastActivity: "Apr 12, 2026" },
    { client: "Amina Diallo", points: 780, tier: "Silver", totalEarned: 1200, lastActivity: "Apr 10, 2026" },
    { client: "Sarah Kim", points: 320, tier: "Bronze", totalEarned: 450, lastActivity: "Apr 8, 2026" },
    { client: "Olivia Parker", points: 150, tier: "Bronze", totalEarned: 200, lastActivity: "Apr 5, 2026" },
  ]

  const tiers = [
    { name: "Bronze", range: "0 - 499", icon: "military_tech", color: "#cd7f32" },
    { name: "Silver", range: "500 - 1,499", icon: "military_tech", color: "#c0c0c0" },
    { name: "Gold", range: "1,500 - 4,999", icon: "military_tech", color: "#CDC9C0" },
    { name: "Platinum", range: "5,000+", icon: "diamond", color: "#7a8f96" },
  ]

  const card: React.CSSProperties = {
    backgroundColor: "#0d1117",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "24px",
  }

  const label: React.CSSProperties = {
    fontSize: "13px",
    color: "#7a8f96",
    marginBottom: "6px",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(205,201,192,0.1)",
    borderRadius: "8px",
    color: "#CDC9C0",
    fontSize: "14px",
    fontFamily: "Fira Code, monospace",
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <>
      <link href={fontLink} rel="stylesheet" />
      <link href={iconLink} rel="stylesheet" />
      <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif", color: "#CDC9C0", minHeight: "100vh", padding: "32px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "28px", verticalAlign: "middle", marginRight: "10px", color: "#7a8f96" }}>stars</span>
            Loyalty Program
          </h1>
          <p style={{ fontSize: "14px", color: "#7a8f96", margin: "4px 0 0" }}>Points-based rewards that keep clients coming back</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Total Members", value: stats.totalMembers.toLocaleString(), icon: "group" },
            { label: "Points Issued", value: stats.pointsIssued.toLocaleString(), icon: "add_circle" },
            { label: "Points Redeemed", value: stats.pointsRedeemed.toLocaleString(), icon: "redeem" },
            { label: "Rewards Value", value: `$${stats.rewardsValue.toLocaleString()}`, icon: "payments" },
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

        {/* Settings */}
        <div style={{ ...card, marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: "0 0 20px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "8px", color: "#7a8f96" }}>tune</span>
            Points Settings
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            <div>
              <div style={label}>Points per Dollar</div>
              <input type="text" value={pointsPerDollar} onChange={(e) => setPointsPerDollar(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={label}>Redemption Rate (pts = $1)</div>
              <input type="text" value={redemptionRate} onChange={(e) => setRedemptionRate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={label}>Birthday Bonus Points</div>
              <input type="text" value={birthdayBonus} onChange={(e) => setBirthdayBonus(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={label}>Referral Bonus Points</div>
              <input type="text" value={referralBonus} onChange={(e) => setReferralBonus(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Tier Thresholds */}
        <div style={{ ...card, marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "8px", color: "#7a8f96" }}>workspace_premium</span>
            Tier Thresholds
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {tiers.map((t) => (
              <div key={t.name} style={{
                padding: "20px",
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "10px",
                textAlign: "center",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "32px", color: t.color, marginBottom: "8px" }}>{t.icon}</span>
                <div style={{ fontSize: "16px", fontWeight: 600, color: t.color, marginBottom: "4px" }}>{t.name}</div>
                <div style={{ fontSize: "13px", fontFamily: "Fira Code, monospace", color: "#7a8f96" }}>{t.range} pts</div>
              </div>
            ))}
          </div>
        </div>

        {/* Members Table */}
        <div style={card}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "8px", color: "#7a8f96" }}>people</span>
            Members
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Client", "Points Balance", "Tier", "Total Earned", "Last Activity"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#7a8f96", fontWeight: 500, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.client} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 500 }}>{m.client}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "Fira Code, monospace" }}>{m.points.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 500,
                        backgroundColor: tierColors[m.tier].bg,
                        color: tierColors[m.tier].text,
                      }}>{m.tier}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "Fira Code, monospace" }}>{m.totalEarned.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "#7a8f96" }}>{m.lastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
