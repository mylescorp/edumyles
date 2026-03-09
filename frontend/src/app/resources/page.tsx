import Link from "next/link";

export default function ResourcesPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Resources</p>
          <h1>Guides, Demos, and Practical Playbooks</h1>
          <p className="subtext">
            Learn quickly and roll out confidently with curated materials for administrators,
            teachers, finance teams, and IT staff.
          </p>
          <div className="actions">
            <Link className="btn btn-primary" href="/auth/signup">Get Started Free</Link>
            <Link className="btn btn-secondary" href="/concierge">Request a Walkthrough</Link>
          </div>
        </div>
      </section>

      {/* Implementation Guides */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Implementation Guides</h2>
            <p className="section-subtitle">Step-by-step onboarding references for every role in your school.</p>
          </div>
          <div className="resources-grid three-col">
            {[
              { meta: "Guide", title: "Admin Quick Start", desc: "Set up your school, import students, configure modules, and invite staff in under 30 minutes." },
              { meta: "Guide", title: "Teacher Onboarding", desc: "Learn to manage classes, enter grades, create assignments, and take attendance from the teacher portal." },
              { meta: "Guide", title: "Finance Setup", desc: "Configure fee structures, connect M-Pesa, set up payment reminders, and generate invoices." },
              { meta: "Guide", title: "Parent Portal Guide", desc: "Help parents access grades, pay fees, and communicate with teachers through the parent portal." },
              { meta: "Guide", title: "Data Migration", desc: "Import existing student records, staff data, and financial history from spreadsheets or other systems." },
              { meta: "Guide", title: "Multi-Campus Setup", desc: "Configure multiple schools under one organization with proper data isolation and shared oversight." },
            ].map((item) => (
              <div key={item.title} className="resource-card">
                <div className="resource-card-icon">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"/></svg>
                </div>
                <span className="resource-meta">{item.meta}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Webinars */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Webinars &amp; Demos</h2>
            <p className="section-subtitle">Live and recorded walkthroughs for core workflows and best practices.</p>
          </div>
          <div className="resources-grid three-col">
            {[
              { title: "Platform Overview Demo", desc: "A 30-minute walkthrough of all 11 modules and how they work together as a unified platform.", duration: "30 min" },
              { title: "Fee Collection Masterclass", desc: "Learn how to set up M-Pesa integration, automated reminders, and reduce fee defaulters by 30%.", duration: "45 min" },
              { title: "CBC Grading Workshop", desc: "Hands-on session on configuring CBC competency-based grading and generating compliant report cards.", duration: "40 min" },
            ].map((item) => (
              <div key={item.title} className="resource-card webinar-card">
                <div className="resource-card-play">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <span className="resource-meta">Webinar &middot; {item.duration}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <Link className="btn btn-outline btn-sm" href="/concierge">Watch Recording</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge Base */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Knowledge Base</h2>
            <p className="section-subtitle">Answers to common operational, billing, and user management questions.</p>
          </div>
          <div className="faq-list">
            {[
              { q: "How do I import student data from Excel?", a: "Go to Admin > Students > Import. Upload a CSV or Excel file with columns for name, class, stream, and contact details. Our system auto-maps common column headers." },
              { q: "How do I set up M-Pesa payments?", a: "Navigate to Admin > Finance > Payment Settings. Enter your M-Pesa paybill number and API credentials. Test with a small amount before going live." },
              { q: "Can I customize report card templates?", a: "Yes. Go to Admin > Academics > Report Cards > Templates. You can customize headers, grading scales, comments sections, and add your school logo." },
              { q: "How do I add a new staff member?", a: "Go to Admin > Staff > Add Staff. Fill in their details, assign a role (teacher, bursar, etc.), and they will receive an email invitation to set up their account." },
              { q: "What happens if I exceed my student limit?", a: "You will receive a notification when approaching your plan limit. You can upgrade your plan at any time from Admin > Settings > Billing." },
            ].map((item) => (
              <details key={item.q} className="faq-item">
                <summary className="faq-question">{item.q}</summary>
                <p className="faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Need hands-on help?</h2>
          <p>Book a free consultation with our team for personalized onboarding support.</p>
          <div className="centered-actions">
            <Link className="btn btn-primary" href="/concierge">Book Free Consultation</Link>
            <Link className="btn btn-outline" href="/contact">Contact Support</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
