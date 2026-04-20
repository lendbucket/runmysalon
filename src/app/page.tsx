import Link from "next/link"
import { headers } from "next/headers"

export default async function RootPage() {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const hostname = host.split(":")[0]

  const match = hostname.match(/^(.+)\.runmysalon\.com$/)
  if (match && match[1] !== "portal" && match[1] !== "www" && match[1] !== "app") {
    const { redirect } = await import("next/navigation")
    redirect("/dashboard")
  }

  // On localhost in development, also redirect to dashboard if user is logged in
  if (hostname === "localhost") {
    const { getServerSession } = await import("next-auth")
    const { authOptions } = await import("@/lib/auth")
    const session = await getServerSession(authOptions)
    if (session) {
      const { redirect } = await import("next/navigation")
      redirect("/dashboard")
    }
  }

  return <LandingPage />
}

function LandingPage() {
  const features = [
    { icon: "calendar_month", title: "Smart Scheduling", desc: "AI-powered appointment management with automated reminders, waitlist, and rebook tracking." },
    { icon: "group", title: "Staff & Payroll", desc: "Commission tracking, automated payroll, onboarding, license verification, and performance goals." },
    { icon: "person", title: "Client Profiles", desc: "Formula history, visit tracking, preferences, card-on-file, and churn prediction." },
    { icon: "trending_up", title: "Performance AI", desc: "Goals, leaderboards, Reyna AI insights, retention analytics, and revenue forecasting." },
    { icon: "sync_alt", title: "Multi-POS Support", desc: "Works with Square, GlossGenius, Meevo, Vagaro, and our built-in Kasse POS." },
    { icon: "palette", title: "White Label", desc: "Your brand, your logo, your colors, your domain. Clients never see RunMySalon." },
  ]

  const integrations = ["Square", "GlossGenius", "Meevo", "Stripe", "Twilio", "Google", "Kasse"]

  const planFeatures = [
    "Unlimited staff members", "All locations included", "Appointment management",
    "Client profiles & formulas", "Payroll & commission tracking", "Performance goals & leaderboard",
    "AI receptionist", "Marketing automation", "Gift cards & loyalty",
    "Kiosk check-in mode", "White-label branding", "24/7 support",
  ]

  return (
    <div style={{ backgroundColor: "#06080d", color: "#FFFFFF", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Fira+Code:wght@400;500;600;700&display=swap" />

      {/* NAVBAR */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: "rgba(6,8,13,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#CDC9C0" }}>content_cut</span>
            <span style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em" }}>RunMySalon</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <a href="#features" style={{ color: "rgba(205,201,192,0.6)", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>Features</a>
            <a href="#pricing" style={{ color: "rgba(205,201,192,0.6)", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>Pricing</a>
            <a href="#integrations" style={{ color: "rgba(205,201,192,0.6)", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>Integrations</a>
            <Link href="/login" style={{ color: "rgba(205,201,192,0.8)", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>Sign In</Link>
            <Link href="/signup" style={{ padding: "10px 24px", backgroundColor: "#CDC9C0", color: "#06080d", borderRadius: "8px", textDecoration: "none", fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: "160px", paddingBottom: "100px", textAlign: "center", maxWidth: "900px", margin: "0 auto", paddingLeft: "24px", paddingRight: "24px" }}>
        <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: "20px", backgroundColor: "rgba(205,201,192,0.08)", border: "1px solid rgba(205,201,192,0.15)", marginBottom: "24px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#CDC9C0", letterSpacing: "0.05em" }}>Now in beta &mdash; 14-day free trial</span>
        </div>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 24px" }}>
          The complete management platform for modern salons
        </h1>
        <p style={{ fontSize: "18px", color: "rgba(205,201,192,0.6)", lineHeight: 1.6, maxWidth: "640px", margin: "0 auto 40px" }}>
          Appointments, staff, payroll, clients, and AI insights &mdash; all in one place. Works with Square, GlossGenius, Meevo, and more.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" style={{ padding: "16px 40px", backgroundColor: "#CDC9C0", color: "#06080d", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: "0 4px 20px rgba(205,201,192,0.2)" }}>
            Start Free Trial
          </Link>
          <a href="#features" style={{ padding: "16px 40px", backgroundColor: "transparent", border: "1px solid rgba(205,201,192,0.25)", color: "#CDC9C0", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Learn More
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#CDC9C0", letterSpacing: "0.25em", textTransform: "uppercase" }}>Features</span>
          <h2 style={{ fontSize: "36px", fontWeight: 800, margin: "12px 0 0", letterSpacing: "-0.02em" }}>Everything your salon needs</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {features.map(f => (
            <div key={f.title} style={{ backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "32px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 0 0 1px rgba(0,0,0,0.25)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#CDC9C0", marginBottom: "16px", display: "block" }}>{f.icon}</span>
              <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px" }}>{f.title}</h3>
              <p style={{ fontSize: "14px", color: "rgba(205,201,192,0.5)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integrations" style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <span style={{ fontSize: "10px", fontWeight: 800, color: "#CDC9C0", letterSpacing: "0.25em", textTransform: "uppercase" }}>Integrations</span>
        <h2 style={{ fontSize: "32px", fontWeight: 800, margin: "12px 0 40px", letterSpacing: "-0.02em" }}>Works with your current tools</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
          {integrations.map(name => (
            <div key={name} style={{ padding: "16px 32px", backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", fontSize: "15px", fontWeight: 600, color: "rgba(205,201,192,0.7)" }}>
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ maxWidth: "600px", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <span style={{ fontSize: "10px", fontWeight: 800, color: "#CDC9C0", letterSpacing: "0.25em", textTransform: "uppercase" }}>Pricing</span>
        <h2 style={{ fontSize: "32px", fontWeight: 800, margin: "12px 0 40px", letterSpacing: "-0.02em" }}>One plan. Everything included.</h2>
        <div style={{ backgroundColor: "#0d1117", border: "1px solid rgba(205,201,192,0.15)", borderRadius: "16px", padding: "48px 40px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 0 0 1px rgba(0,0,0,0.25)" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#CDC9C0", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>RunMySalon</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "4px", marginBottom: "8px" }}>
            <span style={{ fontSize: "56px", fontWeight: 900, fontFamily: "'Fira Code', monospace", letterSpacing: "-0.02em" }}>$99</span>
            <span style={{ fontSize: "16px", color: "rgba(205,201,192,0.5)" }}>/month</span>
          </div>
          <p style={{ fontSize: "14px", color: "rgba(205,201,192,0.5)", marginBottom: "32px" }}>14-day free trial &mdash; no credit card required</p>
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
            {planFeatures.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#22c55e" }}>check_circle</span>
                <span style={{ fontSize: "14px", color: "rgba(205,201,192,0.7)" }}>{f}</span>
              </div>
            ))}
          </div>
          <Link href="/signup" style={{ display: "block", padding: "16px", backgroundColor: "#CDC9C0", color: "#06080d", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>
            Start 14-Day Free Trial
          </Link>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>Trusted by salons nationwide</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {[
            { quote: "RunMySalon replaced three different tools we were paying for. Everything is in one place now.", name: "Sarah M.", role: "Salon Owner, Austin TX" },
            { quote: "The AI receptionist alone paid for itself in the first week. We never miss a call anymore.", name: "Jessica L.", role: "Studio Owner, Dallas TX" },
            { quote: "My stylists love the performance dashboard. It motivates them and makes payroll transparent.", name: "Maria R.", role: "Salon Owner, Houston TX" },
          ].map(t => (
            <div key={t.name} style={{ backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "28px" }}>
              <p style={{ fontSize: "14px", color: "rgba(205,201,192,0.7)", lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>{t.name}</div>
                <div style={{ fontSize: "12px", color: "rgba(205,201,192,0.4)" }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#CDC9C0" }}>content_cut</span>
              <span style={{ fontSize: "15px", fontWeight: 800 }}>RunMySalon</span>
            </div>
            <p style={{ fontSize: "12px", color: "rgba(205,201,192,0.3)", margin: 0 }}>The complete salon management platform</p>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            <a href="#" style={{ color: "rgba(205,201,192,0.4)", textDecoration: "none", fontSize: "12px" }}>Privacy Policy</a>
            <a href="#" style={{ color: "rgba(205,201,192,0.4)", textDecoration: "none", fontSize: "12px" }}>Terms of Service</a>
            <a href="mailto:support@runmysalon.com" style={{ color: "rgba(205,201,192,0.4)", textDecoration: "none", fontSize: "12px" }}>Contact</a>
          </div>
        </div>
        <div style={{ marginTop: "24px", fontSize: "11px", color: "rgba(205,201,192,0.2)", textAlign: "center" }}>
          Powered by Reyna Technology &mdash; Reyna Tech LLC &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
