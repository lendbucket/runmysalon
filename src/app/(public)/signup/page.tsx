"use client";

import { useState, useCallback, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FormData {
  // Step 1
  salonName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  // Step 2
  posSystem: string;
  posToken: string;
  posApiKey: string;
  posSiteId: string;
  // Step 3
  businessModel: string;
  commissionRate: number;
  numStylists: number;
  numLocations: number;
  // Step 4
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

const INITIAL_FORM: FormData = {
  salonName: "",
  ownerName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "TX",
  zip: "",
  posSystem: "",
  posToken: "",
  posApiKey: "",
  posSiteId: "",
  businessModel: "1099",
  commissionRate: 40,
  numStylists: 1,
  numLocations: 1,
  password: "",
  confirmPassword: "",
  termsAccepted: false,
};

/* ------------------------------------------------------------------ */
/*  POS options                                                        */
/* ------------------------------------------------------------------ */

const POS_OPTIONS = [
  {
    id: "kasse",
    name: "Kasse",
    subtitle: "Our built-in POS — no setup required",
    icon: "point_of_sale",
    recommended: true,
    disabled: false,
    fields: [],
  },
  {
    id: "square",
    name: "Square",
    subtitle: "Connect your Square account",
    icon: "square",
    recommended: false,
    disabled: false,
    fields: ["token"],
  },
  {
    id: "glossgenius",
    name: "GlossGenius",
    subtitle: "Connect your GlossGenius account",
    icon: "auto_awesome",
    recommended: false,
    disabled: false,
    fields: ["apiKey"],
  },
  {
    id: "meevo",
    name: "Meevo",
    subtitle: "Connect your Meevo account",
    icon: "hub",
    recommended: false,
    disabled: false,
    fields: ["apiKey", "siteId"],
  },
  {
    id: "vagaro",
    name: "Vagaro",
    subtitle: "Coming soon",
    icon: "event_available",
    recommended: false,
    disabled: true,
    fields: [],
  },
  {
    id: "later",
    name: "I'll set this up later",
    subtitle: "Skip POS setup for now",
    icon: "schedule",
    recommended: false,
    disabled: false,
    fields: [],
  },
];

const BUSINESS_MODELS = [
  { id: "1099", label: "1099 Commission", desc: "Independent contractor model" },
  { id: "booth", label: "Booth Rental", desc: "Stylists rent their station" },
  { id: "w2", label: "W2 Employees", desc: "Traditional employee model" },
  { id: "hybrid", label: "Hybrid", desc: "Mix of contractor & employee" },
];

const FEATURES = [
  "Appointment management",
  "Staff & payroll",
  "Client profiles",
  "Performance tracking",
  "AI-powered insights",
  "Works with Square, GlossGenius, Meevo & more",
];

/* ------------------------------------------------------------------ */
/*  Inline styles (design-token driven)                                */
/* ------------------------------------------------------------------ */

const T = {
  bg: "#06080d",
  card: "#0d1117",
  border: "rgba(255,255,255,0.06)",
  primary: "#606E74",
  bright: "#7a8f96",
  gold: "#CDC9C0",
  goldText: "#06080d",
  white: "#ffffff",
  muted: "rgba(255,255,255,0.5)",
  error: "#f87171",
  green: "#4ade80",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  fontMono: "'Fira Code', monospace",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /* fonts + icons via <link> */
  useEffect(() => {
    const links = [
      {
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap",
        rel: "stylesheet",
      },
      {
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap",
        rel: "stylesheet",
      },
    ];
    const els: HTMLLinkElement[] = [];
    links.forEach(({ href, rel }) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const el = document.createElement("link");
        el.rel = rel;
        el.href = href;
        document.head.appendChild(el);
        els.push(el);
      }
    });
    return () => els.forEach((el) => el.remove());
  }, []);

  /* helpers */
  const set = useCallback(
    (key: keyof FormData, value: string | number | boolean) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  /* ---------- validation ---------- */

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.salonName.trim()) errs.salonName = "Salon name is required";
      if (!form.ownerName.trim()) errs.ownerName = "Your name is required";
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = "Enter a valid email";
      if (!form.phone.trim()) errs.phone = "Phone is required";
      else if (!/^\+?[\d\s()-]{7,}$/.test(form.phone))
        errs.phone = "Enter a valid phone number";
    }
    if (s === 2) {
      if (!form.posSystem) errs.posSystem = "Select a POS system";
      const opt = POS_OPTIONS.find((p) => p.id === form.posSystem);
      if (opt) {
        if (opt.fields.includes("token") && !form.posToken.trim())
          errs.posToken = "Access token is required";
        if (opt.fields.includes("apiKey") && !form.posApiKey.trim())
          errs.posApiKey = "API key is required";
        if (opt.fields.includes("siteId") && !form.posSiteId.trim())
          errs.posSiteId = "Site ID is required";
      }
    }
    if (s === 3) {
      if (form.numStylists < 1) errs.numStylists = "At least 1 stylist";
      if (form.numLocations < 1) errs.numLocations = "At least 1 location";
    }
    if (s === 4) {
      if (form.password.length < 8)
        errs.password = "Password must be at least 8 characters";
      if (form.password !== form.confirmPassword)
        errs.confirmPassword = "Passwords do not match";
      if (!form.termsAccepted)
        errs.termsAccepted = "You must accept the terms";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4));
  };
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Signup failed");
      }
      // success — redirect to login or dashboard
      window.location.href = "/login?registered=1";
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================================================================ */
  /*  Render helpers                                                   */
  /* ================================================================ */

  const icon = (name: string, style?: React.CSSProperties) => (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: 20, ...style }}
    >
      {name}
    </span>
  );

  const fieldLabel = (text: string, required?: boolean) => (
    <label
      style={{
        display: "block",
        fontSize: 13,
        fontWeight: 500,
        color: T.bright,
        marginBottom: 6,
        fontFamily: T.fontBody,
      }}
    >
      {text}
      {required && <span style={{ color: T.error, marginLeft: 2 }}>*</span>}
    </label>
  );

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "10px 14px",
    background: T.bg,
    border: `1px solid ${hasError ? T.error : T.border}`,
    borderRadius: 8,
    color: T.white,
    fontSize: 14,
    fontFamily: T.fontBody,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  });

  const errorText = (key: string) =>
    errors[key] ? (
      <span
        style={{
          fontSize: 12,
          color: T.error,
          marginTop: 4,
          display: "block",
          fontFamily: T.fontBody,
        }}
      >
        {errors[key]}
      </span>
    ) : null;

  /* ================================================================ */
  /*  Step renderers                                                   */
  /* ================================================================ */

  const renderStep1 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        {fieldLabel("Salon Name", true)}
        <input
          style={inputStyle(!!errors.salonName)}
          placeholder="e.g. Salon Envy"
          value={form.salonName}
          onChange={(e) => set("salonName", e.target.value)}
        />
        {errorText("salonName")}
      </div>
      <div>
        {fieldLabel("Your Name", true)}
        <input
          style={inputStyle(!!errors.ownerName)}
          placeholder="First and last name"
          value={form.ownerName}
          onChange={(e) => set("ownerName", e.target.value)}
        />
        {errorText("ownerName")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          {fieldLabel("Email", true)}
          <input
            type="email"
            style={inputStyle(!!errors.email)}
            placeholder="you@salon.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
          {errorText("email")}
        </div>
        <div>
          {fieldLabel("Phone", true)}
          <input
            type="tel"
            style={inputStyle(!!errors.phone)}
            placeholder="(555) 123-4567"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          {errorText("phone")}
        </div>
      </div>
      <div>
        {fieldLabel("Business Address")}
        <input
          style={inputStyle()}
          placeholder="Street address"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14 }}>
        <div>
          {fieldLabel("City")}
          <input
            style={inputStyle()}
            placeholder="City"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div>
          {fieldLabel("State")}
          <input
            style={inputStyle()}
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
          />
        </div>
        <div>
          {fieldLabel("ZIP")}
          <input
            style={inputStyle()}
            placeholder="75001"
            value={form.zip}
            onChange={(e) => set("zip", e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const selected = POS_OPTIONS.find((p) => p.id === form.posSystem);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {errors.posSystem && (
          <span style={{ fontSize: 13, color: T.error, fontFamily: T.fontBody }}>
            {errors.posSystem}
          </span>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {POS_OPTIONS.map((pos) => {
            const isSelected = form.posSystem === pos.id;
            const borderColor = pos.disabled
              ? T.border
              : pos.recommended && isSelected
                ? T.gold
                : isSelected
                  ? T.bright
                  : T.border;
            return (
              <button
                key={pos.id}
                type="button"
                disabled={pos.disabled}
                onClick={() => {
                  set("posSystem", pos.id);
                  set("posToken", "");
                  set("posApiKey", "");
                  set("posSiteId", "");
                }}
                style={{
                  position: "relative",
                  background: isSelected ? "rgba(96,110,116,0.1)" : T.card,
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 12,
                  padding: "22px 16px 18px",
                  cursor: pos.disabled ? "not-allowed" : "pointer",
                  opacity: pos.disabled ? 0.4 : 1,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transition: "border-color 0.2s, background 0.2s",
                  fontFamily: T.fontBody,
                }}
              >
                {pos.recommended && (
                  <span
                    style={{
                      position: "absolute",
                      top: -10,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: T.gold,
                      color: T.goldText,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 10px",
                      borderRadius: 20,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      fontFamily: T.fontBody,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Recommended
                  </span>
                )}
                {icon(pos.icon, {
                  fontSize: 32,
                  color: isSelected ? T.bright : T.muted,
                })}
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: T.white,
                  }}
                >
                  {pos.name}
                </span>
                <span style={{ fontSize: 12, color: T.muted, lineHeight: 1.3 }}>
                  {pos.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* conditional POS fields */}
        {selected && selected.fields.length > 0 && (
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.bright,
                fontFamily: T.fontBody,
              }}
            >
              {selected.name} credentials
            </span>
            {selected.fields.includes("token") && (
              <div>
                {fieldLabel("Access Token", true)}
                <input
                  style={{ ...inputStyle(!!errors.posToken), fontFamily: T.fontMono }}
                  placeholder="sq0atp-..."
                  value={form.posToken}
                  onChange={(e) => set("posToken", e.target.value)}
                />
                {errorText("posToken")}
              </div>
            )}
            {selected.fields.includes("apiKey") && (
              <div>
                {fieldLabel("API Key", true)}
                <input
                  style={{ ...inputStyle(!!errors.posApiKey), fontFamily: T.fontMono }}
                  placeholder="Enter API key"
                  value={form.posApiKey}
                  onChange={(e) => set("posApiKey", e.target.value)}
                />
                {errorText("posApiKey")}
              </div>
            )}
            {selected.fields.includes("siteId") && (
              <div>
                {fieldLabel("Site ID", true)}
                <input
                  style={{ ...inputStyle(!!errors.posSiteId), fontFamily: T.fontMono }}
                  placeholder="Enter Site ID"
                  value={form.posSiteId}
                  onChange={(e) => set("posSiteId", e.target.value)}
                />
                {errorText("posSiteId")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* business model */}
      <div>
        <span
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: T.bright,
            marginBottom: 10,
            fontFamily: T.fontBody,
          }}
        >
          Business Model
        </span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          {BUSINESS_MODELS.map((bm) => {
            const active = form.businessModel === bm.id;
            return (
              <button
                key={bm.id}
                type="button"
                onClick={() => set("businessModel", bm.id)}
                style={{
                  background: active ? "rgba(96,110,116,0.12)" : T.card,
                  border: `1.5px solid ${active ? T.bright : T.border}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: T.fontBody,
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: `2px solid ${active ? T.bright : T.muted}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {active && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: T.bright,
                        }}
                      />
                    )}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.white }}>
                    {bm.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: T.muted,
                    marginTop: 4,
                    display: "block",
                    paddingLeft: 24,
                  }}
                >
                  {bm.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* commission slider (1099 only) */}
      {form.businessModel === "1099" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            {fieldLabel("Commission Rate")}
            <span
              style={{
                fontFamily: T.fontMono,
                fontSize: 18,
                fontWeight: 600,
                color: T.gold,
              }}
            >
              {form.commissionRate}%
            </span>
          </div>
          <input
            type="range"
            min={30}
            max={60}
            value={form.commissionRate}
            onChange={(e) => set("commissionRate", Number(e.target.value))}
            style={{
              width: "100%",
              accentColor: T.gold,
              cursor: "pointer",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: T.muted,
              fontFamily: T.fontMono,
              marginTop: 4,
            }}
          >
            <span>30%</span>
            <span>60%</span>
          </div>
        </div>
      )}

      {/* stylists + locations */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          {fieldLabel("Number of Stylists")}
          <input
            type="number"
            min={1}
            style={{ ...inputStyle(!!errors.numStylists), fontFamily: T.fontMono }}
            value={form.numStylists}
            onChange={(e) => set("numStylists", Math.max(1, Number(e.target.value)))}
          />
          {errorText("numStylists")}
        </div>
        <div>
          {fieldLabel("Number of Locations")}
          <input
            type="number"
            min={1}
            style={{ ...inputStyle(!!errors.numLocations), fontFamily: T.fontMono }}
            value={form.numLocations}
            onChange={(e) => set("numLocations", Math.max(1, Number(e.target.value)))}
          />
          {errorText("numLocations")}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* plan summary */}
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: T.white,
              fontFamily: T.fontBody,
              display: "block",
            }}
          >
            RunMySalon Starter
          </span>
          <span style={{ fontSize: 13, color: T.muted, fontFamily: T.fontBody }}>
            Full platform access for your salon
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: T.gold,
              fontFamily: T.fontMono,
            }}
          >
            $99
          </span>
          <span
            style={{
              fontSize: 13,
              color: T.muted,
              fontFamily: T.fontBody,
              display: "block",
            }}
          >
            per month
          </span>
        </div>
      </div>

      {/* password */}
      <div>
        {fieldLabel("Password", true)}
        <input
          type="password"
          style={inputStyle(!!errors.password)}
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
        {errorText("password")}
      </div>
      <div>
        {fieldLabel("Confirm Password", true)}
        <input
          type="password"
          style={inputStyle(!!errors.confirmPassword)}
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
        />
        {errorText("confirmPassword")}
      </div>

      {/* terms */}
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          cursor: "pointer",
          fontFamily: T.fontBody,
        }}
      >
        <input
          type="checkbox"
          checked={form.termsAccepted}
          onChange={(e) => set("termsAccepted", e.target.checked)}
          style={{
            accentColor: T.gold,
            width: 18,
            height: 18,
            marginTop: 2,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
          I agree to the{" "}
          <a
            href="/terms"
            style={{ color: T.bright, textDecoration: "underline" }}
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            style={{ color: T.bright, textDecoration: "underline" }}
          >
            Privacy Policy
          </a>
        </span>
      </label>
      {errorText("termsAccepted")}

      {submitError && (
        <div
          style={{
            background: "rgba(248,113,113,0.1)",
            border: `1px solid ${T.error}`,
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: T.error,
            fontFamily: T.fontBody,
          }}
        >
          {submitError}
        </div>
      )}
    </div>
  );

  /* ================================================================ */
  /*  Step metadata                                                    */
  /* ================================================================ */

  const STEPS = [
    { num: 1, title: "Your Salon", icon: "storefront" },
    { num: 2, title: "Your POS System", icon: "point_of_sale" },
    { num: 3, title: "Your Team", icon: "groups" },
    { num: 4, title: "Start Your Trial", icon: "rocket_launch" },
  ];

  /* ================================================================ */
  /*  Main render                                                      */
  /* ================================================================ */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: T.fontBody,
        color: T.white,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* -------- progress bar -------- */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: T.card,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {STEPS.map((s, i) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div
                key={s.num}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: isCompleted ? "pointer" : "default",
                    opacity: isActive ? 1 : isCompleted ? 0.9 : 0.35,
                    transition: "opacity 0.2s",
                  }}
                  onClick={() => {
                    if (isCompleted) setStep(s.num);
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: T.fontMono,
                      background: isCompleted
                        ? T.green
                        : isActive
                          ? T.gold
                          : "transparent",
                      color: isCompleted || isActive ? T.goldText : T.muted,
                      border: `2px solid ${
                        isCompleted
                          ? T.green
                          : isActive
                            ? T.gold
                            : "rgba(255,255,255,0.15)"
                      }`,
                      transition: "all 0.3s",
                    }}
                  >
                    {isCompleted
                      ? icon("check", { fontSize: 16, color: T.goldText })
                      : s.num}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? T.white : T.muted,
                      display: "none",
                    }}
                    className="step-label"
                  >
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: 40,
                      height: 2,
                      background: isCompleted ? T.green : "rgba(255,255,255,0.1)",
                      borderRadius: 2,
                      transition: "background 0.3s",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* -------- main content -------- */}
      <div
        style={{
          flex: 1,
          display: "flex",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* ---- left branding panel ---- */}
        <div
          className="branding-panel"
          style={{
            width: "40%",
            minHeight: "calc(100vh - 64px)",
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            borderRight: `1px solid ${T.border}`,
          }}
        >
          {/* logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 32,
            }}
          >
            {icon("content_cut", { fontSize: 28, color: T.gold })}
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: T.white,
                letterSpacing: -0.5,
              }}
            >
              RunMySalon
            </span>
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: T.white,
              lineHeight: 1.2,
              margin: "0 0 32px 0",
            }}
          >
            The complete salon management platform
          </h1>

          {/* features */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              marginBottom: 40,
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                {icon("check_circle", { fontSize: 20, color: T.green })}
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                  {f}
                </span>
              </div>
            ))}
          </div>

          {/* social proof */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 12,
              padding: "16px 20px",
              border: `1px solid ${T.border}`,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: T.bright,
                marginBottom: 4,
              }}
            >
              Trusted by 200+ salons
            </div>
            <div style={{ fontSize: 13, color: T.muted }}>
              $99/month &mdash; cancel anytime
            </div>
          </div>
        </div>

        {/* ---- right form panel ---- */}
        <div
          style={{
            flex: 1,
            padding: "48px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          {/* step heading */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              {icon(STEPS[step - 1].icon, { fontSize: 22, color: T.gold })}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: T.muted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontFamily: T.fontMono,
                }}
              >
                Step {step} of 4
              </span>
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: T.white,
                margin: 0,
              }}
            >
              {STEPS[step - 1].title}
            </h2>
          </div>

          {/* form body */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </div>

          {/* navigation */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 32,
              paddingTop: 20,
              borderTop: `1px solid ${T.border}`,
            }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: "10px 20px",
                  color: T.muted,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: T.fontBody,
                  transition: "border-color 0.2s",
                }}
              >
                {icon("arrow_back", { fontSize: 18 })}
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: T.gold,
                  color: T.goldText,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 28px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: T.fontBody,
                  transition: "opacity 0.2s",
                }}
              >
                Continue
                {icon("arrow_forward", { fontSize: 18, color: T.goldText })}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: submitting ? T.primary : T.gold,
                  color: T.goldText,
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 32px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: T.fontBody,
                  opacity: submitting ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {submitting
                  ? icon("hourglass_empty", { fontSize: 18, color: T.goldText })
                  : icon("rocket_launch", { fontSize: 18, color: T.goldText })}
                {submitting ? "Creating account..." : "Start Free Trial"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* -------- responsive styles -------- */}
      <style>{`
        @media (max-width: 768px) {
          .branding-panel {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .step-label {
            display: inline !important;
          }
        }
        input[type="range"]::-webkit-slider-thumb {
          cursor: pointer;
        }
        input:focus {
          border-color: ${T.bright} !important;
        }
        button:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
