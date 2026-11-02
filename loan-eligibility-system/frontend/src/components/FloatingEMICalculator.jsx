import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function calculateEmi(principal, annualRatePercent, tenureMonths) {
  const p = Number(principal);
  const n = Number(tenureMonths);
  const r = Number(annualRatePercent) / 12 / 100;

  if (!p || !n || p <= 0 || n <= 0) {
    return { emi: 0, totalInterest: 0, totalRepayment: 0 };
  }
  if (r === 0) {
    const emi = p / n;
    return { emi, totalInterest: 0, totalRepayment: p };
  }
  const factor = Math.pow(1 + r, n);
  const emi = (p * r * factor) / (factor - 1);
  const totalRepayment = emi * n;
  const totalInterest = totalRepayment - p;
  return { emi, totalInterest, totalRepayment };
}

const formatCurrency = (value) =>
  `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function FloatingEMICalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(10);
  const [tenureMonths, setTenureMonths] = useState(60);
  const modalRef = useRef(null);

  const { emi, totalInterest, totalRepayment } = useMemo(
    () => calculateEmi(loanAmount, interestRate, tenureMonths),
    [loanAmount, interestRate, tenureMonths]
  );

  // Close when clicking outside of the floating widget
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const setPreset = (amount, rate, months) => {
    setLoanAmount(amount);
    setInterestRate(rate);
    setTenureMonths(months);
  };

  return (
    <div
      ref={modalRef}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        fontFamily: "var(--font-ui, sans-serif)",
      }}
    >
      {/* ── Floating EMI Calculator Window (Chatbot-style popup) ── */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            right: "0",
            width: "380px",
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "85vh",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            boxShadow: "0 12px 40px rgba(15, 23, 42, 0.22), 0 2px 10px rgba(0, 0, 0, 0.08)",
            border: "1px solid var(--border, #cbd5e1)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeInUp 0.25s ease-out forwards",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "0.85rem 1.1rem",
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🧮</span>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#ffffff", fontWeight: 700 }}>
                  EMI Calculator
                </h4>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  Meridian Trust Financial Estimator
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Link
                to="/applicant/emi-calculator"
                title="Open full page calculator"
                onClick={() => setIsOpen(false)}
                style={{
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  textDecoration: "none",
                  padding: "0.2rem 0.45rem",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.1)",
                }}
              >
                Full Page ↗
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close EMI calculator"
                style={{
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  padding: "0.2rem 0.4rem",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "1rem", overflowY: "auto", flex: 1 }}>
            {/* Quick Presets */}
            <div style={{ marginBottom: "0.85rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
                Quick Presets:
              </span>
              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setPreset(300000, 11.5, 36)}
                  style={{
                    padding: "0.25rem 0.55rem",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#1e293b",
                    cursor: "pointer",
                  }}
                >
                  Personal ₹3L (3y)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(500000, 9.0, 60)}
                  style={{
                    padding: "0.25rem 0.55rem",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#1e293b",
                    cursor: "pointer",
                  }}
                >
                  Education ₹5L (5y)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(2500000, 8.5, 180)}
                  style={{
                    padding: "0.25rem 0.55rem",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#1e293b",
                    cursor: "pointer",
                  }}
                >
                  Home ₹25L (15y)
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600 }}>
                  <label htmlFor="float_emi_amount" style={{ margin: 0 }}>Loan Amount</label>
                  <span style={{ color: "#0284c7" }}>{formatCurrency(loanAmount)}</span>
                </div>
                <input
                  id="float_emi_amount"
                  type="number"
                  min="10000"
                  step="10000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    marginTop: "0.25rem",
                    marginBottom: 0,
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600 }}>
                  <label htmlFor="float_emi_rate" style={{ margin: 0 }}>Interest Rate (% p.a.)</label>
                  <span style={{ color: "#0284c7" }}>{interestRate}%</span>
                </div>
                <input
                  id="float_emi_rate"
                  type="number"
                  min="1"
                  max="30"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    marginTop: "0.25rem",
                    marginBottom: 0,
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600 }}>
                  <label htmlFor="float_emi_tenure" style={{ margin: 0 }}>Tenure (Months)</label>
                  <span style={{ color: "#0284c7" }}>
                    {tenureMonths} mo ({Math.floor(tenureMonths / 12)}y {tenureMonths % 12 ? `${tenureMonths % 12}m` : ""})
                  </span>
                </div>
                <input
                  id="float_emi_tenure"
                  type="number"
                  min="1"
                  max="360"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Math.max(1, Number(e.target.value)))}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    marginTop: "0.25rem",
                    marginBottom: 0,
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>

            {/* Result Box */}
            <div
              style={{
                marginTop: "1rem",
                padding: "0.85rem",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                border: "1px solid #bbf7d0",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#166534", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                  Estimated Monthly EMI
                </span>
                <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#15803d", marginTop: "2px" }}>
                  {formatCurrency(emi)}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px solid #bbf7d0",
                  fontSize: "0.78rem",
                }}
              >
                <div>
                  <span style={{ color: "#475569", display: "block" }}>Total Interest</span>
                  <strong style={{ color: "#0f172a", fontSize: "0.85rem" }}>{formatCurrency(totalInterest)}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "#475569", display: "block" }}>Total Repayment</span>
                  <strong style={{ color: "#0f172a", fontSize: "0.85rem" }}>{formatCurrency(totalRepayment)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Action Button (Always visible on bottom-right) ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open Loan EMI Calculator"
        title="Open Loan EMI Calculator"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "#0f2b48",
          backgroundImage: "linear-gradient(135deg, #1b4b72 0%, #0f2b48 100%)",
          color: "#ffffff",
          border: "2px solid #d4af37",
          boxShadow: "0 6px 20px rgba(15, 43, 72, 0.4), 0 0 12px rgba(212, 175, 55, 0.3)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transform: isOpen ? "rotate(90deg) scale(1.05)" : "scale(1)",
          outline: "none",
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isOpen ? "rotate(90deg) scale(1.12)" : "scale(1.12)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(15, 43, 72, 0.5), 0 0 16px rgba(212, 175, 55, 0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isOpen ? "rotate(90deg) scale(1.05)" : "scale(1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(15, 43, 72, 0.4), 0 0 12px rgba(212, 175, 55, 0.3)";
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: "1.35rem", fontWeight: "bold", lineHeight: 1 }}>✕</span>
        ) : (
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "#fef3c7" }}
          >
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="16" y1="14" x2="16" y2="18" />
            <path d="M16 10h.01" />
            <path d="M12 10h.01" />
            <path d="M8 10h.01" />
            <path d="M12 14h.01" />
            <path d="M8 14h.01" />
            <path d="M12 18h.01" />
            <path d="M8 18h.01" />
          </svg>
        )}
      </button>
    </div>
  );
}

