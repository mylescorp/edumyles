import Link from "next/link";

const modules = [
  { name: "Student Information System", abbr: "SIS", desc: "Central hub for all student data - profiles, demographics, class assignments, and academic history.", features: ["Student profiles & demographics", "Class & stream allocation", "Enrollment history", "Document management"] },
  { name: "Admissions & Enrollment", abbr: "ADM", desc: "Digitize your entire admissions workflow from application to enrollment.", features: ["Online applications", "Waitlist management", "Auto-allocation", "Status tracking for parents"] },
  { name: "Academics & Gradebook", abbr: "ACA", desc: "Comprehensive assessment and grading system supporting both CBC and 8-4-4 curricula.", features: ["Flexible grading scales", "CBC competency tracking", "Report card generation", "Performance analytics"] },
  { name: "Fee Management", abbr: "FIN", desc: "Streamline billing, invoicing, and payment tracking with automated reminders.", features: ["Flexible fee structures", "Payment plans & installments", "Automated reminders", "Receipt generation"] },
  { name: "Mobile Money Integration", abbr: "PAY", desc: "Accept payments via M-Pesa, Airtel Money, and MTN MoMo with instant reconciliation.", features: ["M-Pesa STK push", "Airtel Money", "Real-time reconciliation", "Multi-currency support"] },
  { name: "Communications Hub", abbr: "COM", desc: "Reach parents, students, and staff through SMS, email, and in-app messaging.", features: ["Bulk SMS campaigns", "Email templates", "In-app notifications", "Announcement broadcasts"] },
  { name: "HR & Payroll", abbr: "HR", desc: "Manage staff records, contracts, leave, and salary processing from one place.", features: ["Staff profiles & contracts", "Leave management", "Payroll processing", "Performance tracking"] },
  { name: "Timetable Builder", abbr: "TT", desc: "Create and manage class schedules with drag-and-drop simplicity.", features: ["Drag-and-drop builder", "Conflict detection", "Room scheduling", "Teacher workload balancing"] },
  { name: "Transport Management", abbr: "TRN", desc: "Manage bus routes, driver assignments, and student transport logistics.", features: ["Route planning", "Fleet management", "Driver assignments", "Student pickup tracking"] },
  { name: "Library System", abbr: "LIB", desc: "Catalogue books, manage circulation, and track overdue items digitally.", features: ["Book cataloguing", "Issue & return tracking", "Overdue notifications", "Reading analytics"] },
  { name: "E-Commerce & Marketplace", abbr: "MKT", desc: "Sell school supplies, uniforms, and merchandise through an integrated store.", features: ["Product listings", "Order management", "Payment integration", "Inventory tracking"] },
];

export default function FeaturesPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Features</p>
          <h1>11 Powerful Modules for Every School</h1>
          <p className="subtext">
            Everything from admissions to alumni in one connected system. Each module works
            independently or together as a unified platform.
          </p>
          <div className="actions">
            <Link className="btn btn-primary" href="/auth/signup">Try All Modules Free</Link>
            <Link className="btn btn-secondary" href="/concierge">See a Live Demo</Link>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Built for how schools actually work</h2>
            <p className="section-subtitle">Every module is designed based on real feedback from school administrators across East Africa.</p>
          </div>
          <div className="features-grid four-col">
            <div className="feature-card"><h3>Role-Based Access</h3><p>Principals, bursars, teachers, parents, and students each see exactly what they need.</p></div>
            <div className="feature-card"><h3>Multi-Campus</h3><p>Run multiple schools from one dashboard with strict data isolation between campuses.</p></div>
            <div className="feature-card"><h3>Offline-Ready</h3><p>Core features work with intermittent connectivity - sync automatically when back online.</p></div>
            <div className="feature-card"><h3>Real-Time Reporting</h3><p>Dashboards and analytics update in real time as data flows through the system.</p></div>
          </div>
        </div>
      </section>

      {/* All 11 Modules */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>All 11 Modules</h2>
            <p className="section-subtitle">Activate what you need today, add more as you grow.</p>
          </div>
          <div className="modules-grid">
            {modules.map((mod) => (
              <div key={mod.name} className="module-detail-card">
                <div className="module-detail-header">
                  <div className="module-icon">{mod.abbr}</div>
                  <h3>{mod.name}</h3>
                </div>
                <p>{mod.desc}</p>
                <ul className="module-features-list">
                  {mod.features.map((f) => (
                    <li key={f}><span className="check-icon">&#10003;</span> {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stakeholder Portals */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Dedicated portals for every stakeholder</h2>
          </div>
          <div className="features-grid four-col">
            <div className="feature-card"><h3>Parent Portal</h3><p>Track grades, view attendance, pay fees via mobile money, and communicate with teachers.</p></div>
            <div className="feature-card"><h3>Teacher Portal</h3><p>Manage classes, enter grades, create assignments, take attendance, and view timetables.</p></div>
            <div className="feature-card"><h3>Student Portal</h3><p>Access timetables, view results, check wallet balance, and submit assignments digitally.</p></div>
            <div className="feature-card"><h3>Alumni Portal</h3><p>Stay connected after graduation with networking, events, and alumni community tools.</p></div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-card">
          <h2>See all modules in action</h2>
          <p>Start your free 30-day trial with full access to every module. No credit card required.</p>
          <Link className="btn btn-primary" href="/auth/signup">Start Free Trial</Link>
        </div>
      </section>
    </main>
  );
}
