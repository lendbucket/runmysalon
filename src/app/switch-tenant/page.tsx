"use client"

import Link from "next/link"
import { Building2 } from "lucide-react"

/**
 * Stub page shown when a user visits a tenant subdomain they don't belong to.
 * Will be fully wired in a later prompt with tenant list + switch functionality.
 */
export default function SwitchTenantPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#06080d", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
        <Building2 size={32} strokeWidth={1.5} color="#7a8f96" style={{ marginBottom: "16px" }} />
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#ffffff", margin: "0 0 8px" }}>
          Switch salon
        </h1>
        <p style={{ fontSize: "14px", fontWeight: 400, color: "#9ca3af", lineHeight: 1.6, margin: "0 0 24px" }}>
          You don&apos;t have access to this salon portal. If you believe this is an error, contact the salon owner.
        </p>
        <Link
          href="https://runmysalon.com"
          style={{ display: "inline-block", padding: "10px 20px", backgroundColor: "#606E74", color: "#ffffff", fontSize: "14px", fontWeight: 600, borderRadius: "8px", textDecoration: "none" }}
        >
          Go to RunMySalon
        </Link>
      </div>
    </div>
  )
}
