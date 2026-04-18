"use client"
import { useState, useEffect, useCallback } from "react"
import { useUserRole } from "@/hooks/useUserRole"

const BG = "#06080d"
const CARD = "#0d1117"
const BORDER = "rgba(255,255,255,0.06)"
const CARD_SHADOW = "inset 0 1px 0 rgba(255,255,255,0.02), 0 0 0 1px rgba(0,0,0,0.25)"
const ACC = "#606E74"
const ACC_B = "#7a8f96"
const MUTED = "rgba(255,255,255,0.3)"
const MID = "rgba(255,255,255,0.6)"
const GREEN = "#22c55e"
const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }
const mono: React.CSSProperties = { fontFamily: "'Fira Code', monospace" }

const FEATURE_GROUPS = [
  {
    label: "Salon Operations",
    features: ["dashboard", "appointments", "inventory", "reviews", "alerts"],
  },
  {
    label: "Staff & HR",
    features: ["staff", "conduct", "complaints", "onboarding", "performance"],
  },
  {
    label: "Finance",
    features: ["payroll", "financials", "reports"],
  },
  {
    label: "Analytics & Tools",
    features: ["metrics", "social", "settings", "api_keys"],
  },
]

interface FeatureDef {
  key: string
  label: string
  actions: string[]
}

type PermMatrix = Record<string, Record<string, Record<string, boolean>>>

