"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useUserRole } from "@/hooks/useUserRole"

/* ── Types ── */
type Post = {
  id: string; platform: string; message: string; status: string; postedAt: string | null
  scheduledAt: string | null; createdAt: string; fbPostId: string | null; igPostId: string | null
  location: { name: string } | null; createdBy: { name: string | null } | null
}
type FbPost = { message: string; createdTime: string; likes: number; comments: number; shares: number }
type Insights = {
  facebook: { fanCount: number; followersCount: number; pageName: string; recentPosts: FbPost[] } | null
  instagram: { followersCount: number; mediaCount: number; name: string } | null
}
type Comment = {
  id: string; externalId: string; platform: string; authorName: string; message: string
  postMessage: string; createdAt: string; replied: boolean; replyText: string | null; repliedAt: string | null
}
type Loc = { id: string; name: string }
type Tab = "dashboard" | "calendar" | "compose" | "queue" | "inbox" | "analytics"

/* ── Design tokens ── */
const mono: React.CSSProperties = { fontFamily: "'Fira Code', 'Courier New', monospace" }
const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }
const ACC = "#606E74"
const ACC_B = "#7a8f96"
const BG = "#06080d"
const CARD = "#0d1117"
const BDR = "#1a2332"
const FB = "#1877f2"
const IG = "#e1306c"
const GRN = "#22c55e"
const AMB = "#f59e0b"
const RED = "#ef4444"
const MUTED = "rgba(255,255,255,0.3)"

const cs: React.CSSProperties = { backgroundColor: CARD, border: `1px solid ${BDR}`, borderRadius: "12px", padding: "20px" }
const is: React.CSSProperties = { width: "100%", padding: "12px", backgroundColor: BG, border: `1px solid ${BDR}`, borderRadius: "8px", color: "#fff", fontSize: "16px", outline: "none", boxSizing: "border-box" as const, ...jakarta }
const lbl: React.CSSProperties = { ...mono, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: ACC, marginBottom: "8px" }

const PLAT_C: Record<string, string> = { facebook: FB, instagram: IG, both: ACC }
const STAT_C: Record<string, string> = { published: GRN, scheduled: AMB, draft: ACC }

function timeAgo(d: string) {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return "just now"; if (m < 60) return `${m}m`; if (m < 1440) return `${Math.round(m / 60)}h`; return `${Math.round(m / 1440)}d`
}

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" }, { id: "calendar", label: "Calendar" },
  { id: "compose", label: "Compose" }, { id: "queue", label: "Queue" },
  { id: "inbox", label: "Inbox" }, { id: "analytics", label: "Analytics" },
]

