"""
Overall Application Status and Multi-Module Assessment Evaluator.

Coordinates:
1. Financial Eligibility Prediction (AI Module)
   - Evaluates monthly income, EMI obligations, credit score, DTI, loan amount, tenure
   - Produces model confidence and financial risk level from actual ML model output
2. Document Verification (OCR Module)
   - Independently verifies applicant name, identity proof, institution name,
     course name, tuition fee, student age, course duration, financial information
   - Compares applicant-entered vs OCR-extracted details
3. Overall Application Status Logic
   - Considers BOTH financial eligibility and document verification
   - Disallows positive financial predictions from overriding critical document mismatches
   - Directs application into:
     * CORRECTION_REQUIRED: if critical document mismatches are detected
     * PENDING_VERIFICATION (or DOCUMENTS_UNDER_VERIFICATION): if documents missing / incomplete
     * SUBMITTED_TO_BRANCH (Pending Branch Manager Review): if documents verified
     * Final decisions are strictly reserved for the authorized Branch Manager
"""
from typing import Dict, Any, List, Optional
from app.models.enums import ApplicationStatus


class OverallStatusEvaluator:
    """Evaluates combined application state from AI Prediction and OCR Verification"""

    CRITICAL_FIELDS = {
        "student_name",
        "full_name",
        "cross_document_name_check",
        "id_number",
        "institution",
        "course",
        "tuition_fee",
        "student_age",
        "age",
        "course_duration_months",
        "applicant_income",
        "monthly_income",
        "property_value",
    }

    @classmethod
    def evaluate(
        cls,
        ai_prediction: Dict[str, Any],
        ocr_comparison: Dict[str, Any],
        uploaded_documents: Optional[List[Any]] = None,
        existing_manager_decision: Optional[str] = None,
        existing_status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate overall application status based on independent financial prediction
        and document verification results.

        Returns a dict that always includes:
          - overall_status           : ApplicationStatus enum value string
          - overall_status_label     : Human-readable label
          - financial_eligibility_status : "Likely Eligible" | "Requires Detailed Review"
          - document_verification_status : e.g. "Mismatch Detected", "All Documents Verified", etc.
          - model_confidence         : ACTUAL model confidence (never modified by doc mismatch)
          - reason                   : Text explaining why this status was assigned
          - required_applicant_corrections : What applicant must do next
          - next_processing_step     : Next step in the workflow
          - discrepancies            : List of discrepancy dicts (field, applicant_value, document_value)
          - is_correction_required   : bool
          - is_pending_verification  : bool
        """
        # 2. Extract AI Model outputs (must NEVER be altered by OCR results)
        is_financially_eligible = bool(ai_prediction.get("eligible", False))
        model_confidence = float(ai_prediction.get("confidence", 0.0) or 0.0)
        risk_level = str(ai_prediction.get("risk_level", "MEDIUM")).upper()
        financial_eligibility_status = "Likely Eligible" if is_financially_eligible else "Requires Detailed Review"

        # If Branch Manager has already recorded a final decision, respect it
        if existing_manager_decision:
            decision_upper = existing_manager_decision.upper()
            if decision_upper == "APPROVE":
                return {
                    "overall_status": ApplicationStatus.APPROVED.value,
                    "overall_status_label": "Approved",
                    "financial_eligibility_status": financial_eligibility_status,
                    "document_verification_status": "Verified",
                    "model_confidence": model_confidence,
                    "reason": "Application approved by authorized Branch Manager.",
                    "required_applicant_corrections": "None",
                    "next_processing_step": "Proceed to loan agreement generation and disbursement processing.",
                    "discrepancies": [],
                    "is_correction_required": False,
                    "is_pending_verification": False,
                }
            elif decision_upper == "REJECT":
                return {
                    "overall_status": ApplicationStatus.REJECTED.value,
                    "overall_status_label": "Rejected",
                    "financial_eligibility_status": financial_eligibility_status,
                    "document_verification_status": "Completed",
                    "model_confidence": model_confidence,
                    "reason": "Application rejected by authorized Branch Manager.",
                    "required_applicant_corrections": "None",
                    "next_processing_step": "Application closed. Applicant may reapply after resolving identified risk factors.",
                    "discrepancies": [],
                    "is_correction_required": False,
                    "is_pending_verification": False,
                }
            elif decision_upper in ("REQUEST_CORRECTION", "CORRECTION_REQUIRED"):
                return {
                    "overall_status": ApplicationStatus.CORRECTION_REQUIRED.value,
                    "overall_status_label": "Correction Required",
                    "financial_eligibility_status": financial_eligibility_status,
                    "document_verification_status": "Correction Requested",
                    "model_confidence": model_confidence,
                    "reason": "Branch Manager requested corrections to submitted application or documents.",
                    "required_applicant_corrections": "Applicant must revise requested fields and re-upload supporting documents.",
                    "next_processing_step": "Applicant must upload corrected documents before proceeding.",
                    "discrepancies": [],
                    "is_correction_required": True,
                    "is_pending_verification": False,
                }

        # 1. Analyze Document Verification (OCR Module)
        comparison_table = ocr_comparison.get("comparison_table", []) if ocr_comparison else []
        ocr_overall = str(ocr_comparison.get("overall_status", "")).strip().upper() if ocr_comparison else ""
        has_documents = bool(uploaded_documents and len(uploaded_documents) > 0)

        # Collect discrepancies from both the explicit discrepancies list and comparison_table mismatches
        explicit_discrepancies = ocr_comparison.get("discrepancies", []) if ocr_comparison else []

        # Detect any mismatches in comparison rows
        mismatched_rows = [
            r for r in comparison_table
            if str(r.get("match_status", "")).upper() in ("MISMATCH",)
        ]

        # Build unified discrepancies list (normalise both formats from OCR engine & manual input)
        # OCR engine format: {key, field_name, entered_value, extracted_value, ...}
        # Manual format: {field, applicant_value, document_value}
        def _normalise_discrepancy(d: Dict[str, Any]) -> Dict[str, str]:
            return {
                "field": d.get("field_name") or d.get("field") or d.get("key") or "Field",
                "applicant_value": str(d.get("entered_value") or d.get("applicant_value") or "N/A"),
                "document_value": str(d.get("extracted_value") or d.get("document_value") or "N/A"),
            }

        all_discrepancies: List[Dict[str, str]] = []
        if explicit_discrepancies:
            all_discrepancies = [_normalise_discrepancy(d) for d in explicit_discrepancies]
        elif mismatched_rows:
            all_discrepancies = [_normalise_discrepancy(r) for r in mismatched_rows]

        # Incomplete / missing checks
        not_detected_rows = [
            r for r in comparison_table
            if r.get("display_status") == "Not Detected"
            or str(r.get("extracted_value", "")).strip() in ("", "Not Detected", "not detected")
        ]

        # 3. Overall Application Status Logic Matrix (Priority-ordered rules)

        # RULE 1: Critical document mismatches detected
        # Positive financial prediction NEVER overrides critical document mismatches
        has_mismatch = (
            bool(mismatched_rows)
            or bool(all_discrepancies)
            or ocr_overall == "MISMATCH_DETECTED"
        )
        if has_mismatch:
            mismatched_names = [d.get("field", d.get("field_name", "Field")) for d in all_discrepancies]
            if not mismatched_names:
                mismatched_names = [r.get("field_name", r.get("key", "Field")) for r in mismatched_rows]

            if len(mismatched_names) > 1:
                reason = "Multiple critical discrepancies were detected between applicant-entered information and uploaded documents."
            elif len(mismatched_names) == 1:
                reason = f"Discrepancy detected in {mismatched_names[0]} between applicant-entered information and uploaded documents."
            else:
                reason = "Critical discrepancies were detected between applicant-entered information and uploaded documents."

            return {
                "overall_status": ApplicationStatus.CORRECTION_REQUIRED.value,
                "overall_status_label": "Correction Required",
                "financial_eligibility_status": financial_eligibility_status,
                "document_verification_status": "Mismatch Detected",
                "model_confidence": model_confidence,
                "reason": reason,
                "required_applicant_corrections": "Applicant must upload corrected documents matching the details provided in the application form.",
                "next_processing_step": "Applicant must upload corrected documents before proceeding to final verification.",
                "discrepancies": all_discrepancies,
                "is_correction_required": True,
                "is_pending_verification": False,
                "discrepancies_count": len(all_discrepancies or mismatched_rows),
                "mismatched_fields": mismatched_names,
            }

        # RULE 2: Missing documents or incomplete OCR extraction -> Pending Verification
        if not has_documents:
            return {
                "overall_status": ApplicationStatus.PENDING_VERIFICATION.value,
                "overall_status_label": "Pending Verification",
                "financial_eligibility_status": financial_eligibility_status,
                "document_verification_status": "Pending Documents",
                "model_confidence": model_confidence,
                "reason": "Required supporting documents have not been uploaded yet.",
                "required_applicant_corrections": "Upload all mandatory supporting documents for identity, institution, and income verification.",
                "next_processing_step": "Upload required documents to initiate automated OCR and branch verification.",
                "discrepancies": [],
                "is_correction_required": False,
                "is_pending_verification": True,
                "discrepancies_count": 0,
                "mismatched_fields": [],
            }

        # OCR needs manual review or fields not extracted
        if ocr_overall in ("NEEDS_VERIFICATION", "PENDING", "PENDING_VERIFICATION", "NEEDS_BRANCH_VERIFICATION"):
            return {
                "overall_status": ApplicationStatus.PENDING_VERIFICATION.value,
                "overall_status_label": "Pending Verification",
                "financial_eligibility_status": financial_eligibility_status,
                "document_verification_status": "Requires Manual Verification",
                "model_confidence": model_confidence,
                "reason": "OCR extraction is incomplete or requires manual verification for key supporting documents.",
                "required_applicant_corrections": "Ensure uploaded files are clear, high-resolution original document scans.",
                "next_processing_step": "Awaiting manual verification by branch document verification team.",
                "discrepancies": [],
                "is_correction_required": False,
                "is_pending_verification": True,
                "discrepancies_count": 0,
                "mismatched_fields": [],
            }

        # RULE 3: All required documents verified AND positive financial eligibility
        # -> Forward to "Pending Branch Manager Review" (human final decision required)
        if is_financially_eligible:
            return {
                "overall_status": ApplicationStatus.SUBMITTED_TO_BRANCH.value,
                "overall_status_label": "Pending Branch Manager Review",
                "financial_eligibility_status": financial_eligibility_status,
                "document_verification_status": "All Documents Verified",
                "model_confidence": model_confidence,
                "reason": "All required documents verified successfully and applicant meets initial AI financial eligibility criteria.",
                "required_applicant_corrections": "None required. Application is complete.",
                "next_processing_step": "Application forwarded to authorized Branch Manager for credit appraisal and final sanction decision.",
                "discrepancies": [],
                "is_correction_required": False,
                "is_pending_verification": False,
                "discrepancies_count": 0,
                "mismatched_fields": [],
            }

        # RULE 4: All required documents verified AND negative financial eligibility
        # -> Forward per existing review workflow. AI NEVER auto-rejects.
        # Final decision is STRICTLY reserved for the authorized Branch Manager.
        return {
            "overall_status": ApplicationStatus.SUBMITTED_TO_BRANCH.value,
            "overall_status_label": "Pending Branch Manager Review",
            "financial_eligibility_status": financial_eligibility_status,
            "document_verification_status": "All Documents Verified",
            "model_confidence": model_confidence,
            "reason": (
                f"Documents verified successfully. Financial eligibility assessment indicates potential credit risk "
                f"({risk_level} Risk level) based on current income, debt-to-income ratio or credit obligations. "
                f"Requires branch manager underwriting review."
            ),
            "required_applicant_corrections": "Branch Manager may request additional financial co-applicant or guarantor during review.",
            "next_processing_step": "Forwarded to Branch Manager for detailed underwriting review and final loan approval or rejection decision.",
            "discrepancies": [],
            "is_correction_required": False,
            "is_pending_verification": False,
            "discrepancies_count": 0,
            "mismatched_fields": [],
        }


status_evaluator = OverallStatusEvaluator()

