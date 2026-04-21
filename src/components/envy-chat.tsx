"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Scissors, X, Send, Loader2, Minimize2 } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface EnvyChatProps {
  sessionId?: string
  currentStep?: string
}

export function EnvyChat({ sessionId, currentStep }: EnvyChatProps) {
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [hasUnread, setHasUnread] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-greeting on first expand
  useEffect(() => {
    if (expanded && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hey! I'm Envy. I'll be here while you sign up — ask me anything about RunMySalon, or I can just wait quietly. Your call.",
      }])
      setHasUnread(false)
    }
  }, [expanded, messages.length])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const send = useCallback(async () => {
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: msg }])
    setLoading(true)

    try {
      const res = await fetch("/api/envy/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId, conversationId, currentStep }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
        if (data.conversationId) setConversationId(data.conversationId)
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Oops — my brain glitched. Try again?" }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, sessionId, conversationId, currentStep])

  // Collapsed bubble
  if (!expanded) {
    return (
      <button
        onClick={() => { setExpanded(true); setHasUnread(false) }}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #606E74, #7a8f96)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          transition: "transform 200ms",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Scissors size={24} strokeWidth={1.5} color="#ffffff" />
        {hasUnread && (
          <div style={{
            position: "absolute", top: -2, right: -2, width: 14, height: 14,
            borderRadius: "50%", backgroundColor: "#22c55e",
            border: "2px solid #06080d",
            animation: "pulse-dot 2s infinite",
          }} />
        )}
      </button>
    )
  }

  // Expanded chat
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 1000,
      width: 400, height: 560, maxWidth: "calc(100vw - 48px)", maxHeight: "calc(100vh - 48px)",
      backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, display: "flex", flexDirection: "column",
      boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, backgroundColor: "#606E74",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Scissors size={16} strokeWidth={1.5} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>Envy</div>
            <div style={{ fontSize: 11, color: "#22c55e" }}>Online</div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(false)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4 }}
        >
          <Minimize2 size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            maxWidth: "85%",
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            backgroundColor: m.role === "user" ? "#606E74" : "rgba(255,255,255,0.04)",
            border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.06)",
            borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
            padding: "10px 14px",
          }}>
            <p style={{ fontSize: 13, color: "#ffffff", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>
              {m.content}
            </p>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "14px 14px 14px 4px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Loader2 size={16} strokeWidth={1.5} color="#9ca3af" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: 8, flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask Envy anything..."
          style={{
            flex: 1, height: 40, backgroundColor: "#06080d",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
            padding: "0 12px", color: "#ffffff", fontSize: 13,
            fontFamily: "inherit", outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            width: 40, height: 40, borderRadius: 8,
            backgroundColor: input.trim() ? "#606E74" : "#2a2f33",
            border: "none", cursor: input.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Send size={16} strokeWidth={1.5} color={input.trim() ? "#ffffff" : "#6b7280"} />
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes pulse-dot { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
      `}</style>
    </div>
  )
}
