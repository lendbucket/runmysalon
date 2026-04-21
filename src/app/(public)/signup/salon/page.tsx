"use client"
import { useRouter } from "next/navigation"
import { Scissors } from "lucide-react"

export default function SalonSetupPage() {
  const router = useRouter()
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#606E74", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Scissors size={24} strokeWidth={1.5} color="#ffffff" />
      </div>
      <div style={{ width: 420, maxWidth: "90vw", backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", margin: "0 0 8px" }}>Let&apos;s set up your salon</h1>
        <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 32px" }}>This wizard is coming in the next update.</p>
        <button onClick={() => router.push("/dashboard")} style={{ width: "100%", height: 44, backgroundColor: "#606E74", color: "#ffffff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Continue</button>
      </div>
    </div>
  )
}
