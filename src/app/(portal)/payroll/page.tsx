"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useUserRole } from "@/hooks/useUserRole"
import { useRouter } from "next/navigation"

interface PayrollEntry {
  teamMemberId: string
  name: string
  location: string
  services: number
  subtotal: number
  commission: number
  tips: number
  totalPay: number
}

interface PaidInfo { paidAt: string; paidBy: string | null }

interface PeriodRecord {
  id: string
  startDate: string
  endDate: string
  markedPaidAt: string | null
  markedBy: { name: string | null } | null
  location: { name: string } | null
}

type LocationFilter = "All" | "Corpus Christi" | "San Antonio"
type SortKey = "name" | "services" | "subtotal" | "commission" | "tips" | "totalPay"

const mono: React.CSSProperties = { fontFamily: "'Fira Code', 'Courier New', monospace" }
const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** Compute Wed-Tue period N weeks back (0 = current) */
function getPeriod(weeksBack: number): { start: string; end: string; label: string } {
  const now = new Date()
  const cst = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }))
  const day = cst.getDay()
  const daysBack = day >= 3 ? day - 3 : day + 4
  const wed = new Date(cst)
  wed.setDate(cst.getDate() - daysBack - weeksBack * 7)
  const tue = new Date(wed)
  tue.setDate(wed.getDate() + 6)
  const f = (d: Date) => d.toISOString().slice(0, 10)
  const label = weeksBack === 0 ? "Current Period" : weeksBack === 1 ? "Last Period" : `${weeksBack} Periods Ago`
  return { start: f(wed), end: f(tue), label }
}

const PERIODS = [0, 1, 2, 3].map(getPeriod)

const ACC = "#606E74"
const ACC_BRIGHT = "#7a8f96"
const ACC_DIM = "rgba(96,110,116,0.08)"
const ACC_BORDER = "rgba(96,110,116,0.2)"
const BORDER = "rgba(255,255,255,0.07)"
const BORDER2 = "rgba(255,255,255,0.12)"
const S1 = "rgba(255,255,255,0.03)"
const MUTED = "rgba(255,255,255,0.3)"
const MID = "rgba(255,255,255,0.6)"
const GREEN = "#10B981"

