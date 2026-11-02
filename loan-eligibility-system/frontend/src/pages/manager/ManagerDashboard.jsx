import React, { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import apiClient from "../../services/apiClient";
import { STATUS_LABELS, STATUS_COLORS, LOAN_TYPE_LABELS } from "../../utils/statusLabels";

const NAV_LINKS = [
  { to: "/manager/dashboard", label: "Branch Dashboard" },
];

const VERIFICATION_BADGES = {
  CONSISTENT: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0", label: "✔ Match" },
  MATCH: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0", label: "✔ Match" },
  Match: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0", label: "✔ Match" },
  NEEDS_VERIFICATION: { bg: "#fffbeb", color: "#92400e", border: "#fde68a", label: "⚠ Requires Manual Verification" },
  REQUIRES_MANUAL_VERIFICATION: { bg: "#fffbeb", color: "#92400e", border: "#fde68a", label: "⚠ Requires Manual Verification" },
  "Requires Manual Verification": { bg: "#fffbeb", color: "#92400e", border: "#fde68a", label: "⚠ Requires Manual Verification" },
  NOT_DETECTED: { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db", label: "⚪ Not Detected" },
  "Not Detected": { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db", label: "⚪ Not Detected" },
  NOT_PROVIDED: { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: "— Not Provided" },
  "Not Provided": { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: "— Not Provided" },
  MISMATCH: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca", label: "✖ Mismatch" },
  Mismatch: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca", label: "✖ Mismatch" },
};

export default function ManagerDashboard() {
  const [managerProfile, setManagerProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "reviewed"

  // Reviewed Section: Search & Filter State
  const [reviewedSearch, setReviewedSearch] = useState("");
  const [reviewedFilter, setReviewedFilter] = useState("ALL"); // "ALL" | "APPROVE" | "REJECT" | "REQUEST_CORRECTION"

  // Review Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetails, setAppDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [decision, setDecision] = useState("APPROVE");
  const [remarks, setRemarks] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState("");

  // PDF Preview State
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const fetchApplications = async () => {
    try {
      const [profRes, appsRes] = await Promise.all([
        apiClient.get("/api/manager/me"),
        apiClient.get("/api/manager/applications"),
      ]);
      setManagerProfile(profRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      console.error("Failed to load manager dashboard:", err);
      setError("Failed to load branch applications. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const handleProfileUpdate = () => {
      fetchApplications();
    };
    window.addEventListener("userProfileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("userProfileUpdated", handleProfileUpdate);
  }, []);

  const openReviewModal = async (app) => {
    setSelectedApp(app);
    setLoadingDetails(true);
    setDecisionSuccess("");
    setDecision("APPROVE");
    setRemarks("");
    try {
      const res = await apiClient.get(`/api/manager/applications/${app.id}`);
      setAppDetails(res.data);
    } catch (err) {
      console.error("Failed to load application details:", err);
      alert("Could not load full application details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeReviewModal = () => {
    setSelectedApp(null);
    setAppDetails(null);
    if (pdfBlobUrl) {
      window.URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  const handleOpenPdf = async (appId) => {
    setLoadingPdf(true);
    try {
      const res = await apiClient.get(`/api/manager/applications/${appId}/report?inline=true`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setShowPdfModal(true);
    } catch (err) {
      console.error("Failed to load PDF report:", err);
      alert("Could not load report preview.");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownloadPdf = async (app) => {
    try {
      const res = await apiClient.get(`/api/manager/applications/${app.id}/report`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Loan_Report_${app.application_code}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Could not download report.");
    }
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmittingDecision(true);
    try {
      const res = await apiClient.post(`/api/manager/applications/${selectedApp.id}/decision`, {
        decision,
        remarks: remarks || `Manager decision: ${decision}`,
      });
      setDecisionSuccess(res.data.message || `Application updated to ${res.data.status}`);
      // Refresh branch applications
      await fetchApplications();
      setTimeout(() => {
        closeReviewModal();
      }, 1500);
    } catch (err) {
      console.error("Failed to submit decision:", err);
      alert(err?.response?.data?.detail || "Could not submit decision.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Helper to determine if application has been reviewed by the manager
  const isReviewed = (a) => {
    // If an explicit manager action was recorded, it is reviewed
    if (a.manager_decision && a.manager_decision.action) return true;
    // Approved or Rejected applications have been finalized by a manager
    if (a.status === "APPROVED" || a.status === "REJECTED") return true;
    // Otherwise pending review
    return false;
  };

  // Split applications: Pending = not yet reviewed; Reviewed = already reviewed
  const pendingApps = applications.filter((a) => !isReviewed(a));
  const reviewedApps = applications.filter((a) => isReviewed(a));

  // Reviewed section: apply search + filter
  const filteredReviewedApps = reviewedApps.filter((a) => {
    // Filter by decision type
    if (reviewedFilter !== "ALL") {
      const decisionAction = a.manager_decision?.action;
      if (reviewedFilter === "APPROVE" && decisionAction !== "APPROVE" && a.status !== "APPROVED") return false;
      if (reviewedFilter === "REJECT" && decisionAction !== "REJECT" && a.status !== "REJECTED") return false;
      if (reviewedFilter === "REQUEST_CORRECTION" && decisionAction !== "REQUEST_CORRECTION" && a.status !== "CORRECTION_REQUIRED") return false;
    }
    // Search by applicant name or application ID / code
    if (reviewedSearch.trim()) {
      const q = reviewedSearch.trim().toLowerCase();
      const nameMatch = (a.applicant_name || "").toLowerCase().includes(q);
      const codeMatch = (a.application_code || "").toLowerCase().includes(q);
      const idMatch = String(a.id || "").toLowerCase().includes(q);
      const verifMatch = (a.verification_code || "").toLowerCase().includes(q);
      if (!nameMatch && !codeMatch && !idMatch && !verifMatch) return false;
    }
    return true;
  });

  // Stats calculation
  const stats = {
    total: applications.length,
    pending: pendingApps.length,
    approved: applications.filter((a) => a.status === "APPROVED" || a.status === "FINAL_BANK_PROCESSING").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
    corrections: applications.filter((a) => a.status === "CORRECTION_REQUIRED").length,
  };

  return (
    <div>
      <DashboardHeader links={NAV_LINKS} initials={managerProfile?.full_name?.charAt(0) || "M"} />

      <div className="dash-hero">
        <div className="dash-hero-inner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.75rem" }}>🏛️</span>
                <h1 style={{ margin: 0 }}>
                  {managerProfile ? `${managerProfile.branch_name} — Manager Portal` : "Branch Manager Dashboard"}
                </h1>
              </div>
              <p style={{ marginTop: "0.35rem", color: "#94a3b8" }}>
                Logged in as <strong>{managerProfile?.full_name || "Manager"}</strong> ({managerProfile?.employee_code || "EMP"}) &middot; Branch Location: {managerProfile?.branch_city || "Main"}
              </p>
            </div>

            <span
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                background: "rgba(16, 185, 129, 0.2)",
                color: "#10b981",
                border: "1px solid #10b981",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              ● Branch Authorization Active
            </span>
          </div>

          <div className="stat-grid" style={{ marginTop: "1.5rem" }}>
            <div className="stat-card">
              <div className="stat-label">Total Assigned</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Review</div>
              <div className="stat-value" style={{ color: "#f59e0b" }}>{stats.pending}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Approved</div>
              <div className="stat-value" style={{ color: "#10b981" }}>{stats.approved}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Rejected / Correction</div>
              <div className="stat-value" style={{ color: "#ef4444" }}>{stats.rejected + stats.corrections}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-content" style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{ margin: 0 }}>Applications Mapped to This Branch</h2>
          <button onClick={fetchApplications} className="btn-secondary" style={{ fontSize: "0.85rem" }}>
            🔄 Refresh List
          </button>
        </div>

        {error && <div className="card" style={{ borderLeft: "5px solid crimson" }}><p style={{ color: "crimson" }}>{error}</p></div>}

        {loading ? (
          <div className="card"><p>Loading branch loan applications...</p></div>
        ) : applications.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</div>
            <h3>No Applications Assigned to This Branch</h3>
            <p style={{ color: "var(--text-muted)" }}>
              When applicants select <strong>{managerProfile?.branch_name || "this branch"}</strong> during submission, their AI-verified applications will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            {/* ── Tab Switcher ── */}
            <div style={{ display: "flex", gap: "0", marginBottom: "1.25rem", borderBottom: "2px solid var(--border, #e2e8f0)" }}>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                style={{
                  padding: "0.7rem 1.5rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                  borderBottom: activeTab === "pending" ? "3px solid #0284c7" : "3px solid transparent",
                  background: activeTab === "pending" ? "#f0f9ff" : "transparent",
                  color: activeTab === "pending" ? "#0284c7" : "var(--text-muted, #64748b)",
                  borderRadius: "6px 6px 0 0",
                  transition: "all 0.2s ease",
                }}
              >
                📋 Pending ({pendingApps.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reviewed")}
                style={{
                  padding: "0.7rem 1.5rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                  borderBottom: activeTab === "reviewed" ? "3px solid #0284c7" : "3px solid transparent",
                  background: activeTab === "reviewed" ? "#f0f9ff" : "transparent",
                  color: activeTab === "reviewed" ? "#0284c7" : "var(--text-muted, #64748b)",
                  borderRadius: "6px 6px 0 0",
                  transition: "all 0.2s ease",
                }}
              >
                ✅ Reviewed ({reviewedApps.length})
              </button>
            </div>

            {/* ── PENDING TAB ── */}
            {activeTab === "pending" && (
              <>
                {pendingApps.length === 0 ? (
                  <div className="card" style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
                    <h3>All Caught Up!</h3>
                    <p style={{ color: "var(--text-muted)" }}>
                      No pending applications require your review. All assigned applications have been reviewed.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {pendingApps.map((app) => {
                      const ai = app.ai_prediction || {};
                      const isFlagged = ai.risk_level === "HIGH" || ai.eligibility === "NEEDS_REVIEW";
                      return (
                        <div
                          key={app.id}
                          className="card"
                          style={{
                            borderLeft: `5px solid ${STATUS_COLORS[app.status] || "var(--ink-500)"}`,
                            padding: "1.25rem",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--ink-900)" }}>
                                  {app.application_code}
                                </span>
                                <span
                                  style={{
                                    padding: "0.15rem 0.55rem",
                                    borderRadius: "12px",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    backgroundColor: `${STATUS_COLORS[app.status] || "#0284c7"}15`,
                                    color: STATUS_COLORS[app.status] || "#0284c7",
                                    border: `1px solid ${STATUS_COLORS[app.status] || "#0284c7"}35`,
                                  }}
                                >
                                  {STATUS_LABELS[app.status] || app.status}
                                </span>

                                {isFlagged ? (
                                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700, background: "#fee2e2", color: "#991b1b" }}>
                                    ⚠️ Flagged / High Risk
                                  </span>
                                ) : (
                                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700, background: "#ecfdf5", color: "#065f46" }}>
                                    🤖 AI Verified
                                  </span>
                                )}
                              </div>

                              <div style={{ marginTop: "0.35rem", fontSize: "0.95rem" }}>
                                <strong>{app.applicant_name}</strong> &middot; {LOAN_TYPE_LABELS[app.loan_type] || app.loan_type} &middot; <strong style={{ color: "#0369a1" }}>₹{Number(app.requested_amount).toLocaleString("en-IN")}</strong> ({app.loan_tenure_months} mo)
                              </div>

                              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                Applicant: {app.applicant_email || "N/A"} &middot; {app.applicant_phone || "N/A"} &middot; Date: {app.created_at ? new Date(app.created_at).toLocaleDateString("en-IN") : "N/A"}
                              </div>

                              {ai.reasoning && (
                                <div style={{ fontSize: "0.85rem", color: isFlagged ? "#b91c1c" : "var(--ink-700)", marginTop: "0.4rem", background: isFlagged ? "#fff1f2" : "#f8fafc", padding: "0.35rem 0.65rem", borderRadius: "4px" }}>
                                  <strong>AI Assessment:</strong> {ai.reasoning}
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => handleDownloadPdf(app)}
                                style={{ fontSize: "0.85rem", padding: "0.5rem 0.85rem" }}
                              >
                                📥 PDF
                              </button>
                              <button
                                type="button"
                                className="btn"
                                onClick={() => openReviewModal(app)}
                                style={{ fontSize: "0.85rem", padding: "0.5rem 1rem", background: "#0284c7", borderColor: "#0284c7" }}
                              >
                                Review &amp; Verify →
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── REVIEWED TAB ── */}
            {activeTab === "reviewed" && (
              <>
                {/* Search & Filter Controls */}
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ flex: "1 1 280px", position: "relative" }}>
                    <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", color: "var(--text-muted, #94a3b8)", pointerEvents: "none" }}>🔍</span>
                    <input
                      type="text"
                      placeholder="Search by applicant name or application ID..."
                      value={reviewedSearch}
                      onChange={(e) => setReviewedSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem 0.6rem 2.25rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border, #e2e8f0)",
                        fontSize: "0.9rem",
                        outline: "none",
                        background: "#ffffff",
                      }}
                    />
                  </div>
                  <select
                    value={reviewedFilter}
                    onChange={(e) => setReviewedFilter(e.target.value)}
                    style={{
                      padding: "0.6rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border, #e2e8f0)",
                      fontSize: "0.9rem",
                      background: "#ffffff",
                      cursor: "pointer",
                      fontWeight: 600,
                      minWidth: "180px",
                    }}
                  >
                    <option value="ALL">All</option>
                    <option value="APPROVE">Approved</option>
                    <option value="REJECT">Rejected</option>
                    <option value="REQUEST_CORRECTION">Correction Required</option>
                  </select>
                </div>

                {filteredReviewedApps.length === 0 ? (
                  <div className="card" style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📂</div>
                    <h3>{reviewedApps.length === 0 ? "No Reviewed Applications" : "No Matching Results"}</h3>
                    <p style={{ color: "var(--text-muted)" }}>
                      {reviewedApps.length === 0
                        ? "Applications you review will appear here with your decision."
                        : "Try adjusting your search or filter criteria."}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {filteredReviewedApps.map((app) => {
                      const ai = app.ai_prediction || {};
                      const isFlagged = ai.risk_level === "HIGH" || ai.eligibility === "NEEDS_REVIEW";
                      const mgr = app.manager_decision || {};
                      const decisionLabel =
                        app.status === "APPROVED" ? "Approved"
                        : app.status === "REJECTED" ? "Rejected"
                        : app.status === "CORRECTION_REQUIRED" ? "Correction Required"
                        : STATUS_LABELS[app.status] || app.status;
                      const decisionColor =
                        app.status === "APPROVED" ? "#16a34a"
                        : app.status === "REJECTED" ? "#dc2626"
                        : app.status === "CORRECTION_REQUIRED" ? "#d97706"
                        : "#0284c7";
                      const decisionBg =
                        app.status === "APPROVED" ? "#f0fdf4"
                        : app.status === "REJECTED" ? "#fef2f2"
                        : app.status === "CORRECTION_REQUIRED" ? "#fffbeb"
                        : "#f0f9ff";
                      const decisionIcon =
                        app.status === "APPROVED" ? "✅"
                        : app.status === "REJECTED" ? "❌"
                        : app.status === "CORRECTION_REQUIRED" ? "⚠️"
                        : "📋";

                      return (
                        <div
                          key={app.id}
                          className="card"
                          style={{
                            borderLeft: `5px solid ${STATUS_COLORS[app.status] || "var(--ink-500)"}`,
                            padding: "1.25rem",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                            position: "relative",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                            <div style={{ flex: 1, minWidth: "250px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--ink-900)" }}>
                                  {app.application_code}
                                </span>
                                <span
                                  style={{
                                    padding: "0.15rem 0.55rem",
                                    borderRadius: "12px",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    backgroundColor: `${STATUS_COLORS[app.status] || "#0284c7"}15`,
                                    color: STATUS_COLORS[app.status] || "#0284c7",
                                    border: `1px solid ${STATUS_COLORS[app.status] || "#0284c7"}35`,
                                  }}
                                >
                                  {STATUS_LABELS[app.status] || app.status}
                                </span>

                                {isFlagged ? (
                                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700, background: "#fee2e2", color: "#991b1b" }}>
                                    ⚠️ Flagged / High Risk
                                  </span>
                                ) : (
                                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700, background: "#ecfdf5", color: "#065f46" }}>
                                    🤖 AI Verified
                                  </span>
                                )}
                              </div>

                              <div style={{ marginTop: "0.35rem", fontSize: "0.95rem" }}>
                                <strong>{app.applicant_name}</strong> &middot; {LOAN_TYPE_LABELS[app.loan_type] || app.loan_type} &middot; <strong style={{ color: "#0369a1" }}>₹{Number(app.requested_amount).toLocaleString("en-IN")}</strong> ({app.loan_tenure_months} mo)
                              </div>

                              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                Applicant: {app.applicant_email || "N/A"} &middot; {app.applicant_phone || "N/A"} &middot; Date: {app.created_at ? new Date(app.created_at).toLocaleDateString("en-IN") : "N/A"}
                              </div>

                              {ai.reasoning && (
                                <div style={{ fontSize: "0.85rem", color: isFlagged ? "#b91c1c" : "var(--ink-700)", marginTop: "0.4rem", background: isFlagged ? "#fff1f2" : "#f8fafc", padding: "0.35rem 0.65rem", borderRadius: "4px" }}>
                                  <strong>AI Assessment:</strong> {ai.reasoning}
                                </div>
                              )}

                              {mgr.remarks && (
                                <div style={{ fontSize: "0.85rem", color: "var(--ink-700)", marginTop: "0.4rem", background: "#f1f5f9", padding: "0.35rem 0.65rem", borderRadius: "4px", borderLeft: `3px solid ${decisionColor}` }}>
                                  <strong>Manager Remarks:</strong> {mgr.remarks}
                                  {mgr.decided_at && (
                                    <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem", fontSize: "0.8rem" }}>
                                      — {new Date(mgr.decided_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Decision Badge (top-right) + Actions */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.6rem" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                  padding: "0.35rem 0.85rem",
                                  borderRadius: "20px",
                                  fontSize: "0.85rem",
                                  fontWeight: 700,
                                  background: decisionBg,
                                  color: decisionColor,
                                  border: `1.5px solid ${decisionColor}`,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {decisionIcon} {decisionLabel}
                              </span>
                              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => handleDownloadPdf(app)}
                                  style={{ fontSize: "0.85rem", padding: "0.5rem 0.85rem" }}
                                >
                                  📥 PDF
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => openReviewModal(app)}
                                  style={{ fontSize: "0.85rem", padding: "0.5rem 1rem", background: "#0284c7", borderColor: "#0284c7" }}
                                >
                                  Review &amp; Verify →
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Manager Review Modal */}
      {selectedApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={closeReviewModal}
        >
          <div
            style={{
              width: "94vw",
              maxWidth: "1000px",
              maxHeight: "92vh",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1rem 1.5rem",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: "#fff" }}>
                  Review Application: {selectedApp.application_code}
                </h3>
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  Applicant: {selectedApp.applicant_name} &middot; Loan: {selectedApp.loan_type} &middot; Amount: ₹{Number(selectedApp.requested_amount).toLocaleString("en-IN")}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleOpenPdf(selectedApp.id)}
                  disabled={loadingPdf}
                  style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem", background: "#0284c7", border: "none" }}
                >
                  <span>{loadingPdf ? "⏳" : "📄"}</span>
                  <span>View PDF Report</span>
                </button>
                <button
                  type="button"
                  onClick={closeReviewModal}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    color: "#fff",
                    borderRadius: "6px",
                    padding: "0.4rem 0.75rem",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {loadingDetails ? (
                <p>Loading application and verification details...</p>
              ) : appDetails ? (
                <>
                  {/* 1. Overall Application Assessment */}
                  {(() => {
                    const assessment = appDetails.overall_assessment || {};
                    const currentStatus = appDetails.status || "SUBMITTED_TO_BRANCH";
                    const isCorrection = currentStatus === "CORRECTION_REQUIRED";
                    const isPendingVerif = currentStatus === "PENDING_VERIFICATION";
                    const isApproved = currentStatus === "APPROVED";
                    const isRejected = currentStatus === "REJECTED";

                    const badgeColor = isCorrection
                      ? "#dc2626"
                      : isPendingVerif
                      ? "#d97706"
                      : isApproved
                      ? "#16a34a"
                      : isRejected
                      ? "#b91c1c"
                      : "#0284c7";

                    const bgGradient = isCorrection
                      ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
                      : isPendingVerif
                      ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                      : isApproved
                      ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                      : "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)";

                    return (
                      <div
                        style={{
                          padding: "1.25rem",
                          borderRadius: "10px",
                          border: `2px solid ${badgeColor}`,
                          background: bgGradient,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                              Overall Application Assessment
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.3rem" }}>
                              <h3 style={{ margin: 0, color: badgeColor, fontSize: "1.3rem" }}>
                                {STATUS_LABELS[currentStatus] || currentStatus}
                              </h3>
                              <span
                                style={{
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: "12px",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  background: "#ffffff",
                                  color: badgeColor,
                                  border: `1px solid ${badgeColor}`,
                                }}
                              >
                                {currentStatus}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>AI Financial Eligibility:</span>
                              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: appDetails.financial_eligibility === "Likely Eligible" ? "#16a34a" : "#b45309" }}>
                                {appDetails.financial_eligibility || (appDetails.ai_prediction?.score >= 60 ? "Likely Eligible" : "Requires Review")}
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>OCR Doc Verification:</span>
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: "0.95rem",
                                  color: appDetails.document_verification_status === "Mismatch Detected" ? "#dc2626" : "#16a34a",
                                }}
                              >
                                {appDetails.document_verification_status || "Verified"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Reason & Next Action */}
                        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                          <div style={{ background: "#ffffff", padding: "0.85rem", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)" }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                              📌 Assessment Reason:
                            </div>
                            <div style={{ fontSize: "0.9rem", color: "var(--ink-900)" }}>
                              {assessment.reason || (isCorrection ? "Discrepancies detected between entered details and uploaded documents." : "All parameters and documents processed.")}
                            </div>
                          </div>

                          <div style={{ background: "#ffffff", padding: "0.85rem", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)" }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                              ⚡ Next Action / Step:
                            </div>
                            <div style={{ fontSize: "0.9rem", color: "var(--ink-900)" }}>
                              {assessment.next_processing_step || "Branch Manager final verification required."}
                            </div>
                          </div>
                        </div>

                        {/* Identified Discrepancies Alert */}
                        {assessment.discrepancies && assessment.discrepancies.length > 0 && (
                          <div
                            style={{
                              marginTop: "1rem",
                              background: "#fff1f2",
                              border: "1px solid #fecaca",
                              borderRadius: "8px",
                              padding: "0.85rem 1rem",
                            }}
                          >
                            <div style={{ fontWeight: 700, color: "#991b1b", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span>⚠️ Critical Discrepancies Identified ({assessment.discrepancies.length}):</span>
                            </div>
                            <ul style={{ margin: "0.5rem 0 0 1.25rem", padding: 0, color: "#7f1d1d", fontSize: "0.85rem", lineHeight: 1.5 }}>
                              {assessment.discrepancies.map((disc, idx) => (
                                <li key={idx}>
                                  <strong>{disc.field}</strong>: Form has <em>&quot;{disc.applicant_value}&quot;</em> vs Document has <em>&quot;{disc.document_value}&quot;</em>
                                </li>
                              ))}
                            </ul>
                            {assessment.required_applicant_corrections && (
                              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#991b1b", fontWeight: 600 }}>
                                Required Correction: {assessment.required_applicant_corrections}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 2. Financial Eligibility Assessment (AI Module) */}
                  <div style={{ padding: "1rem", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <div>
                        <h4 style={{ margin: 0, color: "var(--ink-900)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span>🤖</span> Financial Eligibility Assessment (AI Module)
                        </h4>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Evaluated purely from financial attributes (Income, EMI, DTI, Credit Score, Tenure, Amount)
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <span
                          style={{
                            padding: "0.2rem 0.6rem",
                            borderRadius: "12px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            background: appDetails.ai_prediction?.risk_level === "HIGH" ? "#fee2e2" : appDetails.ai_prediction?.risk_level === "MEDIUM" ? "#fef3c7" : "#ecfdf5",
                            color: appDetails.ai_prediction?.risk_level === "HIGH" ? "#991b1b" : appDetails.ai_prediction?.risk_level === "MEDIUM" ? "#92400e" : "#065f46",
                          }}
                        >
                          Risk: {appDetails.ai_prediction?.risk_level || "MEDIUM"}
                        </span>
                        <span
                          style={{
                            padding: "0.2rem 0.6rem",
                            borderRadius: "12px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            background: "#e0f2fe",
                            color: "#0369a1",
                          }}
                        >
                          Confidence: {appDetails.ai_prediction?.score || 50}%
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: "0.9rem", color: "var(--ink-800)", marginTop: "0.5rem", background: "#ffffff", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                      <strong>AI Decision: </strong>
                      <span style={{ fontWeight: 600, color: appDetails.financial_eligibility === "Likely Eligible" ? "#16a34a" : "#b45309" }}>
                        {appDetails.financial_eligibility || (appDetails.ai_prediction?.score >= 60 ? "Likely Eligible" : "Requires Detailed Review")}
                      </span>
                      {appDetails.ai_prediction?.reasoning && (
                        <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {appDetails.ai_prediction.reasoning}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. OCR Document Verification Matrix */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>🔍</span> Document Verification (OCR Module)
                      </h4>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.6rem",
                          borderRadius: "12px",
                          background: appDetails.document_verification_status === "Mismatch Detected" ? "#fee2e2" : "#ecfdf5",
                          color: appDetails.document_verification_status === "Mismatch Detected" ? "#991b1b" : "#065f46",
                        }}
                      >
                        Status: {appDetails.document_verification_status || "Completed"}
                      </span>
                    </div>

                    {appDetails.verifications?.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No document verification rows extracted.</p>
                    ) : (
                      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                              <th style={{ padding: "0.6rem 0.85rem" }}>Verification Parameter</th>
                              <th style={{ padding: "0.6rem 0.85rem" }}>Entered in Form</th>
                              <th style={{ padding: "0.6rem 0.85rem" }}>OCR Extracted from Document</th>
                              <th style={{ padding: "0.6rem 0.85rem" }}>Match Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appDetails.verifications?.map((v, i) => {
                              const badge = VERIFICATION_BADGES[v.match_status] || {
                                bg: "#f3f4f6",
                                color: "#4b5563",
                                border: "#d1d5db",
                                label: v.match_status,
                              };
                              return (
                                <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: v.match_status === "MISMATCH" || v.match_status === "Mismatch" ? "#fff1f2" : "#fff" }}>
                                  <td style={{ padding: "0.6rem 0.85rem", fontWeight: 600 }}>{v.field_name}</td>
                                  <td style={{ padding: "0.6rem 0.85rem" }}>{v.entered_value || "N/A"}</td>
                                  <td style={{ padding: "0.6rem 0.85rem", color: v.match_status === "MISMATCH" || v.match_status === "Mismatch" ? "#dc2626" : "var(--ink-800)" }}>
                                    {v.extracted_value || "N/A"}
                                  </td>
                                  <td style={{ padding: "0.6rem 0.85rem" }}>
                                    <span
                                      style={{
                                        padding: "0.2rem 0.6rem",
                                        borderRadius: "10px",
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        background: badge.bg,
                                        color: badge.color,
                                        border: `1px solid ${badge.border}`,
                                      }}
                                    >
                                      {badge.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Documents List */}
                  <div>
                    <h4 style={{ margin: "0 0 0.5rem 0" }}>📁 Uploaded Document Proofs ({appDetails.documents?.length || 0})</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
                      {appDetails.documents?.map((doc) => (
                        <div key={doc.id} style={{ padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "6px", background: "#f8fafc" }}>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            📄 {doc.filename}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            Type: {doc.document_type} &middot; Confidence: {doc.ocr_confidence}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decision Submission Form */}
                  <div style={{ marginTop: "0.5rem", padding: "1.25rem", background: "#f1f5f9", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <h4 style={{ margin: "0 0 0.75rem 0" }}>✍️ Submit Branch Manager Verification Decision</h4>

                    {decisionSuccess && (
                      <div style={{ padding: "0.75rem", background: "#dcfce7", color: "#15803d", borderRadius: "6px", marginBottom: "1rem", fontWeight: 600 }}>
                        ✓ {decisionSuccess}
                      </div>
                    )}

                    <form onSubmit={handleSubmitDecision}>
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.9rem" }}>
                          Verification Action:
                        </label>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: decision === "APPROVE" ? 700 : 400, color: decision === "APPROVE" ? "#166534" : "inherit" }}>
                            <input
                              type="radio"
                              name="decision"
                              value="APPROVE"
                              checked={decision === "APPROVE"}
                              onChange={(e) => setDecision(e.target.value)}
                            />
                            ✅ Approve Application
                          </label>

                          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: decision === "REJECT" ? 700 : 400, color: decision === "REJECT" ? "#991b1b" : "inherit" }}>
                            <input
                              type="radio"
                              name="decision"
                              value="REJECT"
                              checked={decision === "REJECT"}
                              onChange={(e) => setDecision(e.target.value)}
                            />
                            ❌ Reject Application
                          </label>

                          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: decision === "REQUEST_CORRECTION" ? 700 : 400, color: decision === "REQUEST_CORRECTION" ? "#92400e" : "inherit" }}>
                            <input
                              type="radio"
                              name="decision"
                              value="REQUEST_CORRECTION"
                              checked={decision === "REQUEST_CORRECTION"}
                              onChange={(e) => setDecision(e.target.value)}
                            />
                            ⚠️ Request Document Correction
                          </label>
                        </div>
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <label htmlFor="manager_remarks" style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600, fontSize: "0.9rem" }}>
                          Manager Review Remarks &amp; Notes:
                        </label>
                        <textarea
                          id="manager_remarks"
                          rows="3"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="e.g. Identity and documents verified against branch records. Approved for disbursement."
                          style={{
                            width: "100%",
                            padding: "0.6rem 0.85rem",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                            fontSize: "0.9rem",
                            resize: "vertical",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                        <button type="button" className="btn-secondary" onClick={closeReviewModal}>
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingDecision}
                          className="btn"
                          style={{
                            backgroundColor: decision === "APPROVE" ? "#16a34a" : decision === "REJECT" ? "#dc2626" : "#d97706",
                            borderColor: decision === "APPROVE" ? "#16a34a" : decision === "REJECT" ? "#dc2626" : "#d97706",
                            color: "#fff",
                            fontWeight: 600,
                          }}
                        >
                          {submittingDecision ? "Submitting..." : `Submit Decision (${decision})`}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setShowPdfModal(false)}
        >
          <div
            style={{
              width: "92vw",
              maxWidth: "1050px",
              height: "90vh",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "0.85rem 1.25rem",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.4rem" }}>📄</span>
                <span style={{ fontWeight: 700 }}>
                  Application Report — {selectedApp?.application_code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "6px",
                  padding: "0.45rem 0.75rem",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✕ Close
              </button>
            </div>
            <div style={{ flex: 1, background: "#f1f5f9" }}>
              {pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="Loan Application Report"
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <p>Loading PDF preview...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
