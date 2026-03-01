import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Concierge — EduMyles",
  description:
    "Book a free, no-obligation consultation with an EduMyles school-tech expert. Not a sales call — a genuine conversation about your school.",
};

const benefits = [
  {
    title: "Personalised Walkthrough",
    description: "See EduMyles configured for your specific school structure, curriculum, and student count.",
  },
  {
    title: "Migration Planning",
    description: "We\u2019ll map out exactly how to move from your current tools to EduMyles with zero data loss.",
  },
  {
    title: "ROI Estimate",
    description: "Get a realistic estimate of time and cost savings based on schools similar to yours.",
  },
  {
    title: "Technical Q&A",
    description: "Ask anything — integrations, data security, multi-campus setup, curriculum support, you name it.",
  },
];

const process = [
  { step: "1", title: "Submit Your Details", desc: "Tell us about your school — size, location, current tools, and what challenges you face." },
  { step: "2", title: "We Schedule a Call", desc: "Our team will reach out within 24 hours to schedule a convenient time." },
  { step: "3", title: "Expert Consultation", desc: "A 30-minute call with a school-tech expert who understands East African education." },
  { step: "4", title: "Custom Recommendation", desc: "You\u2019ll receive a tailored plan with the right modules, pricing, and migration steps." },
];

export default function ConciergePage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero green-hero">
        <div className="page-hero-inner">
          <span className="concierge-label">EduMyles Concierge</span>
          <h1 className="light-heading">
            Speak to a school-tech expert — free.
          </h1>
          <p className="subtext light">
            Not a sales call. A genuine consultation to understand your school
            and show you exactly how EduMyles can help.
          </p>
          <div className="actions">
            <Link
              className="btn btn-amber"
              href="mailto:sales@edumyles.com?subject=Concierge%20Request%20-%20Free%20Consultation"
            >
              Book Free Consultation
            </Link>
            <a className="btn btn-outline-light" href="tel:+254743993715">
              Call +254 743 993 715
            </a>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>What you get from a concierge session</h2>
            <p className="section-subtitle">
              A 30-minute session designed entirely around your school — not a
              generic demo.
            </p>
          </div>
          <div className="features-grid four-col">
            {benefits.map((b) => (
              <div key={b.title} className="feature-card">
                <h3>{b.title}</h3>
                <p>{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>How it works</h2>
          </div>
          <div className="process-grid">
            {process.map((p) => (
              <div key={p.step} className="process-step">
                <span className="process-number">{p.step}</span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Details */}
      <section className="content-section green-bg">
        <div className="content-inner">
          <div className="concierge-contact-block">
            <h2>Prefer to reach out directly?</h2>
            <div className="concierge-contact-grid">
              <div className="concierge-contact-item">
                <h4>Email</h4>
                <a href="mailto:sales@edumyles.com">sales@edumyles.com</a>
                <a href="mailto:contact@edumyles.com">contact@edumyles.com</a>
              </div>
              <div className="concierge-contact-item">
                <h4>Phone</h4>
                <a href="tel:+254743993715">+254 743 993 715</a>
                <a href="tel:+254751812884">+254 751 812 884</a>
              </div>
              <div className="concierge-contact-item">
                <h4>Office</h4>
                <p>WesternHeights</p>
                <p>Nairobi, Kenya</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Ready to talk?</h2>
          <p>
            Book your free consultation or start a free trial right away.
          </p>
          <div className="actions centered-actions">
            <Link className="btn btn-primary" href="mailto:sales@edumyles.com?subject=Concierge%20Request">
              Book Consultation
            </Link>
            <Link className="btn btn-secondary" href="/contact">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
