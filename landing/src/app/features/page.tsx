import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Features — EduMyles",
  description:
    "Explore all 11 modules of EduMyles — student information, admissions, finance, timetable, academics, HR, library, transport, communications, eWallet, and school shop.",
};

const platformFeatures = [
  {
    title: "Unified Dashboard",
    description:
      "One login, one view. See student enrollment, fee status, timetable, and staff activity — all from a single screen.",
  },
  {
    title: "Role-Based Access Control",
    description:
      "14 built-in roles from Platform Admin to Student. Every user sees only what they need, nothing more.",
  },
  {
    title: "Multi-Tenant Architecture",
    description:
      "Strict data isolation per school. Run multiple campuses from one platform without any data bleed.",
  },
  {
    title: "Real-Time Sync",
    description:
      "Powered by Convex — every update is reflected instantly across all connected devices and dashboards.",
  },
];

const modules = [
  {
    name: "Student Information System",
    icon: "SIS",
    description: "Student profiles, class allocation, streams, and full academic history in one place.",
    features: ["Student profiles & photos", "Class & stream management", "Enrollment tracking", "Parent/guardian linking", "Student transfers"],
  },
  {
    name: "Admissions",
    icon: "ADM",
    description: "Digital applications, enrollment workflows, waitlists, and automated communication.",
    features: ["Online application forms", "Document collection", "Waitlist management", "Enrollment automation", "Acceptance letters"],
  },
  {
    name: "Finance & Fees",
    icon: "FIN",
    description: "Fee structures, invoicing, payment collection, receipts, and financial reporting.",
    features: ["Fee structure builder", "Auto-invoicing", "M-Pesa & Airtel Money", "Stripe & bank transfers", "Financial reports"],
  },
  {
    name: "Timetable & Scheduling",
    icon: "TTB",
    description: "Automated timetable generation, substitution management, and room bookings.",
    features: ["Auto-generate timetables", "Teacher substitutions", "Room & resource booking", "Conflict detection", "Export & print"],
  },
  {
    name: "Academics & Gradebook",
    icon: "ACA",
    description: "Assessments, grading, report cards, and curriculum tracking for CBC, 8-4-4, UNEB, and more.",
    features: ["Gradebook entry", "Assessment management", "Report card generation", "Curriculum mapping", "Parent report access"],
  },
  {
    name: "HR & Payroll",
    icon: "HR",
    description: "Staff records, attendance, leave management, payroll processing, and compliance.",
    features: ["Staff profiles", "Attendance tracking", "Leave management", "Payroll processing", "Statutory deductions"],
  },
  {
    name: "Library",
    icon: "LIB",
    description: "Book cataloguing, borrowing, returns, fines, and digital resource management.",
    features: ["Book catalogue", "Borrowing & returns", "Fine management", "Barcode scanning", "Digital resources"],
  },
  {
    name: "Transport",
    icon: "TRN",
    description: "Route management, vehicle tracking, driver assignment, and parent notifications.",
    features: ["Route planning", "Vehicle management", "Driver assignment", "Student tracking", "Parent notifications"],
  },
  {
    name: "Communications",
    icon: "COM",
    description: "SMS, email, and in-app messaging to parents, staff, and students.",
    features: ["Bulk SMS (Africa\u2019s Talking)", "Email campaigns", "In-app notifications", "Announcement broadcasts", "Message templates"],
  },
  {
    name: "eWallet",
    icon: "WAL",
    description: "Digital wallet for cashless transactions within the school ecosystem.",
    features: ["Digital wallet top-up", "Cashless payments", "Transaction history", "Parent controls", "Balance alerts"],
  },
  {
    name: "School Shop",
    icon: "SHP",
    description: "Online storefront for uniforms, books, and school supplies with inventory management.",
    features: ["Product catalogue", "Online ordering", "Inventory tracking", "Payment integration", "Order fulfilment"],
  },
];

const integrations = [
  { name: "M-Pesa (Daraja)", desc: "Mobile money payments for Kenya" },
  { name: "Airtel Money", desc: "Mobile money for Uganda, Tanzania, Rwanda" },
  { name: "Stripe", desc: "International card payments" },
  { name: "Bank Transfers", desc: "Direct bank payment support" },
  { name: "Africa\u2019s Talking", desc: "SMS & USSD messaging" },
  { name: "Resend", desc: "Transactional email delivery" },
  { name: "WorkOS", desc: "Enterprise SSO & authentication" },
  { name: "Cloudinary", desc: "Image & file management" },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Features</p>
          <h1>Everything your school needs. One platform.</h1>
          <p className="subtext">
            11 integrated modules covering student management, finance,
            operations, HR, and communication — purpose-built for East African
            schools.
          </p>
          <div className="actions">
            <Link className="btn btn-primary" href="/contact">
              Start Free Trial
            </Link>
            <Link className="btn btn-secondary" href="/concierge">
              Talk to an Expert
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="content-section" id="platform">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Built on a unified platform</h2>
            <p className="section-subtitle">
              Not a collection of stitched-together tools. EduMyles is one
              integrated platform from the ground up.
            </p>
          </div>
          <div className="features-grid four-col">
            {platformFeatures.map((f) => (
              <div key={f.title} className="feature-card">
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Modules */}
      <section className="content-section alt" id="modules">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>All 11 modules</h2>
            <p className="section-subtitle">
              Each module is deeply integrated with the others — no data silos,
              no duplicate entry.
            </p>
          </div>
          <div className="modules-grid">
            {modules.map((mod) => (
              <div key={mod.name} className="module-detail-card">
                <div className="module-detail-header">
                  <span className="module-icon">{mod.icon}</span>
                  <h3>{mod.name}</h3>
                </div>
                <p>{mod.description}</p>
                <ul className="module-features-list">
                  {mod.features.map((f) => (
                    <li key={f}>
                      <span className="check-icon">&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="content-section" id="integrations">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Integrations that matter</h2>
            <p className="section-subtitle">
              Built-in integrations with the payment providers and services East
              African schools actually use.
            </p>
          </div>
          <div className="features-grid four-col">
            {integrations.map((int) => (
              <div key={int.name} className="feature-card">
                <h3>{int.name}</h3>
                <p>{int.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="content-section green-bg" id="ai">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Smart automation &amp; insights</h2>
            <p className="section-subtitle light">
              Let the platform handle the repetitive tasks so your team can focus
              on educating students.
            </p>
          </div>
          <div className="features-grid three-col">
            <div className="feature-card dark">
              <h3>Auto-Generated Timetables</h3>
              <p>Set constraints — teacher availability, room capacity, subject hours — and let EduMyles generate conflict-free schedules.</p>
            </div>
            <div className="feature-card dark">
              <h3>Fee Reminders</h3>
              <p>Automated SMS and email reminders sent to parents before and after fee due dates, with escalation workflows.</p>
            </div>
            <div className="feature-card dark">
              <h3>Analytics Dashboard</h3>
              <p>Real-time insights on enrollment trends, fee collection rates, attendance patterns, and academic performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Ready to see it in action?</h2>
          <p>Start your free 30-day trial or book a personalized demo with our team.</p>
          <div className="actions centered-actions">
            <Link className="btn btn-primary" href="/contact">
              Activate Free Trial
            </Link>
            <Link className="btn btn-secondary" href="/concierge">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
