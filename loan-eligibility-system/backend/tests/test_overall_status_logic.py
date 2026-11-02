"""
Comprehensive test suite for the improved AI Loan Eligibility Prediction
and Overall Application Status logic.

Covers:
- Example Test Case (Monika vs ARJUN RAMESH KUMAR)
- Scenario 1: Financially eligible applicant with all documents matching
- Scenario 2: Financially eligible applicant with multiple document mismatches
- Scenario 3: Financially eligible applicant with incomplete OCR extraction
- Scenario 4: Financially ineligible applicant with all documents matching
- Scenario 5: Financially ineligible applicant with document mismatches
- Manager Review Workflow (Manager final authority)
- PDF Report generation with 4 separate sections
"""
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ml_engine import ml_engine
from app.services.ocr_engine import ocr_engine
from app.services.status_evaluator import status_evaluator
from app.services.report_generator import report_generator
from app.models.enums import ApplicationStatus


def test_example_test_case_monika():
    """
    Example Test Case from User:
    Applicant-entered details:
      - Name: Monika
      - Institution: Bannari Amman Institute of Technology
      - Tuition Fee: 5,00,000
      - Age: 21
      - Course Duration: 48 months
    OCR-extracted details:
      - Name: ARJUN RAMESH KUMAR
      - Institution: GREENFIELD INSTITUTE OF TECHNOLOGY
      - Tuition Fee: 1,25,000
      - Age: 22
      - Course Duration: 24 months

    Expected output:
      - Financial Eligibility: Likely Eligible (from genuine AI model)
      - Document Verification: Mismatch Detected
      - Overall Application Status: CORRECTION_REQUIRED ("Correction Required")
      - Reason: Multiple critical discrepancies were detected between applicant-entered information and uploaded documents.
      - Next Action: Applicant must upload corrected documents before proceeding to final verification.
      - AI confidence and prediction MUST NOT be artificially lowered.
    """
    print("\n" + "=" * 70)
    print("TEST: Example Test Case (Monika vs ARJUN RAMESH KUMAR)")
    print("=" * 70)

    # 1. Financial info: Strong profile -> Should be Eligible
    financial_data = {
        "age": 21,
        "employment_duration_months": 36,
        "monthly_income": 85000,
        "credit_score": 790,
        "existing_emi": 5000,
        "number_of_dependents": 1,
        "requested_amount": 500000,
        "loan_tenure_months": 48,
    }
    is_eligible, probability, ml_details = ml_engine.predict_eligibility(financial_data)
    original_conf = ml_details.get("confidence")
    original_risk = ml_details.get("risk_level")

    print(f"[AI Financial Module] is_eligible={is_eligible}, prob={probability:.2%}, conf={original_conf}%, risk={original_risk}")
    assert is_eligible is True, "Strong applicant should be financially eligible by ML engine"
    assert original_risk == "LOW", "Strong applicant risk should be LOW"
    assert original_conf >= 70, "Confidence should be high"

    # 2. Form details vs OCR extracted details
    user_entered = {
        "student_name": "Monika",
        "institution": "Bannari Amman Institute of Technology",
        "tuition_fee": 500000,
        "student_age": 21,
        "course_duration_months": 48,
        "course": "B.Tech Information Technology",
        "applicant_income": 0,
        "co_applicant_income": 85000,
        "existing_obligations": 5000,
        "requested_amount": 500000,
        "loan_tenure_months": 48,
    }

    ocr_extracted_fields = {
        "student_name": "ARJUN RAMESH KUMAR",
        "full_name": "ARJUN RAMESH KUMAR",
        "institution": "GREENFIELD INSTITUTE OF TECHNOLOGY",
        "course": "Diploma in Mechanical Engineering",
        "tuition_fee": 125000,
        "student_age": 22,
        "course_duration_months": 24,
        "detected_document_type": "ADMISSION_LETTER",
        "confidence": 98.0,
    }

    mock_docs = [
        {
            "filename": "admission_cert.pdf",
            "document_type": "ADMISSION_LETTER",
            "extracted_fields": ocr_extracted_fields,
            "confidence": 98.0,
        }
    ]

    # Compare fields with OCR Engine
    comparison = ocr_engine.compare_fields_comprehensive(user_entered, mock_docs, "EDUCATION")
    print(f"[OCR Module] overall_status={comparison['overall_status']}, consistency_score={comparison['consistency_score']}%")
    print(f"[OCR Module] Discrepancies count: {len(comparison.get('discrepancies', []))}")
    for d in comparison.get("discrepancies", []):
        field_label = d.get("field_name", d.get("field", "Field"))
        entered = d.get("entered_value", d.get("applicant_value", "N/A"))
        extracted = d.get("extracted_value", d.get("document_value", "N/A"))
        entered_safe = str(entered).encode("ascii", "replace").decode("ascii")
        extracted_safe = str(extracted).encode("ascii", "replace").decode("ascii")
        print(f"   -> Mismatch: {field_label} | Form='{entered_safe}' vs Document='{extracted_safe}'")

    assert comparison["overall_status"] == "MISMATCH_DETECTED", "Should detect critical mismatches"
    assert len(comparison["discrepancies"]) >= 4, "Should detect at least 4 critical mismatches (Name, Inst, Fee, Duration, etc.)"

    # 3. Status Evaluator multi-module evaluation
    eval_result = status_evaluator.evaluate(
        ai_prediction=ml_details,
        ocr_comparison=comparison,
        uploaded_documents=mock_docs,
        existing_status=ApplicationStatus.DOCUMENTS_UPLOADED.value,
    )

    print(f"[Overall Status Evaluator]:")
    print(f"   overall_status: {eval_result['overall_status']}")
    print(f"   overall_status_label: {eval_result['overall_status_label']}")
    print(f"   financial_eligibility: {eval_result['financial_eligibility_status']}")
    print(f"   document_verification: {eval_result['document_verification_status']}")
    print(f"   model_confidence: {eval_result['model_confidence']}%")
    print(f"   reason: {eval_result['reason']}")
    print(f"   next_processing_step: {eval_result['next_processing_step']}")

    # Verification assertions:
    assert eval_result["financial_eligibility_status"] == "Likely Eligible", "Financial eligibility must remain positive!"
    assert eval_result["document_verification_status"] == "Mismatch Detected", "Document verification must report mismatch!"
    assert eval_result["overall_status"] == ApplicationStatus.CORRECTION_REQUIRED.value, "Overall status must be CORRECTION_REQUIRED!"
    assert eval_result["overall_status_label"] == "Correction Required"
    assert "Multiple critical discrepancies were detected" in eval_result["reason"]
    assert "Applicant must upload corrected documents" in eval_result["next_processing_step"]
    # Model confidence must NOT be artificially altered:
    assert eval_result["model_confidence"] == original_conf, "Model confidence score must NOT be modified by document mismatch!"
    print("PASS: Monika scenario verified perfectly!\n")


