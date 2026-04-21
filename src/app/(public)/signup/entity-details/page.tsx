"use client"

import { Suspense, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Building2, Hash, FileText, Clock, Users } from "lucide-react"
import { SignupShell, labelStyle, inputStyle, btnStyle } from "@/components/signup-shell"

const entityTypes = [
  { label: "Sole Proprietor", value: "sole_proprietor" },
  { label: "LLC", value: "llc" },
  { label: "S-Corp", value: "s_corp" },
  { label: "C-Corp", value: "c_corp" },
  { label: "Partnership", value: "partnership" },
  { label: "Not sure yet", value: "not_sure" },
]

function maskEIN(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9)
  if (digits.length <= 2) return digits
  return digits.slice(0, 2) + "-" + digits.slice(2)
}

export default function EntityDetailsPage() {
  return (
    <Suspense fallback={null}>
      <EntityDetailsForm />
    </Suspense>
  )
}

function EntityDetailsForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session") || ""

  const [entityType, setEntityType] = useState("")
  const [ein, setEIN] = useState("")
  const [noEIN, setNoEIN] = useState(false)
  const [ssn, setSSN] = useState("")
  const [dba, setDBA] = useState("")
  const [yearsInBusiness, setYearsInBusiness] = useState("")
  const [fullTime, setFullTime] = useState("")
  const [partTime, setPartTime] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSoleProp = entityType === "sole_proprietor"
  const needsEIN = entityType && !(isSoleProp && noEIN)
  const einValid = !needsEIN || ein.replace(/\D/g, "").length === 9
  const canSubmit = entityType && einValid && !loading

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/signup/entity-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          entityType,
          ein: needsEIN ? ein.replace(/\D/g, "") : undefined,
          ssn: isSoleProp && noEIN ? ssn.replace(/\D/g, "") : undefined,
          dba: dba.trim() || undefined,
          yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness) : undefined,
          fullTimeEmployees: fullTime ? parseInt(fullTime) : 0,
          partTimeEmployees: partTime ? parseInt(partTime) : 0,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }
      router.push(`/signup/locations?session=${sessionId}`)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }, [canSubmit, sessionId, entityType, ein, needsEIN, isSoleProp, noEIN, ssn, dba, yearsInBusiness, fullTime, partTime, router])

  const fieldInput: React.CSSProperties = {
    ...inputStyle,
    paddingLeft: 40,
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    paddingLeft: 40,
    appearance: "none",
    WebkitAppearance: "none",
  }

  return (
    <SignupShell currentStep={6} showBack onBack={() => router.push(`/signup/revenue?session=${sessionId}`)}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 6px", textAlign: "center" }}>
        The legal stuff
      </h1>
      <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 28px", textAlign: "center" }}>
        Required for payroll and taxes. Takes 30 seconds.
      </p>

      {error && (
        <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center", margin: "0 0 16px" }}>{error}</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Entity Type */}
        <div>
          <label style={labelStyle}>Entity Type</label>
          <div style={{ position: "relative" }}>
            <Building2 size={16} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 13, top: 14, pointerEvents: "none" }} />
            <select
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); setNoEIN(false) }}
              style={selectStyle}
            >
              <option value="" disabled>Select entity type</option>
              {entityTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* EIN */}
        {entityType && needsEIN && (
          <div>
            <label style={labelStyle}>EIN</label>
            <div style={{ position: "relative" }}>
              <Hash size={16} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 13, top: 14, pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="XX-XXXXXXX"
                value={maskEIN(ein)}
                onChange={(e) => setEIN(e.target.value.replace(/\D/g, "").slice(0, 9))}
                style={fieldInput}
              />
            </div>
          </div>
        )}

        {/* No EIN checkbox — sole prop only */}
        {isSoleProp && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={noEIN}
              onChange={(e) => setNoEIN(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#606E74" }}
            />
            <span style={{ fontSize: 13, color: "#9ca3af" }}>I don&apos;t have an EIN yet</span>
          </label>
        )}

        {/* SSN — shown when sole prop + no EIN */}
        {isSoleProp && noEIN && (
          <div>
            <label style={labelStyle}>SSN</label>
            <div style={{ position: "relative" }}>
              <Hash size={16} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 13, top: 14, pointerEvents: "none" }} />
              <input
                type="password"
                placeholder="XXX-XX-XXXX"
                value={ssn}
                onChange={(e) => setSSN(e.target.value.replace(/\D/g, "").slice(0, 9))}
                style={fieldInput}
              />
            </div>
          </div>
        )}

        {/* DBA */}
        <div>
          <label style={labelStyle}>DBA (optional)</label>
          <div style={{ position: "relative" }}>
            <FileText size={16} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 13, top: 14, pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Doing business as..."
              value={dba}
              onChange={(e) => setDBA(e.target.value)}
              style={fieldInput}
            />
          </div>
        </div>

        {/* Years in Business */}
        <div>
          <label style={labelStyle}>Years in Business</label>
          <div style={{ position: "relative" }}>
            <Clock size={16} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 13, top: 14, pointerEvents: "none" }} />
            <input
              type="number"
              min={0}
              max={100}
              placeholder="0"
              value={yearsInBusiness}
              onChange={(e) => setYearsInBusiness(e.target.value)}
              style={fieldInput}
            />
          </div>
        </div>

        {/* Employee Count */}
        <div>
          <label style={labelStyle}>Employee Count</label>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Users size={16} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 13, top: 14, pointerEvents: "none" }} />
              <input
                type="number"
                min={0}
                placeholder="Full-time"
                value={fullTime}
                onChange={(e) => setFullTime(e.target.value)}
                style={fieldInput}
              />
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <Users size={16} strokeWidth={1.5} color="#6b7280" style={{ position: "absolute", left: 13, top: 14, pointerEvents: "none" }} />
              <input
                type="number"
                min={0}
                placeholder="Part-time"
                value={partTime}
                onChange={(e) => setPartTime(e.target.value)}
                style={fieldInput}
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={!canSubmit} style={btnStyle(!!canSubmit)}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </SignupShell>
  )
}
