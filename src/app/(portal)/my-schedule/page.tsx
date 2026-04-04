"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface ShiftCard {
  id: string
  date: string
  startTime: string
  endTime: string
  isTimeOff: boolean
  schedule: {
    location: { name: string }
  }
}

function dayLabel(dateStr: string): string | null {
  const d = new Date(dateStr + "T00:00:00")
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.getTime() === today.getTime()) return "TODAY"
  if (d.getTime() === tomorrow.getTime()) return "TOMORROW"
  return null
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
}

export default function MySchedulePage() {
  const { data: session } = useSession()
  const [shifts, setShifts] = useState<ShiftCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) return
    fetch("/api/schedule/my-shifts")
      .then(r => r.json())
      .then(d => setShifts(d.shifts || []))
      .finally(() => setLoading(false))
  }, [session])

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "28px 20px" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />
      <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "-0.02em" }}>My Schedule</h1>
      <p style={{ fontSize: "12px", color: "#94A3B8", margin: "0 0 24px" }}>Your upcoming shifts</p>

      {loading ? (
        <p style={{ color: "#94A3B8", textAlign: "center", padding: "40px 0" }}>Loading...</p>
      ) : shifts.length === 0 ? (
        <div style={{ backgroundColor: "#1a2a32", border: "1px solid rgba(205,201,192,0.12)", borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "rgba(205,201,192,0.2)", display: "block", marginBottom: "16px" }}>event_busy</span>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", margin: "0 0 8px" }}>No shifts scheduled</p>
          <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>Your upcoming shifts will appear here once assigned.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {shifts.map(sh => {
            const badge = dayLabel(sh.date)
            return (
              <div key={sh.id} style={{
                backgroundColor: sh.isTimeOff ? "rgba(239,68,68,0.06)" : "#1a2a32",
                border: `1px solid ${sh.isTimeOff ? "rgba(239,68,68,0.2)" : "rgba(205,201,192,0.12)"}`,
                borderRadius: "12px",
                padding: "16px 20px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>{formatDay(sh.date)}</span>
                    {badge && (
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "9px",
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        backgroundColor: badge === "TODAY" ? "rgba(16,185,129,0.15)" : "rgba(205,201,192,0.1)",
                        color: badge === "TODAY" ? "#10B981" : "#CDC9C0",
                      }}>{badge}</span>
                    )}
                  </div>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>{sh.schedule.location.name}</span>
                </div>
                {sh.isTimeOff ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#EF4444" }}>beach_access</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.08em" }}>Day Off</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#10B981" }}>schedule</span>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(16,185,129,0.1)",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#10B981",
                    }}>{sh.startTime} - {sh.endTime}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