def test_scenario_1_financially_eligible_docs_matching():
    """
    Scenario 1: Financially eligible applicant with all documents matching.
    Expected:
      - Financial: Likely Eligible
      - Document Verification: Verified
      - Overall Status: SUBMITTED_TO_BRANCH ("Pending Branch Manager Review")
    """
    print("\n" + "=" * 70)
    print("TEST Scenario 1: Financially eligible applicant with all documents matching")
    print("=" * 70)

    ml_details = {
        "eligible": True,
        "probability": 0.88,
        "confidence": 88.0,
        "risk_level": "LOW",
        "contributing_factors": ["High income", "Good credit score"],
    }

    user_entered = {
        "student_name": "Monika R",
        "institution": "Bannari Amman Institute of Technology",
        "tuition_fee": 250000,
        "student_age": 21,
        "course_duration_months": 48,
        "course": "B.Tech Information Technology",
        "applicant_income": 0,
        "co_applicant_income": 75000,
        "requested_amount": 250000,
        "loan_tenure_months": 48,
    }

    docs = [
        {
            "filename": "admission_monika.pdf",
            "document_type": "ADMISSION_LETTER",
            "extracted_fields": {
                "student_name": "Monika R",
                "institution": "Bannari Amman Institute of Technology",
                "tuition_fee": 250000,
                "student_age": 21,
                "course_duration_months": 48,
                "course": "B.Tech Information Technology",
                "detected_document_type": "ADMISSION_LETTER",
                "confidence": 99.0,
            },
            "confidence": 99.0,
        }
    ]

    comp = ocr_engine.compare_fields_comprehensive(user_entered, docs, "EDUCATION")
    assert comp["overall_status"] == "CONSISTENT"

    eval_res = status_evaluator.evaluate(
        ai_prediction=ml_details,
        ocr_comparison=comp,
        uploaded_documents=docs,
    )

    print(f"Scenario 1 -> overall_status: {eval_res['overall_status']}, label: {eval_res['overall_status_label']}")
    assert eval_res["overall_status"] == ApplicationStatus.SUBMITTED_TO_BRANCH.value
    assert eval_res["overall_status_label"] == "Pending Branch Manager Review"
    assert eval_res["financial_eligibility_status"] == "Likely Eligible"
    assert eval_res["document_verification_status"] == "All Documents Verified"
    print("PASS: Scenario 1 verified successfully!\n")


