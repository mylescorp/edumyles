import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solutions — EduMyles",
  description:
    "EduMyles solutions for primary schools, secondary schools, school groups, and partners across East Africa.",
};

const solutions = [
  {
    id: "primary",
    title: "For Primary Schools",
    subtitle: "Simplified management for junior schools",
    description:
      "Primary schools need simplicity. EduMyles gives you student enrollment, attendance, basic fee collection, and parent communication — without the complexity your staff doesn't need.",
    features: [
      "Simple student enrollment and class management",
      "Basic fee collection with M-Pesa and Airtel Money",
      "Parent communication via SMS and in-app messaging",
      "Report card generation for CBC and 8-4-4",
      "Attendance tracking with parent notifications",
      "Library management for reading programmes",
    ],
    cta: "Start Free Trial",
    href: "/contact",
  },
  {
    id: "secondary",
    title: "For Secondary Schools",
    subtitle: "Full academic & administrative management",
    description:
      "Secondary schools handle complex timetables, multiple subject streams, exams, and larger staff. EduMyles provides the full suite — academics, HR, finance, and operations — all integrated.",
    features: [
      "Advanced timetable generation with stream support",
      "Full gradebook with assessment weighting",
      "UNEB, NECTA, and REB curriculum support",
      "HR & payroll for large teaching staff",
      "Transport route management",
      "Student eWallet for cashless campus",
    ],
    cta: "Start Free Trial",
    href: "/contact",
  },
  {
    id: "groups",
    title: "For School Groups",
    subtitle: "Multi-campus unified control",
    description:
      "School groups and chains need central oversight without micromanaging each campus. EduMyles gives you a unified dashboard across all your schools with per-campus data isolation.",
    features: [
      "Central dashboard for all campuses",
      "Per-campus data isolation and admin roles",
      "Consolidated financial reporting",
      "Cross-campus student transfers",
      "Standardized curriculum and assessments",
      "Group-level analytics and benchmarking",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@edumyles.com?subject=School%20Group%20Inquiry",
  },
  {
    id: "partners",
    title: "For Partners",
    subtitle: "White-label & API access",
    description:
      "Educational technology providers, consultancies, and resellers can offer EduMyles under their own brand. Our white-label programme gives you full customisation, your own domain, and API access to build on top of our platform.",
    features: [
      "Full white-labeling with your brand and domain",
      "API access for custom integrations",
      "Partner dashboard for managing client schools",
      "Revenue sharing model",
      "Dedicated partner success manager",
      "Co-marketing and co-selling support",
    ],
    cta: "Become a Partner",
    href: "mailto:sales@edumyles.com?subject=Partner%20Programme%20Inquiry",
  },
];

const countries = [
  { flag: "\u{1F1F0}\u{1F1EA}", name: "Kenya", curriculum: "CBC & 8-4-4", currency: "KES" },
  { flag: "\u{1F1FA}\u{1F1EC}", name: "Uganda", curriculum: "UNEB", currency: "UGX" },
  { flag: "\u{1F1F9}\u{1F1FF}", name: "Tanzania", curriculum: "NECTA", currency: "TZS" },
  { flag: "\u{1F1F7}\u{1F1FC}", name: "Rwanda", curriculum: "REB", currency: "RWF" },
  { flag: "\u{1F1EA}\u{1F1F9}", name: "Ethiopia", curriculum: "MoE", currency: "ETB" },
  { flag: "\u{1F1EC}\u{1F1ED}", name: "Ghana", curriculum: "WAEC", currency: "GHS" },
];

export default function SolutionsPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Solutions</p>
          <h1>Built for every type of school.</h1>
          <p className="subtext">
            Whether you run a single primary school or a network of campuses,
            EduMyles adapts to your needs with the right modules and the right
            pricing.
          </p>
        </div>
      </section>

      {/* Solutions */}
      {solutions.map((sol, i) => (
        <section
          key={sol.id}
          className={`content-section ${i % 2 === 1 ? "alt" : ""}`}
          id={sol.id}
        >
          <div className="content-inner">
            <div className="solution-block">
              <div className="solution-text">
                <p className="eyebrow">{sol.subtitle}</p>
                <h2>{sol.title}</h2>
                <p>{sol.description}</p>
                <Link className="btn btn-primary" href={sol.href}>
                  {sol.cta}
                </Link>
              </div>
              <div className="solution-features">
                <ul className="module-features-list large">
                  {sol.features.map((f) => (
                    <li key={f}>
                      <span className="check-icon">&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Countries */}
      <section className="content-section green-bg">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Serving 6 East African countries</h2>
            <p className="section-subtitle light">
              Local curricula, local currencies, local payment methods — built in from day one.
            </p>
          </div>
          <div className="countries-grid">
            {countries.map((c) => (
              <div key={c.name} className="country-card">
                <span className="country-flag">{c.flag}</span>
                <h3>{c.name}</h3>
                <p>Curriculum: {c.curriculum}</p>
                <p>Currency: {c.currency}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Not sure which solution fits?</h2>
          <p>Talk to our team — we&apos;ll help you find the right plan for your school.</p>
          <div className="actions centered-actions">
            <Link className="btn btn-primary" href="/concierge">
              Book Free Consultation
            </Link>
            <Link className="btn btn-secondary" href="mailto:sales@edumyles.com">
              Email Sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
