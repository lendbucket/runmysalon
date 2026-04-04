"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "" as "MANAGER" | "STYLIST" | "",
    location: "" as "Corpus Christi" | "San Antonio" | "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStep(4);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f1d24",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
      />

      <div style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img src="/images/logo-white.png" alt="Salon Envy" style={{ height: "60px", width: "auto" }} />
        </div>

        {step < 4 && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              {["Your Info", "Your Role", "Your Location", "Done"].map((label, i) => (
                <span
                  key={label}
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: i + 1 <= step ? "#CDC9C0" : "rgba(205,201,192,0.3)",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
            <div style={{ height: "3px", backgroundColor: "rgba(205,201,192,0.1)", borderRadius: "4px" }}>
              <div
                style={{
                  height: "100%",
                  width: `${((step - 1) / 3) * 100}%`,
                  backgroundColor: "#CDC9C0",
                  borderRadius: "4px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        )}

        <div
          style={{
            backgroundColor: "#142127",
            border: "1px solid rgba(205,201,192,0.1)",
            borderRadius: "12px",
            padding: "32px",
          }}
        >
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px" }}>
                Request Portal Access
              </h2>
              <p style={{ fontSize: "13px", color: "#94A3B8", margin: "0 0 28px" }}>
                Fill in your details to request access to the Salon Envy® portal.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#CDC9C0",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      First Name
                    </label>
                    <input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="First name"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#1a2a32",
                        border: "1px solid rgba(205,201,192,0.15)",
                        borderRadius: "7px",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#CDC9C0",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      Last Name
                    </label>
                    <input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Last name"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#1a2a32",
                        border: "1px solid rgba(205,201,192,0.15)",
                        borderRadius: "7px",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#CDC9C0",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#1a2a32",
                      border: "1px solid rgba(205,201,192,0.15)",
                      borderRadius: "7px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#CDC9C0",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(xxx) xxx-xxxx"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#1a2a32",
                      border: "1px solid rgba(205,201,192,0.15)",
                      borderRadius: "7px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.firstName || !formData.lastName || !formData.email}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "24px",
                  backgroundColor: "#CDC9C0",
                  color: "#0f1d24",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  borderRadius: "7px",
                  border: "none",
                  cursor: "pointer",
                  opacity: !formData.firstName || !formData.lastName || !formData.email ? 0.5 : 1,
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px" }}>
                What is your role?
              </h2>
              <p style={{ fontSize: "13px", color: "#94A3B8", margin: "0 0 28px" }}>
                Select the role that best describes your position at Salon Envy®.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                {[
                  {
                    value: "MANAGER",
                    icon: "manage_accounts",
                    title: "Salon Manager",
                    desc: "Manage schedules, inventory, staff, and operations for your location.",
                  },
                  {
                    value: "STYLIST",
                    icon: "content_cut",
                    title: "Stylist",
                    desc: "View your schedule and access Reyna AI for color formulas and guidance.",
                  },
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.value as "MANAGER" | "STYLIST" })}
                    style={{
                      padding: "16px 20px",
                      backgroundColor: formData.role === role.value ? "rgba(205,201,192,0.1)" : "#1a2a32",
                      border:
                        formData.role === role.value
                          ? "1px solid #CDC9C0"
                          : "1px solid rgba(205,201,192,0.15)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#CDC9C0", flexShrink: 0 }}>
                      {role.icon}
                    </span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>{role.title}</div>
                      <div style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.4 }}>{role.desc}</div>
                    </div>
                    {formData.role === role.value && (
                      <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#CDC9C0", marginLeft: "auto", flexShrink: 0 }}>
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(205,201,192,0.2)",
                    borderRadius: "7px",
                    color: "#CDC9C0",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!formData.role}
                  style={{
                    flex: 2,
                    padding: "12px",
                    backgroundColor: "#CDC9C0",
                    color: "#0f1d24",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    borderRadius: "7px",
                    border: "none",
                    cursor: "pointer",
                    opacity: !formData.role ? 0.5 : 1,
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px" }}>Which location?</h2>
              <p style={{ fontSize: "13px", color: "#94A3B8", margin: "0 0 28px" }}>Select the Salon Envy® location where you work.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                {[
                  { value: "Corpus Christi" as const, address: "5601 S Padre Island Dr STE E", phone: "(361) 889-1102" },
                  { value: "San Antonio" as const, address: "11826 Wurzbach Rd", phone: "(210) 660-3339" },
                ].map((loc) => (
                  <button
                    key={loc.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, location: loc.value })}
                    style={{
                      padding: "20px",
                      backgroundColor: formData.location === loc.value ? "rgba(205,201,192,0.1)" : "#1a2a32",
                      border:
                        formData.location === loc.value
                          ? "1px solid #CDC9C0"
                          : "1px solid rgba(205,201,192,0.15)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF", marginBottom: "6px" }}>{loc.value}</div>
                        <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "2px" }}>{loc.address}</div>
                        <div style={{ fontSize: "12px", color: "#94A3B8" }}>{loc.phone}</div>
                      </div>
                      {formData.location === loc.value && (
                        <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#CDC9C0" }}>
                          check_circle
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(205,201,192,0.2)",
                    borderRadius: "7px",
                    color: "#CDC9C0",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!formData.location || loading}
                  style={{
                    flex: 2,
                    padding: "12px",
                    backgroundColor: "#CDC9C0",
                    color: "#0f1d24",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    borderRadius: "7px",
                    border: "none",
                    cursor: "pointer",
                    opacity: !formData.location || loading ? 0.5 : 1,
                  }}
                >
                  {loading ? "Submitting..." : "Submit Request →"}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(205,201,192,0.1)",
                  border: "2px solid #CDC9C0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#CDC9C0" }}>
                  pending
                </span>
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 12px" }}>Request Submitted!</h2>
              <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, margin: "0 0 8px" }}>
                Your access request has been sent to the owner for approval.
              </p>
              <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, margin: "0 0 28px" }}>
                You&apos;ll receive an email at <strong style={{ color: "#CDC9C0" }}>{formData.email}</strong> once your account is approved.
              </p>
              <div
                style={{
                  backgroundColor: "#1a2a32",
                  border: "1px solid rgba(205,201,192,0.15)",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { label: "Name", value: `${formData.firstName} ${formData.lastName}` },
                    { label: "Role", value: formData.role === "MANAGER" ? "Salon Manager" : "Stylist" },
                    { label: "Location", value: formData.location },
                    { label: "Email", value: formData.email },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          color: "rgba(205,201,192,0.4)",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          marginBottom: "3px",
                        }}
                      >
                        {label}
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/login")}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(205,201,192,0.25)",
                  borderRadius: "7px",
                  color: "#CDC9C0",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