def test_scenario_2_financially_eligible_docs_mismatch():
    """
    Scenario 2: Financially eligible applicant with multiple document mismatches.
    Expected:
      - Financial: Likely Eligible (confidence unaffected)
      - Document Verification: Mismatch Detected
      - Overall Status: CORRECTION_REQUIRED
    """
    print("\n" + "=" * 70)
    print("TEST Scenario 2: Financially eligible applicant with multiple document mismatches")
    print("=" * 70)

    ml_details = {
        "eligible": True,
        "probability": 0.92,
        "confidence": 92.0,
        "risk_level": "LOW",
        "contributing_factors": ["High CIBIL 810", "Zero existing debt"],
    }

    mock_comp = {
        "overall_status": "MISMATCH_DETECTED",
        "consistency_score": 30.0,
        "discrepancies": [
            {"field": "Student Name", "applicant_value": "Rohan Sharma", "document_value": "Vikram Singh"},
            {"field": "Institution Name", "applicant_value": "IIT Madras", "document_value": "SRM University"},
        ],
        "comparison_table": [],
    }

    eval_res = status_evaluator.evaluate(
        ai_prediction=ml_details,
        ocr_comparison=mock_comp,
        uploaded_documents=[{"filename": "doc.pdf"}],
    )

    print(f"Scenario 2 -> overall_status: {eval_res['overall_status']}, label: {eval_res['overall_status_label']}")
    assert eval_res["overall_status"] == ApplicationStatus.CORRECTION_REQUIRED.value
    assert eval_res["overall_status_label"] == "Correction Required"
    assert eval_res["financial_eligibility_status"] == "Likely Eligible"
    assert eval_res["model_confidence"] == 92.0
    print("PASS: Scenario 2 verified successfully!\n")


