"use client";

import Link from "next/link";

interface Section {
  title: string;
  text: string;
}

interface MarketingPageProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: Section[];
  ctaLabel?: string;
  ctaHref?: string;
}

export default function MarketingPage({
  eyebrow,
  title,
  subtitle,
  sections,
  ctaLabel = "Get Started Free",
  ctaHref = "/auth/signup",
}: MarketingPageProps) {
  return (
    <main>
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="subtext">{subtitle}</p>
          <div className="actions">
            <Link className="btn btn-primary" href={ctaHref}>
              {ctaLabel}
            </Link>
            <Link className="btn btn-secondary" href="/concierge">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {sections.map((section, i) => (
        <section
          key={section.title}
          className={`content-section ${i % 2 === 1 ? "alt" : ""}`}
        >
          <div className="content-inner">
            <div className="section-header">
              <h2>{section.title}</h2>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "1.05rem", lineHeight: 1.7, maxWidth: "70ch" }}>
              {section.text}
            </p>
          </div>
        </section>
      ))}

      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Ready to transform your school?</h2>
          <p>Join 50+ schools across East Africa already running smarter with EduMyles.</p>
          <Link className="btn btn-primary" href="/auth/signup">
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </main>
  );
}
