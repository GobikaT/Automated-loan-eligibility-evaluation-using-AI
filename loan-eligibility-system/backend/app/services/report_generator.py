"""
PDF Report Generation Service using ReportLab.
Generates comprehensive loan application evaluation reports with Meridian Trust Bank branding.
Separates:
1. Financial Eligibility Assessment (AI Module)
2. OCR Document Verification (OCR Module)
3. Overall Application Assessment (Combined Logic Engine)
4. Branch Manager Review (Human Decision Workflow)
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib import colors
from datetime import datetime
from io import BytesIO
from typing import Dict, Any, List


class ReportGenerator:
    """Generate professional PDF reports for loan applications"""

    @staticmethod
    def generate_application_report(app_data: Dict[str, Any]) -> bytes:
        """Generate comprehensive PDF report for a loan application"""

        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )
        elements = []

        # Color Palette - Meridian Trust Bank branding
        navy_primary = colors.HexColor('#0f2b48')
        blue_accent = colors.HexColor('#1b4b72')
        header_bg = colors.HexColor('#e8f1f8')
        light_bg = colors.HexColor('#f7fafc')
        success_color = colors.HexColor('#166534')
        warning_color = colors.HexColor('#9a3412')
        danger_color = colors.HexColor('#991b1b')
        border_color = colors.HexColor('#cbd5e1')
        neutral_grey = colors.HexColor('#475569')

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=navy_primary,
            fontName='Helvetica-Bold',
            alignment=1,
            spaceAfter=4,
        )
        subtitle_style = ParagraphStyle(
            'DocSubTitle',
            parent=styles['Normal'],
            fontSize=8.5,
            leading=11,
            textColor=neutral_grey,
            fontName='Helvetica-Bold',
            alignment=1,
            spaceAfter=10,
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=10.5,
            leading=13,
            textColor=blue_accent,
            fontName='Helvetica-Bold',
            spaceBefore=8,
            spaceAfter=4,
        )
        cell_bold = ParagraphStyle(
            'CellBold',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            fontName='Helvetica-Bold',
            textColor=navy_primary,
        )
        cell_normal = ParagraphStyle(
            'CellNormal',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#1e293b'),
        )
        badge_match = ParagraphStyle(
            'BadgeMatch',
            parent=styles['Normal'],
            fontSize=7.5,
            leading=9,
            fontName='Helvetica-Bold',
            textColor=success_color,
        )
        badge_mismatch = ParagraphStyle(
            'BadgeMismatch',
            parent=styles['Normal'],
            fontSize=7.5,
            leading=9,
            fontName='Helvetica-Bold',
            textColor=danger_color,
        )
        badge_not_detected = ParagraphStyle(
            'BadgeNotDetected',
            parent=styles['Normal'],
            fontSize=7.5,
            leading=9,
            fontName='Helvetica-Bold',
            textColor=neutral_grey,
        )
        badge_not_provided = ParagraphStyle(
            'BadgeNotProvided',
            parent=styles['Normal'],
            fontSize=7.5,
            leading=9,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#64748b'),
        )
        badge_manual = ParagraphStyle(
            'BadgeManual',
            parent=styles['Normal'],
            fontSize=7.5,
            leading=9,
            fontName='Helvetica-Bold',
            textColor=warning_color,
        )

        # 1. Header Banner
        elements.append(Paragraph("MERIDIAN TRUST BANK &bull; SECURE UNDERWRITING &amp; VERIFICATION SYSTEM", subtitle_style))
        elements.append(Paragraph("COMPREHENSIVE LOAN APPLICATION EVALUATION REPORT", title_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=navy_primary, spaceBefore=2, spaceAfter=8))

        # 2. Application & Applicant Summary
        loan_type_str = str(app_data.get('loan_type', 'N/A')).upper()
        overall_eval = app_data.get('overall_assessment', {})
        status_raw = overall_eval.get('overall_status') or app_data.get('status', 'APPLICATION_CREATED')
        status_display = overall_eval.get('overall_status_label') or str(status_raw).replace('_', ' ').title()

        app_meta = [
            [
                Paragraph("<b>Application ID:</b>", cell_bold),
                Paragraph(str(app_data.get('application_code', 'N/A')), cell_normal),
                Paragraph("<b>Loan Type:</b>", cell_bold),
                Paragraph(f"{loan_type_str} LOAN", cell_normal),
            ],
            [
                Paragraph("<b>Verification Code:</b>", cell_bold),
                Paragraph(str(app_data.get('verification_code', 'N/A')), cell_normal),
                Paragraph("<b>Overall Status:</b>", cell_bold),
                Paragraph(f"<b>{status_display.upper()}</b>", cell_bold),
            ],
            [
                Paragraph("<b>Applicant Name:</b>", cell_bold),
                Paragraph(str(app_data.get('applicant_name', 'N/A')), cell_normal),
                Paragraph("<b>Assigned Branch:</b>", cell_bold),
                Paragraph(f"{app_data.get('branch_name', 'Main Branch')} ({app_data.get('assigned_manager_name', 'Branch Manager')})", cell_normal),
            ],
            [
                Paragraph("<b>Requested Amount:</b>", cell_bold),
                Paragraph(f"₹{float(app_data.get('requested_amount', 0) or 0):,.2f}", cell_normal),
                Paragraph("<b>Loan Tenure:</b>", cell_bold),
                Paragraph(f"{app_data.get('loan_tenure_months', 0)} months", cell_normal),
            ],
        ]
        meta_table = Table(app_meta, colWidths=[1.3*inch, 2.2*inch, 1.3*inch, 2.2*inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), header_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 6))

        # =========================================================================
        # SECTION 1: FINANCIAL ELIGIBILITY ASSESSMENT (AI MODULE)
        # =========================================================================
        elements.append(Paragraph("1. Financial Eligibility Assessment (AI Module)", section_heading))
        ai_pred = app_data.get('ai_prediction', {})
        is_elig = bool(ai_pred.get('eligible', False))
        conf = float(ai_pred.get('confidence', 0.0) or 0.0)
        risk = str(ai_pred.get('risk_level', 'LOW')).upper()

        prediction_text = "LIKELY ELIGIBLE" if is_elig else "REQUIRES DETAILED REVIEW"
        prediction_style = badge_match if is_elig else badge_mismatch
        risk_style = badge_match if risk == 'LOW' else (badge_manual if risk == 'MEDIUM' else badge_mismatch)

        # Important factors
        reason = ai_pred.get('reasoning', '')
        positive_factors = ai_pred.get('positive_factors') or []
        negative_factors = ai_pred.get('negative_factors') or []

        factor_bullets = []
        if isinstance(reason, str) and reason:
            for r in reason.split(';'):
                if r.strip():
                    factor_bullets.append(r.strip())
        if positive_factors:
            for pf in positive_factors:
                if str(pf) not in factor_bullets:
                    factor_bullets.append(f"[Positive] {pf}")
        if negative_factors:
            for nf in negative_factors:
                if str(nf) not in factor_bullets:
                    factor_bullets.append(f"[Watchpoint] {nf}")
        if not factor_bullets:
            factor_bullets.append("Underwriting ratios and financial parameters evaluated based on applicant inputs.")

        factors_html = "<br/>&bull; " + "<br/>&bull; ".join(factor_bullets)

        fin_table_data = [
            [
                Paragraph("<b>AI Prediction Result:</b>", cell_bold),
                Paragraph(f"<b>{prediction_text}</b>", prediction_style),
                Paragraph("<b>Model Confidence:</b>", cell_bold),
                Paragraph(f"{conf:.2f}%", cell_normal),
            ],
            [
                Paragraph("<b>Financial Risk Level:</b>", cell_bold),
                Paragraph(f"<b>{risk} RISK</b>", risk_style),
                Paragraph("<b>Monthly Income / EMI:</b>", cell_bold),
                Paragraph(f"₹{float(app_data.get('monthly_income', 0) or 0):,.2f} / ₹{float(app_data.get('existing_emi', 0) or 0):,.2f}", cell_normal),
            ],
            [
                Paragraph("<b>Important Factors Influencing Prediction:</b>", cell_bold),
                Paragraph(factors_html, cell_normal),
                Paragraph("", cell_normal),
                Paragraph("", cell_normal),
            ],
        ]
        fin_table = Table(fin_table_data, colWidths=[1.4*inch, 2.1*inch, 1.3*inch, 2.2*inch])
        fin_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), light_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('SPAN', (1, 2), (3, 2)),
        ]))
        elements.append(fin_table)
        elements.append(Spacer(1, 6))

        # =========================================================================
        # SECTION 2: OCR DOCUMENT VERIFICATION (OCR MODULE)
        # =========================================================================
        elements.append(Paragraph("2. Document Verification (OCR Module)", section_heading))
        comparison = app_data.get('ocr_comparison', {})
        comp_rows_data = comparison.get('comparison_table', [])
        discrepancies = comparison.get('discrepancies', [])

        comp_table_data = [
            [
                Paragraph("<b>Field Name</b>", cell_bold),
                Paragraph("<b>Applicant Entered</b>", cell_bold),
                Paragraph("<b>OCR Extracted</b>", cell_bold),
                Paragraph("<b>Match Status</b>", cell_bold),
                Paragraph("<b>Source Document</b>", cell_bold),
                Paragraph("<b>Verification Remarks</b>", cell_bold),
            ]
        ]

        if comp_rows_data:
            for row in comp_rows_data:
                match_st = str(row.get('match_status', 'REQUIRES_MANUAL_VERIFICATION')).upper()
                disp_st = str(row.get('display_status') or match_st).strip().upper()

                if match_st in ("MATCH", "CONSISTENT") or disp_st == "MATCH":
                    badge = Paragraph("✔ MATCH", badge_match)
                elif match_st == "MISMATCH" or disp_st == "MISMATCH":
                    badge = Paragraph("✖ MISMATCH", badge_mismatch)
                elif match_st == "NOT_DETECTED" or "NOT DETECTED" in disp_st:
                    badge = Paragraph("⚪ NOT DETECTED", badge_not_detected)
                elif match_st == "NOT_PROVIDED" or "NOT PROVIDED" in disp_st:
                    badge = Paragraph("— NOT PROVIDED", badge_not_provided)
                else:
                    badge = Paragraph("⚠ REQUIRES MANUAL VERIFICATION", badge_manual)

                entered_v = str(row.get('entered_value', '-'))
                extracted_v = str(row.get('extracted_value', '-'))
                source_d = str(row.get('source_document', '-'))
                remarks_v = str(row.get('remarks', '-'))

                comp_table_data.append([
                    Paragraph(str(row.get('field_name', '')), cell_normal),
                    Paragraph(entered_v, cell_normal),
                    Paragraph(extracted_v, cell_normal),
                    badge,
                    Paragraph(source_d, cell_normal),
                    Paragraph(remarks_v, cell_normal),
                ])
        else:
            comp_table_data.append([
                Paragraph("Documents", cell_normal),
                Paragraph("Pending Upload", cell_normal),
                Paragraph("Not Detected", cell_normal),
                Paragraph("⚪ NOT DETECTED", badge_not_detected),
                Paragraph("No files uploaded", cell_normal),
                Paragraph("Please upload supporting documents for automated verification.", cell_normal),
            ])

        comp_table = Table(comp_table_data, colWidths=[1.25*inch, 1.05*inch, 1.15*inch, 1.00*inch, 1.25*inch, 1.80*inch])
        comp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), header_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(comp_table)

        # Identified Discrepancies Box
        if discrepancies:
            disc_bullets = []
            for d in discrepancies:
                fn = d.get('field_name', 'Field')
                ev = d.get('entered_value', 'N/A')
                xv = d.get('extracted_value', 'N/A')
                sd = d.get('source_document', 'Doc')
                disc_bullets.append(f"<b>{fn}:</b> Applicant entered '{ev}' but document states '{xv}' ({sd})")

            disc_html = "<b>Identified Discrepancies:</b><br/>&bull; " + "<br/>&bull; ".join(disc_bullets)
            disc_table = Table([[Paragraph(disc_html, ParagraphStyle('Disc', parent=styles['Normal'], fontSize=7.5, leading=9.5, textColor=danger_color))]], colWidths=[7.0*inch])
            disc_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef2f2')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#fca5a5')),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ]))
            elements.append(Spacer(1, 3))
            elements.append(disc_table)

        elements.append(Spacer(1, 6))

        # =========================================================================
        # SECTION 3: OVERALL APPLICATION ASSESSMENT
        # =========================================================================
        elements.append(Paragraph("3. Overall Application Assessment", section_heading))
        overall_status_str = overall_eval.get('overall_status_label') or status_display
        status_reason = overall_eval.get('reason') or "Automated multi-factor evaluation completed."
        req_corrections = overall_eval.get('required_corrections') or "None"
        next_step = overall_eval.get('next_processing_step') or "Pending branch verification"

        if "CORRECTION" in overall_status_str.upper():
            badge_overall_style = badge_mismatch
            status_banner_bg = colors.HexColor('#fef2f2')
        elif "PENDING" in overall_status_str.upper():
            badge_overall_style = badge_manual
            status_banner_bg = colors.HexColor('#fffbeb')
        elif "APPROVED" in overall_status_str.upper():
            badge_overall_style = badge_match
            status_banner_bg = colors.HexColor('#ecfdf5')
        else:
            badge_overall_style = cell_bold
            status_banner_bg = light_bg

        overall_rows = [
            [
                Paragraph("<b>Overall Application Status:</b>", cell_bold),
                Paragraph(f"<b>{overall_status_str.upper()}</b>", badge_overall_style),
                Paragraph("<b>Document Verification:</b>", cell_bold),
                Paragraph(f"<b>{overall_eval.get('document_verification_status', 'Evaluated')}</b>", cell_normal),
            ],
            [
                Paragraph("<b>Reason for Status:</b>", cell_bold),
                Paragraph(status_reason, cell_normal),
                Paragraph("", cell_normal),
                Paragraph("", cell_normal),
            ],
            [
                Paragraph("<b>Required Applicant Corrections:</b>", cell_bold),
                Paragraph(req_corrections, cell_normal),
                Paragraph("", cell_normal),
                Paragraph("", cell_normal),
            ],
            [
                Paragraph("<b>Next Processing Step:</b>", cell_bold),
                Paragraph(next_step, cell_normal),
                Paragraph("", cell_normal),
                Paragraph("", cell_normal),
            ],
        ]
        overall_table = Table(overall_rows, colWidths=[1.4*inch, 2.1*inch, 1.3*inch, 2.2*inch])
        overall_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), status_banner_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('SPAN', (1, 1), (3, 1)),
            ('SPAN', (1, 2), (3, 2)),
            ('SPAN', (1, 3), (3, 3)),
        ]))
        elements.append(overall_table)
        elements.append(Spacer(1, 6))

        # =========================================================================
        # SECTION 4: BRANCH MANAGER REVIEW
        # =========================================================================
        elements.append(Paragraph("4. Branch Manager Review", section_heading))
        mgr_review = app_data.get('manager_review', {})
        mgr_status = mgr_review.get('review_status') or (
            "Completed" if app_data.get('status') in ("APPROVED", "REJECTED") else "Pending Branch Manager Review"
        )
        mgr_remarks = mgr_review.get('manager_remarks') or "Awaiting branch manager underwriting evaluation and physical document review."
        mgr_decision = mgr_review.get('final_decision') or (
            app_data.get('status') if app_data.get('status') in ("APPROVED", "REJECTED") else "Decision Pending (Reserved for Branch Manager)"
        )

        mgr_rows = [
            [
                Paragraph("<b>Review Status:</b>", cell_bold),
                Paragraph(mgr_status, cell_normal),
                Paragraph("<b>Final Decision:</b>", cell_bold),
                Paragraph(f"<b>{mgr_decision}</b>", badge_match if mgr_decision == "APPROVED" else (badge_mismatch if mgr_decision == "REJECTED" else cell_normal)),
            ],
            [
                Paragraph("<b>Manager Remarks:</b>", cell_bold),
                Paragraph(mgr_remarks, cell_normal),
                Paragraph("", cell_normal),
                Paragraph("", cell_normal),
            ],
        ]
        mgr_table = Table(mgr_rows, colWidths=[1.4*inch, 2.1*inch, 1.3*inch, 2.2*inch])
        mgr_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), light_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('SPAN', (1, 1), (3, 1)),
        ]))
        elements.append(mgr_table)
        elements.append(Spacer(1, 8))

        # 5. Verification Seal & Regulatory Disclaimer
        disclaimer_text = (
            "<b>Statutory Governance Disclaimer:</b> The AI prediction and OCR verification modules provide automated decision support. "
            "Neither module has the authority to issue final loan approval or rejection. Only the designated Branch Manager can "
            "execute final approval, sanction, or rejection decisions. Physical verification of original documents is mandatory before disbursement."
        )
        elements.append(Paragraph(disclaimer_text, ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=7,
            leading=9,
            textColor=colors.HexColor('#64748b'),
            alignment=0,
        )))

        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=border_color, spaceBefore=2, spaceAfter=4))
        elements.append(Paragraph(
            f"Meridian Trust Bank &bull; Secure Document Verification Unit &bull; Generated: {datetime.now().strftime('%d-%b-%Y %H:%M:%S')}",
            ParagraphStyle(
                'FooterText',
                parent=styles['Normal'],
                fontSize=7,
                textColor=colors.HexColor('#94a3b8'),
                alignment=1,
            )
        ))

        # Build document
        doc.build(elements)
        pdf_buffer.seek(0)
        return pdf_buffer.getvalue()


report_generator = ReportGenerator()
