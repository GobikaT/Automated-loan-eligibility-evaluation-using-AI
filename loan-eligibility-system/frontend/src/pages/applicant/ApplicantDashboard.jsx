import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "../../components/DashboardHeader";
import FloatingEMICalculator from "../../components/FloatingEMICalculator";
import { getDashboardSummary } from "../../services/applicationService";

export default function ApplicantDashboard() {
  const [userName, setUserName] = useState("Applicant");
  const [stats, setStats] = useState({
    applied_loans: 0,
    total_loans: 0,
    existing_loan_amount: null,
    credit_score: null,
  });

  useEffect(() => {
    const syncUser = () => {
      try {
        const user = localStorage.getItem("user");
        if (user) {
          const userData = JSON.parse(user);
          setUserName(userData.full_name || "Applicant");
        }
      } catch (err) {
        console.error("Failed to parse user", err);
      }
    };

    syncUser();
    window.addEventListener("userProfileUpdated", syncUser);
    window.addEventListener("storage", syncUser);

    (async () => {
      try {
        const data = await getDashboardSummary();
        if (data) setStats(data);
      } catch (e) {
        console.warn("Could not load dashboard stats", e);
      }
    })();

    return () => {
      window.removeEventListener("userProfileUpdated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  return (
    <div>
      <DashboardHeader links={[]} initials={userName[0] || "A"} />

      <div className="dash-hero">
        <div className="dash-hero-inner">
          <h1>Welcome, {userName}! 👋</h1>
          <p>Manage your loan applications, attach supporting documents, and track approval status</p>

          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Applications</div>
              <div className="stat-value">{stats.applied_loans || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Approved Loans</div>
              <div className="stat-value">{stats.total_loans || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Loan Value</div>
              <div className="stat-value">{stats.existing_loan_amount ? `₹${Number(stats.existing_loan_amount).toLocaleString("en-IN")}` : "None"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Credit Score</div>
              <div className="stat-value">{stats.credit_score || "N/A"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-content">
        <h2>Apply for a Loan with Instant Verification</h2>
        <p>Choose a loan type below and provide your details and documents for instant eligibility assessment.</p>

        <div className="loan-grid">
          <div className="loan-card">
            <span className="loan-icon">🎓</span>
            <h3>Education Loan</h3>
            <p>Tuition and college fee funding with automated document verification</p>
            <div className="loan-details">
              <div>Interest Rate: 9.0% p.a.</div>
              <div>Tenure: 12-180 months</div>
              <div style={{ color: "var(--success)", fontWeight: 600 }}>Instant Verification Ready</div>
            </div>
            <Link to="/applicant/education-loan" className="btn">
              Apply Now →
            </Link>
          </div>

          <div className="loan-card">
            <span className="loan-icon">💳</span>
            <h3>Personal Loan</h3>
            <p>Quick personal finance with instant salary slip and ID proof verification</p>
            <div className="loan-details">
              <div>Interest Rate: 11.5% p.a.</div>
              <div>Tenure: 12-60 months</div>
              <div style={{ color: "var(--success)", fontWeight: 600 }}>Instant Verification Ready</div>
            </div>
            <Link to="/applicant/personal-loan" className="btn">
              Apply Now →
            </Link>
          </div>

          <div className="loan-card">
            <span className="loan-icon">🏠</span>
            <h3>Home Loan</h3>
            <p>Property purchase &amp; renovation loans with automated document screening</p>
            <div className="loan-details">
              <div>Interest Rate: 8.5% p.a.</div>
              <div>Tenure: 120-240 months</div>
              <div style={{ color: "var(--success)", fontWeight: 600 }}>Instant Verification Ready</div>
            </div>
            <Link to="/applicant/home-loan" className="btn">
              Apply Now →
            </Link>
          </div>
        </div>

      </div>

      {/* Floating EMI Calculator Widget (always visible at bottom-right) */}
      <FloatingEMICalculator />
    </div>
  );
}