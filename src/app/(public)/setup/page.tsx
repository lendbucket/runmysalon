"use client"
import { useState } from "react"

const fontLink = "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
const iconLink = "https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function SetupPage() {
  const [step, setStep] = useState(1)

  // Step 1 — Customize Portal
  const [brandName, setBrandName] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#606E74")

  // Step 2 — Add Location
  const [locName, setLocName] = useState("")
  const [locAddress, setLocAddress] = useState("")
  const [locPhone, setLocPhone] = useState("")
  const [locHours, setLocHours] = useState(
    daysOfWeek.map((d) => ({ day: d, start: "09:00", end: "18:00" }))
  )

  // Step 3 — Invite Stylist
  const [stylistName, setStylistName] = useState("")
  const [stylistEmail, setStylistEmail] = useState("")
  const [stylistRole, setStylistRole] = useState("stylist")
  const [inviteSent, setInviteSent] = useState(false)

  // Step 4 — Set Schedule
  const [schedule, setSchedule] = useState(
    daysOfWeek.map((d) => ({
      day: d,
      open: d !== "Sunday",
      start: "09:00",
      end: "18:00",
    }))
  )

  // Step 5 — Launch checklist
  const checklist = [
    { label: "POS Connected", done: false, icon: "point_of_sale" },
    { label: "Location Added", done: !!locName, icon: "location_on" },
    { label: "Stylist Invited", done: inviteSent, icon: "person_add" },
    { label: "Schedule Set", done: schedule.some((s) => s.open), icon: "calendar_month" },
  ]

  const card: React.CSSProperties = {
    backgroundColor: "#0d1117",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "32px",
    maxWidth: "640px",
    margin: "0 auto",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#7a8f96",
    marginBottom: "6px",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(205,201,192,0.1)",
    borderRadius: "8px",
    color: "#CDC9C0",
    fontSize: "14px",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  }

  const btnPrimary: React.CSSProperties = {
    padding: "10px 24px",
    backgroundColor: "#606E74",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  }

  const btnSecondary: React.CSSProperties = {
    padding: "10px 24px",
    backgroundColor: "transparent",
    border: "1px solid rgba(205,201,192,0.1)",
    borderRadius: "8px",
    color: "#7a8f96",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  }

  const stepIndicator = (
    <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} style={{
          width: s === step ? "32px" : "10px",
          height: "10px",
          borderRadius: "5px",
          backgroundColor: s === step ? "#606E74" : s < step ? "#7a8f96" : "rgba(255,255,255,0.1)",
          transition: "all 0.3s",
        }} />
      ))}
    </div>
  )

  const navButtons = (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
      {step > 1 ? (
        <button onClick={() => setStep(step - 1)} style={btnSecondary}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px", verticalAlign: "middle", marginRight: "4px" }}>arrow_back</span>
          Back
        </button>
      ) : <div />}
      {step < 5 ? (
        <button onClick={() => setStep(step + 1)} style={btnPrimary}>
          Next
          <span className="material-symbols-outlined" style={{ fontSize: "16px", verticalAlign: "middle", marginLeft: "4px" }}>arrow_forward</span>
        </button>
      ) : (
        <button
          onClick={() => window.location.href = "/dashboard"}
          style={{ ...btnPrimary, backgroundColor: "#CDC9C0", color: "#0d1117" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px", verticalAlign: "middle", marginRight: "6px" }}>rocket_launch</span>
          Launch Your Portal
        </button>
      )}
    </div>
  )

  const stepTitles = [
    { title: "Customize Your Portal", desc: "Make it yours with branding and colors", icon: "palette" },
    { title: "Add Your First Location", desc: "Where are your clients coming?", icon: "location_on" },
    { title: "Invite Your First Stylist", desc: "Build your team", icon: "person_add" },
    { title: "Set Your Schedule", desc: "Define your working hours", icon: "calendar_month" },
    { title: "Launch Checklist", desc: "Everything you need before going live", icon: "checklist" },
  ]

  return (
    <>
      <link href={fontLink} rel="stylesheet" />
      <link href={iconLink} rel="stylesheet" />
      <div style={{
        fontFamily: "Plus Jakarta Sans, sans-serif",
        color: "#CDC9C0",
        minHeight: "100vh",
        backgroundColor: "#1e2d35",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Logo area */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>RunMySalon</div>
          <div style={{ fontSize: "13px", color: "#7a8f96", marginTop: "4px" }}>Setup Wizard</div>
        </div>

        {stepIndicator}

        {/* Step Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#7a8f96", marginBottom: "8px" }}>{stepTitles[step - 1].icon}</span>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", margin: "8px 0 4px" }}>{stepTitles[step - 1].title}</h1>
          <p style={{ fontSize: "14px", color: "#7a8f96", margin: 0 }}>{stepTitles[step - 1].desc}</p>
        </div>

        <div style={card}>
          {/* Step 1: Customize Portal */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={labelStyle}>Logo</div>
                <div style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "16px",
                  border: "2px dashed rgba(205,201,192,0.2)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#7a8f96",
                  gap: "6px",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>upload</span>
                  <span style={{ fontSize: "12px" }}>Upload Logo</span>
                </div>
              </div>
              <div>
                <div style={labelStyle}>Primary Color</div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: "40px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer", backgroundColor: "transparent" }}
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ ...inputStyle, width: "140px", fontFamily: "Fira Code, monospace" }}
                  />
                </div>
              </div>
              <div>
                <div style={labelStyle}>Brand Name</div>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  style={inputStyle}
                  placeholder="Your Salon Name"
                />
              </div>
            </div>
          )}

          {/* Step 2: Add Location */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={labelStyle}>Location Name</div>
                <input type="text" value={locName} onChange={(e) => setLocName(e.target.value)} style={inputStyle} placeholder="Main Studio" />
              </div>
              <div>
                <div style={labelStyle}>Address</div>
                <input type="text" value={locAddress} onChange={(e) => setLocAddress(e.target.value)} style={inputStyle} placeholder="123 Main St, City, State" />
              </div>
              <div>
                <div style={labelStyle}>Phone</div>
                <input type="text" value={locPhone} onChange={(e) => setLocPhone(e.target.value)} style={inputStyle} placeholder="(555) 123-4567" />
              </div>
              <div>
                <div style={labelStyle}>Hours</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {locHours.map((h, i) => (
                    <div key={h.day} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "90px", fontSize: "13px", color: "#fff" }}>{h.day}</div>
                      <input
                        type="time"
                        value={h.start}
                        onChange={(e) => {
                          const u = [...locHours]
                          u[i] = { ...u[i], start: e.target.value }
                          setLocHours(u)
                        }}
                        style={{ ...inputStyle, width: "120px", fontFamily: "Fira Code, monospace", fontSize: "13px" }}
                      />
                      <span style={{ color: "#7a8f96", fontSize: "13px" }}>to</span>
                      <input
                        type="time"
                        value={h.end}
                        onChange={(e) => {
                          const u = [...locHours]
                          u[i] = { ...u[i], end: e.target.value }
                          setLocHours(u)
                        }}
                        style={{ ...inputStyle, width: "120px", fontFamily: "Fira Code, monospace", fontSize: "13px" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Invite Stylist */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={labelStyle}>Stylist Name</div>
                <input type="text" value={stylistName} onChange={(e) => setStylistName(e.target.value)} style={inputStyle} placeholder="Jane Doe" />
              </div>
              <div>
                <div style={labelStyle}>Email</div>
                <input type="email" value={stylistEmail} onChange={(e) => setStylistEmail(e.target.value)} style={inputStyle} placeholder="jane@example.com" />
              </div>
              <div>
                <div style={labelStyle}>Role</div>
                <select value={stylistRole} onChange={(e) => setStylistRole(e.target.value)} style={inputStyle}>
                  <option value="stylist">Stylist</option>
                  <option value="senior_stylist">Senior Stylist</option>
                  <option value="manager">Manager</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>
              <button
                onClick={() => setInviteSent(true)}
                style={{
                  ...btnPrimary,
                  alignSelf: "flex-start",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: inviteSent ? 0.6 : 1,
                }}
                disabled={inviteSent}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  {inviteSent ? "check_circle" : "send"}
                </span>
                {inviteSent ? "Invite Sent!" : "Send Invite"}
              </button>
            </div>
          )}

          {/* Step 4: Set Schedule */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {schedule.map((s, i) => (
                <div key={s.day} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    onClick={() => {
                      const u = [...schedule]
                      u[i] = { ...u[i], open: !u[i].open }
                      setSchedule(u)
                    }}
                    style={{
                      width: "40px",
                      height: "22px",
                      borderRadius: "11px",
                      backgroundColor: s.open ? "#606E74" : "rgba(255,255,255,0.1)",
                      position: "relative",
                      cursor: "pointer",
                      border: "none",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: "#fff",
                      position: "absolute",
                      top: "3px",
                      left: s.open ? "21px" : "3px",
                      transition: "left 0.2s",
                    }} />
                  </button>
                  <div style={{ width: "90px", fontSize: "14px", color: s.open ? "#fff" : "#606E74" }}>{s.day}</div>
                  {s.open ? (
                    <>
                      <input
                        type="time"
                        value={s.start}
                        onChange={(e) => {
                          const u = [...schedule]
                          u[i] = { ...u[i], start: e.target.value }
                          setSchedule(u)
                        }}
                        style={{ ...inputStyle, width: "120px", fontFamily: "Fira Code, monospace", fontSize: "13px" }}
                      />
                      <span style={{ color: "#7a8f96", fontSize: "13px" }}>to</span>
                      <input
                        type="time"
                        value={s.end}
                        onChange={(e) => {
                          const u = [...schedule]
                          u[i] = { ...u[i], end: e.target.value }
                          setSchedule(u)
                        }}
                        style={{ ...inputStyle, width: "120px", fontFamily: "Fira Code, monospace", fontSize: "13px" }}
                      />
                    </>
                  ) : (
                    <span style={{ fontSize: "13px", color: "#606E74" }}>Closed</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Launch Checklist */}
          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {checklist.map((item) => (
                <div key={item.label} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  backgroundColor: item.done ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${item.done ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)"}`,
                }}>
                  <span className="material-symbols-outlined" style={{
                    fontSize: "22px",
                    color: item.done ? "#22c55e" : "#606E74",
                  }}>
                    {item.done ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#7a8f96" }}>{item.icon}</span>
                  <span style={{ fontSize: "14px", color: item.done ? "#fff" : "#7a8f96", fontWeight: item.done ? 500 : 400 }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {navButtons}
        </div>
      </div>
    </>
  )
}
