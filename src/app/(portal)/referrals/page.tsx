"use client"
import { useState } from "react"
import Link from "next/link"

const fontLink = "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
const iconLink = "https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined"

type RewardType = "percent" | "dollar" | "service"

interface ReferralCode {
  code: string
  client: string
  referrals: number
  rewards: string
  status: "Active" | "Expired" | "Paused"
}

export default function ReferralsPage() {
  const [rewardType, setRewardType] = useState<RewardType>("percent")
  const [rewardAmount, setRewardAmount] = useState("15")
  const [minSpend, setMinSpend] = useState("50")

  const stats = {
    totalReferrals: 127,
    rewardsIssued: 89,
    revenueFromReferred: 14350,
  }

  const codes: ReferralCode[] = [
    { code: "MARIA-2024", client: "Maria Santos", referrals: 8, rewards: "$120", status: "Active" },
    { code: "JESS-VIP", client: "Jessica Chen", referrals: 5, rewards: "$75", status: "Active" },
    { code: "TAYLOR-REF", client: "Taylor Brooks", referrals: 3, rewards: "$45", status: "Active" },
    { code: "AMINA-LOVE", client: "Amina Diallo", referrals: 2, rewards: "$30", status: "Paused" },
    { code: "SARAH-2023", client: "Sarah Kim", referrals: 1, rewards: "$15", status: "Expired" },
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

  const input: React.CSSProperties = {
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", margin: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px", verticalAlign: "middle", marginRight: "10px", color: "#7a8f96" }}>loyalty</span>
              Referral Program
            </h1>
            <p style={{ fontSize: "14px", color: "#7a8f96", margin: "4px 0 0" }}>Grow your client base through word-of-mouth rewards</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Total Referrals", value: stats.totalReferrals, icon: "group_add", fmt: false },
            { label: "Rewards Issued", value: stats.rewardsIssued, icon: "redeem", fmt: false },
            { label: "Revenue from Referred", value: stats.revenueFromReferred, icon: "payments", fmt: true },
          ].map((s) => (
            <div key={s.label} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#7a8f96" }}>{s.icon}</span>
                <span style={{ fontSize: "13px", color: "#7a8f96" }}>{s.label}</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "Fira Code, monospace", color: "#fff" }}>
                {s.fmt ? `$${s.value.toLocaleString()}` : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div style={{ ...card, marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: "0 0 20px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "8px", color: "#7a8f96" }}>settings</span>
            Reward Settings
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            <div>
              <div style={label}>Reward Type</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {([
                  { key: "percent" as RewardType, label: "Discount %", icon: "percent" },
                  { key: "dollar" as RewardType, label: "Dollar Credit", icon: "attach_money" },
                  { key: "service" as RewardType, label: "Free Service", icon: "spa" },
                ]).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setRewardType(t.key)}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      backgroundColor: rewardType === t.key ? "rgba(122,143,150,0.2)" : "rgba(255,255,255,0.04)",
                      border: rewardType === t.key ? "1px solid #7a8f96" : "1px solid rgba(205,201,192,0.1)",
                      borderRadius: "8px",
                      color: rewardType === t.key ? "#fff" : "#7a8f96",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={label}>Reward Amount</div>
              <input
                type="text"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                style={input}
                placeholder={rewardType === "percent" ? "15%" : "$15"}
              />
            </div>
            <div>
              <div style={label}>Minimum Spend</div>
              <input
                type="text"
                value={minSpend}
                onChange={(e) => setMinSpend(e.target.value)}
                style={input}
                placeholder="$50"
              />
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div style={{ ...card, marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "8px", color: "#7a8f96" }}>info</span>
            How It Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {[
              { step: "1", title: "Unique Code", desc: "Each client gets a unique referral code they can share with friends and family." },
              { step: "2", title: "New Client Books", desc: "When a new client books an appointment using the referral code, the system tracks it." },
              { step: "3", title: "Earn Rewards", desc: "The referring client earns a reward after the referred client completes their first visit." },
            ].map((s) => (
              <div key={s.step} style={{ display: "flex", gap: "12px" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(122,143,150,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#7a8f96",
                  flexShrink: 0,
                }}>{s.step}</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>{s.title}</div>
                  <div style={{ fontSize: "13px", color: "#7a8f96", lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Codes Table */}
        <div style={card}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "8px", color: "#7a8f96" }}>qr_code</span>
            Referral Codes
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Code", "Client", "Referrals", "Rewards", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#7a8f96", fontWeight: 500, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.code} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "Fira Code, monospace", color: "#CDC9C0" }}>{c.code}</td>
                    <td style={{ padding: "12px 16px", color: "#fff" }}>{c.client}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "Fira Code, monospace" }}>{c.referrals}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "Fira Code, monospace", color: "#CDC9C0" }}>{c.rewards}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 500,
                        backgroundColor: c.status === "Active" ? "rgba(34,197,94,0.1)" : c.status === "Paused" ? "rgba(234,179,8,0.1)" : "rgba(239,68,68,0.1)",
                        color: c.status === "Active" ? "#22c55e" : c.status === "Paused" ? "#eab308" : "#ef4444",
                      }}>{c.status}</span>
                    </td>
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
