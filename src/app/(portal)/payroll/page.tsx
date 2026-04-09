"use client"
import { useState, useEffect, useCallback } from "react"
import { useUserRole } from "@/hooks/useUserRole"

const ACC = "#606E74", ACC_B = "#7a8f96", ACC_DIM = "rgba(96,110,116,0.08)", ACC_BDR = "rgba(96,110,116,0.2)"
const BORDER = "rgba(255,255,255,0.07)", BORDER2 = "rgba(255,255,255,0.12)", S1 = "rgba(255,255,255,0.03)", S2 = "rgba(255,255,255,0.05)"
const MUTED = "rgba(255,255,255,0.3)", MID = "rgba(255,255,255,0.6)", GREEN = "#10B981", AMBER = "#ffb347", BLUE = "#4da6ff"
const mono: React.CSSProperties = { fontFamily: "'Fira Code', 'Courier New', monospace" }
const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Period = any
type Toast = { message: string; type: "success" | "error" } | null

function getPeriod(offset: number) {
  const now = new Date()
  const cst = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }))
  const day = cst.getDay()
  const daysBack = day >= 3 ? day - 3 : day + 4
  const wed = new Date(cst); wed.setDate(cst.getDate() - daysBack - offset * 7); wed.setHours(0, 0, 0, 0)
  const tue = new Date(wed); tue.setDate(wed.getDate() + 6); tue.setHours(23, 59, 59, 999)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { start: new Date(`${fmt(wed)}T06:00:00Z`), end: new Date(`${fmt(tue)}T05:59:59Z`), label: `${wed.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${tue.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` }
}

