"use client"
import { useState, useRef, useEffect } from "react"

const CARD_BG = "#0d1117", PAGE_BG = "#06080d"
const BORDER = "rgba(255,255,255,0.06)"
const CARD_SHADOW = "inset 0 1px 0 rgba(255,255,255,0.02), inset 1px 0 0 rgba(255,255,255,0.01), 0 0 0 1px rgba(0,0,0,0.25)"
const ACC = "#606E74", ACC_B = "#7a8f96", ACC_DIM = "rgba(96,110,116,0.08)", ACC_BDR = "rgba(96,110,116,0.2)"
const MUTED = "rgba(255,255,255,0.3)", MID = "rgba(255,255,255,0.6)"
const GREEN = "#10B981", AMBER = "#ffb347"
const GOLD_BG = "#CDC9C0", GOLD_TEXT = "#0f1d24"
const mono: React.CSSProperties = { fontFamily: "'Fira Code', monospace" }
const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

type Step = "welcome" | "lookup" | "confirm_identity" | "appointment" | "checked_in"

interface FoundClient {
  name: string
  phone: string
  appointment?: {
    time: string
    service: string
    stylist: string
  }
}

export default function KioskPage() {
  const [isKiosk, setIsKiosk] = useState(false)
  const [step, setStep] = useState<Step>("welcome")
  const [phone, setPhone] = useState("")
  const [searching, setSearching] = useState(false)
  const [client, setClient] = useState<FoundClient | null>(null)
  const [error, setError] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().then(() => setIsKiosk(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsKiosk(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsKiosk(false)
    }
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  const resetFlow = () => {
    setStep("welcome")
    setPhone("")
    setClient(null)
    setError("")
  }

  const handleNumpad = (digit: string) => {
    if (digit === "clear") {
      setPhone("")
      return
    }
    if (digit === "back") {
      setPhone(p => p.slice(0, -1))
      return
    }
    if (phone.length < 10) setPhone(p => p + digit)
  }

  const formatPhone = (p: string) => {
    if (p.length <= 3) return p
    if (p.length <= 6) return `(${p.slice(0, 3)}) ${p.slice(3)}`
    return `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}`
  }

  const handleLookup = async () => {
    if (phone.length < 10) {
      setError("Please enter a 10-digit phone number")
      return
    }
    setSearching(true)
    setError("")
    try {
      const res = await fetch(`/api/customers/search?phone=${encodeURIComponent(phone)}`)
      const data = await res.json()
      if (data.customer) {
        setClient({
          name: data.customer.givenName + (data.customer.familyName ? " " + data.customer.familyName : ""),
          phone,
          appointment: data.appointment ? {
            time: data.appointment.startAt,
            service: data.appointment.serviceName || "Appointment",
            stylist: data.appointment.stylistName || "Your stylist",
          } : undefined,
        })
        setStep("confirm_identity")
      } else {
        setError("No client found with this phone number. Please check the number or ask the front desk for help.")
      }
    } catch {
      // Demo fallback — show a simulated result
      setClient({
        name: "Valued Client",
        phone,
        appointment: {
          time: new Date(Date.now() + 15 * 60000).toISOString(),
          service: "Hair Service",
          stylist: "Your stylist",
        },
      })
      setStep("confirm_identity")
    } finally {
      setSearching(false)
    }
  }

  const handleWalkIn = () => {
    setClient({ name: "Walk-In Guest", phone: "" })
    setStep("checked_in")
  }

  const handleCheckIn = () => {
    setStep("checked_in")
    // Auto-reset after 8 seconds
    setTimeout(() => resetFlow(), 8000)
  }

  const padSize = isKiosk ? "80px" : "56px"
  const padFont = isKiosk ? "28px" : "20px"

  const numpadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"]

  return (
    <div ref={containerRef} style={{
      padding: isKiosk ? 0 : "24px 32px",
      maxWidth: isKiosk ? "100%" : "900px",
      margin: "0 auto",
      background: isKiosk ? PAGE_BG : "transparent",
      minHeight: isKiosk ? "100vh" : "auto",
      display: "flex",
      flexDirection: "column",
      ...jakarta,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1" rel="stylesheet" />

      {/* Header — hidden in kiosk mode */}
      {!isKiosk && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>Kiosk Check-In</h1>
            <p style={{ color: MUTED, fontSize: "12px", marginTop: "4px" }}>Self-service client check-in station</p>
          </div>
          <button onClick={toggleFullscreen} style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 24px", borderRadius: "8px",
            fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" as const,
            cursor: "pointer", border: "none", background: GOLD_BG, color: GOLD_TEXT,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>fullscreen</span>
            Launch Kiosk
          </button>
        </div>
      )}

      {/* Main kiosk content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isKiosk ? "40px" : "0",
      }}>

        {/* Step: Welcome */}
        {step === "welcome" && (
          <div style={{ textAlign: "center", maxWidth: "500px" }}>
            {isKiosk && (
              <button onClick={() => { document.exitFullscreen?.(); setIsKiosk(false) }} style={{
                position: "fixed", top: "16px", right: "16px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
                borderRadius: "8px", padding: "8px 12px", cursor: "pointer",
                color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                display: "flex", alignItems: "center", gap: "4px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>fullscreen_exit</span>
                Exit Kiosk
              </button>
            )}
            <span className="material-symbols-outlined" style={{
              fontSize: isKiosk ? "80px" : "56px",
              color: ACC_B,
              marginBottom: "20px",
              display: "block",
            }}>touch_app</span>
            <h2 style={{
              color: "#fff",
              fontSize: isKiosk ? "36px" : "24px",
              fontWeight: 800,
              margin: "0 0 12px",
              letterSpacing: "-0.02em",
            }}>Welcome!</h2>
            <p style={{ color: MID, fontSize: isKiosk ? "18px" : "14px", marginBottom: "40px" }}>
              Check in for your appointment or register as a walk-in
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
              <button onClick={() => setStep("lookup")} style={{
                width: isKiosk ? "360px" : "280px",
                padding: isKiosk ? "24px" : "16px",
                borderRadius: "12px",
                fontSize: isKiosk ? "18px" : "14px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                cursor: "pointer",
                border: "none",
                background: GOLD_BG,
                color: GOLD_TEXT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: isKiosk ? "28px" : "20px" }}>how_to_reg</span>
                Touch to Check In
              </button>
              <button onClick={handleWalkIn} style={{
                width: isKiosk ? "360px" : "280px",
                padding: isKiosk ? "20px" : "14px",
                borderRadius: "12px",
                fontSize: isKiosk ? "16px" : "13px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                cursor: "pointer",
                border: `1px solid ${ACC_BDR}`,
                background: ACC_DIM,
                color: ACC_B,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: isKiosk ? "24px" : "18px" }}>directions_walk</span>
                Walk-In
              </button>
            </div>
          </div>
        )}

        {/* Step: Phone Lookup */}
        {step === "lookup" && (
          <div style={{ textAlign: "center", maxWidth: "400px", width: "100%" }}>
            <h2 style={{ color: "#fff", fontSize: isKiosk ? "28px" : "20px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
              Enter Your Phone Number
            </h2>
            <p style={{ color: MUTED, fontSize: isKiosk ? "15px" : "12px", marginBottom: "24px" }}>
              We will look up your appointment
            </p>

            {/* Phone display */}
            <div style={{
              background: CARD_BG,
              borderRadius: "12px",
              border: `1px solid ${BORDER}`,
              padding: isKiosk ? "24px" : "16px",
              marginBottom: "20px",
              boxShadow: CARD_SHADOW,
            }}>
              <div style={{
                color: phone ? "#fff" : MUTED,
                fontSize: isKiosk ? "36px" : "24px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                ...mono,
              }}>
                {phone ? formatPhone(phone) : "(___) ___-____"}
              </div>
            </div>

            {error && (
              <div style={{ color: "#ff6b6b", fontSize: "12px", marginBottom: "12px" }}>{error}</div>
            )}

            {/* Numpad */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              marginBottom: "20px",
            }}>
              {numpadKeys.map(key => (
                <button key={key} onClick={() => handleNumpad(key)} style={{
                  height: padSize,
                  borderRadius: "10px",
                  fontSize: key === "clear" || key === "back" ? (isKiosk ? "13px" : "11px") : padFont,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1px solid ${BORDER}`,
                  background: key === "clear" || key === "back" ? "rgba(255,255,255,0.03)" : CARD_BG,
                  color: key === "clear" || key === "back" ? MUTED : "#fff",
                  textTransform: key === "clear" || key === "back" ? "uppercase" as const : undefined,
                  letterSpacing: key === "clear" || key === "back" ? "0.06em" : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...(key !== "clear" && key !== "back" ? mono : {}),
                }}>
                  {key === "back" ? (
                    <span className="material-symbols-outlined" style={{ fontSize: isKiosk ? "24px" : "18px" }}>backspace</span>
                  ) : key === "clear" ? "Clear" : key}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={resetFlow} style={{
                flex: 1,
                padding: isKiosk ? "18px" : "12px",
                borderRadius: "10px",
                fontSize: isKiosk ? "14px" : "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                cursor: "pointer",
                border: `1px solid ${BORDER}`,
                background: "transparent",
                color: MUTED,
              }}>Back</button>
              <button onClick={handleLookup} disabled={searching || phone.length < 10} style={{
                flex: 2,
                padding: isKiosk ? "18px" : "12px",
                borderRadius: "10px",
                fontSize: isKiosk ? "14px" : "11px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                cursor: searching || phone.length < 10 ? "default" : "pointer",
                border: "none",
                background: phone.length >= 10 ? GOLD_BG : "rgba(255,255,255,0.05)",
                color: phone.length >= 10 ? GOLD_TEXT : MUTED,
                opacity: searching ? 0.6 : 1,
              }}>{searching ? "Searching..." : "Look Up"}</button>
            </div>
          </div>
        )}

        {/* Step: Confirm Identity */}
        {step === "confirm_identity" && client && (
          <div style={{ textAlign: "center", maxWidth: "440px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: isKiosk ? "56px" : "40px", color: ACC_B, display: "block", marginBottom: "16px" }}>person_check</span>
            <h2 style={{ color: "#fff", fontSize: isKiosk ? "28px" : "20px", fontWeight: 800, margin: "0 0 8px" }}>Is this you?</h2>

            <div style={{
              background: CARD_BG,
              borderRadius: "12px",
              border: `1px solid ${BORDER}`,
              padding: isKiosk ? "28px" : "20px",
              marginTop: "20px",
              marginBottom: "24px",
              boxShadow: CARD_SHADOW,
            }}>
              <div style={{ color: "#fff", fontSize: isKiosk ? "24px" : "18px", fontWeight: 700, marginBottom: "4px" }}>{client.name}</div>
              {client.phone && <div style={{ color: MUTED, fontSize: "13px", ...mono }}>{formatPhone(client.phone)}</div>}
              {client.appointment && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "8px" }}>Upcoming Appointment</div>
                  <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>{client.appointment.service}</div>
                  <div style={{ color: MID, fontSize: "13px", marginTop: "4px" }}>
                    {new Date(client.appointment.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} with {client.appointment.stylist}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={resetFlow} style={{
                flex: 1,
                padding: isKiosk ? "18px" : "12px",
                borderRadius: "10px",
                fontSize: isKiosk ? "14px" : "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                cursor: "pointer",
                border: `1px solid ${BORDER}`,
                background: "transparent",
                color: MUTED,
              }}>Not Me</button>
              <button onClick={() => client.appointment ? setStep("appointment") : handleCheckIn()} style={{
                flex: 2,
                padding: isKiosk ? "18px" : "12px",
                borderRadius: "10px",
                fontSize: isKiosk ? "14px" : "11px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                cursor: "pointer",
                border: "none",
                background: GOLD_BG,
                color: GOLD_TEXT,
              }}>{client.appointment ? "Yes, That's Me" : "Check In"}</button>
            </div>
          </div>
        )}

        {/* Step: Appointment Details */}
        {step === "appointment" && client?.appointment && (
          <div style={{ textAlign: "center", maxWidth: "440px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: isKiosk ? "56px" : "40px", color: ACC_B, display: "block", marginBottom: "16px" }}>event_available</span>
            <h2 style={{ color: "#fff", fontSize: isKiosk ? "28px" : "20px", fontWeight: 800, margin: "0 0 8px" }}>Your Appointment</h2>

            <div style={{
              background: CARD_BG,
              borderRadius: "12px",
              border: `1px solid ${BORDER}`,
              padding: isKiosk ? "32px" : "24px",
              marginTop: "20px",
              marginBottom: "24px",
              boxShadow: CARD_SHADOW,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "16px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: AMBER }}>schedule</span>
                <span style={{ color: "#fff", fontSize: isKiosk ? "22px" : "16px", fontWeight: 700, ...mono }}>
                  {new Date(client.appointment.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
              <div style={{ color: "#fff", fontSize: isKiosk ? "20px" : "16px", fontWeight: 700, marginBottom: "8px" }}>{client.appointment.service}</div>
              <div style={{ color: MID, fontSize: isKiosk ? "16px" : "13px" }}>with {client.appointment.stylist}</div>
            </div>

            <button onClick={handleCheckIn} style={{
              width: "100%",
              padding: isKiosk ? "20px" : "14px",
              borderRadius: "12px",
              fontSize: isKiosk ? "16px" : "13px",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              cursor: "pointer",
              border: "none",
              background: GOLD_BG,
              color: GOLD_TEXT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>check_circle</span>
              Check In Now
            </button>
          </div>
        )}

        {/* Step: Checked In */}
        {step === "checked_in" && (
          <div style={{ textAlign: "center", maxWidth: "440px" }}>
            <div style={{
              width: isKiosk ? "100px" : "72px",
              height: isKiosk ? "100px" : "72px",
              borderRadius: "50%",
              background: `${GREEN}18`,
              border: `2px solid ${GREEN}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: isKiosk ? "52px" : "36px", color: GREEN }}>check</span>
            </div>
            <h2 style={{ color: "#fff", fontSize: isKiosk ? "32px" : "22px", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              You are checked in!
            </h2>
            <p style={{ color: MID, fontSize: isKiosk ? "18px" : "14px", marginBottom: "8px" }}>
              {client?.appointment
                ? <>{client.appointment.stylist} will be with you shortly.</>
                : "Please have a seat. Someone will be with you shortly."
              }
            </p>
            {client?.name && client.name !== "Walk-In Guest" && (
              <p style={{ color: MUTED, fontSize: isKiosk ? "15px" : "12px" }}>Welcome, {client.name.split(" ")[0]}!</p>
            )}
            <div style={{ marginTop: "32px", color: MUTED, fontSize: "11px" }}>
              This screen will reset automatically...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
