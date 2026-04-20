"use client"
import { useState } from "react"

const fontLink = "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
const iconLink = "https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined"

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

interface FAQ {
  question: string
  answer: string
}

export default function AIReceptionistPage() {
  const [enabled, setEnabled] = useState(true)
  const [aiName, setAiName] = useState("Nova")
  const [greeting, setGreeting] = useState("Thank you for calling RunMySalon, I'm Nova. How can I help you today?")
  const [fallbackRings, setFallbackRings] = useState("3")

  const [hours, setHours] = useState(
    days.map((d) => ({
      day: d,
      start: d === "Sunday" ? "10:00" : "09:00",
      end: d === "Sunday" ? "17:00" : d === "Saturday" ? "18:00" : "20:00",
    }))
  )

  const [services, setServices] = useState([
    { name: "Haircut", checked: true },
    { name: "Hair Coloring", checked: true },
    { name: "Blowout", checked: true },
    { name: "Deep Conditioning", checked: true },
    { name: "Balayage", checked: false },
    { name: "Extensions", checked: false },
    { name: "Keratin Treatment", checked: true },
    { name: "Scalp Treatment", checked: false },
  ])

  const [faqs, setFaqs] = useState<FAQ[]>([
    { question: "What are your hours?", answer: "We're open Monday through Saturday 9am to 8pm, and Sunday 10am to 5pm." },
    { question: "Do you accept walk-ins?", answer: "We accept walk-ins based on availability, but we recommend booking an appointment for guaranteed service." },
  ])
  const [newQ, setNewQ] = useState("")
  const [newA, setNewA] = useState("")

  const card: React.CSSProperties = {
    backgroundColor: "#0d1117",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "24px",
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

  const toggleStyle = (on: boolean): React.CSSProperties => ({
    width: "48px",
    height: "26px",
    borderRadius: "13px",
    backgroundColor: on ? "#606E74" : "rgba(255,255,255,0.1)",
    position: "relative",
    cursor: "pointer",
    transition: "background-color 0.2s",
    border: "none",
    flexShrink: 0,
  })

  const toggleDot = (on: boolean): React.CSSProperties => ({
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "#fff",
    position: "absolute",
    top: "3px",
    left: on ? "25px" : "3px",
    transition: "left 0.2s",
  })

  const addFaq = () => {
    if (newQ.trim() && newA.trim()) {
      setFaqs([...faqs, { question: newQ, answer: newA }])
      setNewQ("")
      setNewA("")
    }
  }

  const removeFaq = (i: number) => {
    setFaqs(faqs.filter((_, idx) => idx !== i))
  }

  return (
    <>
      <link href={fontLink} rel="stylesheet" />
      <link href={iconLink} rel="stylesheet" />
      <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif", color: "#CDC9C0", minHeight: "100vh", padding: "32px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "28px", verticalAlign: "middle", marginRight: "10px", color: "#7a8f96" }}>smart_toy</span>
            AI Receptionist
          </h1>
          <p style={{ fontSize: "14px", color: "#7a8f96", margin: "4px 0 0" }}>Configure your voice AI to handle calls automatically</p>
        </div>

        {/* Enable Toggle */}
        <div style={{ ...card, marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "24px", color: enabled ? "#22c55e" : "#7a8f96" }}>
              {enabled ? "phone_enabled" : "phone_disabled"}
            </span>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>Enable AI Receptionist</div>
              <div style={{ fontSize: "13px", color: "#7a8f96" }}>{enabled ? "AI is actively answering calls" : "AI receptionist is disabled"}</div>
            </div>
          </div>
          <button style={toggleStyle(enabled)} onClick={() => setEnabled(!enabled)}>
            <div style={toggleDot(enabled)} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          {/* AI Name */}
          <div style={card}>
            <div style={labelStyle}>AI Name</div>
            <input
              type="text"
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              style={inputStyle}
              placeholder="Nova"
            />
          </div>

          {/* Fallback */}
          <div style={card}>
            <div style={labelStyle}>Transfer to Human After</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="number"
                value={fallbackRings}
                onChange={(e) => setFallbackRings(e.target.value)}
                style={{ ...inputStyle, width: "80px", fontFamily: "Fira Code, monospace", textAlign: "center" }}
              />
              <span style={{ fontSize: "14px", color: "#7a8f96" }}>rings</span>
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ ...card, marginBottom: "24px" }}>
          <div style={labelStyle}>Salon Greeting</div>
          <textarea
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          />
          <div style={{ fontSize: "12px", color: "#606E74", marginTop: "8px" }}>
            Use [Salon Name] and [AI Name] as placeholders
          </div>
        </div>

        {/* Business Hours */}
        <div style={{ ...card, marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "8px", color: "#7a8f96" }}>schedule</span>
            Business Hours
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {hours.map((h, i) => (
              <div key={h.day} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "100px", fontSize: "14px", color: "#fff", fontWeight: 500 }}>{h.day}</div>
                <input
                  type="time"
                  value={h.start}
                  onChange={(e) => {
                    const updated = [...hours]
                    updated[i] = { ...updated[i], start: e.target.value }
                    setHours(updated)
                  }}
                  style={{ ...inputStyle, width: "140px", fontFamily: "Fira Code, monospace" }}
                />
                <span style={{ color: "#7a8f96" }}>to</span>
                <input
                  type="time"
                  value={h.end}
                  onChange={(e) => {
                    const updated = [...hours]
                    updated[i] = { ...updated[i], end: e.target.value }
                    setHours(updated)
                  }}
                  style={{ ...inputStyle, width: "140px", fontFamily: "Fira Code, monospace" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Services Checklist */}
        <div style={{ ...card, marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "8px", color: "#7a8f96" }}>checklist</span>
            Services AI Can Book
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {services.map((s, i) => (
              <label key={s.name} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "8px 12px", borderRadius: "8px", backgroundColor: s.checked ? "rgba(122,143,150,0.08)" : "transparent" }}>
                <input
                  type="checkbox"
                  checked={s.checked}
                  onChange={() => {
                    const updated = [...services]
                    updated[i] = { ...updated[i], checked: !updated[i].checked }
                    setServices(updated)
                  }}
                  style={{ accentColor: "#606E74", width: "16px", height: "16px" }}
                />
                <span style={{ fontSize: "14px", color: s.checked ? "#fff" : "#7a8f96" }}>{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={card}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "8px", color: "#7a8f96" }}>help</span>
            Custom FAQ
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            {faqs.map((f, i) => (
              <div key={i} style={{
                padding: "14px",
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>Q: {f.question}</div>
                    <div style={{ fontSize: "13px", color: "#7a8f96", lineHeight: 1.5 }}>A: {f.answer}</div>
                  </div>
                  <button
                    onClick={() => removeFaq(i)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#ef4444" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              type="text"
              value={newQ}
              onChange={(e) => setNewQ(e.target.value)}
              style={inputStyle}
              placeholder="Question..."
            />
            <input
              type="text"
              value={newA}
              onChange={(e) => setNewA(e.target.value)}
              style={inputStyle}
              placeholder="Answer..."
            />
            <button
              onClick={addFaq}
              style={{
                alignSelf: "flex-start",
                padding: "8px 16px",
                backgroundColor: "#606E74",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
              Add Q&A Pair
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
