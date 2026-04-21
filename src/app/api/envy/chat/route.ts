import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getEnvySystemPrompt } from "@/lib/envy/system-prompt"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, sessionId, conversationId, currentStep } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 })
    }

    // Load signup context if available
    let businessData: Record<string, any> = {}
    let email: string | undefined
    if (sessionId) {
      const session = await prisma.signupSession.findUnique({ where: { id: sessionId } })
      if (session) {
        businessData = (session.businessData || {}) as Record<string, any>
        email = session.email
      }
    }

    // Load or create conversation
    let conversation: any = null
    let messages: Array<{ role: string; content: string }> = []

    if (conversationId) {
      conversation = await prisma.envyConversation.findUnique({ where: { id: conversationId } })
      if (conversation) {
        messages = (conversation.messages || []) as Array<{ role: string; content: string }>
      }
    }

    // Add user message
    messages.push({ role: "user", content: message.trim() })

    // Build system prompt
    const systemPrompt = getEnvySystemPrompt({
      currentStep: currentStep || "email_pending",
      businessData,
      email,
    })

    // Call Anthropic Claude
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      // Fallback for dev without API key
      const fallback = "I'm Envy, your signup assistant! I'd love to chat, but my brain (the Anthropic API) isn't connected yet. Set the ANTHROPIC_API_KEY environment variable and I'll be fully functional."
      messages.push({ role: "assistant", content: fallback })

      const saved = await saveConversation(conversationId, sessionId, messages)
      return NextResponse.json({ reply: fallback, conversationId: saved.id })
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: messages.slice(-20).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error("[envy/chat] Anthropic error:", anthropicRes.status, errText)
      const fallback = "Hmm, my brain is taking a nap. Try again in a sec — I'll be back."
      messages.push({ role: "assistant", content: fallback })
      const saved = await saveConversation(conversationId, sessionId, messages)
      return NextResponse.json({ reply: fallback, conversationId: saved.id })
    }

    const data = await anthropicRes.json()
    const reply = data.content?.[0]?.text || "I'm here! What can I help with?"

    messages.push({ role: "assistant", content: reply })
    const saved = await saveConversation(conversationId, sessionId, messages)

    return NextResponse.json({ reply, conversationId: saved.id })
  } catch (error) {
    console.error("[envy/chat] Error:", error)
    return NextResponse.json({ error: "Envy is temporarily unavailable" }, { status: 500 })
  }
}

async function saveConversation(existingId: string | null, sessionId: string | null, messages: any[]) {
  if (existingId) {
    return prisma.envyConversation.update({
      where: { id: existingId },
      data: { messages, updatedAt: new Date() },
    })
  }
  return prisma.envyConversation.create({
    data: {
      signupSessionId: sessionId || null,
      context: "signup",
      messages,
    },
  })
}