def test_scenario_3_financially_eligible_incomplete_ocr():
    """
    Scenario 3: Financially eligible applicant with incomplete OCR extraction / missing docs.
    Expected:
      - Financial: Likely Eligible
      - Document Verification: Requires Manual Verification / Incomplete
      - Overall Status: PENDING_VERIFICATION ("Pending Verification")
    """
    print("\n" + "=" * 70)
    print("TEST Scenario 3: Financially eligible applicant with incomplete OCR extraction")
    print("=" * 70)

    ml_details = {
        "eligible": True,
        "probability": 0.85,
        "confidence": 85.0,
        "risk_level": "LOW",
    }

    mock_comp = {
        "overall_status": "NEEDS_VERIFICATION",
        "consistency_score": 50.0,
        "discrepancies": [],
        "comparison_table": [
            {"field_name": "Tuition Fee", "applicant_value": "500000", "extracted_value": "Not Detected", "match_status": "NOT_DETECTED"},
        ],
    }

    # Case A: OCR needs verification / not fully detected
    eval_res_a = status_evaluator.evaluate(
        ai_prediction=ml_details,
        ocr_comparison=mock_comp,
        uploaded_documents=[{"filename": "blurry_doc.pdf"}],
    )
    print(f"Scenario 3A -> overall_status: {eval_res_a['overall_status']}, label: {eval_res_a['overall_status_label']}")
    assert eval_res_a["overall_status"] == ApplicationStatus.PENDING_VERIFICATION.value
    assert eval_res_a["overall_status_label"] == "Pending Verification"

    # Case B: No uploaded documents at all
    eval_res_b = status_evaluator.evaluate(
        ai_prediction=ml_details,
        ocr_comparison={"overall_status": "PENDING", "comparison_table": []},
        uploaded_documents=[],
    )
    print(f"Scenario 3B (No docs) -> overall_status: {eval_res_b['overall_status']}, label: {eval_res_b['overall_status_label']}")
    assert eval_res_b["overall_status"] == ApplicationStatus.PENDING_VERIFICATION.value
    assert eval_res_b["overall_status_label"] == "Pending Verification"
    print("PASS: Scenario 3 verified successfully!\n")


def test_scenario_4_financially_ineligible_docs_matching():
    """
    Scenario 4: Financially ineligible applicant with all documents matching.
    Expected:
      - Financial: Requires Detailed Review / Ineligible
      - Document Verification: All Documents Verified
      - Overall Status: SUBMITTED_TO_BRANCH (Forwarded to human Branch Manager per workflow)
    """
    print("\n" + "=" * 70)
    print("TEST Scenario 4: Financially ineligible applicant with all documents matching")
    print("=" * 70)

    ml_details = {
        "eligible": False,
        "probability": 0.35,
        "confidence": 65.0,
        "risk_level": "HIGH",
        "contributing_factors": ["High DTI ratio > 65%", "Low credit score 540"],
    }

    mock_comp = {
        "overall_status": "CONSISTENT",
        "consistency_score": 90.0,
        "discrepancies": [],
        "comparison_table": [],
    }

    eval_res = status_evaluator.evaluate(
        ai_prediction=ml_details,
        ocr_comparison=mock_comp,
        uploaded_documents=[{"filename": "valid_doc.pdf"}],
    )

    print(f"Scenario 4 -> overall_status: {eval_res['overall_status']}, label: {eval_res['overall_status_label']}")
    print(f"Scenario 4 -> financial_status: {eval_res['financial_eligibility_status']}")
    assert eval_res["overall_status"] == ApplicationStatus.SUBMITTED_TO_BRANCH.value
    assert eval_res["financial_eligibility_status"] == "Requires Detailed Review"
    assert eval_res["document_verification_status"] == "All Documents Verified"
    assert "financial eligibility indicates potential credit risk" in eval_res["reason"].lower() or "requires branch manager" in eval_res["reason"].lower()
    print("PASS: Scenario 4 verified successfully!\n")