export default function PayrollPage() {
  const { isOwner } = useUserRole()
  const router = useRouter()

  const [periodIdx, setPeriodIdx] = useState(0) // 0=current, 1=last, etc.
  const [isCustom, setIsCustom] = useState(false)
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [locFilter, setLocFilter] = useState<LocationFilter>("All")
  const [payroll, setPayroll] = useState<PayrollEntry[]>([])
  const [paidInfo, setPaidInfo] = useState<PaidInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("subtotal")
  const [sortAsc, setSortAsc] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [periods, setPeriods] = useState<PeriodRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const dates = useMemo(() => {
    if (isCustom) return { start: customStart, end: customEnd }
    return PERIODS[periodIdx] || PERIODS[0]
  }, [isCustom, customStart, customEnd, periodIdx])

  const fetchPayroll = useCallback(async () => {
    if (!dates.start || !dates.end) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/payroll?start=${dates.start}&end=${dates.end}`)
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load")
      const data = await res.json()
      setPayroll(data.payroll || [])
      setPaidInfo(data.paidInfo || null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [dates.start, dates.end])

  const fetchPeriods = useCallback(async () => {
    try {
      const res = await fetch("/api/payroll/periods")
      if (res.ok) {
        const data = await res.json()
        setPeriods(data.periods || [])
      }
    } catch { /* noop */ }
  }, [])

  useEffect(() => { fetchPayroll() }, [fetchPayroll])
  useEffect(() => { fetchPeriods() }, [fetchPeriods])

  const filtered = useMemo(() => {
    if (locFilter === "All") return payroll
    return payroll.filter(p => p.location === locFilter)
  }, [payroll, locFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [filtered, sortKey, sortAsc])

  const ccEntries = useMemo(() => sorted.filter(p => p.location === "Corpus Christi"), [sorted])
  const saEntries = useMemo(() => sorted.filter(p => p.location === "San Antonio"), [sorted])

  const totals = useMemo(() => {
    const t = { services: 0, subtotal: 0, commission: 0, tips: 0, totalPay: 0 }
    for (const p of filtered) {
      t.services += p.services; t.subtotal += p.subtotal; t.commission += p.commission
      t.tips += p.tips; t.totalPay += p.totalPay
    }
    return t
  }, [filtered])

  const stylistCount = filtered.filter(p => p.services > 0).length

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const handleMarkPaid = async () => {
    if (!dates.start || !dates.end) return
    setMarkingPaid(true)
    try {
      await fetch("/api/payroll/periods", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: dates.start, end: dates.end }),
      })
      await fetchPayroll()
      await fetchPeriods()
    } catch { /* noop */ }
    setMarkingPaid(false)
  }

  const handleExport = () => {
    const rows = [["Stylist", "Location", "Period Start", "Period End", "Services", "Subtotal", "Commission (40%)", "Tips", "Total Pay"]]
    for (const p of sorted) {
      rows.push([p.name, p.location, dates.start, dates.end, String(p.services), fmt(p.subtotal), fmt(p.commission), fmt(p.tips), fmt(p.totalPay)])
    }
    rows.push(["TOTAL", "", dates.start, dates.end, String(totals.services), fmt(totals.subtotal), fmt(totals.commission), fmt(totals.tips), fmt(totals.totalPay)])
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `payroll_${dates.start}_to_${dates.end}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const loadHistoryPeriod = (start: string, end: string) => {
    setIsCustom(true)
    setCustomStart(start.split("T")[0])
    setCustomEnd(end.split("T")[0])
    setShowHistory(false)
  }

  if (!isOwner) {
    router.push("/dashboard")
    return null
  }

  const inputStyle: React.CSSProperties = { padding: "8px 12px", fontSize: "16px", borderRadius: "8px", border: `1px solid ${BORDER2}`, backgroundColor: "rgba(255,255,255,0.06)", color: "#fff", outline: "none", ...jakarta }
  const cardStyle: React.CSSProperties = { backgroundColor: S1, borderRadius: "12px", border: `1px solid ${BORDER}`, padding: "16px 20px" }
  const thStyle = (key: SortKey, align: "left" | "right" = "right"): React.CSSProperties => ({
    padding: "10px 16px", textAlign: align, fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: sortKey === key ? ACC_BRIGHT : MUTED, whiteSpace: "nowrap",
    cursor: "pointer", userSelect: "none",
  })

  function LocationTable({ entries, title }: { entries: PayrollEntry[]; title: string }) {
    const loc = entries.reduce((a, p) => ({
      services: a.services + p.services, subtotal: a.subtotal + p.subtotal,
      commission: a.commission + p.commission, tips: a.tips + p.tips, totalPay: a.totalPay + p.totalPay,
    }), { services: 0, subtotal: 0, commission: 0, tips: 0, totalPay: 0 })
    if (entries.length === 0) return null
    return (
      <div style={{ ...cardStyle, marginBottom: "16px", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: ACC_BRIGHT }}>{title}</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                <th onClick={() => handleSort("name")} style={thStyle("name", "left")}>Stylist {sortKey === "name" ? (sortAsc ? "\u2191" : "\u2193") : ""}</th>
                <th onClick={() => handleSort("services")} style={thStyle("services")}>Services {sortKey === "services" ? (sortAsc ? "\u2191" : "\u2193") : ""}</th>
                <th onClick={() => handleSort("subtotal")} style={thStyle("subtotal")}>Subtotal {sortKey === "subtotal" ? (sortAsc ? "\u2191" : "\u2193") : ""}</th>
                <th onClick={() => handleSort("commission")} style={thStyle("commission")}>Commission {sortKey === "commission" ? (sortAsc ? "\u2191" : "\u2193") : ""}</th>
                <th onClick={() => handleSort("tips")} style={thStyle("tips")}>Tips {sortKey === "tips" ? (sortAsc ? "\u2191" : "\u2193") : ""}</th>
                <th onClick={() => handleSort("totalPay")} style={thStyle("totalPay")}>Total Pay {sortKey === "totalPay" ? (sortAsc ? "\u2191" : "\u2193") : ""}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(p => (
                <tr key={p.teamMemberId} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                  <td style={{ padding: "10px 16px", color: "#fff", fontWeight: 600, ...jakarta }}>{p.name}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", color: MID, ...mono }}>{p.services}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", color: MID, ...mono }}>{fmt(p.subtotal)}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", color: GREEN, fontWeight: 700, ...mono }}>{fmt(p.commission)}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", color: MID, ...mono }}>{fmt(p.tips)}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", color: "#fff", fontWeight: 700, ...mono }}>{fmt(p.totalPay)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${BORDER2}` }}>
                <td style={{ padding: "12px 16px", color: ACC_BRIGHT, fontWeight: 800, fontSize: "12px", ...jakarta }}>TOTAL</td>
                <td style={{ padding: "12px 16px", textAlign: "right", color: ACC_BRIGHT, fontWeight: 700, ...mono }}>{loc.services}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", color: ACC_BRIGHT, fontWeight: 700, ...mono }}>{fmt(loc.subtotal)}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", color: GREEN, fontWeight: 800, ...mono }}>{fmt(loc.commission)}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", color: ACC_BRIGHT, fontWeight: 700, ...mono }}>{fmt(loc.tips)}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", color: "#fff", fontWeight: 800, ...mono }}>{fmt(loc.totalPay)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...jakarta, padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Payroll</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
            <p style={{ fontSize: "12px", color: MUTED, margin: 0 }}>Wed-Tue pay period · Tuesday pay date · 40% commission · CST</p>
            {paidInfo && (
              <span style={{ ...mono, fontSize: "9px", padding: "3px 10px", borderRadius: "4px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: GREEN, textTransform: "uppercase" }}>
                Paid {new Date(paidInfo.paidAt).toLocaleDateString()}{paidInfo.paidBy ? ` by ${paidInfo.paidBy}` : ""}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {!loading && totals.services > 0 && (
            <>
              {!paidInfo && (
                <button onClick={handleMarkPaid} disabled={markingPaid} style={{ padding: "8px 16px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: `1px solid rgba(16,185,129,0.3)`, borderRadius: "8px", backgroundColor: "rgba(16,185,129,0.08)", color: GREEN, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", ...jakarta, opacity: markingPaid ? 0.6 : 1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
                  {markingPaid ? "Marking..." : "Mark as Paid"}
                </button>
              )}
              <button onClick={handleExport} style={{ padding: "8px 16px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: `1px solid ${BORDER2}`, borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.04)", color: ACC_BRIGHT, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", ...jakarta }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
                Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Period selector + location filter */}
      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
          {PERIODS.map((p, i) => (
            <button key={i} onClick={() => { setPeriodIdx(i); setIsCustom(false) }} style={{
              padding: "7px 14px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              border: !isCustom && periodIdx === i ? `1px solid ${ACC_BRIGHT}` : `1px solid ${BORDER2}`,
              borderRadius: "7px",
              backgroundColor: !isCustom && periodIdx === i ? ACC_DIM : "transparent",
              color: !isCustom && periodIdx === i ? ACC_BRIGHT : MUTED,
              cursor: "pointer", whiteSpace: "nowrap", ...mono,
            }}>
              {p.label}
              <span style={{ display: "block", fontSize: "8px", color: MUTED, fontWeight: 500, marginTop: "2px" }}>{fmtDate(p.start)} - {fmtDate(p.end)}</span>
            </button>
          ))}
          <button onClick={() => setIsCustom(true)} style={{
            padding: "7px 14px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            border: isCustom ? `1px solid ${ACC_BRIGHT}` : `1px solid ${BORDER2}`,
            borderRadius: "7px", backgroundColor: isCustom ? ACC_DIM : "transparent",
            color: isCustom ? ACC_BRIGHT : MUTED, cursor: "pointer", ...mono,
          }}>Custom</button>
        </div>

        {isCustom && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px", alignItems: "center" }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={inputStyle} />
            <span style={{ color: MUTED, fontSize: "12px" }}>to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={inputStyle} />
          </div>
        )}

        <div style={{ display: "flex", gap: "6px" }}>
          {(["All", "Corpus Christi", "San Antonio"] as LocationFilter[]).map(loc => (
            <button key={loc} onClick={() => setLocFilter(loc)} style={{
              padding: "6px 12px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              border: locFilter === loc ? `1px solid ${ACC_BRIGHT}` : `1px solid ${BORDER2}`,
              borderRadius: "6px", backgroundColor: locFilter === loc ? ACC_DIM : "transparent",
              color: locFilter === loc ? ACC_BRIGHT : MUTED, cursor: "pointer", ...mono,
            }}>{loc === "Corpus Christi" ? "CC" : loc === "San Antonio" ? "SA" : loc}</button>
          ))}
        </div>

        {dates.start && dates.end && (
          <div style={{ marginTop: "10px", ...mono, fontSize: "11px", color: MUTED }}>
            {dates.start} to {dates.end}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ width: "32px", height: "32px", border: `3px solid ${BORDER}`, borderTop: `3px solid ${ACC_BRIGHT}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ fontSize: "12px", color: MUTED }}>Loading payroll data...</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ ...cardStyle, textAlign: "center", padding: "40px", color: "#ff6b6b" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "32px", marginBottom: "8px", display: "block" }}>error</span>
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && payroll.length > 0 && totals.services === 0 && (
        <div style={{ ...cardStyle, textAlign: "center", padding: "40px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "40px", color: MUTED, marginBottom: "8px", display: "block" }}>inbox</span>
          <div style={{ fontSize: "13px", color: MUTED }}>No services found for this period</div>
        </div>
      )}

      {/* Data */}
      {!loading && !error && totals.services > 0 && (
        <>
          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "20px" }}>
            {[
              { label: "Total Services", value: String(totals.services), color: "#fff" },
              { label: "Total Subtotal", value: fmt(totals.subtotal), color: "#fff" },
              { label: "Total Commissions", value: fmt(totals.commission), color: GREEN },
              { label: "Total Tips", value: fmt(totals.tips), color: "#fff" },
              { label: "Total Payout", value: fmt(totals.totalPay), color: GREEN },
              { label: "Avg per Stylist", value: stylistCount > 0 ? fmt(totals.totalPay / stylistCount) : "$0.00", color: ACC_BRIGHT },
            ].map(s => (
              <div key={s.label} style={cardStyle}>
                <div style={{ ...mono, fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, marginBottom: "6px" }}>{s.label}</div>
                <div style={{ ...mono, fontSize: "22px", fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Tables */}
          {(locFilter === "All" || locFilter === "Corpus Christi") && <LocationTable entries={ccEntries} title="Corpus Christi" />}
          {(locFilter === "All" || locFilter === "San Antonio") && <LocationTable entries={saEntries} title="San Antonio" />}

          {/* Grand total bar */}
          {locFilter === "All" && (
            <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: `linear-gradient(135deg, ${S1} 0%, rgba(16,185,129,0.06) 100%)`, border: `1px solid rgba(16,185,129,0.15)` }}>
              <div>
                <div style={{ ...mono, fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED }}>Grand Total</div>
                <div style={{ fontSize: "12px", color: MID, marginTop: "2px" }}>{totals.services} services across {stylistCount} stylists</div>
              </div>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {[
                  { label: "Subtotal", value: fmt(totals.subtotal), color: "#fff" },
                  { label: "Commission", value: fmt(totals.commission), color: GREEN },
                  { label: "Tips", value: fmt(totals.tips), color: "#fff" },
                  { label: "Total Pay", value: fmt(totals.totalPay), color: ACC_BRIGHT },
                ].map(t => (
                  <div key={t.label} style={{ textAlign: "right" }}>
                    <div style={{ ...mono, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>{t.label}</div>
                    <div style={{ ...mono, fontSize: "18px", fontWeight: 800, color: t.color }}>{t.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Period History */}
      {periods.length > 0 && (
        <div style={{ marginTop: "28px" }}>
          <button onClick={() => setShowHistory(!showHistory)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: ACC_BRIGHT, fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: 0, ...mono }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", transform: showHistory ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>expand_more</span>
            Period History ({periods.length})
          </button>
          {showHistory && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {periods.map(p => {
                const s = p.startDate.split("T")[0]
                const e = p.endDate.split("T")[0]
                return (
                  <div key={p.id} onClick={() => loadHistoryPeriod(s, e)} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "12px 16px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{fmtDate(s)} - {fmtDate(e)}</div>
                      <div style={{ ...mono, fontSize: "10px", color: MUTED }}>{s} to {e}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {p.markedPaidAt && (
                        <>
                          <div style={{ ...mono, fontSize: "9px", color: GREEN, textTransform: "uppercase" }}>Paid {new Date(p.markedPaidAt).toLocaleDateString()}</div>
                          {p.markedBy?.name && <div style={{ fontSize: "10px", color: MUTED }}>by {p.markedBy.name}</div>}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
