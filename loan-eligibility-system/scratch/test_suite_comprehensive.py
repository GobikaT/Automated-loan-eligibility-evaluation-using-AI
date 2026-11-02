import os
import sys

# Configure UTF-8 stdout
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.services.ocr_engine import ocr_engine

def run_tests():
    uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "uploads", "7"))
    files = [
        "1793552182_01_Admission_Offer_Letter.pdf",
        "1793552183_02_Fee_Structure_Estimate.pdf",
        "1793552183_03_Academic_Records_Marksheets.pdf",
        "1793552184_04_Student_Identity_Proof.pdf",
        "1793552184_05a_Co-Applicant_Salary_Slips.pdf",
    ]

    extracted_docs = []
    print("=================== 1. EXTRACTING DOCUMENTS ===================")
    for fname in files:
        fpath = os.path.join(uploads_dir, fname)
        text, conf = ocr_engine.extract_text_from_file(fpath, "application/pdf")
        doc_type = ocr_engine.detect_document_type(text, fname)
        fields = ocr_engine.extract_fields(text, doc_type, "EDUCATION", filename=fname)
        extracted_docs.append({
            "filename": fname,
            "document_type": doc_type,
            "confidence": conf * 100,
            "extracted_fields": fields,
        })
        print(f"\n[+] File: {fname}")
        print(f"    Doc Type: {doc_type}")
        print(f"    Student Name: {fields.get('student_name')}")
        print(f"    Co-Applicant Name: {fields.get('co_applicant_name')}")
        print(f"    Course: {fields.get('course')}")
        print(f"    Course Duration (months): {fields.get('course_duration_months')}")
        print(f"    Tuition Fee: {fields.get('tuition_fee')}")
        print(f"    Total Course Fee: {fields.get('total_course_fee')}")
        print(f"    Total Education Cost: {fields.get('total_education_cost')}")
        print(f"    Applicant Income: {fields.get('applicant_income')}")
        print(f"    Co-Applicant Income: {fields.get('co_applicant_income')}")
        print(f"    Aadhaar: {fields.get('aadhaar_number')}")
        print(f"    PAN: {fields.get('pan_number')}")
        print(f"    Passport: {fields.get('passport_number')}")

    # Now run Comprehensive Comparison with typical Education Loan User Input
    user_entered = {
        "student_name": "ARJUN RAMESH KUMAR",
        "student_age": 22,
        "course": "Master of Science (M.Sc.) in Data Science",
        "course_duration_months": 24,
        "institution": "Greenfield Institute of Technology",
        "tuition_fee": 660000.0,
        "applicant_income": 0.0,
        "co_applicant_income": 72952.0,
        "monthly_income": 72952.0,
    }

    print("\n=================== 2. RUNNING COMPREHENSIVE COMPARISON ===================")
    comparison = ocr_engine.compare_fields_comprehensive(user_entered, extracted_docs, "EDUCATION")
    
    print(f"Overall Status: {comparison['overall_status']}")
    print(f"Consistency Score: {comparison['consistency_score']}%")
    print(f"Consistent Fields Count: {comparison['consistent_fields_count']} / {comparison['total_verifiable_fields']}")
    print(f"Discrepancies Count: {len(comparison['discrepancies'])}")
    
    print("\n------------------- VERIFICATION TABLE -------------------")
    for r in comparison["comparison_table"]:
        print(f"[{r.get('match_status')}] {r.get('field_name')}")
        print(f"     Entered:   {r.get('entered_value')}")
        print(f"     Extracted: {r.get('extracted_value')}")
        print(f"     Source:    {r.get('source_document')}")
        print(f"     Remarks:   {r.get('remarks')}\n")

    # Assertions for the prompt requirements
    print("\n=================== 3. ASSERTING SPECIFIC USER REQUIREMENTS ===================")
    
    # 1. Course Name
    course_row = next(r for r in comparison["comparison_table"] if r["key"] == "course")
    assert course_row["match_status"] == "MATCH", f"Expected MATCH for course, got {course_row['match_status']}"
    assert "Master of Science (M.Sc.) in Data Science" in course_row["extracted_value"], f"Expected full course name, got {course_row['extracted_value']}"
    assert "/ Program" not in course_row["extracted_value"], "Course name must not be '/ Program'"
    print("✔ [PASS] Course name extracted accurately without '/ Program'")

    # 2. Total Course Fee
    fee_row = next(r for r in comparison["comparison_table"] if r["key"] == "tuition_fee")
    assert fee_row["match_status"] == "MATCH", f"Expected MATCH for tuition_fee, got {fee_row['match_status']}"
    assert "125" not in fee_row["extracted_value"], f"Should not extract semester fee 125000 as total course fee, got {fee_row['extracted_value']}"
    print("✔ [PASS] Total Course Fee extracted instead of semester fee (₹1,25,000 rejected, total extracted)")

    # 3. Student Name (not IDENTITY PROOF)
    name_row = next(r for r in comparison["comparison_table"] if r["key"] == "student_name")
    assert name_row["match_status"] == "MATCH", f"Expected MATCH for student_name, got {name_row['match_status']}"
    assert "IDENTITY" not in name_row["extracted_value"].upper(), "Document headings must not be extracted as student name"
    print("✔ [PASS] Student Name extracted accurately without document headings like 'IDENTITY PROOF'")

    # 4. Cross-Document Name Verification
    cross_name_row = next((r for r in comparison["comparison_table"] if r["key"] == "cross_document_name_check"), None)
    if cross_name_row:
        assert cross_name_row["match_status"] == "MATCH", f"Expected MATCH for cross-doc name, got {cross_name_row['match_status']}"
        print("✔ [PASS] Cross-Document Name Verification is MATCH across all documents")

    # 5. Co-Applicant Income Mapping
    co_inc_row = next(r for r in comparison["comparison_table"] if r["key"] == "co_applicant_income")
    assert co_inc_row["match_status"] == "MATCH", f"Expected MATCH for co_applicant_income, got {co_inc_row['match_status']}"
    print("✔ [PASS] Co-Applicant Income mapped and verified correctly against entered co-applicant income")

    # 6. Applicant Income (0 vs not found / not reported)
    app_inc_row = next((r for r in comparison["comparison_table"] if r["key"] == "applicant_income"), None)
    if app_inc_row:
        assert app_inc_row["match_status"] in ("MATCH", "REQUIRES_MANUAL_VERIFICATION", "NOT_DETECTED", "NOT_PROVIDED"), f"Should not be MISMATCH, got {app_inc_row['match_status']}"
        print(f"✔ [PASS] Applicant Income status: {app_inc_row['match_status']} (no false mismatch with parent's salary)")

    # 7. Identity Proof Status
    id_row = next(r for r in comparison["comparison_table"] if r["key"] == "id_number")
    assert id_row["match_status"] == "REQUIRES_MANUAL_VERIFICATION", f"Expected REQUIRES_MANUAL_VERIFICATION for dummy ID without form input, got {id_row['match_status']}"
    print("✔ [PASS] Identity Proof is marked REQUIRES_MANUAL_VERIFICATION rather than a false MISMATCH")

    # 8. Course Duration Formatting
    duration_row = next(r for r in comparison["comparison_table"] if r["key"] == "course_duration_months")
    assert "%" not in duration_row["entered_value"], f"Duration entered must not have '%', got {duration_row['entered_value']}"
    assert "%" not in duration_row["extracted_value"], f"Duration extracted must not have '%', got {duration_row['extracted_value']}"
    assert "months" in duration_row["entered_value"], f"Duration entered must state 'months', got {duration_row['entered_value']}"
    assert "months" in duration_row["extracted_value"], f"Duration extracted must state 'months', got {duration_row['extracted_value']}"
    print("✔ [PASS] Course Duration is properly formatted in months without percentage")

    # 9. Genuine Mismatch Scenario
    print("\n=================== 4. TESTING GENUINE MISMATCH DETECTION ===================")
    mismatch_user_entered = {
        "student_name": "VIKRAM SINGH",  # Deliberately different name
        "student_age": 30,
        "course": "Master of Business Administration",  # Deliberately different course
        "course_duration_months": 12,  # Deliberately different duration
        "institution": "Apex Institute of Advanced Technology",
        "tuition_fee": 1500000.0,  # Deliberately different fee
        "applicant_income": 0.0,
        "co_applicant_income": 150000.0,  # Deliberately different income
        "monthly_income": 150000.0,
    }
    mismatch_comp = ocr_engine.compare_fields_comprehensive(mismatch_user_entered, extracted_docs, "EDUCATION")
    assert mismatch_comp["overall_status"] == "MISMATCH_DETECTED", f"Expected MISMATCH_DETECTED, got {mismatch_comp['overall_status']}"
    assert len(mismatch_comp["discrepancies"]) > 0, "Expected discrepancies to be populated for genuine mismatches"
    
    mismatch_keys = [d["key"] for d in mismatch_comp["discrepancies"]]
    assert "student_name" in mismatch_keys, "Expected student_name mismatch"
    assert "course" in mismatch_keys, "Expected course mismatch"
    assert "tuition_fee" in mismatch_keys, "Expected tuition_fee mismatch"
    assert "co_applicant_income" in mismatch_keys, "Expected co_applicant_income mismatch"
    print(f"✔ [PASS] Genuine mismatches correctly detected ({len(mismatch_comp['discrepancies'])} discrepancies flagged)")

    print("\n=================== ALL TESTS PASSED SUCCESSFULLY! ===================")

if __name__ == "__main__":
    run_tests()
