import Link from "next/link";

export default function SolutionsPage() {
  return (
    <main>
      <section className="page-hero green-hero">
        <div className="page-hero-inner">
          <p className="eyebrow light">Solutions</p>
          <h1 className="light-heading">Solutions Built for Real School Operations</h1>
          <p className="subtext light">
            Whether you run a single primary school, a secondary school, or a multi-campus
            institution - EduMyles adapts to your structure and workflows.
          </p>
          <div className="actions">
            <Link className="btn btn-amber" href="/auth/signup">
              Get Started Free
            </Link>
            <Link className="btn btn-outline-light" href="/concierge">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Primary & Secondary */}
      <section className="content-section">
        <div className="content-inner">
          <div className="solution-block">
            <div className="solution-text">
              <p className="eyebrow">For Day Schools</p>
              <h2>Primary &amp; Secondary Schools</h2>
              <p>
                Manage the daily rhythm of school life - from morning attendance to afternoon bus
                departures. EduMyles handles admissions, timetabling, fee collection, grade
                management, and parent communication in one seamless workflow designed for how East
                African schools actually operate.
              </p>
              <Link className="btn btn-primary" href="/auth/signup">
                Start Free Trial
              </Link>
            </div>
            <div className="solution-features">
              <ul className="module-features-list large">
                <li><span className="check-icon">&#10003;</span> CBC and 8-4-4 curriculum support</li>
                <li><span className="check-icon">&#10003;</span> M-Pesa and Airtel Money fee collection</li>
                <li><span className="check-icon">&#10003;</span> Automated report card generation</li>
                <li><span className="check-icon">&#10003;</span> Parent portal with SMS notifications</li>
                <li><span className="check-icon">&#10003;</span> Timetable builder with conflict detection</li>
                <li><span className="check-icon">&#10003;</span> Attendance tracking and analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Campus */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="solution-block" style={{ direction: "rtl" }}>
            <div className="solution-text" style={{ direction: "ltr" }}>
              <p className="eyebrow">For School Groups</p>
              <h2>Multi-Campus Operations</h2>
              <p>
                Unified oversight with role-based control across branches and teams. See consolidated
                analytics, manage shared staff, and maintain consistent policies across all your
                campuses while keeping data strictly isolated between schools.
              </p>
              <Link className="btn btn-primary" href="/auth/signup">
                Start Free Trial
              </Link>
            </div>
            <div className="solution-features" style={{ direction: "ltr" }}>
              <ul className="module-features-list large">
                <li><span className="check-icon">&#10003;</span> Central dashboard for all campuses</li>
                <li><span className="check-icon">&#10003;</span> Strict tenant isolation between schools</li>
                <li><span className="check-icon">&#10003;</span> Consolidated financial reporting</li>
                <li><span className="check-icon">&#10003;</span> Shared staff and resource management</li>
                <li><span className="check-icon">&#10003;</span> Granular role-based access controls</li>
                <li><span className="check-icon">&#10003;</span> Cross-campus analytics and benchmarking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="content-section">
        <div className="content-inner">
          <div className="solution-block">
            <div className="solution-text">
              <p className="eyebrow">For Ecosystem Providers</p>
              <h2>Partners &amp; Integrators</h2>
              <p>
                APIs and workflows for implementation partners, ed-tech providers, and ecosystem
                integrators. Build on top of EduMyles or connect your existing tools. Our platform
                is designed to be extensible and partner-friendly.
              </p>
              <Link className="btn btn-primary" href="/contact">
                Partner With Us
              </Link>
            </div>
            <div className="solution-features">
              <ul className="module-features-list large">
                <li><span className="check-icon">&#10003;</span> RESTful API access</li>
                <li><span className="check-icon">&#10003;</span> Webhook integrations</li>
                <li><span className="check-icon">&#10003;</span> White-label deployment options</li>
                <li><span className="check-icon">&#10003;</span> Revenue sharing for partners</li>
                <li><span className="check-icon">&#10003;</span> Dedicated partner support</li>
                <li><span className="check-icon">&#10003;</span> Co-marketing opportunities</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="content-section green-bg">
        <div className="content-inner">
          <div className="section-header centered">
            <h2 className="text-white">Available across East Africa</h2>
          </div>
          <div className="countries-grid">
            {[
              { flag: "\ud83c\uddf0\ud83c\uddea", name: "Kenya", currency: "KES" },
              { flag: "\ud83c\uddfa\ud83c\uddec", name: "Uganda", currency: "UGX" },
              { flag: "\ud83c\uddf9\ud83c\uddff", name: "Tanzania", currency: "TZS" },
              { flag: "\ud83c\uddf7\ud83c\uddfc", name: "Rwanda", currency: "RWF" },
              { flag: "\ud83c\udde7\ud83c\uddee", name: "Burundi", currency: "BIF" },
              { flag: "\ud83c\uddf8\ud83c\uddf8", name: "South Sudan", currency: "SSP" },
            ].map((c) => (
              <div key={c.name} className="country-card">
                <span className="country-flag">{c.flag}</span>
                <h3>{c.name}</h3>
                <p>{c.currency} supported</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Find the right solution for your school</h2>
          <p>Book a free consultation to discuss your specific needs and workflows.</p>
          <div className="centered-actions">
            <Link className="btn btn-primary" href="/auth/signup">
              Start Free Trial
            </Link>
            <Link className="btn btn-outline" href="/concierge">
              Talk to an Expert
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
