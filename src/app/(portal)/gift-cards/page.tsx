"use client"
import { useEffect, useState } from "react"
import { useUserRole } from "@/hooks/useUserRole"

const ACC = "#606E74", ACC_B = "#7a8f96", ACC_DIM = "rgba(96,110,116,0.08)", ACC_BDR = "rgba(96,110,116,0.2)"
const BORDER = "rgba(255,255,255,0.06)", CARD_BG = "#0d1117"
const CARD_SHADOW = "inset 0 1px 0 rgba(255,255,255,0.02), inset 1px 0 0 rgba(255,255,255,0.01), 0 0 0 1px rgba(0,0,0,0.25)"
const MUTED = "rgba(255,255,255,0.3)", MID = "rgba(255,255,255,0.6)"
const GREEN = "#10B981", AMBER = "#ffb347", RED = "#ff6b6b", GRAY = "#6b7280"
const GOLD_BG = "#CDC9C0", GOLD_TEXT = "#0f1d24"
const mono: React.CSSProperties = { fontFamily: "'Fira Code', monospace" }
const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

type Tab = "active" | "sold" | "redeemed" | "settings"
type GiftCardStatus = "active" | "partially_used" | "fully_redeemed" | "expired"

interface GiftCard {
  id: string
  code: string
  amount: number
  balance: number
  recipientName: string
  recipientEmail: string
  message: string
  issuedAt: string
  expiresAt: string
  status: GiftCardStatus
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `GC-${seg()}-${seg()}-${seg()}`
}

const PRESET_AMOUNTS = [25, 50, 75, 100]

const DEMO_CARDS: GiftCard[] = [
  { id: "1", code: "GC-XKRM-7N4P-Q2LJ", amount: 10000, balance: 10000, recipientName: "Sarah Johnson", recipientEmail: "sarah@email.com", message: "Happy Birthday!", issuedAt: "2026-04-10", expiresAt: "2027-04-10", status: "active" },
  { id: "2", code: "GC-WF3K-8YHT-M6NB", amount: 5000, balance: 2500, recipientName: "Mike Chen", recipientEmail: "mike@email.com", message: "Thank you for the referral!", issuedAt: "2026-03-22", expiresAt: "2027-03-22", status: "partially_used" },
  { id: "3", code: "GC-P9DJ-4AXC-V8RL", amount: 7500, balance: 0, recipientName: "Emily Davis", recipientEmail: "emily@email.com", message: "Enjoy your new look!", issuedAt: "2026-02-14", expiresAt: "2027-02-14", status: "fully_redeemed" },
  { id: "4", code: "GC-L2TN-6BMP-H5GK", amount: 2500, balance: 2500, recipientName: "Alex Turner", recipientEmail: "alex@email.com", message: "Merry Christmas!", issuedAt: "2025-12-20", expiresAt: "2026-12-20", status: "active" },
]

