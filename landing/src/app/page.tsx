const highlights = [
  {
    title: "Admissions to Alumni",
    description:
      "Handle enrollment, class allocation, academics, report cards, and parent communication in one flow.",
  },
  {
    title: "Built for Multi-Campus",
    description:
      "Run multiple schools from a single platform with strict tenant isolation and role-based access controls.",
  },
  {
    title: "East Africa Ready",
    description:
      "Support M-Pesa and Airtel Money payment workflows, with local-first communication channels.",
  },
];

const modules = [
  "Student Information System",
  "Finance & Fees",
  "Timetable & Scheduling",
  "Gradebook & Exams",
  "HR & Payroll",
  "Transport & Library",
];

const stats = [
  { value: "50+", label: "Schools Managed" },
  { value: "10+", label: "Core Modules" },
  { value: "6", label: "East African Countries" },
];

export default function LandingPage() {
  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        Introducing EduMyles — the all-in-one school management platform
        <span className="badge">NEW</span>
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-logo">EduMyles</span>
        <ul className="navbar-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#modules">Modules</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <a className="navbar-cta" href="/auth/login">
          Get Started
        </a>
      </nav>

      <main className="landing">
        {/* Hero Section — White */}
        <section className="hero">
          <p className="eyebrow">EduMyles</p>
          <h1>School management that actually fits East Africa.</h1>
          <p className="subtext">
            Replace disconnected spreadsheets and messaging groups with one platform for operations,
            billing, academics, and communication.
          </p>
          <div className="actions">
            <a className="btn btn-primary" href="#">
              Activate Free Trial
            </a>
            <a className="btn btn-secondary" href="#">
              Contact Sales
            </a>
          </div>
          <div className="trust-signals">
            <span className="trust-signal">
              <span className="check">✓</span> Free for 30 days
            </span>
            <span className="trust-signal">
              <span className="check">✓</span> No card details required
            </span>
            <span className="trust-signal">
              <span className="check">✓</span> Free support and training
            </span>
          </div>
        </section>

        {/* Stats Section — Off-White */}
        <section className="stats-section" id="features">
          <div className="stats-grid">
            {stats.map((item) => (
              <div key={item.label} className="stat-item">
                <div className="stat-value">{item.value}</div>
                <div className="stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Highlights Section — Amber/Yellow Zone */}
        <section className="highlights-zone">
          <div className="highlights" aria-label="Platform highlights">
            {highlights.map((item) => (
              <article key={item.title} className="panel">
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Modules Section — Forest Green Zone */}
        <section className="modules-zone" id="modules">
          <div className="split">
            <div className="split-text">
              <h2>Core modules for daily school operations</h2>
              <p>
                Start with the essentials and expand module by module as your institution grows.
                EduMyles keeps your teams aligned without forcing generic workflows.
              </p>
            </div>
            <ul className="module-list" aria-label="Core modules">
              {modules.map((module) => (
                <li key={module}>{module}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA Section — Off-White */}
        <section className="cta" id="contact">
          <h2>Launch faster with your school structure already in mind.</h2>
          <p>Bring your admin, bursar, and academic teams into one connected system.</p>
          <a className="btn btn-primary" href="#">
            Start Setup Call
          </a>
        </section>
      </main>

      {/* Footer — Charcoal Zone */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} EduMyles. Built for East Africa.</p>
      </footer>
    </>
  );
}
