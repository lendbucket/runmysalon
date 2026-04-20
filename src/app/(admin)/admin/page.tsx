"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface TenantRow {
  id: string
  name: string
  slug: string
  brandName: string
  ownerName: string
  ownerEmail: string
  posProvider: string
  planType: string
  subscriptionStatus: string
  isActive: boolean
  isSuspended: boolean
  staffCount: number
  locationCount: number
  createdAt: string
  logoUrl: string | null
}

interface Stats {
  total: number
  active: number
  trial: number
  mrr: number
}

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", label: "Active" },
  trial: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Trial" },
  past_due: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Past Due" },
  cancelled: { bg: "rgba(148,163,184,0.12)", color: "#94A3B8", label: "Cancelled" },
}

const POS_BADGE: Record<string, string> = {
  kasse: "#CDC9C0",
  square: "#3693F5",
  glossgenius: "#E91E63",
  meevo: "#FF9800",
}

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, trial: 0, mrr: 0 })
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: "", ownerName: "", ownerEmail: "", posProvider: "kasse" })
  const [creating, setCreating] = useState(false)

  const userEmail = session?.user?.email
  const userRole = (session?.user as any)?.role
  const superAdminEmail = "ceo@36west.org"
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "OWNER" || userEmail === superAdminEmail

  useEffect(() => {
    if (!isAdmin) return
    fetch("/api/admin/tenants")
      .then(r => r.json())
      .then(d => {
        setTenants(d.tenants || [])
        setStats(d.stats || { total: 0, active: 0, trial: 0, mrr: 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAdmin])

  const handleCreate = async () => {
    if (!createForm.name) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        const d = await res.json()
        setTenants(prev => [d.tenant, ...prev])
        setStats(prev => ({ ...prev, total: prev.total + 1, trial: prev.trial + 1 }))
        setShowCreate(false)
        setCreateForm({ name: "", ownerName: "", ownerEmail: "", posProvider: "kasse" })
      }
    } catch {}
    setCreating(false)
  }

  const handleSuspend = async (id: string, suspend: boolean) => {
    await fetch(`/api/admin/tenants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSuspended: suspend }),
    })
    setTenants(prev => prev.map(t => t.id === id ? { ...t, isSuspended: suspend } : t))
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", backgroundColor: "#06080d", minHeight: "100vh", color: "#94A3B8" }}>
        <p>Access denied. Super admin only.</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: "#06080d", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Fira+Code:wght@400;500;600;700&display=swap" />

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#CDC9C0" }}>admin_panel_settings</span>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>RunMySalon Admin</h1>
          </div>
          <p style={{ fontSize: "12px", color: "#94A3B8", margin: "4px 0 0" }}>Manage all tenants and subscriptions</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding: "10px 24px", backgroundColor: "#CDC9C0", color: "#06080d", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
          Add Tenant
        </button>
      </header>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px 32px" }}>
        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Total Tenants", value: stats.total, icon: "apartment" },
            { label: "Active Subscriptions", value: stats.active, icon: "check_circle" },
            { label: "Trial Accounts", value: stats.trial, icon: "hourglass_top" },
            { label: "MRR", value: `$${stats.mrr.toLocaleString()}`, icon: "payments" },
          ].map(m => (
            <div key={m.label} style={{ backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#CDC9C0", letterSpacing: "0.12em", textTransform: "uppercase" }}>{m.label}</span>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "rgba(205,201,192,0.25)" }}>{m.icon}</span>
              </div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#FFFFFF", fontFamily: "'Fira Code', monospace" }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Tenants Table */}
        <div style={{ backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>All Tenants</h2>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>{tenants.length} total</span>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading tenants...</div>
          ) : tenants.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "rgba(205,201,192,0.15)", display: "block", marginBottom: "12px" }}>apartment</span>
              <p style={{ color: "#94A3B8", margin: 0 }}>No tenants yet</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["Salon", "Owner", "POS", "Plan", "Status", "Locations", "Staff", "MRR", "Joined", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", fontSize: "9px", fontWeight: 700, color: "rgba(205,201,192,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => {
                    const sb = STATUS_BADGE[t.subscriptionStatus] || STATUS_BADGE.cancelled
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(205,201,192,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#CDC9C0" }}>
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>{t.name}</div>
                              <div style={{ fontSize: "11px", color: "#606E74" }}>{t.slug}.runmysalon.com</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: "13px", color: "#CDC9C0" }}>{t.ownerName}</div>
                          <div style={{ fontSize: "11px", color: "#606E74" }}>{t.ownerEmail}</div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", backgroundColor: `${POS_BADGE[t.posProvider] || "#94A3B8"}20`, color: POS_BADGE[t.posProvider] || "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                            {t.posProvider}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#94A3B8", textTransform: "capitalize" }}>{t.planType}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "4px", backgroundColor: sb.bg, color: sb.color, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                            {sb.label}
                          </span>
                          {t.isSuspended && <span style={{ fontSize: "9px", color: "#ef4444", marginLeft: "6px" }}>SUSPENDED</span>}
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "#94A3B8", fontFamily: "'Fira Code', monospace" }}>{t.locationCount}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "#94A3B8", fontFamily: "'Fira Code', monospace" }}>{t.staffCount}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "#FFFFFF", fontFamily: "'Fira Code', monospace", fontWeight: 600 }}>
                          {t.subscriptionStatus === "active" ? "$99" : "$0"}
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "11px", color: "#606E74" }}>
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => router.push(`/admin?impersonate=${t.id}`)} style={{ padding: "4px 10px", backgroundColor: "transparent", border: "1px solid rgba(205,201,192,0.2)", borderRadius: "5px", color: "#7a8f96", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>View</button>
                            <button onClick={() => handleSuspend(t.id, !t.isSuspended)} style={{ padding: "4px 10px", backgroundColor: "transparent", border: `1px solid ${t.isSuspended ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: "5px", color: t.isSuspended ? "#22c55e" : "#ef4444", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>
                              {t.isSuspended ? "Restore" : "Suspend"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreate && (
        <>
          <div onClick={() => setShowCreate(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 100 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", maxWidth: "480px", backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "32px", zIndex: 101 }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 24px" }}>Add Tenant</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#CDC9C0", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Salon Name *</label>
                <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} style={{ width: "100%", padding: "12px 14px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#CDC9C0", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Owner Name</label>
                <input value={createForm.ownerName} onChange={e => setCreateForm(f => ({ ...f, ownerName: e.target.value }))} style={{ width: "100%", padding: "12px 14px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#CDC9C0", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Owner Email</label>
                <input type="email" value={createForm.ownerEmail} onChange={e => setCreateForm(f => ({ ...f, ownerEmail: e.target.value }))} style={{ width: "100%", padding: "12px 14px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#CDC9C0", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>POS Provider</label>
                <select value={createForm.posProvider} onChange={e => setCreateForm(f => ({ ...f, posProvider: e.target.value }))} style={{ width: "100%", padding: "12px 14px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}>
                  <option value="kasse">Kasse (RunMySalon POS)</option>
                  <option value="square">Square</option>
                  <option value="glossgenius">GlossGenius</option>
                  <option value="meevo">Meevo</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: "12px", backgroundColor: "transparent", border: "1px solid rgba(205,201,192,0.2)", borderRadius: "8px", color: "#CDC9C0", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCreate} disabled={creating || !createForm.name} style={{ flex: 2, padding: "12px", backgroundColor: "#CDC9C0", color: "#06080d", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: 800, cursor: "pointer", opacity: creating || !createForm.name ? 0.5 : 1 }}>
                {creating ? "Creating..." : "Create Tenant"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
