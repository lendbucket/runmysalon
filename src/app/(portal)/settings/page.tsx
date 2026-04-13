"use client"
import { useSession } from "next-auth/react"
import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useUserRole } from "@/hooks/useUserRole"

function SettingsInner() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isOwner, isManager, isStylist } = useUserRole()
  const user = session?.user as any

  const tabs = [
    { key: "profile", label: "Profile" },
    { key: "license", label: "License" },
    { key: "notifications", label: "Notifications" },
    ...(isOwner || isManager ? [{ key: "location", label: "Location" }] : []),
  ]

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile")
  const [name, setName] = useState(user?.name || "")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  // License state
  const [licenseNumber, setLicenseNumber] = useState("")
  const [licenseStatus, setLicenseStatus] = useState<any>(null)
  const [licenseLoading, setLicenseLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    fetch("/api/staff/me/license-status").then(r => r.json()).then(d => {
      setLicenseStatus(d)
      if (d.licenseNumber) setLicenseNumber(d.licenseNumber)
    }).catch(() => {})
  }, [])

  const verifyLicense = async () => {
    if (!licenseNumber.trim()) return
    setVerifying(true)
    try {
      const res = await fetch(`/api/tdlr/verify?license=${encodeURIComponent(licenseNumber)}`)
      const data = await res.json()
      if (data.found) {
        // Save to profile via existing endpoint
        const meRes = await fetch("/api/staff/me")
        const meData = await meRes.json()
        if (meData.staffMember?.id) {
          await fetch("/api/tdlr/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ staffMemberId: meData.staffMember.id, licenseNumber, licenseStatus: data.isActive ? "active" : data.status, expirationDate: data.expirationDate }),
          })
        }
        setLicenseStatus({ ...licenseStatus, licenseNumber, verified: data.isActive, status: data.isActive ? "active" : data.status, expirationDate: data.expirationDate, holderName: data.holderName })
        setMsg(data.isActive ? "License verified!" : "License found but not active")
      } else {
        setMsg("License not found in TDLR records")
      }
    } catch { setMsg("Verification failed") }
    setVerifying(false)
    setTimeout(() => setMsg(""), 4000)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/profile/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) })
      const data = await res.json()
      setMsg(data.error ? data.error : "Profile saved!")
    } catch { setMsg("Failed to save") }
    setSaving(false)
    setTimeout(() => setMsg(""), 3000)
  }

  const cardStyle: React.CSSProperties = { backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "28px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 0 0 1px rgba(0,0,0,0.25)" }
  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", backgroundColor: "rgba(205,201,192,0.06)", border: "1px solid rgba(205,201,192,0.15)", borderRadius: "8px", color: "#FFFFFF", fontSize: "14px", outline: "none", boxSizing: "border-box" }
  const labelStyle: React.CSSProperties = { fontSize: "10px", fontWeight: 700, color: "#7a8f96", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px", display: "block" }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "28px 20px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 20px" }}>Settings</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "24px", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "10px 18px", fontSize: "13px", fontWeight: 600, color: activeTab === t.key ? "#ffffff" : "#606E74",
            backgroundColor: "transparent", border: "none", borderBottom: activeTab === t.key ? "2px solid #7a8f96" : "2px solid transparent",
            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {msg && <div style={{ padding: "10px 16px", marginBottom: "16px", borderRadius: "8px", backgroundColor: "rgba(122,143,150,0.1)", color: "#7a8f96", fontSize: "13px" }}>{msg}</div>}

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div><label style={labelStyle}>Full Name</label><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Email</label><input value={user?.email || ""} disabled style={{ ...inputStyle, color: "rgba(205,201,192,0.4)", cursor: "not-allowed" }} /></div>
            <div><label style={labelStyle}>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(361) 555-0123" style={inputStyle} /></div>
            <button onClick={saveProfile} disabled={saving} style={{ padding: "12px", backgroundColor: "#7a8f96", color: "#06080d", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "14px", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save Profile"}</button>
          </div>
        </div>
      )}

      {/* License tab */}
      {activeTab === "license" && (
        <div style={cardStyle}>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#606E74", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>License Status</div>
            {licenseStatus?.verified ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: licenseStatus.expired ? "#ef4444" : licenseStatus.expiringSoon ? "#f59e0b" : "#22c55e" }} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: licenseStatus.expired ? "#ef4444" : licenseStatus.expiringSoon ? "#f59e0b" : "#22c55e" }}>
                  {licenseStatus.expired ? "Expired" : licenseStatus.expiringSoon ? `Expiring Soon (${licenseStatus.daysUntilExpiry} days)` : "Active"}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: "14px", color: "#f59e0b" }}>Unverified — enter your license number below</div>
            )}
          </div>

          {licenseStatus?.holderName && <div style={{ fontSize: "13px", color: "#7a8f96", marginBottom: "8px" }}>TDLR Name: {licenseStatus.holderName}</div>}
          {licenseStatus?.expirationDate && <div style={{ fontSize: "13px", color: "#606E74", marginBottom: "16px", fontFamily: "'Fira Code', monospace" }}>Expires: {new Date(licenseStatus.expirationDate).toLocaleDateString()}</div>}

          <div style={{ display: "flex", gap: "8px" }}>
            <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="TX license number" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={verifyLicense} disabled={verifying || !licenseNumber.trim()} style={{ padding: "12px 20px", backgroundColor: "#7a8f96", color: "#06080d", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: "pointer", opacity: verifying ? 0.6 : 1, whiteSpace: "nowrap" }}>{verifying ? "Verifying..." : "Verify"}</button>
          </div>
          <div style={{ fontSize: "12px", color: "#606E74", marginTop: "12px" }}>Your license number can be found on your TDLR certificate or at tdlr.texas.gov</div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <div style={cardStyle}>
          <div style={{ fontSize: "14px", color: "#7a8f96", marginBottom: "16px" }}>Notification preferences are managed in the Preferences page.</div>
          <button onClick={() => router.push("/preferences")} style={{ padding: "10px 16px", backgroundColor: "transparent", border: "1px solid #606E74", color: "#7a8f96", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Go to Preferences</button>
        </div>
      )}

      {/* Location tab */}
      {activeTab === "location" && (isOwner || isManager) && (
        <div style={cardStyle}>
          <div style={{ fontSize: "14px", color: "#7a8f96" }}>Location settings are configured in the portal admin. Contact the portal owner for changes.</div>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  return <Suspense fallback={null}><SettingsInner /></Suspense>
}
