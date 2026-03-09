import Link from "next/link";

export default function ConciergePage() {
  return (
    <main>
      <section className="page-hero green-hero">
        <div className="page-hero-inner">
          <p className="eyebrow light">EduMyles Concierge</p>
          <h1 className="light-heading">Talk to an Education Technology Specialist</h1>
          <p className="subtext light">
            Book a guided session to map EduMyles to your school workflows. Not a sales pitch - a
            genuine consultation to help you evaluate if EduMyles is right for your institution.
          </p>
          <div className="actions">
            <Link className="btn btn-amber" href="mailto:concierge@edumyles.com">
              Book Free Consultation
            </Link>
            <Link className="btn btn-outline-light" href="/features">
              Explore Features First
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>How the Concierge works</h2>
            <p className="section-subtitle">
              A structured, no-pressure consultation designed to help you make the right decision
              for your school.
            </p>
          </div>
          <div className="process-grid">
            <div className="process-step">
              <div className="process-number">1</div>
              <h3>Discovery Session</h3>
              <p>
                We review your school structure, current tools, pain points, and operational goals.
                This helps us understand what you actually need.
              </p>
            </div>
            <div className="process-step">
              <div className="process-number">2</div>
              <h3>Live Walkthrough</h3>
              <p>
                You get a guided demo tailored to your school model - showing exactly how EduMyles
                would handle your specific workflows.
              </p>
            </div>
            <div className="process-step">
              <div className="process-number">3</div>
              <h3>Rollout Plan</h3>
              <p>
                Receive a recommended implementation sequence, timeline, and adoption checklist
                customized for your institution.
              </p>
            </div>
            <div className="process-step">
              <div className="process-number">4</div>
              <h3>Ongoing Support</h3>
              <p>
                Your dedicated specialist stays with you through setup, training, and the first
                month of operation to ensure success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What we cover */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>What we cover in your session</h2>
          </div>
          <div className="features-grid three-col">
            <div className="feature-card">
              <h3>School Structure Mapping</h3>
              <p>
                We map your campuses, classes, streams, departments, and reporting hierarchy to
                configure EduMyles to match your exact organizational structure.
              </p>
            </div>
            <div className="feature-card">
              <h3>Workflow Analysis</h3>
              <p>
                We identify your current processes for admissions, fee collection, grade management,
                and communication - then show you how EduMyles streamlines each one.
              </p>
            </div>
            <div className="feature-card">
              <h3>Integration Planning</h3>
              <p>
                We review your existing payment methods (M-Pesa, bank transfers), communication
                channels (SMS, email), and any systems that need to connect.
              </p>
            </div>
            <div className="feature-card">
              <h3>Data Migration Strategy</h3>
              <p>
                We assess your current data (spreadsheets, legacy systems) and create a plan to
                migrate student records, staff data, and financial history safely.
              </p>
            </div>
            <div className="feature-card">
              <h3>Role & Access Design</h3>
              <p>
                We help you define who needs access to what - from the principal down to individual
                teachers, parents, and support staff.
              </p>
            </div>
            <div className="feature-card">
              <h3>Cost & Timeline Estimate</h3>
              <p>
                You get a clear picture of costs, implementation timeline, and expected return on
                investment based on your school size and needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="content-section green-bg">
        <div className="content-inner">
          <div className="concierge-contact-block">
            <h2>Ready to book your session?</h2>
            <div className="concierge-contact-grid">
              <div className="concierge-contact-item">
                <h4>Email</h4>
                <a href="mailto:concierge@edumyles.com">concierge@edumyles.com</a>
              </div>
              <div className="concierge-contact-item">
                <h4>Response Time</h4>
                <p>Within 4 business hours</p>
              </div>
              <div className="concierge-contact-item">
                <h4>Session Length</h4>
                <p>45-60 minutes (free)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Prefer to explore on your own first?</h2>
          <p>Start a free 30-day trial with full access to all modules. No credit card required.</p>
          <div className="centered-actions">
            <Link className="btn btn-primary" href="/auth/signup">Start Free Trial</Link>
            <Link className="btn btn-outline" href="/features">View All Features</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
