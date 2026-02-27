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

export default function LandingPage() {
  return (
    <main className="landing">
      <div className="orb orb-a" aria-hidden />
      <div className="orb orb-b" aria-hidden />
      <section className="hero">
        <p className="eyebrow">EduMyles</p>
        <h1>School management that actually fits East Africa.</h1>
        <p className="subtext">
          Replace disconnected spreadsheets and messaging groups with one platform for operations,
          billing, academics, and communication.
        </p>
        <div className="actions">
          <a className="btn btn-primary" href="#">
            Request Demo
          </a>
          <a className="btn btn-secondary" href="#">
            View Product Brief
          </a>
        </div>
      </section>

      <section className="highlights" aria-label="Platform highlights">
        {highlights.map((item) => (
          <article key={item.title} className="panel">
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="split">
        <div className="panel">
          <h2>Core modules for daily school operations</h2>
          <p>
            Start with the essentials and expand module by module as your institution grows. EduMyles
            keeps your teams aligned without forcing generic workflows.
          </p>
        </div>
        <ul className="module-list" aria-label="Core modules">
          {modules.map((module) => (
            <li key={module}>{module}</li>
          ))}
        </ul>
      </section>

      <section className="cta">
        <h2>Launch faster with your school structure already in mind.</h2>
        <p>Bring your admin, bursar, and academic teams into one connected system.</p>
        <a className="btn btn-primary" href="#">
          Start Setup Call
        </a>
      </section>
    </main>
  );
}
