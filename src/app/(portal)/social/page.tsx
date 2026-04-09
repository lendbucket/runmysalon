"use client"
import { useCallback, useEffect, useState } from "react"
import { useUserRole } from "@/hooks/useUserRole"

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
type Loc = { id: string; name: string }

const mono: React.CSSProperties = { fontFamily: "'Fira Code', 'Courier New', monospace" }
const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }

const MUTED = "rgba(255,255,255,0.3)"
const MID = "rgba(255,255,255,0.6)"
const ACC = "#606E74"
const ACC_BRIGHT = "#7a8f96"

const cardStyle: React.CSSProperties = { backgroundColor: "#0d1117", border: "1px solid #1a2332", borderRadius: "12px", padding: "20px" }
const inputStyle: React.CSSProperties = { width: "100%", padding: "12px", backgroundColor: "#06080d", border: "1px solid #1a2332", borderRadius: "8px", color: "#fff", fontSize: "16px", outline: "none", boxSizing: "border-box" as const, ...jakarta }

function timeAgo(d: string) {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}

const PLATFORM_COLORS: Record<string, string> = { facebook: "#1877f2", instagram: "#e1306c", both: ACC }
const STATUS_COLORS: Record<string, string> = { published: "#22c55e", scheduled: "#f59e0b", draft: ACC }

