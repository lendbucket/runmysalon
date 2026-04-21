"use client"

import { Scissors, ArrowLeft, Save } from "lucide-react"

const STEPS = [
  "email", "verify", "terms", "business-info", "business-category",
  "revenue", "entity-details", "locations", "software", "social",
  "plan", "phone", "provisioning",
]

interface SignupShellProps {
  currentStep: number // 0-indexed
  children: React.ReactNode
  onBack?: () => void
  showBack?: boolean
}

export function SignupShell({ currentStep, children, onBack, showBack }: SignupShellProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", width: "100%",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", minHeight: "100vh",
      paddingTop: 32, paddingBottom: 48,
    }}>
      {/* Logo */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, backgroundColor: "#606E74",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
      }}>
        <Scissors size={20} strokeWidth={1.5} color="#ffffff" />
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 3, marginBottom: 32, width: 320, maxWidth: "80vw" }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            backgroundColor: i < currentStep ? "#7a8f96" : i === currentStep ? "#606E74" : "rgba(255,255,255,0.06)",
            transition: "background-color 300ms",
          }} />
        ))}
      </div>

      {/* Card */}
      <div style={{
        width: 560, maxWidth: "92vw",
        backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: "48px 48px 40px",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 24px 64px rgba(0,0,0,0.5)",
        position: "relative",
      }}>
        {/* Back button */}
        {showBack && onBack && (
          <button onClick={onBack} style={{
            position: "absolute", top: 16, left: 16, background: "none", border: "none",
            color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            fontSize: 13, padding: "4px 8px",
          }}>
            <ArrowLeft size={14} strokeWidth={1.5} /> Back
          </button>
        )}

        {children}
      </div>

      {/* Powered by */}
      <p style={{ fontSize: 11, color: "#4b5563", marginTop: 24, textAlign: "center", letterSpacing: "0.3px" }}>
        Powered by RunMySalon
      </p>
    </div>
  )
}

// Shared input styles
export const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af",
  letterSpacing: "0.2px", textTransform: "uppercase", marginBottom: 6,
}

export const inputStyle: React.CSSProperties = {
  width: "100%", height: 44, boxSizing: "border-box",
  backgroundColor: "#06080d", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8, padding: "0 14px 0 40px",
  color: "#ffffff", fontSize: 14, fontFamily: "inherit", outline: "none",
  transition: "border-color 150ms ease, box-shadow 150ms ease",
}

export const btnStyle = (enabled: boolean): React.CSSProperties => ({
  width: "100%", height: 48, border: "none", borderRadius: 10,
  backgroundColor: enabled ? "#606E74" : "#2a2f33",
  color: enabled ? "#ffffff" : "#6b7280",
  fontSize: 15, fontWeight: 600, fontFamily: "inherit",
  cursor: enabled ? "pointer" : "not-allowed",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  transition: "background-color 150ms, transform 50ms",
})