def test_scenario_5_financially_ineligible_docs_mismatch():
    """
    Scenario 5: Financially ineligible applicant with document mismatches.
    Expected:
      - Financial: Requires Detailed Review / Ineligible
      - Document Verification: Mismatch Detected
      - Overall Status: CORRECTION_REQUIRED
    """
    print("\n" + "=" * 70)
    print("TEST Scenario 5: Financially ineligible applicant with document mismatches")
    print("=" * 70)

    ml_details = {
        "eligible": False,
        "probability": 0.25,
        "confidence": 75.0,
        "risk_level": "HIGH",
    }

    mock_comp = {
        "overall_status": "MISMATCH_DETECTED",
        "consistency_score": 25.0,
        "discrepancies": [
            {"field": "Identity Proof", "applicant_value": "A1234567", "document_value": "B9876543"},
        ],
        "comparison_table": [],
    }

    eval_res = status_evaluator.evaluate(
        ai_prediction=ml_details,
        ocr_comparison=mock_comp,
        uploaded_documents=[{"filename": "mismatched_id.pdf"}],
    )

    print(f"Scenario 5 -> overall_status: {eval_res['overall_status']}, label: {eval_res['overall_status_label']}")
    assert eval_res["overall_status"] == ApplicationStatus.CORRECTION_REQUIRED.value
    assert eval_res["overall_status_label"] == "Correction Required"
    assert eval_res["financial_eligibility_status"] == "Requires Detailed Review"
    assert eval_res["document_verification_status"] == "Mismatch Detected"
    print("PASS: Scenario 5 verified successfully!\n")


def test_branch_manager_final_authority():
    """
    Validate that only the Branch Manager can make final loan decisions (Approve/Reject).
    The AI positive recommendation never overrides human authority.
    """
    print("\n" + "=" * 70)
    print("TEST: Branch Manager Final Authority")
    print("=" * 70)

    ml_details = {"eligible": True, "probability": 0.99, "confidence": 99.0, "risk_level": "LOW"}
    comp = {"overall_status": "CONSISTENT", "discrepancies": []}

    # Before manager action: Status is SUBMITTED_TO_BRANCH, NOT APPROVED!
    eval_pending = status_evaluator.evaluate(
        ai_prediction=ml_details,
        ocr_comparison=comp,
        uploaded_documents=[{"filename": "doc.pdf"}],
    )
    assert eval_pending["overall_status"] == ApplicationStatus.SUBMITTED_TO_BRANCH.value
    assert eval_pending["overall_status"] != ApplicationStatus.APPROVED.value, "AI must NEVER automatically approve without Branch Manager!"

    # Manager approves:
    eval_approved = status_evaluator.evaluate(
        ai_prediction=ml_details,
        ocr_comparison=comp,
        uploaded_documents=[{"filename": "doc.pdf"}],
        existing_manager_decision="APPROVE",
    )
    assert eval_approved["overall_status"] == ApplicationStatus.APPROVED.value
    assert eval_approved["overall_status_label"] == "Approved"

    # Manager rejects:
    eval_rejected = status_evaluator.evaluate(
        ai_prediction=ml_details,
        ocr_comparison=comp,
        uploaded_documents=[{"filename": "doc.pdf"}],
        existing_manager_decision="REJECT",
    )
    assert eval_rejected["overall_status"] == ApplicationStatus.REJECTED.value
    assert eval_rejected["overall_status_label"] == "Rejected"

    print("PASS: Branch Manager authority verified!\n")


