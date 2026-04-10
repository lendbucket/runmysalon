"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useUserRole } from "@/hooks/useUserRole"
import { TEAM_NAMES, CC_STYLISTS, SA_STYLISTS } from "@/lib/staff"

const ACC = "#606E74", ACC_B = "#7a8f96", ACC_DIM = "rgba(96,110,116,0.08)", ACC_BDR = "rgba(96,110,116,0.2)"
const BORDER = "rgba(255,255,255,0.07)", BORDER2 = "rgba(255,255,255,0.12)", S1 = "rgba(255,255,255,0.03)", S2 = "rgba(255,255,255,0.05)"
const MUTED = "rgba(255,255,255,0.3)", MID = "rgba(255,255,255,0.6)", GREEN = "#10B981", AMBER = "#ffb347", RED = "#ff6b6b", BLUE = "#4da6ff"
const mono: React.CSSProperties = { fontFamily: "'Fira Code', monospace" }
const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

interface Svc { serviceName: string; price: number; durationMinutes: number }
interface Appt {
  id: string; customerId?: string | null; customerName: string; customerPhone: string; customerEmail?: string
  startTime: string; endTime?: string | null; teamMemberId: string | null; status: string
  services?: Svc[]; totalPrice?: number; totalDurationMinutes?: number; note?: string | null
  isCheckedOut?: boolean; orderId?: string
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  ACCEPTED: { label: "Confirmed", color: BLUE, bg: "rgba(77,166,255,0.08)" },
  PENDING: { label: "Pending", color: AMBER, bg: "rgba(255,179,71,0.08)" },
  CANCELLED_BY_CUSTOMER: { label: "Cancelled", color: RED, bg: "rgba(255,107,107,0.08)" },
  CANCELLED_BY_SELLER: { label: "Cancelled", color: RED, bg: "rgba(255,107,107,0.08)" },
  NO_SHOW: { label: "No Show", color: AMBER, bg: "rgba(255,179,71,0.08)" },
}
const getStatus = (a: Appt) => {
  if (a.isCheckedOut) return { label: "Checked Out", color: GREEN, bg: "rgba(16,185,129,0.08)" }
  const now = Date.now(); const st = new Date(a.startTime).getTime(); const dur = (a.totalDurationMinutes || 60) * 60000
  if (a.status === "ACCEPTED" && now >= st && now <= st + dur) return { label: "In Progress", color: GREEN, bg: "rgba(16,185,129,0.12)" }
  return STATUS[a.status] || { label: a.status, color: ACC, bg: ACC_DIM }
}

