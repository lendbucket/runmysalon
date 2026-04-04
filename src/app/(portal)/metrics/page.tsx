"use client"
import { useCallback, useEffect, useState } from "react"

interface StylistMetrics {
  teamMemberId: string
  name: string
  homeLocation: string
  revenue: number
  serviceCount: number
  avgTicket: number
}

interface LocationMetrics {
  location: string
  revenue: number
  serviceCount: number
  avgTicket: number
  stylistBreakdown: StylistMetrics[]
  periodStart: string
  periodEnd: string
}

type Period = "week" | "month" | "year"
type Location = "both" | "Corpus Christi" | "San Antonio"

const PERIOD_LABELS: Record<Period, string> = { week: "This Week", month: "This Month", year: "This Year" }
const LOC_LABELS: Record<Location, string> = { both: "Both", "Corpus Christi": "CC", "San Antonio": "SA" }

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function MetricsPage() {
  const [period, setPeriod] = useState<Period>("week")
  const [location, setLocation] = useState<Location>("both")
  const [data, setData] = useState<LocationMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ period })
      if (location !== "both") params.set("location", location)
      const res = await fetch(`/api/metrics/live?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json.metrics || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load metrics")
    } finally {
      setLoading(false)
    }
  }, [period, location])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalServices = data.reduce((s, d) => s + d.serviceCount, 0)
  const totalAvg = totalServices > 0 ? totalRevenue / totalServices : 0

  const pillStyle = (active: boolean) => ({
    padding: "7px 16px",
    fontSize: "10px",
    fontWeight: 700 as const,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    borderRadius: "6px",
    border: "none",
    cursor: "pointer" as const,
    backgroundColor: active ? "#CDC9C0" : "transparent",
    color: active ? "#0f1d24" : "rgba(205,201,192,0.45)",
    transition: "all 0.15s",
  })

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Metrics & Goals
          </h1>
          <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Live data from Square
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "9px 16px", backgroundColor: "rgba(205,201,192,0.08)",
            border: "1px solid rgba(205,201,192,0.2)", borderRadius: "7px",
            color: "#CDC9C0", fontSize: "10px", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>refresh</span>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", gap: "2px", backgroundColor: "#1a2a32", padding: "3px", borderRadius: "8px", border: "1px solid rgba(205,201,192,0.08)" }}>
          {(["week", "month", "year"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={pillStyle(period === p)}>{PERIOD_LABELS[p]}</button>
          ))}
        </div>
        <div style={{ display: "inline-flex", gap: "2px", backgroundColor: "#1a2a32", padding: "3px", borderRadius: "8px", border: "1px solid rgba(205,201,192,0.08)" }}>
          {(["both", "Corpus Christi", "San Antonio"] as Location[]).map(l => (
            <button key={l} onClick={() => setLocation(l)} style={pillStyle(location === l)}>{LOC_LABELS[l]}</button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "14px 16px", color: "#FCA5A5", fontSize: "12px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#94A3B8" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "32px", display: "block", marginBottom: "12px", opacity: 0.4 }}>hourglass_empty</span>
          <p style={{ fontSize: "13px", margin: 0 }}>Fetching metrics from Square...</p>
        </div>
      )}

      {/* No data */}
      {!loading && !error && data.length === 0 && (
        <div style={{ backgroundColor: "#1a2a32", border: "1px solid rgba(205,201,192,0.1)", borderRadius: "10px", padding: "60px", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "rgba(205,201,192,0.2)", display: "block", marginBottom: "12px" }}>insights</span>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", margin: "0 0 4px" }}>No Data Available</p>
          <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>No bookings found for this period.</p>
        </div>
      )}

      {/* Summary cards */}
      {!loading && data.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
            {[
              { label: "Total Revenue", value: fmt(totalRevenue), icon: "payments" },
              { label: "Total Services", value: String(totalServices), icon: "content_cut" },
              { label: "Avg Ticket", value: fmt(totalAvg), icon: "receipt_long" },
              { label: "Locations", value: String(data.length), icon: "storefront" },
            ].map(c => (
              <div key={c.label} style={{ backgroundColor: "#1a2a32", border: "1px solid rgba(205,201,192,0.1)", borderRadius: "10px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, color: "#CDC9C0", letterSpacing: "0.12em", textTransform: "uppercase" }}>{c.label}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "rgba(205,201,192,0.25)" }}>{c.icon}</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Per-location breakdown */}
          {data.map(loc => (
            <div key={loc.location} style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {loc.location}
                </h2>
                <div style={{ display: "flex", gap: "16px" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    <span style={{ color: "#CDC9C0", fontWeight: 700 }}>{fmt(loc.revenue)}</span> revenue
                  </span>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    <span style={{ color: "#CDC9C0", fontWeight: 700 }}>{loc.serviceCount}</span> services
                  </span>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    <span style={{ color: "#CDC9C0", fontWeight: 700 }}>{fmt(loc.avgTicket)}</span> avg
                  </span>
                </div>
              </div>

              {/* Stylist table */}
              <div style={{ backgroundColor: "#1a2a32", border: "1px solid rgba(205,201,192,0.1)", borderRadius: "10px", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: "1px solid rgba(205,201,192,0.08)" }}>
                  {["Stylist", "Services", "Avg Ticket", "Revenue"].map(h => (
                    <div key={h} style={{ fontSize: "9px", fontWeight: 700, color: "rgba(205,201,192,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: h === "Stylist" ? "left" : "right" }}>{h}</div>
                  ))}
                </div>
                {/* Rows */}
                {loc.stylistBreakdown.map((s, i) => (
                  <div key={s.teamMemberId} style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "14px 20px",
                    borderBottom: i < loc.stylistBreakdown.length - 1 ? "1px solid rgba(205,201,192,0.06)" : "none",
                    backgroundColor: i % 2 === 0 ? "transparent" : "rgba(205,201,192,0.02)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        backgroundColor: "rgba(205,201,192,0.08)", border: "1px solid rgba(205,201,192,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#CDC9C0", fontSize: "10px", fontWeight: 800, flexShrink: 0,
                      }}>
                        {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>{s.name}</span>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 700, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>{s.serviceCount}</div>
                    <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 600, color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>{s.avgTicket > 0 ? fmt(s.avgTicket) : "—"}</div>
                    <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 700, color: s.revenue > 0 ? "#CDC9C0" : "#94A3B8", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>{s.revenue > 0 ? fmt(s.revenue) : "—"}</div>
                  </div>
                ))}
                {loc.stylistBreakdown.length === 0 && (
                  <div style={{ padding: "24px 20px", textAlign: "center", color: "#94A3B8", fontSize: "12px" }}>No stylist data</div>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