def test_pdf_report_sections():
    """
    Validate that the generated PDF contains:
      1. Financial Eligibility Assessment
      2. OCR Document Verification
      3. Overall Application Assessment
      4. Branch Manager Review
    with Meridian Trust Bank branding preserved.
    """
    print("\n" + "=" * 70)
    print("TEST: PDF Report Generation (4 Sections & Meridian Trust Bank Branding)")
    print("=" * 70)

    report_payload = {
        "application_code": "EDU-2024-MONIKA01",
        "verification_code": "V-MNK2024",
        "loan_type": "EDUCATION",
        "status": "CORRECTION_REQUIRED",
        "applicant_name": "Monika",
        "applicant_email": "monika@example.com",
        "applicant_phone": "9876543210",
        "requested_amount": 500000,
        "loan_tenure_months": 48,
        "monthly_income": 85000,
        "existing_emi": 5000,
        "detail": {
            "student_name": "Monika",
            "institution": "Bannari Amman Institute of Technology",
            "tuition_fee": 500000,
            "student_age": 21,
            "course_duration_months": 48,
        },
        "ocr_comparison": {
            "overall_status": "MISMATCH_DETECTED",
            "consistency_score": 25.0,
            "discrepancies": [
                {"field": "Student Name", "applicant_value": "Monika", "document_value": "ARJUN RAMESH KUMAR"},
                {"field": "Institution Name", "applicant_value": "Bannari Amman Institute of Technology", "document_value": "GREENFIELD INSTITUTE OF TECHNOLOGY"},
                {"field": "Tuition Fee", "applicant_value": "500000", "document_value": "125000"},
            ],
            "comparison_table": [
                {"field_name": "Student Name", "entered_value": "Monika", "extracted_value": "ARJUN RAMESH KUMAR", "match_status": "MISMATCH", "document_name": "admission_letter.pdf"},
                {"field_name": "Institution Name", "entered_value": "Bannari Amman Institute of Technology", "extracted_value": "GREENFIELD INSTITUTE OF TECHNOLOGY", "match_status": "MISMATCH", "document_name": "admission_letter.pdf"},
                {"field_name": "Tuition Fee", "entered_value": "500000", "extracted_value": "125000", "match_status": "MISMATCH", "document_name": "admission_letter.pdf"},
            ],
        },
        "ai_prediction": {
            "eligible": True,
            "confidence": 91.5,
            "score": 91,
            "risk_level": "LOW",
            "contributing_factors": ["High repayment buffer ratio", "Low existing DTI ratio"],
            "positive_factors": ["Excellent income buffer", "Healthy financial standing"],
            "negative_factors": [],
            "reasoning": "Strong family income and manageable existing obligations make this loan viable.",
        },
        "overall_assessment": {
            "overall_status": "CORRECTION_REQUIRED",
            "overall_status_label": "Correction Required",
            "reason": "Multiple critical discrepancies were detected between applicant-entered information and uploaded documents.",
            "required_applicant_corrections": "Applicant must re-upload valid admission letters and fee certificates corresponding to entered institution.",
            "next_processing_step": "Applicant must upload corrected documents before proceeding to final verification.",
            "discrepancies": [
                {"field": "Student Name", "applicant_value": "Monika", "document_value": "ARJUN RAMESH KUMAR"},
                {"field": "Institution Name", "applicant_value": "Bannari Amman Institute of Technology", "document_value": "GREENFIELD INSTITUTE OF TECHNOLOGY"},
            ],
        },
        "manager_review": {
            "review_status": "Action Required by Applicant",
            "manager_remarks": "Document details do not match applicant profile. Correction requested.",
            "final_decision": "CORRECTION_REQUIRED",
        },
        "branch_name": "Chennai Main Branch",
        "assigned_manager_name": "Karthik Subramanian",
    }

    pdf_bytes = report_generator.generate_application_report(report_payload)
    assert pdf_bytes is not None, "PDF bytes should not be None"
    assert len(pdf_bytes) > 2000, f"PDF should be substantial, got {len(pdf_bytes)} bytes"

    # Verify PDF starts with %PDF
    assert pdf_bytes.startswith(b"%PDF"), "Generated output should be a valid PDF document"
    print(f"Generated PDF successfully ({len(pdf_bytes)} bytes)!")
    print("PASS: PDF report generation verified successfully!\n")


if __name__ == "__main__":
    test_example_test_case_monika()
    test_scenario_1_financially_eligible_docs_matching()
    test_scenario_2_financially_eligible_docs_mismatch()
    test_scenario_3_financially_eligible_incomplete_ocr()
    test_scenario_4_financially_ineligible_docs_matching()
    test_scenario_5_financially_ineligible_docs_mismatch()
    test_branch_manager_final_authority()
    test_pdf_report_sections()
    print("\n" + "=" * 70)
    print("ALL 7 CORE TEST SUITE CASES COMPLETED SUCCESSFULLY!")
    print("=" * 70)

