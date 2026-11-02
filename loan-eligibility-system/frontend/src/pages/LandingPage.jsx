import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/landing.css";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing-wrap">
      {/* ─────────────────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR
          ───────────────────────────────────────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <div className="landing-brand-crest">🏛️</div>
            <div className="landing-brand-text">
              <h1>Meridian Trust Bank</h1>
              <span>ESTD 1924 &bull; SECURE DIGITAL BANKING</span>
            </div>
          </Link>

          <nav>
            <ul className="landing-nav-links">
              <li>
                <a
                  href="#loans"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScrollTo("loans");
                  }}
                >
                  Loan Solutions
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScrollTo("how-it-works");
                  }}
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#trust-security"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScrollTo("trust-security");
                  }}
                >
                  Trust &amp; Governance
                </a>
              </li>
              <li>
                <Link to="/applicant/emi-calculator">EMI Calculator</Link>
              </li>
            </ul>
          </nav>

          <div className="landing-nav-actions">
            <Link to="/roles" className="nav-btn-outline">
              <span>Portals</span>
              <span>&rarr;</span>
            </Link>
            <Link to="/applicant/login" className="nav-btn-gold">
              Applicant Login
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. HERO SECTION
          ───────────────────────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-container">
          {/* Left Column: Welcoming Content */}
          <div className="hero-left">
            <div className="hero-badge">
              <span className="hero-badge-pulse" />
              <span>AI-Assisted Assessment &bull; Branch Manager Final Sanction</span>
            </div>

            <h1 className="hero-headline">
              Your Dreams. Our Support. <br />
              <span className="hero-headline-accent">A Smarter Financial Future.</span>
            </h1>

            <p className="hero-description">
              Explore smarter loan possibilities with AI-assisted eligibility assessment
              for Personal, Home and Education Loans, supported by trusted branch manager
              verification.
            </p>

            <div className="hero-actions">
              <Link to="/roles" className="hero-btn-primary">
                <span>Get Started</span>
                <span>&rarr;</span>
              </Link>
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => handleScrollTo("loans")}
              >
                Explore Loans &darr;
              </button>
            </div>

            <div className="hero-trust-row">
              <div className="hero-trust-item">
                <span className="icon">🔒</span>
                <span>Bank-Grade Document Handling</span>
              </div>
              <div className="hero-trust-item">
                <span className="icon">⚖️</span>
                <span>Transparent AI Scoring</span>
              </div>
              <div className="hero-trust-item">
                <span className="icon">🏛️</span>
                <span>Human Branch Review</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Digital Banking Visual Showcase */}
          <div className="hero-right">
            <div className="hero-visual-card">
              {/* Floating Top AI Badge */}
              <div className="hero-floating-badge badge-ai">
                <div className="badge-icon-box">🤖</div>
                <div className="badge-content">
                  <h4>AI Financial Screening</h4>
                  <p>Likely Eligible &bull; Objective Criteria Evaluation</p>
                </div>
              </div>

              {/* Central Meridian Trust Platinum Card */}
              <div className="mtb-platinum-card">
                <div className="card-top">
                  <div>
                    <div className="card-bank-name">MERIDIAN TRUST BANK</div>
                    <div className="card-bank-sub">Premier Lending Facility</div>
                  </div>
                  <div className="card-chip" />
                </div>

                <div className="card-middle">
                  <div className="card-number">4892 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 1924</div>
                </div>

                <div className="card-bottom">
                  <div>
                    <div className="card-holder-title">Valued Borrower</div>
                    <div className="card-holder-name">AUTHORIZED APPLICANT</div>
                  </div>
                  <div className="card-network-tier">
                    <span>TRUSTED SANCTION</span>
                  </div>
                </div>
              </div>

              {/* Floating Bottom Branch Manager Badge */}
              <div className="hero-floating-badge badge-manager">
                <div className="badge-icon-box">🏛️</div>
                <div className="badge-content">
                  <h4>Branch Manager Verified</h4>
                  <p>Certified Human Underwriting Decision</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. LOAN CATEGORIES SECTION
          ───────────────────────────────────────────────────────────────────────── */}
      <section id="loans" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">Comprehensive Portfolio</span>
          <h2 className="section-title">Transparent Loan Categories for Every Milestone</h2>
          <p className="section-subtitle">
            Whether advancing your academic aspirations, buying your family home, or
            meeting personal commitments, evaluate your eligibility with confidence.
          </p>
        </div>

        <div className="loan-cards-grid">
          {/* Card 1: Personal Loan */}
          <div className="loan-category-card">
            <div>
              <div className="loan-card-icon-wrap">💳</div>
              <span className="loan-card-badge">Instant Personal Finance</span>
              <h3>Personal Loan</h3>
              <p className="loan-desc">
                Flexible funding for medical expenses, lifestyle upgrades, or unexpected
                needs with rapid AI-assisted underwriting checks.
              </p>

              <div className="loan-metrics">
                <div>
                  <div className="metric-item-label">Interest Rate</div>
                  <div className="metric-item-value" style={{ color: "#0d9488" }}>
                    From 10.5% p.a.
                  </div>
                </div>
                <div>
                  <div className="metric-item-label">Tenure Duration</div>
                  <div className="metric-item-value">12 to 60 Months</div>
                </div>
              </div>

              <ul className="loan-features-list">
                <li>
                  <span className="tick">✔</span> Instant debt-to-income and EMI affordability evaluation
                </li>
                <li>
                  <span className="tick">✔</span> Automated salary slip &amp; KYC document verification
                </li>
                <li>
                  <span className="tick">✔</span> Zero prepayment penalty on qualifying options
                </li>
                <li>
                  <span className="tick">✔</span> Local branch manager appraisal and personalized advice
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="loan-card-cta"
              onClick={() => navigate("/roles")}
            >
              <span>Apply for Personal Loan</span>
              <span>&rarr;</span>
            </button>
          </div>

          {/* Card 2: Home Loan */}
          <div className="loan-category-card" style={{ borderColor: "rgba(212, 175, 55, 0.45)" }}>
            <div>
              <div className="loan-card-icon-wrap" style={{ background: "#fef9e7" }}>
                🏡
              </div>
              <span
                className="loan-card-badge"
                style={{ background: "#fef9e7", color: "#96702c", borderColor: "#edd67d" }}
              >
                Residential Property
              </span>
              <h3>Home Loan</h3>
              <p className="loan-desc">
                Realize your dream of homeownership with high Loan-to-Value funding, low
                interest margins, and clear legal appraisal.
              </p>

              <div className="loan-metrics">
                <div>
                  <div className="metric-item-label">Interest Rate</div>
                  <div className="metric-item-value" style={{ color: "#0d9488" }}>
                    From 8.4% p.a.
                  </div>
                </div>
                <div>
                  <div className="metric-item-label">Tenure Duration</div>
                  <div className="metric-item-value">Up to 300 Months</div>
                </div>
              </div>

              <ul className="loan-features-list">
                <li>
                  <span className="tick">✔</span> Financing up to 85% of total property valuation
                </li>
                <li>
                  <span className="tick">✔</span> Automated property document &amp; title consistency check
                </li>
                <li>
                  <span className="tick">✔</span> Co-applicant income consolidation to boost eligibility
                </li>
                <li>
                  <span className="tick">✔</span> Direct physical branch officer assistance throughout
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="loan-card-cta"
              style={{
                background: "linear-gradient(135deg, #0b1f33 0%, #163a5c 100%)",
                border: "1px solid var(--mtb-gold-primary)",
              }}
              onClick={() => navigate("/roles")}
            >
              <span>Apply for Home Loan</span>
              <span>&rarr;</span>
            </button>
          </div>

          {/* Card 3: Education Loan */}
          <div className="loan-category-card">
            <div>
              <div className="loan-card-icon-wrap">🎓</div>
              <span className="loan-card-badge">Higher Studies Funding</span>
              <h3>Education Loan</h3>
              <p className="loan-desc">
                Invest in academic excellence and career potential with specialized student
                terms, course-aligned moratoriums, and comprehensive coverage.
              </p>

              <div className="loan-metrics">
                <div>
                  <div className="metric-item-label">Interest Rate</div>
                  <div className="metric-item-value" style={{ color: "#0d9488" }}>
                    From 9.0% p.a.
                  </div>
                </div>
                <div>
                  <div className="metric-item-label">Tenure Duration</div>
                  <div className="metric-item-value">Up to 180 Months</div>
                </div>
              </div>

              <ul className="loan-features-list">
                <li>
                  <span className="tick">✔</span> 100% coverage of tuition fees, accommodation &amp; supplies
                </li>
                <li>
                  <span className="tick">✔</span> Automated admission letter &amp; fee structure OCR check
                </li>
                <li>
                  <span className="tick">✔</span> Repayment holiday (moratorium) during study duration
                </li>
                <li>
                  <span className="tick">✔</span> Transparent burden ratio calculation tailored for students
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="loan-card-cta"
              onClick={() => navigate("/roles")}
            >
              <span>Apply for Education Loan</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. HOW THE SYSTEM WORKS (4-STEP PROCESS)
          ───────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="how-it-works-bg">
        <div className="landing-section">
          <div className="section-header">
            <span className="section-eyebrow">Structured Process</span>
            <h2 className="section-title">How Our Lending System Works</h2>
            <p className="section-subtitle">
              A transparent, four-step workflow combining modern digital verification with
              the integrity of human branch management.
            </p>
          </div>

          <div className="steps-grid">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Apply Online</h3>
              <p>
                Complete our digital loan request in minutes. Fill in your requested amount,
                financial details, and attach digital document proofs.
              </p>
              <span className="step-card-tag">Fast &bull; Paperless</span>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>AI Eligibility Assessment</h3>
              <p>
                Our intelligent machine learning model assesses your financial parameters,
                income buffers, and debt obligations to calculate an objective eligibility score.
              </p>
              <span className="step-card-tag">Real-Time Scoring</span>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Document Verification</h3>
              <p>
                Advanced OCR technology cross-checks entered values against uploaded
                proofs to detect discrepancies, confirm typography integrity, and ensure accuracy.
              </p>
              <span className="step-card-tag">Automated OCR</span>
            </div>

            {/* Step 4 */}
            <div className="step-card">
              <div className="step-number">04</div>
              <h3>Branch Manager Review</h3>
              <p>
                Your application is assigned to an authorized Branch Manager who performs
                the final underwriting appraisal and issues the formal approval decision.
              </p>
              <span className="step-card-tag" style={{ background: "#fef9e7", color: "#96702c", borderColor: "#edd67d" }}>
                100% Human Final Decision
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          5. TRUST & SECURITY SECTION (NO FAKE STATS OR RATINGS)
          ───────────────────────────────────────────────────────────────────────── */}
      <section id="trust-security" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">Institutional Integrity</span>
          <h2 className="section-title">Built on Trust, Secured by Rigorous Governance</h2>
          <p className="section-subtitle">
            Meridian Trust Bank safeguards your financial journey through strict confidentiality,
            uncompromised human accountability, and transparent technology.
          </p>
        </div>

        <div className="trust-grid">
          {/* Trust Pillar 1 */}
          <div className="trust-card">
            <div className="trust-card-icon">🔐</div>
            <h3>Bank-Grade Document Handling</h3>
            <p>
              Uploaded identity proofs, bank statements, and salary certificates are
              handled with strict access controls and digital vault encryption. Your documents
              are utilized solely for verified underwriting evaluation and never shared
              with third-party advertisers.
            </p>
          </div>

          {/* Trust Pillar 2 */}
          <div className="trust-card">
            <div className="trust-card-icon">📊</div>
            <h3>Transparent, Explainable Assessment</h3>
            <p>
              We believe in full clarity. The AI module discloses contributing financial
              factors, debt-to-income benchmarks, and disposable income flags directly to
              the applicant without opaque black-box rejections.
            </p>
          </div>

          {/* Trust Pillar 3 */}
          <div className="trust-card">
            <div className="trust-card-icon">🏛️</div>
            <h3>Human-Reviewed Final Decisions</h3>
            <p>
              AI serves as an underwriting advisory tool. Automated algorithms do not
              have the authority to sanction or reject your loan. The final approval
              decision is made solely by an authorized, certified Meridian Trust Bank Branch
              Manager.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          6. ROLE PORTAL ACCESS / DIRECT LAUNCHPAD
          ───────────────────────────────────────────────────────────────────────── */}
      <section className="portal-access-section">
        <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
          <span style={{ color: "var(--mtb-gold-primary)", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Direct System Access
          </span>
          <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "2.1rem", color: "#ffffff", margin: "0.4rem 0 0.8rem" }}>
            Access Your Designated Banking Portal
          </h2>
          <p style={{ color: "#cbd5e1", fontSize: "0.95rem", margin: "0 auto" }}>
            Seamless access points tailored for applicants seeking financing, branch managers
            conducting underwriting, and bank administrators managing branch hierarchies.
          </p>
        </div>

        <div className="portal-grid">
          {/* Applicant Portal */}
          <Link to="/applicant/login" className="portal-card">
            <div>
              <div className="portal-card-top">
                <span className="portal-card-icon">👤</span>
                <div>
                  <span className="portal-role-tag">Customer Access</span>
                  <h4>Applicant Portal</h4>
                </div>
              </div>
              <p>
                Apply for personal, home, or education loans, upload supporting proofs,
                and track real-time application status.
              </p>
            </div>
            <div className="portal-card-link">
              <span>Sign in as Applicant</span>
              <span>&rarr;</span>
            </div>
          </Link>

          {/* Manager Portal */}
          <Link to="/manager/login" className="portal-card" style={{ borderColor: "rgba(212, 175, 55, 0.4)" }}>
            <div>
              <div className="portal-card-top">
                <span className="portal-card-icon">🏦</span>
                <div>
                  <span className="portal-role-tag">Branch Underwriting</span>
                  <h4>Branch Manager Portal</h4>
                </div>
              </div>
              <p>
                Review mapped branch applications, examine OCR field cross-comparisons,
                and authorize sanction or correction decisions.
              </p>
            </div>
            <div className="portal-card-link" style={{ color: "var(--mtb-gold-primary)" }}>
              <span>Sign in as Manager</span>
              <span>&rarr;</span>
            </div>
          </Link>

          {/* Admin Portal */}
          <Link to="/admin/login" className="portal-card">
            <div>
              <div className="portal-card-top">
                <span className="portal-card-icon">⚙️</span>
                <div>
                  <span className="portal-role-tag">Governance &amp; Ops</span>
                  <h4>Admin Portal</h4>
                </div>
              </div>
              <p>
                Configure bank districts, assign branches, manage authorized branch managers,
                and monitor institutional lending analytics.
              </p>
            </div>
            <div className="portal-card-link">
              <span>Sign in as Admin</span>
              <span>&rarr;</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          7. FOOTER
          ───────────────────────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "1.4rem" }}>🏛️</span>
                <h3>Meridian Trust Bank</h3>
              </div>
              <p>
                Dedicated to sound, transparent banking principles. Empowering personal,
                home, and academic ambitions through intelligent technology and trusted branch
                stewardship.
              </p>
            </div>

            <div className="footer-col">
              <h4>Loan Products</h4>
              <ul>
                <li>
                  <a
                    href="#loans"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScrollTo("loans");
                    }}
                  >
                    Personal Loans
                  </a>
                </li>
                <li>
                  <a
                    href="#loans"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScrollTo("loans");
                    }}
                  >
                    Home Loans
                  </a>
                </li>
                <li>
                  <a
                    href="#loans"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScrollTo("loans");
                    }}
                  >
                    Education Loans
                  </a>
                </li>
                <li>
                  <Link to="/applicant/emi-calculator">EMI Affordability Calculator</Link>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Banking Portals</h4>
              <ul>
                <li>
                  <Link to="/applicant/login">Applicant Login</Link>
                </li>
                <li>
                  <Link to="/manager/login">Branch Manager Portal</Link>
                </li>
                <li>
                  <Link to="/admin/login">Administration Portal</Link>
                </li>
                <li>
                  <Link to="/roles">Choose Portal Role</Link>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Governance</h4>
              <ul>
                <li>
                  <a
                    href="#trust-security"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScrollTo("trust-security");
                    }}
                  >
                    Document Security
                  </a>
                </li>
                <li>
                  <a
                    href="#trust-security"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScrollTo("trust-security");
                    }}
                  >
                    Explainable AI Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScrollTo("how-it-works");
                    }}
                  >
                    Manager Review Workflow
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-disclaimer-box">
            <strong>Statutory Governance Disclaimer:</strong> Meridian Trust Bank utilizes
            automated decision-support modules strictly for preliminary data extraction and
            financial capacity estimation. Neither the artificial intelligence model nor the OCR
            verification engine has the authority to sanction or reject credit applications.
            Final credit decisions, loan agreements, and fund disbursements are strictly subject
            to human underwriting verification by an authorized Branch Manager and physical
            validation of original documents.
          </div>

          <div className="footer-bottom">
            <div>
              &copy; {new Date().getFullYear()} Meridian Trust Bank. All rights reserved. Member
              Banking Association.
            </div>
            <div>Secure 256-Bit SSL Underwriting Infrastructure</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
