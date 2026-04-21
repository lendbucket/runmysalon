import { SearchX } from "lucide-react"
import Link from "next/link"

export default function TenantNotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#06080d", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
        <SearchX size={32} strokeWidth={1.5} color="#ef4444" style={{ marginBottom: "16px" }} />
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#ffffff", margin: "0 0 8px" }}>
          Salon not found
        </h1>
        <p style={{ fontSize: "14px", fontWeight: 400, color: "#9ca3af", lineHeight: 1.6, margin: "0 0 24px" }}>
          The salon portal you&apos;re looking for doesn&apos;t exist. Check the URL and try again.
        </p>
        <Link
          href="https://runmysalon.com"
          style={{ display: "inline-block", padding: "10px 20px", backgroundColor: "#606E74", color: "#ffffff", fontSize: "14px", fontWeight: 600, borderRadius: "8px", textDecoration: "none" }}
        >
          Go to runmysalon.com
        </Link>
      </div>
    </div>
  )
}