export default function SocialPage() {
  const { isOwner, isManager, isStylist, locationName } = useUserRole()

  const [locations, setLocations] = useState<Loc[]>([])
  const [selectedLoc, setSelectedLoc] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [postsTotal, setPostsTotal] = useState(0)
  const [postsPage, setPostsPage] = useState(1)
  const [postsTotalPages, setPostsTotalPages] = useState(1)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(true)
  const [monthCount, setMonthCount] = useState(0)
  const [scheduledCount, setScheduledCount] = useState(0)

  // Create form
  const [platform, setPlatform] = useState<"facebook" | "instagram" | "both">("facebook")
  const [postLoc, setPostLoc] = useState("")
  const [message, setMessage] = useState("")
  const [scheduleToggle, setScheduleToggle] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)

  // Load locations
  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(d => {
      const locs = d.locations || []
      setLocations(locs)
      if (locs.length > 0) {
        const defaultLoc = isManager && locationName
          ? locs.find((l: Loc) => l.name === locationName)?.id || locs[0].id
          : locs[0].id
        setSelectedLoc(defaultLoc)
        setPostLoc(defaultLoc)
      }
    }).catch(() => {})
  }, [isManager, locationName])

  // Load posts
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true)
    try {
      const params = new URLSearchParams({ page: String(postsPage), limit: "10" })
      if (selectedLoc) params.set("locationId", selectedLoc)
      const res = await fetch(`/api/social/posts?${params}`)
      const data = await res.json()
      setPosts(data.posts || [])
      setPostsTotal(data.total || 0)
      setPostsTotalPages(data.totalPages || 1)
    } catch { /* noop */ }
    setLoadingPosts(false)
  }, [selectedLoc, postsPage])

  // Load insights
  const fetchInsights = useCallback(async () => {
    if (!selectedLoc) return
    setLoadingInsights(true)
    try {
      const res = await fetch(`/api/social/insights?locationId=${selectedLoc}`)
      const data = await res.json()
      setInsights(data)
    } catch { /* noop */ }
    setLoadingInsights(false)
  }, [selectedLoc])

  // Load counts
  const fetchCounts = useCallback(async () => {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const params = new URLSearchParams({ limit: "1000" })
      if (selectedLoc) params.set("locationId", selectedLoc)
      const res = await fetch(`/api/social/posts?${params}`)
      const data = await res.json()
      const allPosts: Post[] = data.posts || []
      setMonthCount(allPosts.filter(p => new Date(p.createdAt) >= new Date(monthStart)).length)
      setScheduledCount(allPosts.filter(p => p.status === "scheduled").length)
    } catch { /* noop */ }
  }, [selectedLoc])

  useEffect(() => { fetchPosts() }, [fetchPosts])
  useEffect(() => { fetchInsights(); fetchCounts() }, [fetchInsights, fetchCounts])
  useEffect(() => {
    const id = setInterval(fetchInsights, 60000)
    return () => clearInterval(id)
  }, [fetchInsights])

  const handlePublish = async () => {
    if (!message.trim() || !postLoc) return
    setPublishing(true)
    setPublishSuccess(false)
    try {
      const body: Record<string, unknown> = { message, platform, locationId: postLoc }
      if (scheduleToggle && scheduleDate) body.scheduledAt = scheduleDate
      const res = await fetch("/api/social/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.ok) {
        setMessage(""); setScheduleToggle(false); setScheduleDate("")
        setPublishSuccess(true)
        setTimeout(() => setPublishSuccess(false), 3000)
        fetchPosts(); fetchCounts()
      }
    } catch { /* noop */ }
    setPublishing(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/social/posts/${id}`, { method: "DELETE" })
    fetchPosts(); fetchCounts()
  }

  if (isStylist) {
    return <div style={{ padding: "40px", textAlign: "center", color: MUTED }}><span className="material-symbols-outlined" style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>lock</span><div style={{ fontSize: "16px", fontWeight: 700 }}>Owner / Manager Access Only</div></div>
  }

  const fbFollowers = insights?.facebook?.fanCount || 0
  const igFollowers = insights?.instagram?.followersCount ?? null

  return (
    <div style={{ ...jakarta, backgroundColor: "#06080d", minHeight: "100%", color: "#fff", padding: "24px", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <style>{`@media(max-width:767px){.social-grid{grid-template-columns:1fr 1fr !important}.social-insights{grid-template-columns:1fr !important}} @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}`}</style>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Social Media</h1>
          {isOwner && locations.length > 1 && (
            <div style={{ display: "flex", gap: "6px" }}>
              {locations.map(loc => (
                <button key={loc.id} onClick={() => { setSelectedLoc(loc.id); setPostsPage(1) }} style={{ padding: "6px 12px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: selectedLoc === loc.id ? `1px solid ${ACC_BRIGHT}` : "1px solid #1a2332", borderRadius: "6px", backgroundColor: selectedLoc === loc.id ? "rgba(96,110,116,0.15)" : "transparent", color: selectedLoc === loc.id ? ACC_BRIGHT : MUTED, cursor: "pointer", ...mono }}>{loc.name === "Corpus Christi" ? "CC" : "SA"}</button>
              ))}
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="social-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Facebook Followers", value: loadingInsights ? null : String(fbFollowers.toLocaleString()) },
            { label: "Instagram Followers", value: loadingInsights ? null : igFollowers !== null ? String(igFollowers.toLocaleString()) : "\u2014" },
            { label: "Posts This Month", value: loadingPosts ? null : String(monthCount) },
            { label: "Scheduled", value: loadingPosts ? null : String(scheduledCount) },
          ].map(kpi => (
            <div key={kpi.label} style={cardStyle}>
              <div style={{ ...mono, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: ACC, marginBottom: "8px" }}>{kpi.label}</div>
              {kpi.value === null ? (
                <div style={{ height: "34px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />
              ) : (
                <div style={{ ...mono, fontSize: "28px", fontWeight: 600, color: "#fff" }}>{kpi.value}</div>
              )}
            </div>
          ))}
        </div>

        {/* Create Post Panel */}
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "16px" }}>Create Post</div>

          {/* Platform pills */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            {(["facebook", "instagram", "both"] as const).map(p => (
              <button key={p} onClick={() => setPlatform(p)} style={{ padding: "8px 16px", fontSize: "13px", borderRadius: "8px", border: platform === p ? `1px solid ${ACC}` : "1px solid #1a2332", backgroundColor: platform === p ? "rgba(96,110,116,0.2)" : "transparent", color: platform === p ? "#fff" : ACC, cursor: "pointer", textTransform: "capitalize", ...jakarta }}>{p}</button>
            ))}
          </div>

          {/* Location select */}
          {isOwner && locations.length > 1 && (
            <div style={{ marginBottom: "14px" }}>
              <select value={postLoc} onChange={e => setPostLoc(e.target.value)} style={{ ...inputStyle, fontSize: "16px" }}>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}

          {/* Message */}
          <div style={{ marginBottom: "14px" }}>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your post..." style={{ ...inputStyle, minHeight: "100px", resize: "vertical" as const, fontSize: "15px" }} />
            <div style={{ ...mono, fontSize: "12px", color: ACC, textAlign: "right", marginTop: "4px" }}>{message.length} / 2200</div>
          </div>

          {/* Schedule toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: scheduleToggle ? "10px" : "14px" }}>
            <span style={{ fontSize: "13px", color: ACC_BRIGHT }}>{scheduleToggle ? "Schedule for later" : "Post now"}</span>
            <label style={{ position: "relative", width: "44px", height: "24px", cursor: "pointer" }}>
              <input type="checkbox" checked={scheduleToggle} onChange={e => setScheduleToggle(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: "absolute", inset: 0, backgroundColor: scheduleToggle ? ACC : "#1a2332", borderRadius: "12px", transition: "0.2s" }} />
              <span style={{ position: "absolute", top: "3px", left: scheduleToggle ? "23px" : "3px", width: "18px", height: "18px", backgroundColor: "#fff", borderRadius: "50%", transition: "0.2s" }} />
            </label>
          </div>
          {scheduleToggle && (
            <div style={{ marginBottom: "14px" }}>
              <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ ...inputStyle, fontSize: "16px" }} />
            </div>
          )}

          {/* Submit */}
          <button onClick={handlePublish} disabled={publishing || !message.trim()} style={{ padding: "10px 20px", border: `1px solid ${ACC}`, borderRadius: "8px", backgroundColor: publishSuccess ? "rgba(34,197,94,0.1)" : "transparent", color: publishSuccess ? "#22c55e" : ACC_BRIGHT, fontSize: "14px", fontWeight: 600, cursor: "pointer", ...jakarta, opacity: (!message.trim() || publishing) ? 0.5 : 1, transition: "all 0.2s" }}>
            {publishing ? "Publishing..." : publishSuccess ? "Published" : scheduleToggle ? "Schedule Post" : "Publish Now"}
          </button>
        </div>

        {/* Recent Posts */}
        <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "12px" }}>Recent Posts</div>
        {loadingPosts ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: "80px", ...cardStyle, animation: "pulse 1.5s ease-in-out infinite" }} />)}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: "40px", color: ACC }}>No posts yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            {posts.map(p => (
              <div key={p.id} style={{ ...cardStyle, borderRadius: "10px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <span style={{ ...mono, fontSize: "10px", padding: "2px 8px", borderRadius: "4px", backgroundColor: `${PLATFORM_COLORS[p.platform] || ACC}20`, color: PLATFORM_COLORS[p.platform] || ACC, textTransform: "uppercase" }}>{p.platform}</span>
                  {p.location?.name && <span style={{ ...mono, fontSize: "10px", padding: "2px 8px", borderRadius: "4px", backgroundColor: `${ACC}15`, color: ACC }}>{p.location.name === "Corpus Christi" ? "CC" : "SA"}</span>}
                  <span style={{ ...mono, fontSize: "12px", color: ACC }}>{timeAgo(p.postedAt || p.createdAt)}</span>
                  <span style={{ ...mono, fontSize: "9px", padding: "2px 7px", borderRadius: "4px", backgroundColor: `${STATUS_COLORS[p.status] || ACC}15`, color: STATUS_COLORS[p.status] || ACC, textTransform: "uppercase" }}>{p.status}</span>
                  {isOwner && (
                    <button onClick={() => handleDelete(p.id)} style={{ marginLeft: "auto", background: "none", border: "none", color: ACC, cursor: "pointer", padding: "2px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                    </button>
                  )}
                </div>
                <div style={{ fontSize: "14px", color: ACC_BRIGHT, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.message}</div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {postsTotalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
            <span style={{ ...mono, fontSize: "11px", color: ACC }}>Showing {(postsPage - 1) * 10 + 1}-{Math.min(postsPage * 10, postsTotal)} of {postsTotal} posts</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => setPostsPage(p => Math.max(1, p - 1))} disabled={postsPage <= 1} style={{ padding: "6px 14px", fontSize: "10px", fontWeight: 700, border: "1px solid #1a2332", borderRadius: "6px", backgroundColor: "transparent", color: postsPage <= 1 ? MUTED : ACC_BRIGHT, cursor: postsPage <= 1 ? "default" : "pointer", ...mono }}>Previous</button>
              <button onClick={() => setPostsPage(p => Math.min(postsTotalPages, p + 1))} disabled={postsPage >= postsTotalPages} style={{ padding: "6px 14px", fontSize: "10px", fontWeight: 700, border: "1px solid #1a2332", borderRadius: "6px", backgroundColor: "transparent", color: postsPage >= postsTotalPages ? MUTED : ACC_BRIGHT, cursor: postsPage >= postsTotalPages ? "default" : "pointer", ...mono }}>Next</button>
            </div>
          </div>
        )}

        {/* Insights */}
        <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "12px" }}>Page Insights</div>
        <div className="social-insights" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {/* Facebook */}
          <div style={{ ...cardStyle, borderLeft: "3px solid #1877f2", borderRadius: "0 12px 12px 0" }}>
            {loadingInsights ? (
              <div style={{ height: "120px", animation: "pulse 1.5s ease-in-out infinite" }} />
            ) : insights?.facebook ? (
              <>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#1877f2", marginBottom: "4px" }}>Facebook</div>
                <div style={{ ...mono, fontSize: "24px", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>{insights.facebook.fanCount.toLocaleString()}</div>
                <div style={{ fontSize: "11px", color: ACC, marginBottom: "14px" }}>followers</div>
                {insights.facebook.recentPosts.slice(0, 5).map((fp, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid rgba(26,35,50,0.8)`, fontSize: "11px" }}>
                    <span style={{ color: MID, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>{fp.message || "(no text)"}</span>
                    <span style={{ ...mono, color: ACC, flexShrink: 0 }}>{fp.likes}L {fp.comments}C</span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ color: ACC, fontSize: "13px" }}>Facebook not connected</div>
            )}
          </div>

          {/* Instagram */}
          <div style={{ ...cardStyle, borderLeft: "3px solid #e1306c", borderRadius: "0 12px 12px 0" }}>
            {loadingInsights ? (
              <div style={{ height: "120px", animation: "pulse 1.5s ease-in-out infinite" }} />
            ) : insights?.instagram ? (
              <>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#e1306c", marginBottom: "4px" }}>Instagram</div>
                <div style={{ ...mono, fontSize: "24px", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>{insights.instagram.followersCount.toLocaleString()}</div>
                <div style={{ fontSize: "11px", color: ACC, marginBottom: "4px" }}>followers</div>
                <div style={{ ...mono, fontSize: "12px", color: ACC }}>{insights.instagram.mediaCount} posts</div>
              </>
            ) : (
              <div style={{ color: ACC, fontSize: "13px" }}>Instagram not connected</div>
            )}
          </div>
        </div>
      </div>

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" />
    </div>
  )
}
