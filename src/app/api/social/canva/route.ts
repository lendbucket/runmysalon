import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import crypto from "crypto"

const CID = process.env.CANVA_CLIENT_ID || ""
const CSEC = process.env.CANVA_CLIENT_SECRET || ""

function redir() { return `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/social/canva?action=callback` }
function base() { return process.env.NEXTAUTH_URL || "http://localhost:3000" }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const action = req.nextUrl.searchParams.get("action")

  if (action === "auth") {
    const cv = crypto.randomBytes(32).toString("base64url")
    const cc = crypto.createHash("sha256").update(cv).digest("base64url")
    const url = `https://www.canva.com/api/oauth/authorize?response_type=code&client_id=${CID}&redirect_uri=${encodeURIComponent(redir())}&scope=design:content:read%20design:meta:read%20asset:read%20profile:read&code_challenge=${cc}&code_challenge_method=S256`
    const res = NextResponse.redirect(url)
    res.cookies.set("canva_cv", cv, { httpOnly: true, secure: true, maxAge: 600, path: "/" })
    return res
  }

  if (action === "callback") {
    const code = req.nextUrl.searchParams.get("code")
    if (!code) return NextResponse.redirect(`${base()}/social?error=canva_no_code`)
    const cv = req.cookies.get("canva_cv")?.value
    if (!cv) return NextResponse.redirect(`${base()}/social?error=canva_no_verifier`)
    try {
      const r = await fetch("https://api.canva.com/rest/v1/oauth/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redir(), client_id: CID, client_secret: CSEC, code_verifier: cv }).toString(),
      })
      const d = await r.json()
      const res = NextResponse.redirect(`${base()}/social?tab=design&canva=connected`)
      if (d.access_token) res.cookies.set("canva_at", d.access_token, { httpOnly: true, secure: true, maxAge: 3600, path: "/" })
      if (d.refresh_token) res.cookies.set("canva_rt", d.refresh_token, { httpOnly: true, secure: true, maxAge: 86400 * 30, path: "/" })
      res.cookies.delete("canva_cv")
      return res
    } catch { return NextResponse.redirect(`${base()}/social?error=canva_token_fail`) }
  }

  if (action === "status") {
    const t = req.cookies.get("canva_at")?.value
    if (!t) return NextResponse.json({ connected: false })
    try {
      const r = await fetch("https://api.canva.com/rest/v1/users/me", { headers: { Authorization: `Bearer ${t}` } })
      if (!r.ok) return NextResponse.json({ connected: false })
      return NextResponse.json({ connected: true, user: await r.json() })
    } catch { return NextResponse.json({ connected: false }) }
  }

  if (action === "designs") {
    const t = req.cookies.get("canva_at")?.value
    if (!t) return NextResponse.json({ needsAuth: true })
    const pt = req.nextUrl.searchParams.get("page_token")
    let url = "https://api.canva.com/rest/v1/designs?limit=20"
    if (pt) url += `&continuation=${pt}`
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${t}` } })
      if (r.status === 401) return NextResponse.json({ needsAuth: true })
      const d = await r.json()
      return NextResponse.json({ designs: d.items || [], continuation: d.continuation })
    } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 }) }
  }

  if (action === "export") {
    const t = req.cookies.get("canva_at")?.value
    if (!t) return NextResponse.json({ needsAuth: true })
    const did = req.nextUrl.searchParams.get("design_id")
    if (!did) return NextResponse.json({ error: "No design_id" }, { status: 400 })
    try {
      const er = await fetch(`https://api.canva.com/rest/v1/designs/${did}/exports`, {
        method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify({ format: { type: "png" } }),
      })
      const ed = await er.json()
      const jid = ed.job?.id
      if (!jid) return NextResponse.json({ error: "Export not created" }, { status: 500 })
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000))
        const pr = await fetch(`https://api.canva.com/rest/v1/exports/${jid}`, { headers: { Authorization: `Bearer ${t}` } })
        const pd = await pr.json()
        if (pd.job?.status === "success") return NextResponse.json({ url: (pd.job?.urls || [])[0] || null })
        if (pd.job?.status === "failed") break
      }
      return NextResponse.json({ error: "Export timed out" }, { status: 500 })
    } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 }) }
  }

  if (action === "disconnect") {
    const res = NextResponse.json({ disconnected: true })
    res.cookies.delete("canva_at"); res.cookies.delete("canva_rt")
    return res
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