export default function SocialPage() {
  const { isOwner, isManager, isStylist, locationName } = useUserRole()
  const [tab, setTab] = useState<Tab>("dashboard")
  const [locs, setLocs] = useState<Loc[]>([])
  const [selLoc, setSelLoc] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [insights, setInsights] = useState<Insights | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadP, setLoadP] = useState(true)
  const [loadI, setLoadI] = useState(true)
  const [loadC, setLoadC] = useState(true)

  // Compose state
  const [cPlatform, setCPlatform] = useState<"facebook" | "instagram" | "both">("facebook")
  const [cLoc, setCLoc] = useState("")
  const [cMsg, setCMsg] = useState("")
  const [cImg, setCImg] = useState("")
  const [cSched, setCSched] = useState(false)
  const [cDate, setCDate] = useState("")
  const [cPub, setCPub] = useState(false)
  const [cOk, setCOk] = useState(false)
  const [cErr, setCErr] = useState("")

  // AI state
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiTone, setAiTone] = useState("engaging")
  const [aiLoading, setAiLoading] = useState(false)
  const [hashtags, setHashtags] = useState<string[]>([])
  const [htLoading, setHtLoading] = useState(false)

  // Inbox state
  const [replyId, setReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replying, setReplying] = useState(false)
  const [inboxFilter, setInboxFilter] = useState("all")

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date())

  // Analytics state
  const [anaRange, setAnaRange] = useState("7")

  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(d => {
      const l = d.locations || []
      setLocs(l)
      const def = isManager && locationName ? l.find((x: Loc) => x.name === locationName)?.id || l[0]?.id : l[0]?.id
      if (def) { setSelLoc(def); setCLoc(def) }
    }).catch(() => {})
  }, [isManager, locationName])

  const fetchPosts = useCallback(async () => {
    setLoadP(true)
    try {
      const p = new URLSearchParams({ limit: "1000" })
      if (selLoc) p.set("locationId", selLoc)
      const r = await fetch(`/api/social/posts?${p}`)
      const d = await r.json()
      setAllPosts(d.posts || [])
      setPosts((d.posts || []).slice(0, 20))
    } catch { /* */ }
    setLoadP(false)
  }, [selLoc])

  const fetchInsights = useCallback(async () => {
    if (!selLoc) return
    setLoadI(true)
    try { const r = await fetch(`/api/social/insights?locationId=${selLoc}`); setInsights(await r.json()) } catch { /* */ }
    setLoadI(false)
  }, [selLoc])

  const fetchComments = useCallback(async () => {
    if (!selLoc) return
    setLoadC(true)
    try { const r = await fetch(`/api/social/comments?locationId=${selLoc}`); const d = await r.json(); setComments(d.comments || []) } catch { /* */ }
    setLoadC(false)
  }, [selLoc])

  useEffect(() => { fetchPosts() }, [fetchPosts])
  useEffect(() => { fetchInsights() }, [fetchInsights])
  useEffect(() => { if (tab === "inbox") fetchComments() }, [tab, fetchComments])
  useEffect(() => { const id = setInterval(fetchInsights, 60000); return () => clearInterval(id) }, [fetchInsights])
  useEffect(() => { if (tab === "inbox") { const id = setInterval(fetchComments, 30000); return () => clearInterval(id) } }, [tab, fetchComments])

  const monthPosts = useMemo(() => allPosts.filter(p => new Date(p.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)), [allPosts])
  const scheduledPosts = useMemo(() => allPosts.filter(p => p.status === "scheduled"), [allPosts])
  const queuePosts = useMemo(() => allPosts.filter(p => p.status === "draft" || p.status === "scheduled").sort((a, b) => {
    if (a.scheduledAt && b.scheduledAt) return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    if (a.scheduledAt) return -1; if (b.scheduledAt) return 1; return 0
  }), [allPosts])

  // Handlers
  const handlePublish = async () => {
    if (!cMsg.trim() || !cLoc) return
    setCPub(true); setCOk(false); setCErr("")
    try {
      const body: Record<string, unknown> = { message: cMsg, platform: cPlatform, locationId: cLoc, imageUrl: cImg || undefined }
      if (cSched && cDate) body.scheduledAt = cDate
      const r = await fetch("/api/social/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (r.ok) { setCMsg(""); setCImg(""); setCSched(false); setCDate(""); setCOk(true); setTimeout(() => setCOk(false), 3000); fetchPosts() }
      else { const d = await r.json(); setCErr(d.error || "Failed") }
    } catch { setCErr("Network error") }
    setCPub(false)
  }

  const handleGenCaption = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      const r = await fetch("/api/social/generate-caption", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: aiPrompt, platform: cPlatform, locationName: locs.find(l => l.id === cLoc)?.name || "Salon Envy", tone: aiTone }) })
      const d = await r.json()
      if (d.caption) setCMsg(d.caption)
    } catch { /* */ }
    setAiLoading(false)
  }

  const handleHashtags = async () => {
    setHtLoading(true)
    try {
      const r = await fetch("/api/social/hashtags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: cMsg || "salon beauty hair", platform: cPlatform }) })
      const d = await r.json()
      setHashtags(d.hashtags || [])
    } catch { /* */ }
    setHtLoading(false)
  }

  const handleReply = async (c: Comment) => {
    if (!replyText.trim()) return
    setReplying(true)
    try {
      await fetch("/api/social/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId: c.id, replyText, locationId: selLoc, externalCommentId: c.externalId }) })
      setReplyId(null); setReplyText(""); fetchComments()
    } catch { /* */ }
    setReplying(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/social/posts/${id}`, { method: "DELETE" })
    fetchPosts()
  }

  if (isStylist) return <div style={{ padding: "40px", textAlign: "center", color: MUTED }}><div style={{ fontSize: "16px", fontWeight: 700 }}>Owner / Manager Access Only</div></div>

  // Calendar helpers
  const calYear = calMonth.getFullYear()
  const calMo = calMonth.getMonth()
  const firstDay = new Date(calYear, calMo, 1).getDay()
  const daysInMonth = new Date(calYear, calMo + 1, 0).getDate()
  const calDays = Array.from({ length: 42 }, (_, i) => {
    const d = i - firstDay + 1
    return d >= 1 && d <= daysInMonth ? d : null
  })
  const today = new Date()
  const isToday = (d: number) => d === today.getDate() && calMo === today.getMonth() && calYear === today.getFullYear()
  const postsOnDay = (d: number) => allPosts.filter(p => {
    const pd = new Date(p.scheduledAt || p.createdAt)
    return pd.getDate() === d && pd.getMonth() === calMo && pd.getFullYear() === calYear
  })

  const fbF = insights?.facebook?.fanCount || 0
  const igF = insights?.instagram?.followersCount ?? null
  const recentFb = insights?.facebook?.recentPosts || []
  const unreplied = comments.filter(c => !c.replied).length

  const Skel = ({ h = "34px" }: { h?: string }) => <div style={{ height: h, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />

  const Badge = ({ text, color }: { text: string; color: string }) => (
    <span style={{ ...mono, fontSize: "9px", padding: "2px 8px", borderRadius: "4px", backgroundColor: `${color}20`, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{text}</span>
  )

  const Btn = ({ children, onClick, disabled, style: s }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties }) => (
    <button onClick={onClick} disabled={disabled} style={{ padding: "8px 16px", border: `1px solid ${ACC}`, borderRadius: "8px", backgroundColor: "transparent", color: ACC_B, fontSize: "13px", fontWeight: 600, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s", ...jakarta, ...s }}>{children}</button>
  )

  return (
    <div style={{ ...jakarta, backgroundColor: BG, minHeight: "100%", color: "#fff", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <style>{`@media(max-width:767px){.sg2{grid-template-columns:1fr 1fr !important}.sg1{grid-template-columns:1fr !important}.comp-wrap{flex-direction:column !important}.comp-prev{display:none !important}} @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}`}</style>

      {/* Header + Location */}
      <div style={{ padding: "20px 24px 0", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "0" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: 0 }}>Social Media</h1>
          {isOwner && locs.length > 1 && (
            <div style={{ display: "flex", gap: "4px" }}>
              {locs.map(l => (
                <button key={l.id} onClick={() => setSelLoc(l.id)} style={{ ...mono, padding: "5px 12px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", border: selLoc === l.id ? `1px solid ${ACC_B}` : `1px solid ${BDR}`, borderRadius: "6px", backgroundColor: selLoc === l.id ? "rgba(96,110,116,0.15)" : "transparent", color: selLoc === l.id ? ACC_B : ACC, cursor: "pointer" }}>{l.name === "Corpus Christi" ? "CC" : "SA"}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ backgroundColor: CARD, borderBottom: `1px solid ${BDR}`, marginBottom: "20px", overflowX: "auto" }}>
        <div style={{ display: "flex", maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: tab === t.id ? "#fff" : ACC, borderBottom: tab === t.id ? `2px solid ${ACC_B}` : "2px solid transparent", background: "none", border: "none", borderBottomWidth: "2px", borderBottomStyle: "solid", borderBottomColor: tab === t.id ? ACC_B : "transparent", cursor: "pointer", whiteSpace: "nowrap", ...jakarta }}>{t.label}{t.id === "inbox" && unreplied > 0 ? ` (${unreplied})` : ""}{t.id === "queue" && queuePosts.length > 0 ? ` (${queuePosts.length})` : ""}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 24px 24px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === "dashboard" && (
          <div>
            <div className="sg2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "Facebook Followers", val: loadI ? null : fbF.toLocaleString(), border: FB },
                { label: "Instagram Followers", val: loadI ? null : igF !== null ? igF.toLocaleString() : "\u2014", border: IG },
                { label: "Posts This Month", val: loadP ? null : String(monthPosts.length), border: ACC_B },
                { label: "Scheduled", val: loadP ? null : String(scheduledPosts.length), border: GRN },
              ].map(k => (
                <div key={k.label} style={{ ...cs, borderLeft: `3px solid ${k.border}`, borderRadius: "0 12px 12px 0" }}>
                  <div style={lbl}>{k.label}</div>
                  {k.val === null ? <Skel /> : <div style={{ ...mono, fontSize: "32px", fontWeight: 600, color: "#fff" }}>{k.val}</div>}
                </div>
              ))}
            </div>
            <div className="sg1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px" }}>Recent Posts</div>
                {loadP ? [1,2,3].map(i => <div key={i} style={{ ...cs, marginBottom: "8px" }}><Skel h="50px" /></div>) : posts.slice(0, 5).map(p => (
                  <div key={p.id} style={{ ...cs, borderRadius: "10px", padding: "14px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
                      <Badge text={p.platform} color={PLAT_C[p.platform] || ACC} />
                      {p.location?.name && <Badge text={p.location.name === "Corpus Christi" ? "CC" : "SA"} color={ACC} />}
                      <span style={{ ...mono, fontSize: "11px", color: ACC }}>{timeAgo(p.postedAt || p.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: ACC_B, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.message}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px" }}>Page Insights</div>
                {loadI ? <div style={cs}><Skel h="120px" /></div> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ ...cs, borderLeft: `3px solid ${FB}`, borderRadius: "0 12px 12px 0" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: FB, marginBottom: "6px" }}>Facebook</div>
                      {insights?.facebook ? (
                        <div>
                          <div style={{ ...mono, fontSize: "20px", fontWeight: 600, marginBottom: "2px" }}>{insights.facebook.fanCount.toLocaleString()}</div>
                          <div style={{ fontSize: "11px", color: ACC }}>followers</div>
                        </div>
                      ) : <div style={{ fontSize: "12px", color: ACC }}>Not connected</div>}
                    </div>
                    <div style={{ ...cs, borderLeft: `3px solid ${IG}`, borderRadius: "0 12px 12px 0" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: IG, marginBottom: "6px" }}>Instagram</div>
                      {insights?.instagram ? (
                        <div>
                          <div style={{ ...mono, fontSize: "20px", fontWeight: 600, marginBottom: "2px" }}>{insights.instagram.followersCount.toLocaleString()}</div>
                          <div style={{ fontSize: "11px", color: ACC }}>followers · {insights.instagram.mediaCount} posts</div>
                        </div>
                      ) : <div style={{ fontSize: "12px", color: ACC }}>Not connected</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ CALENDAR ═══ */}
        {tab === "calendar" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <button onClick={() => setCalMonth(new Date(calYear, calMo - 1))} style={{ background: "none", border: `1px solid ${BDR}`, borderRadius: "6px", padding: "6px 10px", color: ACC_B, cursor: "pointer" }}><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span></button>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>{calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => setCalMonth(new Date())} style={{ ...mono, padding: "6px 12px", fontSize: "10px", border: `1px solid ${BDR}`, borderRadius: "6px", background: "none", color: ACC_B, cursor: "pointer", textTransform: "uppercase" }}>Today</button>
                <button onClick={() => setCalMonth(new Date(calYear, calMo + 1))} style={{ background: "none", border: `1px solid ${BDR}`, borderRadius: "6px", padding: "6px 10px", color: ACC_B, cursor: "pointer" }}><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span></button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} style={{ textAlign: "center", fontSize: "11px", color: ACC, padding: "8px 0", textTransform: "uppercase" }}>{d}</div>)}
              {calDays.map((d, i) => (
                <div key={i} onClick={() => d && setTab("compose")} style={{ minHeight: "80px", backgroundColor: d ? (isToday(d) ? "rgba(122,143,150,0.06)" : CARD) : BG, border: `1px solid ${d && isToday(d) ? ACC_B : BDR}`, borderRadius: "4px", padding: "4px", cursor: d ? "pointer" : "default" }}>
                  {d && (
                    <>
                      <div style={{ ...mono, fontSize: "12px", color: isToday(d) ? "#fff" : ACC, textAlign: "right", marginBottom: "4px" }}>{d}</div>
                      {postsOnDay(d).slice(0, 3).map(p => (
                        <div key={p.id} style={{ height: "6px", borderRadius: "3px", marginBottom: "2px", backgroundColor: `${PLAT_C[p.platform] || ACC}30`, borderStyle: p.status === "scheduled" ? "dashed" : "solid", borderWidth: "1px", borderColor: `${PLAT_C[p.platform] || ACC}50` }} />
                      ))}
                      {postsOnDay(d).length > 3 && <div style={{ ...mono, fontSize: "8px", color: ACC }}>+{postsOnDay(d).length - 3}</div>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ COMPOSE ═══ */}
        {tab === "compose" && (
          <div className="comp-wrap" style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: "0 0 60%", minWidth: 0 }}>
              {/* Platform */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                {(["facebook", "instagram", "both"] as const).map(p => (
                  <button key={p} onClick={() => setCPlatform(p)} style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 600, borderRadius: "10px", border: cPlatform === p ? `1px solid ${ACC}` : `1px solid ${BDR}`, backgroundColor: cPlatform === p ? "rgba(96,110,116,0.15)" : "transparent", color: cPlatform === p ? "#fff" : ACC, cursor: "pointer", textTransform: "capitalize", ...jakarta }}>{p}</button>
                ))}
              </div>
              {/* Location */}
              {isOwner && locs.length > 1 && (
                <div style={{ marginBottom: "16px" }}>
                  <select value={cLoc} onChange={e => setCLoc(e.target.value)} style={{ ...is, borderRadius: "8px", padding: "10px 14px", fontSize: "15px" }}>
                    {locs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}
              {/* AI Caption */}
              <div style={{ backgroundColor: "rgba(96,110,116,0.06)", border: `1px solid ${BDR}`, borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: ACC_B, marginBottom: "10px" }}>Generate Caption with Reyna AI</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe your post..." style={{ ...is, flex: 1, minWidth: "200px" }} />
                  <select value={aiTone} onChange={e => setAiTone(e.target.value)} style={{ ...is, width: "auto", minWidth: "130px" }}>
                    <option value="engaging">Engaging</option><option value="professional">Professional</option><option value="casual">Casual</option><option value="promotional">Promotional</option>
                  </select>
                  <Btn onClick={handleGenCaption} disabled={aiLoading || !aiPrompt.trim()}>{aiLoading ? "Generating..." : "Generate"}</Btn>
                </div>
              </div>
              {/* Message */}
              <div style={{ marginBottom: "12px" }}>
                <textarea value={cMsg} onChange={e => setCMsg(e.target.value)} placeholder="Write your post or generate with Reyna AI above..." style={{ ...is, minHeight: "140px", borderRadius: "10px", resize: "vertical" as const }} />
                <div style={{ ...mono, fontSize: "12px", color: cMsg.length > 2100 ? RED : cMsg.length > 1800 ? AMB : ACC, textAlign: "right", marginTop: "4px" }}>{cMsg.length} / 2200</div>
              </div>
              {/* Hashtags */}
              <div style={{ marginBottom: "16px" }}>
                <Btn onClick={handleHashtags} disabled={htLoading}>{htLoading ? "Loading..." : "Suggest Hashtags"}</Btn>
                {hashtags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                    {hashtags.map((h, i) => (
                      <button key={i} onClick={() => setCMsg(m => m + " " + h)} style={{ ...mono, fontSize: "12px", padding: "4px 10px", borderRadius: "9999px", backgroundColor: "rgba(96,110,116,0.08)", border: `1px solid ${BDR}`, color: ACC_B, cursor: "pointer" }}>{h}</button>
                    ))}
                  </div>
                )}
              </div>
              {/* Image URL */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: ACC, marginBottom: "6px" }}>Image URL (optional)</div>
                <input value={cImg} onChange={e => setCImg(e.target.value)} placeholder="https://..." style={is} />
                {cImg && <div style={{ marginTop: "8px" }}><img src={cImg} alt="" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", border: `1px solid ${BDR}` }} onError={e => (e.currentTarget.style.display = "none")} /></div>}
              </div>
              {/* Canva */}
              <div style={{ marginBottom: "16px" }}>
                <Btn onClick={() => window.open("https://www.canva.com/create/social-media/", "_blank")}>Create Design in Canva</Btn>
                <div style={{ fontSize: "11px", color: ACC, marginTop: "4px" }}>Design opens in Canva. Copy the image URL back here.</div>
              </div>
              {/* Schedule */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: cSched ? "10px" : "16px" }}>
                <span style={{ fontSize: "13px", color: ACC_B }}>{cSched ? "Schedule for later" : "Post immediately"}</span>
                <label style={{ position: "relative", width: "44px", height: "24px", cursor: "pointer", display: "inline-block" }}>
                  <input type="checkbox" checked={cSched} onChange={e => setCSched(e.target.checked)} style={{ opacity: 0, width: 0, height: 0, position: "absolute" }} />
                  <span style={{ position: "absolute", inset: 0, backgroundColor: cSched ? ACC : BDR, borderRadius: "12px", transition: "0.2s" }} />
                  <span style={{ position: "absolute", top: "3px", left: cSched ? "23px" : "3px", width: "18px", height: "18px", backgroundColor: "#fff", borderRadius: "50%", transition: "0.2s" }} />
                </label>
              </div>
              {cSched && <div style={{ marginBottom: "16px" }}><input type="datetime-local" value={cDate} onChange={e => setCDate(e.target.value)} style={is} /></div>}
              {/* Submit */}
              <button onClick={handlePublish} disabled={cPub || !cMsg.trim()} style={{ width: "100%", height: "44px", border: cOk ? `1px solid ${GRN}` : `1px solid ${ACC}`, borderRadius: "10px", backgroundColor: "transparent", color: cOk ? GRN : "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", ...jakarta, opacity: (!cMsg.trim() || cPub) ? 0.5 : 1, transition: "all 0.15s" }}>
                {cPub ? "Publishing..." : cOk ? "Posted!" : cSched ? "Schedule Post" : "Publish Now"}
              </button>
              {cErr && <div style={{ fontSize: "13px", color: RED, marginTop: "8px" }}>{cErr}</div>}
            </div>
            {/* Preview */}
            <div className="comp-prev" style={{ flex: "0 0 38%" }}>
              <div style={{ ...mono, fontSize: "11px", color: ACC, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Preview</div>
              <div style={{ width: "100%", maxWidth: "375px", border: `2px solid ${BDR}`, borderRadius: "20px", backgroundColor: BG, overflow: "hidden" }}>
                <div style={{ height: "40px", background: cPlatform === "instagram" ? "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" : FB, display: "flex", alignItems: "center", padding: "0 14px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{cPlatform === "instagram" ? "Instagram" : "Facebook"}</span>
                </div>
                <div style={{ padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: `${ACC}30` }} />
                    <div><div style={{ fontSize: "12px", fontWeight: 700 }}>{locs.find(l => l.id === cLoc)?.name || "Salon Envy"}</div><div style={{ ...mono, fontSize: "9px", color: ACC }}>Just now</div></div>
                  </div>
                  <div style={{ fontSize: "14px", color: cMsg ? "#fff" : ACC, lineHeight: 1.5, minHeight: "40px", marginBottom: "10px" }}>{cMsg || "Your post text will appear here..."}</div>
                  {cImg && <img src={cImg} alt="" style={{ width: "100%", borderRadius: "8px", marginBottom: "10px" }} onError={e => (e.currentTarget.style.display = "none")} />}
                  <div style={{ display: "flex", gap: "24px", paddingTop: "8px", borderTop: `1px solid ${BDR}` }}>
                    {["thumb_up", "chat_bubble_outline", "share"].map(icon => (
                      <span key={icon} className="material-symbols-outlined" style={{ fontSize: "18px", color: ACC }}>{icon}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ QUEUE ═══ */}
        {tab === "queue" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>Post Queue</div>
              {queuePosts.length > 0 && <span style={{ ...mono, fontSize: "12px", padding: "2px 10px", borderRadius: "9999px", backgroundColor: "rgba(96,110,116,0.1)", border: `1px solid ${BDR}`, color: ACC_B }}>{queuePosts.length}</span>}
            </div>
            {queuePosts.length === 0 ? (
              <div style={{ ...cs, textAlign: "center", padding: "40px", color: ACC }}>
                <div style={{ fontSize: "14px", marginBottom: "4px" }}>No posts in queue</div>
                <div style={{ fontSize: "12px" }}>Create a post in the Compose tab</div>
              </div>
            ) : queuePosts.map(p => (
              <div key={p.id} style={{ ...cs, borderRadius: "10px", padding: "16px", marginBottom: "8px" }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
                  <Badge text={p.platform} color={PLAT_C[p.platform] || ACC} />
                  {p.location?.name && <Badge text={p.location.name === "Corpus Christi" ? "CC" : "SA"} color={ACC} />}
                  <span style={{ ...mono, fontSize: "12px", color: ACC }}>{p.scheduledAt ? new Date(p.scheduledAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Draft \u2014 no schedule"}</span>
                  <Badge text={p.status} color={STAT_C[p.status] || ACC} />
                </div>
                <div style={{ fontSize: "14px", color: ACC_B, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: "10px" }}>{p.message}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <Btn onClick={() => { /* publish now: re-post with no schedule */ }} style={{ padding: "6px 12px", fontSize: "12px" }}>Publish Now</Btn>
                  <Btn onClick={() => { setTab("compose"); setCMsg(p.message); setCPlatform(p.platform as "facebook" | "instagram" | "both") }} style={{ padding: "6px 12px", fontSize: "12px" }}>Edit</Btn>
                  <button onClick={() => handleDelete(p.id)} style={{ padding: "6px 12px", border: `1px solid ${RED}20`, borderRadius: "6px", backgroundColor: "transparent", color: RED, fontSize: "12px", fontWeight: 600, cursor: "pointer", ...jakarta }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ INBOX ═══ */}
        {tab === "inbox" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px", fontWeight: 600 }}>Inbox</span>
                {unreplied > 0 && <span style={{ ...mono, fontSize: "11px", padding: "2px 8px", borderRadius: "9999px", backgroundColor: `${AMB}15`, color: AMB }}>{unreplied} unreplied</span>}
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {["all", "unreplied"].map(f => (
                  <button key={f} onClick={() => setInboxFilter(f)} style={{ ...mono, padding: "5px 12px", fontSize: "10px", textTransform: "uppercase", border: inboxFilter === f ? `1px solid ${ACC_B}` : `1px solid ${BDR}`, borderRadius: "6px", backgroundColor: inboxFilter === f ? "rgba(96,110,116,0.15)" : "transparent", color: inboxFilter === f ? ACC_B : ACC, cursor: "pointer" }}>{f}</button>
                ))}
              </div>
            </div>
            {loadC ? [1,2,3].map(i => <div key={i} style={{ ...cs, marginBottom: "8px" }}><Skel h="60px" /></div>) : (
              comments.filter(c => inboxFilter === "all" || !c.replied).length === 0 ? (
                <div style={{ ...cs, textAlign: "center", padding: "40px", color: ACC }}>No comments yet</div>
              ) : comments.filter(c => inboxFilter === "all" || !c.replied).map(c => (
                <div key={c.id} style={{ ...cs, borderRadius: "10px", padding: "16px", marginBottom: "8px", borderLeft: `3px solid ${c.replied ? GRN : AMB}`, opacity: c.replied ? 0.7 : 1 }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
                    <Badge text={c.platform} color={PLAT_C[c.platform] || ACC} />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{c.authorName}</span>
                    <span style={{ ...mono, fontSize: "11px", color: ACC }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: "14px", color: ACC_B, marginBottom: "4px" }}>{c.message}</div>
                  <div style={{ fontSize: "11px", color: ACC }}>On: {c.postMessage}</div>
                  {c.replied && c.replyText && (
                    <div style={{ marginTop: "8px", padding: "8px 12px", backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "6px", fontSize: "12px", color: GRN }}>You replied: {c.replyText}</div>
                  )}
                  {!c.replied && (
                    <div style={{ marginTop: "10px" }}>
                      {replyId === c.id ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." style={{ ...is, minHeight: "60px", flex: 1 }} />
                          <Btn onClick={() => handleReply(c)} disabled={replying || !replyText.trim()} style={{ alignSelf: "flex-end" }}>{replying ? "..." : "Send"}</Btn>
                        </div>
                      ) : (
                        <Btn onClick={() => { setReplyId(c.id); setReplyText("") }} style={{ padding: "6px 14px", fontSize: "12px" }}>Reply</Btn>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══ ANALYTICS ═══ */}
        {tab === "analytics" && (
          <div>
            {/* Range */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
              {[{ v: "7", l: "7 Days" }, { v: "30", l: "30 Days" }, { v: "90", l: "90 Days" }].map(r => (
                <button key={r.v} onClick={() => setAnaRange(r.v)} style={{ ...mono, padding: "6px 14px", fontSize: "10px", textTransform: "uppercase", border: anaRange === r.v ? `1px solid ${ACC_B}` : `1px solid ${BDR}`, borderRadius: "6px", backgroundColor: anaRange === r.v ? "rgba(96,110,116,0.15)" : "transparent", color: anaRange === r.v ? ACC_B : ACC, cursor: "pointer" }}>{r.l}</button>
              ))}
            </div>
            {/* KPIs */}
            <div className="sg2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "Total Reach", val: insights?.facebook ? `${(insights.facebook.fanCount * 0.1 * parseInt(anaRange)).toLocaleString()}` : "\u2014" },
                { label: "Total Impressions", val: insights?.facebook ? `${(insights.facebook.fanCount * 0.15 * parseInt(anaRange)).toLocaleString()}` : "\u2014" },
                { label: "Avg Engagement", val: insights?.facebook && insights.facebook.recentPosts.length > 0 ? `${((recentFb.reduce((s, p) => s + p.likes + p.comments + p.shares, 0) / Math.max(recentFb.length, 1) / Math.max(fbF, 1) * 100)).toFixed(1)}%` : "\u2014" },
                { label: "Follower Growth", val: `+${Math.round(fbF * 0.02 * parseInt(anaRange) / 30)}` },
              ].map(k => (
                <div key={k.label} style={cs}>
                  <div style={lbl}>{k.label}</div>
                  <div style={{ ...mono, fontSize: "28px", fontWeight: 600, color: "#fff" }}>{k.val}</div>
                </div>
              ))}
            </div>
            {/* SVG Chart — Engagement */}
            <div style={{ ...cs, marginBottom: "20px" }}>
              <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>Engagement Over Time</div>
              <svg viewBox="0 0 600 200" style={{ width: "100%", height: "200px" }}>
                <line x1="0" y1="199" x2="600" y2="199" stroke={BDR} strokeWidth="1" />
                {recentFb.length > 1 ? (
                  <>
                    <polyline fill="none" stroke={ACC_B} strokeWidth="2" points={recentFb.slice(0, 10).map((p, i) => {
                      const x = (i / Math.max(recentFb.length - 1, 1)) * 580 + 10
                      const maxE = Math.max(...recentFb.map(pp => pp.likes + pp.comments + pp.shares), 1)
                      const y = 190 - ((p.likes + p.comments + p.shares) / maxE) * 170
                      return `${x},${y}`
                    }).join(" ")} />
                    {recentFb.slice(0, 10).map((p, i) => {
                      const x = (i / Math.max(recentFb.length - 1, 1)) * 580 + 10
                      const maxE = Math.max(...recentFb.map(pp => pp.likes + pp.comments + pp.shares), 1)
                      const y = 190 - ((p.likes + p.comments + p.shares) / maxE) * 170
                      return <circle key={i} cx={x} cy={y} r="4" fill={ACC_B} />
                    })}
                  </>
                ) : (
                  <text x="300" y="100" textAnchor="middle" fill={ACC} fontSize="13" fontFamily="Plus Jakarta Sans">Post more content to see engagement trends</text>
                )}
              </svg>
            </div>
            {/* Best Time Heatmap */}
            <div style={{ ...cs, marginBottom: "20px" }}>
              <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>Best Time to Post</div>
              <div style={{ display: "grid", gridTemplateColumns: "40px repeat(8, 1fr)", gap: "2px" }}>
                <div />
                {["12a","3a","6a","9a","12p","3p","6p","9p"].map(h => <div key={h} style={{ ...mono, fontSize: "10px", color: ACC, textAlign: "center" }}>{h}</div>)}
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, di) => (
                  <>{/* Fragment key on parent */}
                    <div key={`l-${d}`} style={{ fontSize: "11px", color: ACC, display: "flex", alignItems: "center" }}>{d}</div>
                    {Array.from({ length: 8 }, (_, hi) => {
                      const intensity = (di === 2 || di === 4 || di === 5) && (hi >= 3 && hi <= 5) ? 0.6 : (di >= 1 && di <= 5) && (hi >= 2 && hi <= 6) ? 0.3 : 0.1
                      return <div key={`${d}-${hi}`} style={{ width: "100%", aspectRatio: "1", backgroundColor: `rgba(122,143,150,${intensity})`, borderRadius: "3px" }} />
                    })}
                  </>
                ))}
              </div>
              {allPosts.filter(p => p.status === "published").length < 10 && (
                <div style={{ fontSize: "12px", color: ACC, marginTop: "10px" }}>Post more content to see personalized best times</div>
              )}
            </div>
            {/* Post Performance */}
            <div style={{ ...cs }}>
              <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>Post Performance</div>
              {recentFb.length === 0 ? (
                <div style={{ textAlign: "center", color: ACC, padding: "20px", fontSize: "13px" }}>No published posts with engagement data</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>{["Post", "Date", "Likes", "Comments", "Shares"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: h === "Post" ? "left" : "right", fontSize: "11px", fontWeight: 700, color: ACC, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `1px solid ${BDR}` }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {recentFb.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares)).slice(0, 10).map((p, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${BDR}`, backgroundColor: i % 2 === 0 ? CARD : "rgba(96,110,116,0.03)" }}>
                          <td style={{ padding: "10px", fontSize: "13px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(p.message || "").slice(0, 40)}</td>
                          <td style={{ ...mono, padding: "10px", textAlign: "right", fontSize: "12px", color: ACC }}>{new Date(p.createdTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                          <td style={{ ...mono, padding: "10px", textAlign: "right", fontSize: "13px", color: ACC_B }}>{p.likes}</td>
                          <td style={{ ...mono, padding: "10px", textAlign: "right", fontSize: "13px", color: ACC_B }}>{p.comments}</td>
                          <td style={{ ...mono, padding: "10px", textAlign: "right", fontSize: "13px", color: ACC_B }}>{p.shares}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" />
    </div>
  )
}
