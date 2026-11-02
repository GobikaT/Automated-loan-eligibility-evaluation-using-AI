import React, { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../services/apiClient";

const FLAG_COLOR = {
  AFFORDABLE: "var(--success)",
  TIGHT: "var(--warning)",
  NOT_AFFORDABLE: "var(--danger)",
};

const STATUS_BADGES = {
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

function formatKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(key, value) {
  if (!value && value !== 0) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key.endsWith("_flag") || key === "affordability_flag" || key === "emi_affordability_flag") {
    return String(value).replace(/_/g, " ");
  }
  if (key.includes("duration") || key.includes("tenure")) {
    const num = parseInt(value, 10);
    return isNaN(num) ? String(value) : (String(value).toLowerCase().includes("month") ? String(value) : `${num} months`);
  }
  if (key.includes("ratio") || key.includes("percentage")) {
    const num = parseFloat(value);
    return isNaN(num) ? value : `${(num * 100).toFixed(2)}%`;
  }
  if (
    key.includes("income") ||
    key.includes("emi") ||
    key.includes("cost") ||
    key.includes("fee") ||
    key.includes("amount") ||
    key.includes("property_value")
  ) {
    const num = Number(value);
    return isNaN(num) ? value : `₹${num.toLocaleString("en-IN")}`;
  }
  return String(value);
}

export default function OCRVerificationReport({ result }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  if (!result) return null;

  const {
    id,
    application_code,
    verification_code,
    loan_type,
    branch_name,
    assigned_manager_name,
    calculated = {},
    documents = [],
    ocr_comparison = {},
    ai_prediction = {},
    warnings = [],
  } = result;

  const comparisonTable = ocr_comparison?.comparison_table || [];
  const overallOcrStatus = ocr_comparison?.overall_status || "CONSISTENT";
  const discrepancies = ocr_comparison?.discrepancies || comparisonTable.filter(r => r.match_status === "MISMATCH");
  const isMismatch = discrepancies.length > 0 || overallOcrStatus === "MISMATCH_DETECTED";

  const overallAssessment = result.overall_assessment || {};
  const overallStatus = result.status || overallAssessment.overall_status || (isMismatch ? "CORRECTION_REQUIRED" : "SUBMITTED_TO_BRANCH");
  const overallStatusLabel = result.status_label || overallAssessment.overall_status_label || (
    overallStatus === "CORRECTION_REQUIRED"
      ? "Correction Required"
      : overallStatus === "SUBMITTED_TO_BRANCH"
      ? "Pending Branch Manager Review"
      : "Pending Verification"
  );
  const statusReason = overallAssessment.reason || (
    isMismatch
      ? "Multiple critical discrepancies were detected between applicant-entered information and uploaded documents."
      : "All required documents verified successfully and applicant meets initial AI financial eligibility criteria."
  );
  const requiredCorrections = overallAssessment.required_corrections || (
    isMismatch ? "Applicant must upload corrected documents before proceeding to final verification." : "None"
  );
  const nextProcessingStep = overallAssessment.next_processing_step || (
    isMismatch
      ? "Applicant must upload corrected documents before proceeding to final verification."
      : "Application forwarded to authorized Branch Manager for credit appraisal and final sanction decision."
  );
  const docVerificationStatus = overallAssessment.document_verification_status || (
    isMismatch ? "Mismatch Detected" : (overallOcrStatus === "CONSISTENT" ? "Verified" : "Pending Verification")
  );

  const handleDownloadPdf = async () => {
    if (!id) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await apiClient.get(`/api/applicant/applications/${id}/report`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Loan_Report_${application_code || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Download error:", err);
      setDownloadError("Could not download PDF report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenPdfPreview = async () => {
    if (!id) return;
    if (previewBlobUrl) {
      setShowPdfModal(true);
      return;
    }
    setLoadingPreview(true);
    setDownloadError("");
    try {
      const response = await apiClient.get(`/api/applicant/applications/${id}/report?inline=true`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      setShowPdfModal(true);
    } catch (err) {
      console.error("PDF Preview load error:", err);
      setDownloadError("Could not load PDF preview. You can still use the Download button.");
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Header Banner */}
      <div
        className="card"
        style={{
          borderLeft: "6px solid var(--ink-500)",
          background: "linear-gradient(135deg, #f8fafc 0%, #edf4f9 100%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>📋</span>
              <h2 style={{ margin: 0 }}>Application &amp; Document Verification Report</h2>
            </div>
            <p style={{ marginTop: "0.35rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Details entered have been verified and cross-referenced against your uploaded documents.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleOpenPdfPreview}
              disabled={loadingPreview}
              className="btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.55rem 1rem",
                fontSize: "0.9rem",
              }}
            >
              <span>{loadingPreview ? "⏳" : "👁️"}</span>
              <span>{loadingPreview ? "Loading Report..." : "Touch to Preview PDF"}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.55rem 1rem",
                fontSize: "0.9rem",
              }}
            >
              <span>{downloading ? "⏳" : "📥"}</span>
              <span>{downloading ? "Downloading..." : "Download PDF"}</span>
            </button>
          </div>
        </div>

        {downloadError && <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.5rem" }}>{downloadError}</p>}

        {/* Application Identifiers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.75rem",
            marginTop: "1.25rem",
            padding: "0.85rem",
            background: "#ffffff",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Application ID
            </div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--ink-900)" }}>
              {application_code || "N/A"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Verification Code
            </div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--ink-700)" }}>
              {verification_code || "N/A"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Loan Category
            </div>
            <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--ink-900)" }}>
              {loan_type ? `${loan_type} LOAN` : "LOAN APPLICATION"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Assigned Branch
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--ink-900)" }}>
              {branch_name || "Main Branch"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Assigned Branch Manager
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#0284c7" }}>
              {assigned_manager_name || "Branch Manager"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Document Verification
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: isMismatch ? "var(--danger)" : "var(--success)",
              }}
            >
              {docVerificationStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Application Assessment Card */}
      <div
        className="card"
        style={{
          borderLeft: `6px solid ${
            overallStatus === "CORRECTION_REQUIRED"
              ? "var(--danger)"
              : overallStatus === "SUBMITTED_TO_BRANCH"
              ? "#0284c7"
              : overallStatus === "APPROVED"
              ? "var(--success)"
              : "var(--warning)"
          }`,
          background:
            overallStatus === "CORRECTION_REQUIRED"
              ? "#fef2f2"
              : overallStatus === "SUBMITTED_TO_BRANCH"
              ? "#f0f9ff"
              : overallStatus === "APPROVED"
              ? "#ecfdf5"
              : "#fffbeb",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: 700 }}>
              Overall Application Assessment
            </div>
            <h2
              style={{
                margin: "0.25rem 0 0 0",
                fontSize: "1.3rem",
                color:
                  overallStatus === "CORRECTION_REQUIRED"
                    ? "#991b1b"
                    : overallStatus === "SUBMITTED_TO_BRANCH"
                    ? "#0369a1"
                    : overallStatus === "APPROVED"
                    ? "#065f46"
                    : "#92400e",
              }}
            >
              Status: {overallStatusLabel.toUpperCase()}
            </h2>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Document Verification</span>
            <span
              style={{
                display: "inline-block",
                padding: "0.2rem 0.6rem",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "0.85rem",
                background: isMismatch ? "#fee2e2" : "#ecfdf5",
                color: isMismatch ? "#991b1b" : "#065f46",
                border: `1px solid ${isMismatch ? "#fca5a5" : "#a7f3d0"}`,
                marginTop: "0.2rem",
              }}
            >
              {docVerificationStatus}
            </span>
          </div>
        </div>

        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.9rem" }}>
          <div style={{ padding: "0.6rem 0.8rem", background: "#ffffff", borderRadius: "6px", border: "1px solid var(--border)" }}>
            <strong style={{ color: "var(--ink-900)" }}>Reason for Status: </strong>
            <span style={{ color: "var(--ink-800)" }}>{statusReason}</span>
          </div>
          {requiredCorrections && requiredCorrections !== "None" && (
            <div style={{ padding: "0.6rem 0.8rem", background: "#ffffff", borderRadius: "6px", border: "1px solid #fca5a5" }}>
              <strong style={{ color: "#991b1b" }}>Required Applicant Corrections: </strong>
              <span style={{ color: "#7f1d1d" }}>{requiredCorrections}</span>
            </div>
          )}
          <div style={{ padding: "0.6rem 0.8rem", background: "#ffffff", borderRadius: "6px", border: "1px solid var(--border)" }}>
            <strong style={{ color: "var(--ink-900)" }}>Next Processing Step: </strong>
            <span style={{ color: "var(--ink-800)" }}>{nextProcessingStep}</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            ⚖️ <em>Statutory Rule: Only the authorized Branch Manager can make the final loan approval or rejection decision.</em>
          </div>
        </div>
      </div>

      {/* Interactive PDF Touch Card */}
      <div
        className="card"
        onClick={handleOpenPdfPreview}
        style={{
          border: "2px solid #0284c7",
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          cursor: "pointer",
          padding: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          boxShadow: "0 4px 15px rgba(2, 132, 199, 0.12)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "#0284c7",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
            }}
          >
            📄
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0369a1" }}>
                Official AI Verification PDF Report
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "0.15rem 0.5rem",
                  background: "#bae6fd",
                  color: "#0369a1",
                  borderRadius: "10px",
                  fontWeight: 700,
                }}
              >
                TOUCH TO PREVIEW
              </span>
            </div>
            <p style={{ margin: "0.25rem 0 0 0", color: "#0c4a6e", fontSize: "0.85rem" }}>
              Click or tap here to preview the generated report with close option &amp; instant PDF download.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="btn"
            onClick={handleOpenPdfPreview}
            disabled={loadingPreview}
            style={{ background: "#0284c7", borderColor: "#0284c7", color: "#fff" }}
          >
            <span>{loadingPreview ? "⏳" : "👁️"}</span>
            <span>{loadingPreview ? "Opening..." : "Touch to Open PDF"}</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            <span>{downloading ? "⏳" : "📥"}</span>
            <span>Download</span>
          </button>
        </div>
      </div>

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
            {/* Modal Header */}
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
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                    Loan Application Verification Report
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    Application: {application_code} &middot; Status: AI Verified &amp; Submitted to Branch
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  style={{
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.45rem 0.9rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <span>📥</span>
                  <span>{downloading ? "Downloading..." : "Download PDF"}</span>
                </button>
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
                  title="Close PDF Preview"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Modal Body with PDF iframe */}
            <div style={{ flex: 1, background: "#f1f5f9", position: "relative" }}>
              {previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  title="Loan Application Report"
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <p>Loading document preview...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Document Field Cross-Verification Matrix */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🔍</span>
            <span>Document vs Form Cross-Verification</span>
          </h3>
          <span
            style={{
              padding: "0.25rem 0.6rem",
              borderRadius: "12px",
              fontSize: "0.8rem",
              fontWeight: 600,
              background: overallOcrStatus === "CONSISTENT" ? "#ecfdf5" : "#fffbeb",
              color: overallOcrStatus === "CONSISTENT" ? "#065f46" : "#92400e",
              border: `1px solid ${overallOcrStatus === "CONSISTENT" ? "#a7f3d0" : "#fde68a"}`,
            }}
          >
            {ocr_comparison?.summary || "Automated Document Cross-Check Complete"}
          </span>
        </div>

        {comparisonTable.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "var(--surface-muted)", borderBottom: "2px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "0.6rem 0.75rem" }}>Field Name</th>
                  <th style={{ textAlign: "left", padding: "0.6rem 0.75rem" }}>Applicant Entered</th>
                  <th style={{ textAlign: "left", padding: "0.6rem 0.75rem" }}>OCR Extracted</th>
                  <th style={{ textAlign: "center", padding: "0.6rem 0.75rem" }}>Match Status</th>
                  <th style={{ textAlign: "left", padding: "0.6rem 0.75rem" }}>Source Document</th>
                  <th style={{ textAlign: "left", padding: "0.6rem 0.75rem" }}>Verification Remarks</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row, idx) => {
                  const badge = STATUS_BADGES[row.display_status] || STATUS_BADGES[row.match_status] || STATUS_BADGES.NEEDS_VERIFICATION;
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border)", background: idx % 2 === 0 ? "#ffffff" : "#fbfcfe" }}>
                      <td style={{ padding: "0.65rem 0.75rem", fontWeight: 600, color: "var(--ink-900)" }}>
                        {row.field_name || formatKey(row.key)}
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", color: "var(--text)" }}>
                        {formatValue(row.key, row.entered_value)}
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", color: "var(--text)", fontWeight: 500 }}>
                        {row.extracted_value && row.extracted_value !== "Not Detected"
                          ? formatValue(row.key, row.extracted_value)
                          : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Not Detected</span>}
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "12px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", fontSize: "0.82rem", color: "var(--ink-700)" }}>
                        {row.source_document || "-"}
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        {row.remarks || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            No documents attached during initial submission. Upload documents to run instant document verification.
          </p>
        )}

        {/* Identified Discrepancies Box */}
        {discrepancies.length > 0 && (
          <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
            <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>⚠️</span>
              <span>Identified Document Discrepancies ({discrepancies.length})</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.85rem", color: "#7f1d1d" }}>
              {discrepancies.map((d, i) => (
                <li key={i} style={{ marginBottom: "0.3rem" }}>
                  <strong>{d.field_name || formatKey(d.key)}:</strong> User entered "<em>{formatValue(d.key, d.entered_value)}</em>" but document indicates "<em>{formatValue(d.key, d.extracted_value)}</em>" ({d.source_document || "Uploaded Document"}).
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3. Uploaded Documents Breakdown Cards */}
      {documents && documents.length > 0 && (
        <div className="card">
          <h3 style={{ margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>📄</span>
            <span>Attached Documents &amp; Verification Details ({documents.length})</span>
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.85rem" }}>
            {documents.map((doc, i) => (
              <div
                key={i}
                style={{
                  padding: "0.85rem",
                  background: "var(--surface-muted)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--ink-900)", wordBreak: "break-all" }}>
                    📎 {doc.filename}
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px",
                      background: "#e0f2fe",
                      color: "#0369a1",
                    }}
                  >
                    {doc.document_type || "DOCUMENT"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <span>Verification Confidence:</span>
                  <span style={{ fontWeight: 600, color: "var(--ink-700)" }}>{Math.round(doc.confidence || 85)}%</span>
                </div>

                {doc.raw_snippet && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#475569",
                      background: "#ffffff",
                      padding: "0.4rem",
                      borderRadius: "4px",
                      border: "1px dashed var(--border)",
                      marginTop: "0.25rem",
                      maxHeight: "55px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    "{doc.raw_snippet}..."
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. AI Eligibility & Risk Assessment */}
      {ai_prediction && (
        <div className="card" style={{ borderLeft: "5px solid #2563eb" }}>
          <h3 style={{ margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🤖</span>
            <span>Financial Eligibility Assessment (AI Module)</span>
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
              marginTop: "0.5rem",
            }}
          >
            <div style={{ background: "var(--surface-muted)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>AI Prediction Result</div>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color:
                    (ai_prediction.prediction === "APPROVE" || ai_prediction.eligible === true)
                      ? "var(--success)"
                      : (ai_prediction.prediction === "REVIEW" || ai_prediction.risk_level === "MEDIUM")
                      ? "var(--warning)"
                      : "var(--danger)",
                }}
              >
                {ai_prediction.prediction || (ai_prediction.eligible ? "LIKELY ELIGIBLE" : "REQUIRES DETAILED REVIEW")}
              </div>
            </div>

            <div style={{ background: "var(--surface-muted)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Financial Risk Level</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--ink-900)" }}>
                {ai_prediction.risk_rating || ai_prediction.risk_level || "LOW"} RISK
              </div>
            </div>

            <div style={{ background: "var(--surface-muted)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Model Confidence</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--ink-900)" }}>
                {Math.round(
                  ai_prediction.confidence != null
                    ? (ai_prediction.confidence > 1 ? ai_prediction.confidence : ai_prediction.confidence * 100)
                    : (ai_prediction.score != null ? ai_prediction.score * 100 : 85)
                )}%
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
            ℹ️ <em>Evaluated using applicant financial parameters (income, obligations, credit score, DTI ratio, requested loan amount, and tenure). Model confidence and prediction reflect genuine statistical model output.</em>
          </div>

          {(() => {
            const reasons = Array.isArray(ai_prediction.reasoning)
              ? ai_prediction.reasoning
              : typeof ai_prediction.reasoning === "string"
              ? ai_prediction.reasoning.split(";").map((r) => r.trim()).filter(Boolean)
              : [];
            if (!reasons || reasons.length === 0) return null;
            return (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-900)", marginBottom: "0.3rem" }}>
                  Key Evaluation Highlights:
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.85rem", color: "var(--ink-700)" }}>
                  {reasons.map((r, i) => (
                    <li key={i} style={{ marginBottom: "0.25rem" }}>{r}</li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
      )}

      {/* 5. Financial Indicators Breakdown */}
      <div className="card">
        <h3 style={{ margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>📈</span>
          <span>Financial Calculations &amp; Affordability</span>
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {Object.entries(calculated).map(([k, v]) => {
            const isAffordability = k.includes("affordability") || k.endsWith("_flag");
            return (
              <div
                key={k}
                style={{
                  padding: "0.75rem",
                  background: "var(--surface-muted)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  {formatKey(k)}
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    marginTop: "0.2rem",
                    color: isAffordability ? FLAG_COLOR[v] || "var(--ink-900)" : "var(--ink-900)",
                  }}
                >
                  {formatValue(k, v)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Inconsistency Warnings if any */}
      {warnings && warnings.length > 0 && (
        <div className="card" style={{ borderLeft: "5px solid var(--warning)", background: "#fffbeb" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#92400e", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⚠️</span>
            <span>Items Requiring Branch Verification</span>
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#78350f", margin: "0 0 0.5rem 0" }}>
            The following items will be verified by the branch officer during review:
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.85rem", color: "#92400e" }}>
            {warnings.map((w, idx) => (
              <li key={idx} style={{ marginBottom: "0.25rem" }}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 7. Action Footer */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <Link to="/applicant/tracking" className="btn-secondary" style={{ padding: "0.6rem 1.25rem" }}>
          Track Application Status →
        </Link>
        <Link to="/applicant/dashboard" className="btn" style={{ padding: "0.6rem 1.25rem" }}>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