function fmtTime(d: string) { return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }) }
function fmtUsd(n: number) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function AppointmentsPage() {
  const { isOwner, isManager, locationName } = useUserRole()
  const [date, setDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` })
  const [loc, setLoc] = useState(locationName || "Corpus Christi")
  const [appts, setAppts] = useState<Appt[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Appt | null>(null)
  const [stylistF, setStylistF] = useState("all")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  const stylists = useMemo(() => loc === "San Antonio" ? SA_STYLISTS : CC_STYLISTS, [loc])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ date, all: "true" })
      if (isOwner && loc) p.set("location", loc)
      const r = await fetch(`/api/pos/appointments?${p}`)
      const d = await r.json()
      setAppts(d.appointments || [])
      setLastUpdated(new Date())
    } catch { /* */ }
    setLoading(false)
  }, [date, loc, isOwner])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const id = setInterval(fetchData, 60000); return () => clearInterval(id) }, [fetchData])

  const filtered = useMemo(() => {
    let list = appts
    if (stylistF !== "all") list = list.filter(a => a.teamMemberId === stylistF)
    return list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }, [appts, stylistF])

  const stats = useMemo(() => {
    const total = appts.length
    const checkedOut = appts.filter(a => a.isCheckedOut).length
    const cancelled = appts.filter(a => a.status.includes("CANCELLED")).length
    const noShow = appts.filter(a => a.status === "NO_SHOW").length
    const revenue = appts.filter(a => a.isCheckedOut).reduce((s, a) => s + (a.totalPrice || 0), 0)
    return { total, checkedOut, remaining: total - checkedOut - cancelled - noShow, cancelled, noShow, revenue }
  }, [appts])

  function changeDate(offset: number) {
    const d = new Date(date + "T12:00:00"); d.setDate(d.getDate() + offset)
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)
    setSelected(null)
  }

  function printReceipt(a: Appt) {
    if (!a.isCheckedOut) return
    const locName = loc === "San Antonio" ? "Salon Envy San Antonio" : "Salon Envy Corpus Christi"
    const addr = loc === "San Antonio" ? "10003 NW Military Hwy, San Antonio, TX 78231" : "5601 S Padre Island Dr, Corpus Christi, TX 78412"
    const stylist = a.teamMemberId ? TEAM_NAMES[a.teamMemberId] || "Stylist" : "Stylist"
    const services = (a.services || []).map(s => `<tr><td style="padding:4px 0">${s.serviceName}</td><td style="text-align:right;padding:4px 0">$${s.price.toFixed(2)}</td></tr>`).join("")
    const subtotal = (a.services || []).reduce((s, sv) => s + sv.price, 0)
    const tax = subtotal * 0.0825
    const tip = (a.totalPrice || 0) - subtotal - tax
    const w = window.open("", "_blank"); if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title><style>body{font-family:monospace;max-width:320px;margin:20px auto;color:#111;font-size:13px}h2{text-align:center;margin:0}p.addr{text-align:center;font-size:11px;color:#666;margin:4px 0 16px}.line{border-top:1px dashed #ccc;margin:8px 0}table{width:100%}.r{text-align:right}.b{font-weight:700}.footer{text-align:center;font-size:11px;color:#666;margin-top:16px}</style></head><body><h2>SALON ENVY</h2><p class="addr">${addr}</p><div class="line"></div><table><tr><td>Date</td><td class="r">${new Date(a.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" })}</td></tr><tr><td>Time</td><td class="r">${fmtTime(a.startTime)}</td></tr><tr><td>Stylist</td><td class="r">${stylist}</td></tr><tr><td>Client</td><td class="r">${a.customerName}</td></tr></table><div class="line"></div><table>${services}</table><div class="line"></div><table><tr><td>Subtotal</td><td class="r">$${subtotal.toFixed(2)}</td></tr><tr><td>Tax (8.25%)</td><td class="r">$${tax.toFixed(2)}</td></tr>${tip > 0 ? `<tr><td>Tip</td><td class="r">$${tip.toFixed(2)}</td></tr>` : ""}<tr class="b"><td>TOTAL</td><td class="r">$${(a.totalPrice || 0).toFixed(2)}</td></tr></table><div class="line"></div><p class="footer">Thank you for visiting<br>Salon Envy!</p><script>window.onload=()=>window.print()</script></body></html>`)
    w.document.close()
  }

  const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Chicago" })
  const isToday = date === (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` })()
  const Sk = ({ h = "48px" }: { h?: string }) => <div style={{ height: h, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />

  return (
    <div style={{ ...jakarta, minHeight: "100%", backgroundColor: "#06080d", color: "#fff", padding: "24px", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <style>{`@media(max-width:767px){.appt-main{flex-direction:column !important}.appt-detail{position:fixed !important;bottom:0 !important;left:0 !important;right:0 !important;top:auto !important;max-height:70vh !important;border-radius:16px 16px 0 0 !important;z-index:100 !important}} @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}} @keyframes live{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 500, margin: "0 0 2px" }}>Appointments</h1>
            <span style={{ fontSize: "11px", color: MUTED }}>Kasse Scheduling</span>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            {isOwner && ["Corpus Christi", "San Antonio"].map(l => <button key={l} onClick={() => { setLoc(l); setSelected(null) }} style={{ padding: "5px 12px", fontSize: "11px", fontWeight: 600, border: loc === l ? `1px solid ${ACC_B}` : `1px solid ${BORDER2}`, borderRadius: "6px", backgroundColor: loc === l ? ACC_DIM : "transparent", color: loc === l ? ACC_B : MUTED, cursor: "pointer", ...jakarta }}>{l === "Corpus Christi" ? "CC" : "SA"}</button>)}
            <select value={stylistF} onChange={e => setStylistF(e.target.value)} style={{ padding: "5px 10px", fontSize: "11px", backgroundColor: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER2}`, borderRadius: "6px", color: "#fff", outline: "none", ...jakarta }}>
              <option value="all">All Stylists</option>
              {stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Date nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
          <button onClick={() => changeDate(-1)} style={{ width: "32px", height: "32px", borderRadius: "6px", background: S1, border: `1px solid ${BORDER2}`, color: MID, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&#8592;</button>
          {!isToday && <button onClick={() => { setDate((() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` })()); setSelected(null) }} style={{ ...mono, padding: "5px 10px", fontSize: "10px", border: `1px solid ${ACC_BDR}`, borderRadius: "6px", background: ACC_DIM, color: ACC_B, cursor: "pointer" }}>Today</button>}
          <span style={{ ...mono, fontSize: "14px", fontWeight: 500 }}>{dateLabel}{isToday && <span style={{ fontSize: "10px", color: GREEN, marginLeft: "6px" }}>Today</span>}</span>
          <button onClick={() => changeDate(1)} style={{ width: "32px", height: "32px", borderRadius: "6px", background: S1, border: `1px solid ${BORDER2}`, color: MID, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&#8594;</button>
          {lastUpdated && <span style={{ ...mono, fontSize: "9px", color: MUTED, marginLeft: "auto" }}>Updated {Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago</span>}
        </div>

        {/* Quick stats */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", overflowX: "auto" }}>
          {[
            { label: "Total", val: String(stats.total), color: "#fff" },
            { label: "Checked Out", val: String(stats.checkedOut), color: GREEN },
            { label: "Remaining", val: String(stats.remaining), color: BLUE },
            { label: "Cancelled", val: String(stats.cancelled), color: RED },
            { label: "Revenue", val: fmtUsd(stats.revenue), color: GREEN },
          ].map(s => (
            <div key={s.label} style={{ ...mono, padding: "6px 12px", borderRadius: "6px", backgroundColor: S1, border: `1px solid ${BORDER}`, fontSize: "11px", whiteSpace: "nowrap" }}>
              <span style={{ color: MUTED, marginRight: "6px" }}>{s.label}</span><span style={{ color: s.color, fontWeight: 600 }}>{s.val}</span>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="appt-main" style={{ display: "flex", gap: "16px" }}>
          {/* List */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? Array.from({ length: 6 }, (_, i) => <div key={i} style={{ ...S1 ? { backgroundColor: S1 } : {}, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px", marginBottom: "6px" }}><Sk /></div>) : filtered.length === 0 ? (
              <div style={{ backgroundColor: S1, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "48px", textAlign: "center", color: MUTED }}>No appointments for {dateLabel}</div>
            ) : filtered.map(a => {
              const st = getStatus(a)
              const stylist = a.teamMemberId ? TEAM_NAMES[a.teamMemberId] || "—" : "—"
              const isActive = selected?.id === a.id
              return (
                <div key={a.id} onClick={() => setSelected(isActive ? null : a)} style={{ backgroundColor: isActive ? S2 : S1, border: `1px solid ${isActive ? ACC_BDR : BORDER}`, borderLeft: `3px solid ${st.color}`, borderRadius: "0 10px 10px 0", padding: "12px 16px", marginBottom: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "14px", transition: "all 0.15s", flexWrap: "wrap" }}>
                  {/* Time */}
                  <div style={{ width: "60px", flexShrink: 0 }}>
                    <div style={{ ...mono, fontSize: "13px", fontWeight: 500 }}>{fmtTime(a.startTime)}</div>
                    <div style={{ ...mono, fontSize: "9px", color: MUTED }}>{a.totalDurationMinutes || 60}min</div>
                  </div>
                  {/* Client + services */}
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>{a.customerName}</div>
                    <div style={{ fontSize: "11px", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(a.services || []).map(s => s.serviceName).join(", ") || "Service"}</div>
                  </div>
                  {/* Stylist */}
                  <div style={{ fontSize: "12px", color: MID, minWidth: "70px" }}>{stylist}</div>
                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {st.label === "In Progress" && <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: GREEN, animation: "live 2s ease-in-out infinite" }} />}
                    <span style={{ ...mono, fontSize: "9px", padding: "3px 8px", borderRadius: "4px", backgroundColor: st.bg, color: st.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{st.label}</span>
                  </div>
                  {/* Amount */}
                  {a.isCheckedOut && <span style={{ ...mono, fontSize: "12px", color: GREEN, fontWeight: 500, minWidth: "60px", textAlign: "right" }}>{fmtUsd(a.totalPrice || 0)}</span>}
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="appt-detail" style={{ width: "360px", flexShrink: 0, backgroundColor: "#0d1117", border: `1px solid ${BORDER2}`, borderRadius: "12px", padding: "20px", alignSelf: "flex-start", position: "sticky", top: "70px", maxHeight: "calc(100vh - 90px)", overflowY: "auto" }}>
              {/* Close */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "15px", fontWeight: 600 }}>{selected.customerName}</span>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: "18px" }}>&times;</button>
              </div>

              {/* Contact */}
              {(selected.customerPhone || selected.customerEmail) && (
                <div style={{ marginBottom: "14px" }}>
                  {selected.customerPhone && <div style={{ ...mono, fontSize: "12px", color: MID }}>{selected.customerPhone}</div>}
                  {selected.customerEmail && <div style={{ ...mono, fontSize: "11px", color: MUTED }}>{selected.customerEmail}</div>}
                </div>
              )}

              {/* Time + stylist */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                <span style={{ ...mono, fontSize: "11px", padding: "3px 8px", borderRadius: "4px", backgroundColor: S1, border: `1px solid ${BORDER}`, color: MID }}>{fmtTime(selected.startTime)} · {selected.totalDurationMinutes || 60}min</span>
                <span style={{ ...mono, fontSize: "11px", padding: "3px 8px", borderRadius: "4px", backgroundColor: S1, border: `1px solid ${BORDER}`, color: MID }}>{selected.teamMemberId ? TEAM_NAMES[selected.teamMemberId] || "Stylist" : "Stylist"}</span>
              </div>

              {/* Status badge */}
              {(() => { const st = getStatus(selected); return (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                  {st.label === "In Progress" && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: GREEN, animation: "live 2s ease-in-out infinite" }} />}
                  <span style={{ ...mono, fontSize: "10px", padding: "4px 10px", borderRadius: "4px", backgroundColor: st.bg, color: st.color, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{st.label}</span>
                </div>
              ) })()}

              {/* Services */}
              {(selected.services || []).length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ ...mono, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, marginBottom: "8px" }}>Services</div>
                  {(selected.services || []).map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ fontSize: "13px", color: MID }}>{s.serviceName}</span>
                      <span style={{ ...mono, fontSize: "12px", color: "#fff" }}>{fmtUsd(s.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkout details */}
              {selected.isCheckedOut && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ ...mono, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: GREEN, marginBottom: "8px" }}>Payment</div>
                  <div style={{ backgroundColor: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span style={{ fontSize: "12px", color: MID }}>Total</span><span style={{ ...mono, fontSize: "16px", fontWeight: 700, color: GREEN }}>{fmtUsd(selected.totalPrice || 0)}</span></div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                    <button onClick={() => printReceipt(selected)} style={{ flex: 1, padding: "8px", border: `1px solid ${BORDER2}`, borderRadius: "6px", background: "none", color: MID, fontSize: "11px", fontWeight: 600, cursor: "pointer", ...jakarta }}>Print Receipt</button>
                  </div>
                </div>
              )}

              {/* Note */}
              {selected.note && (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ ...mono, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, marginBottom: "6px" }}>Note</div>
                  <div style={{ fontSize: "12px", color: MID, lineHeight: 1.5 }}>{selected.note}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