function fmtUsd(n: number) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function PayrollPage() {
  const { isOwner, isManager, isStylist } = useUserRole()
  const [loc, setLoc] = useState<"CC" | "SA">("CC")
  const [offset, setOffset] = useState(0)
  const [period, setPeriod] = useState<Period>(null)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [history, setHistory] = useState<Period[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  const p = getPeriod(offset)

  const showT = (m: string, t: "success" | "error" = "success") => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 3000) }

  const loadPayroll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll/periods?locationId=${loc}`)
      const data = await res.json()
      const periods: Period[] = data.periods || []
      const match = periods.find((pp: Period) => Math.abs(new Date(pp.periodStart).getTime() - p.start.getTime()) < 120000)
      setPeriod(match || null)
    } catch { /* */ }
    setLoading(false)
  }, [loc, p.start])

  const loadHistory = useCallback(async () => {
    try { const res = await fetch(`/api/payroll/periods?locationId=${loc}`); const data = await res.json(); setHistory(data.periods || []) } catch { /* */ }
  }, [loc])

  useEffect(() => { loadPayroll() }, [loadPayroll])
  useEffect(() => { loadHistory() }, [loadHistory])

  async function calculate() {
    setCalculating(true)
    try {
      const res = await fetch("/api/payroll/calculate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationId: loc, start: p.start.toISOString(), end: p.end.toISOString() }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPeriod(data.period); loadHistory(); showT("Payroll calculated")
    } catch (e: unknown) { showT(e instanceof Error ? e.message : "Failed", "error") }
    setCalculating(false)
  }

  async function markPaid() {
    if (!period) return; setMarkingPaid(true)
    try {
      const res = await fetch(`/api/payroll/periods/${period.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) })
      const data = await res.json(); setPeriod(data.period); loadHistory(); showT("Marked as paid")
    } catch { showT("Failed", "error") }
    setMarkingPaid(false)
  }

  const payDay = new Date(p.end); payDay.setDate(payDay.getDate())
  const entries = period?.entries || []

  if (isStylist) return <div style={{ padding: "40px", textAlign: "center", color: MUTED }}><div style={{ fontSize: "16px", fontWeight: 700 }}>Owner / Manager Access Only</div></div>

  const Sk = ({ h = "34px" }: { h?: string }) => <div style={{ height: h, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />

  return (
    <div style={{ ...jakarta, backgroundColor: "#06080d", minHeight: "100%", color: "#fff", padding: "24px", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <style>{`@media(max-width:767px){.pr4{grid-template-columns:1fr 1fr !important}} @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}`}</style>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: 500, margin: 0 }}>Payroll</h1>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            {(["CC", "SA"] as const).map(l => <button key={l} onClick={() => setLoc(l)} style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 600, border: loc === l ? `1px solid ${ACC_B}` : `1px solid ${BORDER2}`, borderRadius: "8px", backgroundColor: loc === l ? ACC_DIM : "transparent", color: loc === l ? ACC_B : MUTED, cursor: "pointer", ...jakarta }}>{l === "CC" ? "Corpus Christi" : "San Antonio"}</button>)}
            {period && <button onClick={() => window.open(`/api/payroll/export?periodId=${period.id}`, "_blank")} style={{ padding: "6px 14px", border: `1px solid ${BORDER2}`, borderRadius: "8px", backgroundColor: "transparent", color: ACC_B, fontSize: "12px", fontWeight: 600, cursor: "pointer", ...jakarta }}>Export CSV</button>}
            {period && period.status === "pending" && (isOwner || isManager) && <button onClick={markPaid} disabled={markingPaid} style={{ padding: "6px 14px", border: `1px solid rgba(16,185,129,0.3)`, borderRadius: "8px", backgroundColor: "rgba(16,185,129,0.08)", color: GREEN, fontSize: "12px", fontWeight: 600, cursor: "pointer", ...jakarta, opacity: markingPaid ? 0.5 : 1 }}>{markingPaid ? "..." : "Mark as Paid"}</button>}
          </div>
        </div>

        {/* Period selector */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <button onClick={() => setOffset(o => o + 1)} style={{ background: "none", border: `1px solid ${BORDER2}`, borderRadius: "6px", padding: "5px 8px", color: ACC_B, cursor: "pointer" }}><span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_left</span></button>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
              <span style={{ ...mono, fontSize: "16px", fontWeight: 500 }}>{p.label}</span>
              {period && <span style={{ ...mono, fontSize: "9px", padding: "2px 8px", borderRadius: "4px", backgroundColor: period.status === "paid" ? "rgba(16,185,129,0.1)" : ACC_DIM, border: `1px solid ${period.status === "paid" ? "rgba(16,185,129,0.2)" : ACC_BDR}`, color: period.status === "paid" ? GREEN : ACC_B, textTransform: "uppercase" }}>{period.status}</span>}
            </div>
            <div style={{ ...mono, fontSize: "10px", color: MUTED, marginTop: "4px" }}>Pay day: {payDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" })}</div>
          </div>
          <button onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0} style={{ background: "none", border: `1px solid ${BORDER2}`, borderRadius: "6px", padding: "5px 8px", color: offset === 0 ? MUTED : ACC_B, cursor: offset === 0 ? "default" : "pointer" }}><span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span></button>
          {offset > 0 && <button onClick={() => setOffset(0)} style={{ ...mono, padding: "4px 10px", fontSize: "9px", border: `1px solid ${BORDER2}`, borderRadius: "5px", background: "none", color: ACC_B, cursor: "pointer", textTransform: "uppercase" }}>Current</button>}
        </div>

        <div style={{ height: "20px" }} />

        {/* KPI cards */}
        <div className="pr4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Total Commission", val: period ? fmtUsd(period.totalCommission) : "\u2014", border: GREEN },
            { label: "Total Tips", val: period ? fmtUsd(period.totalTips) : "\u2014", border: AMBER },
            { label: "Total Payout", val: period ? fmtUsd(period.totalCommission + period.totalTips) : "\u2014", border: ACC_B },
            { label: "Services", val: period ? String(period.totalServices) : "\u2014", border: BLUE },
          ].map(k => (
            <div key={k.label} style={{ background: S1, border: `1px solid ${BORDER2}`, borderLeft: `3px solid ${k.border}`, borderRadius: "0 10px 10px 0", padding: "18px 20px" }}>
              {loading ? <Sk /> : <div style={{ ...mono, fontSize: "28px", fontWeight: 500 }}>{k.val}</div>}
              <div style={{ ...mono, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, marginTop: "6px" }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Calculate button if no data */}
        {!period && !loading && (
          <div style={{ background: S1, border: `1px solid ${BORDER2}`, borderRadius: "12px", padding: "48px", textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", color: MID, marginBottom: "8px" }}>No payroll calculated for this period</div>
            <div style={{ fontSize: "12px", color: MUTED, marginBottom: "20px" }}>Click Calculate to pull Square data and compute commissions</div>
            <button onClick={calculate} disabled={calculating} style={{ padding: "10px 24px", background: `linear-gradient(135deg, ${ACC_B}, ${ACC})`, border: "none", borderRadius: "9px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", ...jakarta, opacity: calculating ? 0.5 : 1 }}>{calculating ? "Calculating..." : "Calculate Payroll"}</button>
          </div>
        )}

        {/* Stylist table */}
        {period && entries.length > 0 && (
          <div style={{ background: S1, border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>Stylist Breakdown</span>
              {period.status === "pending" && <button onClick={calculate} disabled={calculating} style={{ ...mono, fontSize: "10px", color: ACC_B, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>{calculating ? "..." : "Recalculate"}</button>}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: S2, borderBottom: `1px solid ${BORDER2}` }}>
                  {["Stylist", "Services", "Service Subtotal", "Commission (40%)", "Tips", "Total Payout"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: h === "Stylist" ? "left" : "right", ...mono, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {entries.map((e: Period) => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "14px", fontSize: "14px", fontWeight: 500 }}>{e.teamMemberName}</td>
                      <td style={{ ...mono, padding: "14px", textAlign: "right", fontSize: "13px", color: MUTED }}>{e.serviceCount}</td>
                      <td style={{ ...mono, padding: "14px", textAlign: "right", fontSize: "13px", color: MID }}>{fmtUsd(e.serviceSubtotal)}</td>
                      <td style={{ ...mono, padding: "14px", textAlign: "right", fontSize: "14px", fontWeight: 500, color: GREEN }}>{fmtUsd(e.commission)}</td>
                      <td style={{ ...mono, padding: "14px", textAlign: "right", fontSize: "13px", color: AMBER }}>{fmtUsd(e.tips)}</td>
                      <td style={{ ...mono, padding: "14px", textAlign: "right", fontSize: "15px", fontWeight: 600 }}>{fmtUsd(e.totalPayout)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr style={{ background: S1, borderTop: `2px solid ${BORDER2}` }}>
                  <td style={{ padding: "14px", fontSize: "13px", fontWeight: 700 }}>TOTAL</td>
                  <td style={{ ...mono, padding: "14px", textAlign: "right", fontSize: "13px", fontWeight: 700, color: MUTED }}>{period.totalServices}</td>
                  <td style={{ padding: "14px" }}></td>
                  <td style={{ ...mono, padding: "14px", textAlign: "right", fontSize: "14px", fontWeight: 700, color: GREEN }}>{fmtUsd(period.totalCommission)}</td>
                  <td style={{ ...mono, padding: "14px", textAlign: "right", fontSize: "13px", fontWeight: 700, color: AMBER }}>{fmtUsd(period.totalTips)}</td>
                  <td style={{ ...mono, padding: "14px", textAlign: "right", fontSize: "15px", fontWeight: 700 }}>{fmtUsd(period.totalCommission + period.totalTips)}</td>
                </tr></tfoot>
              </table>
            </div>
          </div>
        )}

        {period && entries.length === 0 && !loading && (
          <div style={{ background: S1, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "40px", textAlign: "center", color: MUTED, marginBottom: "20px" }}>No service data found for this period</div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <button onClick={() => setShowHistory(!showHistory)} style={{ ...mono, display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: ACC_B, fontSize: "12px", fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em", padding: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", transform: showHistory ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>expand_more</span>
              Previous Periods ({history.length})
            </button>
            {showHistory && (
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {history.map((hp: Period) => {
                  const s = new Date(hp.periodStart); const e = new Date(hp.periodEnd)
                  return (
                    <div key={hp.id} onClick={() => { const diff = Math.round((getPeriod(0).start.getTime() - s.getTime()) / (7 * 24 * 60 * 60 * 1000)); setOffset(diff) }} style={{ background: S1, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>{s.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" })} – {e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" })}</div>
                        <div style={{ ...mono, fontSize: "10px", color: MUTED }}>{hp.locationId}</div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ ...mono, fontSize: "9px", padding: "2px 7px", borderRadius: "4px", backgroundColor: hp.status === "paid" ? "rgba(16,185,129,0.1)" : ACC_DIM, border: `1px solid ${hp.status === "paid" ? "rgba(16,185,129,0.2)" : ACC_BDR}`, color: hp.status === "paid" ? GREEN : ACC_B, textTransform: "uppercase" }}>{hp.status}</span>
                        <span style={{ ...mono, fontSize: "13px", fontWeight: 500 }}>{fmtUsd(hp.totalCommission + hp.totalTips)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: "100px", right: "20px", background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(255,107,107,0.15)", border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(255,107,107,0.3)"}`, borderRadius: "10px", padding: "12px 20px", color: "#fff", fontSize: "13px", fontWeight: 500, zIndex: 999, backdropFilter: "blur(8px)", ...jakarta }}>{toast.message}</div>}

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" />
    </div>
  )
}