export default function PermissionsPage() {
  const { isOwner } = useUserRole()
  const [activeRole, setActiveRole] = useState<"OWNER" | "MANAGER" | "STYLIST">("MANAGER")
  const [matrix, setMatrix] = useState<PermMatrix>({})
  const [features, setFeatures] = useState<FeatureDef[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [staffSearch, setStaffSearch] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [staffList, setStaffList] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)

  const loadMatrix = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/permissions/matrix")
      if (res.ok) {
        const data = await res.json()
        setMatrix(data.matrix || {})
        setFeatures(data.features || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadMatrix() }, [loadMatrix])

  useEffect(() => {
    fetch("/api/staff/list").then(r => r.json()).then(d => setStaffList(d.staff || [])).catch(() => {})
  }, [])

  const togglePermission = async (feature: string, action: string, currentValue: boolean) => {
    if (activeRole === "OWNER") return
    const key = `${feature}:${action}`
    setSaving(key)
    try {
      const body: Record<string, unknown> = { role: activeRole, feature, action, granted: !currentValue }
      if (selectedStaff) body.staffMemberId = selectedStaff
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setMatrix(prev => {
          const next = { ...prev }
          if (!next[activeRole]) next[activeRole] = {}
          if (!next[activeRole][feature]) next[activeRole][feature] = {}
          next[activeRole][feature] = { ...next[activeRole][feature], [action]: !currentValue }
          return next
        })
        setSaved(key)
        setTimeout(() => setSaved(null), 2000)
      }
    } catch { /* ignore */ }
    setSaving(null)
  }

  const getPermValue = (role: string, feature: string, action: string): boolean => {
    return matrix[role]?.[feature]?.[action] ?? false
  }

  const featureMap: Record<string, FeatureDef> = {}
  for (const f of features) featureMap[f.key] = f

  const filteredStaff = staffList.filter(s =>
    !staffSearch || s.fullName?.toLowerCase().includes(staffSearch.toLowerCase())
  )

  if (!isOwner) {
    return (
      <div style={{ ...jakarta, padding: "60px 24px", textAlign: "center", color: MUTED, backgroundColor: BG, minHeight: "100%" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "48px", color: ACC, marginBottom: "12px", display: "block" }}>lock</span>
        <div style={{ fontSize: "16px", fontWeight: 700, color: MID }}>Owner Access Only</div>
        <div style={{ fontSize: "13px", marginTop: "6px" }}>Permission management is restricted to salon owners.</div>
      </div>
    )
  }

  return (
    <div style={{ ...jakarta, minHeight: "100%", backgroundColor: BG, color: "#fff", padding: "24px", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}`}</style>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: 500, margin: "0 0 4px" }}>Permissions</h1>
          <p style={{ ...mono, fontSize: "11px", color: MUTED, margin: 0 }}>Control what each role can access in the portal</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "20px" }}>
          {/* Left panel — Role selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Role tabs */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden", boxShadow: CARD_SHADOW }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ ...mono, fontSize: "9px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em" }}>Roles</span>
              </div>
              {(["OWNER", "MANAGER", "STYLIST"] as const).map(role => (
                <button key={role} onClick={() => { setActiveRole(role); setSelectedStaff(null) }} style={{
                  display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "12px 16px",
                  backgroundColor: activeRole === role && !selectedStaff ? "rgba(255,255,255,0.04)" : "transparent",
                  borderLeft: activeRole === role && !selectedStaff ? `2px solid ${ACC_B}` : "2px solid transparent",
                  border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", color: activeRole === role && !selectedStaff ? "#fff" : MID,
                  fontSize: "12px", fontWeight: 600, textAlign: "left",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: ACC }}>
                    {role === "OWNER" ? "shield" : role === "MANAGER" ? "supervisor_account" : "person"}
                  </span>
                  {role}
                  {role === "OWNER" && <span style={{ ...mono, fontSize: "8px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(34,197,94,0.1)", color: GREEN, marginLeft: "auto" }}>ALL</span>}
                </button>
              ))}
            </div>

            {/* Individual overrides */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden", boxShadow: CARD_SHADOW }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ ...mono, fontSize: "9px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em" }}>Individual Overrides</span>
              </div>
              <div style={{ padding: "8px" }}>
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={staffSearch}
                  onChange={e => setStaffSearch(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: "6px", color: "#fff", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {filteredStaff.map(s => (
                  <button key={s.id} onClick={() => { setSelectedStaff(s.id); setActiveRole(s.role || "STYLIST") }} style={{
                    display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 16px",
                    backgroundColor: selectedStaff === s.id ? "rgba(255,255,255,0.04)" : "transparent",
                    border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", color: selectedStaff === s.id ? "#fff" : MID,
                    fontSize: "11px", textAlign: "left",
                  }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: ACC, flexShrink: 0 }}>
                      {s.fullName?.[0] || "?"}
                    </div>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.fullName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel — Permission matrix */}
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden", boxShadow: CARD_SHADOW }}>
            {/* Matrix header */}
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  {selectedStaff ? filteredStaff.find(s => s.id === selectedStaff)?.fullName : activeRole} Permissions
                </span>
                {activeRole === "OWNER" && !selectedStaff && (
                  <span style={{ ...mono, fontSize: "10px", color: MUTED, display: "block", marginTop: "2px" }}>Owner permissions cannot be modified</span>
                )}
              </div>
              {saved && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: GREEN, fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check_circle</span>
                  Saved
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                {[1,2,3,4].map(i => <div key={i} style={{ height: "40px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "6px", marginBottom: "8px", animation: "pulse 1.5s infinite" }} />)}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                {FEATURE_GROUPS.map(group => (
                  <div key={group.label}>
                    <div style={{ padding: "10px 20px", backgroundColor: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}` }}>
                      <span style={{ ...mono, fontSize: "9px", fontWeight: 700, color: ACC_B, textTransform: "uppercase", letterSpacing: "0.12em" }}>{group.label}</span>
                    </div>
                    {group.features.map(fKey => {
                      const feat = featureMap[fKey]
                      if (!feat) return null
                      return (
                        <div key={fKey} style={{ display: "flex", alignItems: "center", padding: "10px 20px", borderBottom: `1px solid ${BORDER}`, gap: "12px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 500, color: MID, minWidth: "120px" }}>{feat.label}</span>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
                            {feat.actions.map(action => {
                              const val = getPermValue(activeRole, fKey, action)
                              const isToggling = saving === `${fKey}:${action}`
                              const isDisabled = activeRole === "OWNER" && !selectedStaff
                              return (
                                <button
                                  key={action}
                                  onClick={() => !isDisabled && togglePermission(fKey, action, val)}
                                  disabled={isDisabled || isToggling}
                                  style={{
                                    display: "flex", alignItems: "center", gap: "6px",
                                    padding: "4px 10px", borderRadius: "6px", border: "none", cursor: isDisabled ? "default" : "pointer",
                                    backgroundColor: val ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                                    opacity: isDisabled ? 0.4 : isToggling ? 0.6 : 1,
                                    transition: "all 0.15s",
                                  }}
                                >
                                  <div style={{
                                    width: "28px", height: "16px", borderRadius: "8px",
                                    backgroundColor: val ? GREEN : "rgba(255,255,255,0.15)",
                                    position: "relative", transition: "background-color 0.2s ease",
                                  }}>
                                    <div style={{
                                      width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#fff",
                                      position: "absolute", top: "2px",
                                      left: val ? "14px" : "2px",
                                      transition: "left 0.2s ease",
                                    }} />
                                  </div>
                                  <span style={{ ...mono, fontSize: "9px", color: val ? GREEN : MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{action.replace("_", " ")}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