export default function GiftCardsPage() {
  const { isOwner, isManager } = useUserRole()
  const [tab, setTab] = useState<Tab>("active")
  const [cards, setCards] = useState<GiftCard[]>(DEMO_CARDS)
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Settings
  const [giftCardsEnabled, setGiftCardsEnabled] = useState(true)
  const [onlinePurchaseEnabled, setOnlinePurchaseEnabled] = useState(false)

  // Issue form
  const [formAmount, setFormAmount] = useState(50)
  const [formCustomAmount, setFormCustomAmount] = useState("")
  const [formIsCustom, setFormIsCustom] = useState(false)
  const [formRecipientName, setFormRecipientName] = useState("")
  const [formRecipientEmail, setFormRecipientEmail] = useState("")
  const [formMessage, setFormMessage] = useState("")

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  if (!isOwner && !isManager) {
    return <div style={{ padding: "40px", textAlign: "center", color: MID, ...jakarta }}>Access restricted to owners and managers.</div>
  }

  const statusColor: Record<GiftCardStatus, string> = { active: GREEN, partially_used: AMBER, fully_redeemed: GRAY, expired: RED }
  const statusLabel: Record<GiftCardStatus, string> = { active: "Active", partially_used: "Partial", fully_redeemed: "Redeemed", expired: "Expired" }

  const filteredCards = (() => {
    if (tab === "active") return cards.filter(c => c.status === "active" || c.status === "partially_used")
    if (tab === "sold") return [...cards].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
    if (tab === "redeemed") return cards.filter(c => c.status === "fully_redeemed")
    return []
  })()

  const totalActiveValue = cards.filter(c => c.status === "active" || c.status === "partially_used").reduce((a, c) => a + c.balance, 0)
  const totalSold = cards.reduce((a, c) => a + c.amount, 0)

  const handleIssue = () => {
    const amount = formIsCustom ? Math.round(parseFloat(formCustomAmount) * 100) || 0 : formAmount * 100
    if (amount <= 0 || !formRecipientName.trim()) return

    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 1)

    const newCard: GiftCard = {
      id: Date.now().toString(),
      code: generateCode(),
      amount,
      balance: amount,
      recipientName: formRecipientName,
      recipientEmail: formRecipientEmail,
      message: formMessage,
      issuedAt: new Date().toISOString().split("T")[0],
      expiresAt: expiryDate.toISOString().split("T")[0],
      status: "active",
    }
    setCards(prev => [newCard, ...prev])
    setShowModal(false)
    setFormAmount(50)
    setFormCustomAmount("")
    setFormIsCustom(false)
    setFormRecipientName("")
    setFormRecipientEmail("")
    setFormMessage("")
  }

  const fmtCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "active", label: "Active Cards", icon: "card_giftcard" },
    { key: "sold", label: "Sold", icon: "point_of_sale" },
    { key: "redeemed", label: "Redeemed", icon: "redeem" },
    { key: "settings", label: "Settings", icon: "settings" },
  ]

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,0.03)",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box" as const,
    ...jakarta,
  }

  return (
    <div style={{ padding: isMobile ? "16px" : "24px 32px", maxWidth: "1100px", margin: "0 auto", ...jakarta }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>Gift Cards</h1>
          <p style={{ color: MUTED, fontSize: "12px", marginTop: "4px" }}>Issue, track, and manage gift cards</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "10px 24px", borderRadius: "8px",
          fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" as const,
          cursor: "pointer", border: "none", background: GOLD_BG, color: GOLD_TEXT,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add_card</span>
          Issue Gift Card
        </button>
      </div>

      {/* Summary stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
        gap: "12px",
        marginBottom: "24px",
      }}>
        {[
          { label: "Active Balance", value: fmtCurrency(totalActiveValue), icon: "account_balance_wallet", color: GREEN },
          { label: "Total Sold", value: fmtCurrency(totalSold), icon: "trending_up", color: AMBER },
          { label: "Cards Issued", value: cards.length.toString(), icon: "card_giftcard", color: ACC_B },
          { label: "Fully Redeemed", value: cards.filter(c => c.status === "fully_redeemed").length.toString(), icon: "redeem", color: GRAY },
        ].map(s => (
          <div key={s.label} style={{
            background: CARD_BG,
            borderRadius: "10px",
            border: `1px solid ${BORDER}`,
            boxShadow: CARD_SHADOW,
            padding: "16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: s.color }}>{s.icon}</span>
              <span style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{s.label}</span>
            </div>
            <div style={{ color: "#fff", fontSize: "20px", fontWeight: 800, ...mono }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
            borderRadius: "8px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const,
            cursor: "pointer", border: "1px solid", whiteSpace: "nowrap" as const,
            backgroundColor: tab === t.key ? ACC_DIM : "transparent",
            borderColor: tab === t.key ? ACC_BDR : "transparent",
            color: tab === t.key ? "#fff" : MUTED,
            transition: "all 0.15s ease",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings Tab */}
      {tab === "settings" && (
        <div style={{
          background: CARD_BG,
          borderRadius: "12px",
          border: `1px solid ${BORDER}`,
          boxShadow: CARD_SHADOW,
          padding: "24px",
        }}>
          <h3 style={{ color: "#fff", fontSize: "15px", fontWeight: 700, margin: "0 0 20px" }}>Gift Card Settings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Enable toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>Enable Gift Cards</div>
                <div style={{ color: MUTED, fontSize: "11px", marginTop: "2px" }}>Allow issuing and redeeming gift cards</div>
              </div>
              <button onClick={() => setGiftCardsEnabled(!giftCardsEnabled)} style={{
                width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
                background: giftCardsEnabled ? GREEN : "rgba(255,255,255,0.1)",
                position: "relative" as const, transition: "background 0.2s",
              }}>
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
                  position: "absolute" as const, top: "3px",
                  left: giftCardsEnabled ? "23px" : "3px",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
            {/* Online purchase toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
              <div>
                <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>Allow Online Purchase</div>
                <div style={{ color: MUTED, fontSize: "11px", marginTop: "2px" }}>Let clients purchase gift cards from your booking site</div>
              </div>
              <button onClick={() => setOnlinePurchaseEnabled(!onlinePurchaseEnabled)} style={{
                width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
                background: onlinePurchaseEnabled ? GREEN : "rgba(255,255,255,0.1)",
                position: "relative" as const, transition: "background 0.2s",
              }}>
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
                  position: "absolute" as const, top: "3px",
                  left: onlinePurchaseEnabled ? "23px" : "3px",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards Table (active, sold, redeemed tabs) */}
      {tab !== "settings" && (
        <div style={{
          background: CARD_BG,
          borderRadius: "12px",
          border: `1px solid ${BORDER}`,
          boxShadow: CARD_SHADOW,
          overflow: "hidden",
        }}>
          {filteredCards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "40px", color: MUTED, display: "block", marginBottom: "12px" }}>card_giftcard</span>
              <div style={{ color: MID, fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>No gift cards in this category</div>
              <div style={{ color: MUTED, fontSize: "12px" }}>Issue a gift card to get started</div>
            </div>
          ) : (
            <>
              {/* Table header */}
              {!isMobile && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "160px 80px 80px 1fr 100px 100px 80px",
                  gap: "12px",
                  padding: "12px 20px",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: MUTED,
                  borderBottom: `1px solid ${BORDER}`,
                }}>
                  <div>Code</div>
                  <div style={{ textAlign: "right" }}>Amount</div>
                  <div style={{ textAlign: "right" }}>Balance</div>
                  <div>Recipient</div>
                  <div>Issued</div>
                  <div>Expires</div>
                  <div style={{ textAlign: "center" }}>Status</div>
                </div>
              )}
              {filteredCards.map(card => (
                isMobile ? (
                  <div key={card.id} style={{
                    padding: "16px 20px",
                    borderBottom: `1px solid ${BORDER}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ color: ACC_B, fontSize: "12px", fontWeight: 600, ...mono }}>{card.code}</span>
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 700,
                        textTransform: "uppercase" as const,
                        background: `${statusColor[card.status]}18`, color: statusColor[card.status],
                      }}>{statusLabel[card.status]}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>{card.recipientName}</span>
                      <span style={{ color: "#fff", fontSize: "14px", fontWeight: 700, ...mono }}>{fmtCurrency(card.balance)}</span>
                    </div>
                    <div style={{ color: MUTED, fontSize: "11px" }}>
                      {fmtCurrency(card.amount)} issued &middot; Exp {card.expiresAt}
                    </div>
                  </div>
                ) : (
                  <div key={card.id} style={{
                    display: "grid",
                    gridTemplateColumns: "160px 80px 80px 1fr 100px 100px 80px",
                    gap: "12px",
                    padding: "12px 20px",
                    borderBottom: `1px solid ${BORDER}`,
                    alignItems: "center",
                  }}>
                    <div style={{ color: ACC_B, fontSize: "12px", fontWeight: 600, ...mono }}>{card.code}</div>
                    <div style={{ color: MID, fontSize: "13px", textAlign: "right", ...mono }}>{fmtCurrency(card.amount)}</div>
                    <div style={{ color: "#fff", fontSize: "13px", fontWeight: 700, textAlign: "right", ...mono }}>{fmtCurrency(card.balance)}</div>
                    <div>
                      <div style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>{card.recipientName}</div>
                      {card.recipientEmail && <div style={{ color: MUTED, fontSize: "10px" }}>{card.recipientEmail}</div>}
                    </div>
                    <div style={{ color: MID, fontSize: "11px" }}>{card.issuedAt}</div>
                    <div style={{ color: MID, fontSize: "11px" }}>{card.expiresAt}</div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 700,
                        textTransform: "uppercase" as const,
                        background: `${statusColor[card.status]}18`, color: statusColor[card.status],
                      }}>{statusLabel[card.status]}</span>
                    </div>
                  </div>
                )
              ))}
            </>
          )}
        </div>
      )}

      {/* Issue Gift Card Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: "#111820",
            borderRadius: "14px",
            border: `1px solid ${BORDER}`,
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            width: "100%",
            maxWidth: "480px",
            maxHeight: "90vh",
            overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px", borderBottom: `1px solid ${BORDER}`,
            }}>
              <h3 style={{ color: "#fff", fontSize: "16px", fontWeight: 700, margin: 0 }}>Issue Gift Card</h3>
              <button onClick={() => setShowModal(false)} style={{
                background: "transparent", border: "none", cursor: "pointer", color: MUTED, padding: "4px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Amount */}
              <div>
                <label style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: "8px" }}>Amount</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {PRESET_AMOUNTS.map(amt => (
                    <button key={amt} onClick={() => { setFormAmount(amt); setFormIsCustom(false) }} style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: `1px solid ${!formIsCustom && formAmount === amt ? ACC_BDR : BORDER}`,
                      background: !formIsCustom && formAmount === amt ? ACC_DIM : "transparent",
                      color: !formIsCustom && formAmount === amt ? "#fff" : MUTED,
                      ...mono,
                    }}>${amt}</button>
                  ))}
                  <button onClick={() => setFormIsCustom(true)} style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                    cursor: "pointer",
                    border: `1px solid ${formIsCustom ? ACC_BDR : BORDER}`,
                    background: formIsCustom ? ACC_DIM : "transparent",
                    color: formIsCustom ? "#fff" : MUTED,
                  }}>Custom</button>
                </div>
                {formIsCustom && (
                  <div style={{ marginTop: "10px", position: "relative" as const }}>
                    <span style={{ position: "absolute" as const, left: "14px", top: "50%", transform: "translateY(-50%)", color: MUTED, fontSize: "14px", ...mono }}>$</span>
                    <input
                      type="number"
                      value={formCustomAmount}
                      onChange={e => setFormCustomAmount(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                      style={{ ...inputStyle, paddingLeft: "28px", ...mono }}
                    />
                  </div>
                )}
              </div>

              {/* Recipient */}
              <div>
                <label style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" }}>Recipient Name</label>
                <input value={formRecipientName} onChange={e => setFormRecipientName(e.target.value)} placeholder="Full name" style={inputStyle} />
              </div>

              <div>
                <label style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" }}>Recipient Email</label>
                <input type="email" value={formRecipientEmail} onChange={e => setFormRecipientEmail(e.target.value)} placeholder="email@example.com" style={inputStyle} />
              </div>

              <div>
                <label style={{ color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" }}>Personal Message</label>
                <textarea
                  value={formMessage}
                  onChange={e => setFormMessage(e.target.value)}
                  placeholder="Happy Birthday! Enjoy your gift..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
              </div>

              <div style={{
                background: "rgba(255,255,255,0.02)",
                borderRadius: "8px",
                padding: "12px 16px",
                border: `1px solid ${BORDER}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: MUTED, fontSize: "11px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>info</span>
                  Expires in 1 year from issue date
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              display: "flex", gap: "12px", padding: "20px 24px",
              borderTop: `1px solid ${BORDER}`,
            }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: "10px", borderRadius: "8px",
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                cursor: "pointer", border: `1px solid ${BORDER}`, background: "transparent", color: MUTED,
              }}>Cancel</button>
              <button onClick={handleIssue} style={{
                flex: 2, padding: "10px", borderRadius: "8px",
                fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" as const,
                cursor: "pointer", border: "none", background: GOLD_BG, color: GOLD_TEXT,
                opacity: formRecipientName.trim() ? 1 : 0.5,
              }}>
                Issue {fmtCurrency(formIsCustom ? Math.round(parseFloat(formCustomAmount || "0") * 100) : formAmount * 100)} Gift Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
