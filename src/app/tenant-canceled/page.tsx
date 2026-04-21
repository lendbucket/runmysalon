import { XCircle } from "lucide-react"
import Link from "next/link"

export default function TenantCanceledPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#06080d", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
        <XCircle size={32} strokeWidth={1.5} color="#ef4444" style={{ marginBottom: "16px" }} />
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#ffffff", margin: "0 0 8px" }}>
          Portal closed
        </h1>
        <p style={{ fontSize: "14px", fontWeight: 400, color: "#9ca3af", lineHeight: 1.6, margin: "0 0 24px" }}>
          This salon is no longer using RunMySalon.
        </p>
        <Link
          href="https://runmysalon.com/signup"
          style={{ display: "inline-block", padding: "10px 20px", backgroundColor: "#606E74", color: "#ffffff", fontSize: "14px", fontWeight: 600, borderRadius: "8px", textDecoration: "none" }}
        >
          Start your own salon portal
        </Link>
      </div>
    </div>
  )
}
