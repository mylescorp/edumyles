import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resources — EduMyles",
  description:
    "Videos, webinars, guides, and newsletters to help you get the most out of EduMyles.",
};

const videos = [
  { title: "Getting Started with EduMyles", duration: "12 min", desc: "A complete walkthrough of setting up your school on EduMyles." },
  { title: "Student Enrollment Flow", duration: "8 min", desc: "See how admissions work from application to enrollment." },
  { title: "Fee Collection with M-Pesa", duration: "6 min", desc: "Set up fee structures and collect payments via mobile money." },
  { title: "Timetable Generation", duration: "10 min", desc: "Auto-generate conflict-free timetables for your school." },
  { title: "Report Card Generation", duration: "7 min", desc: "Create and distribute report cards to parents digitally." },
  { title: "Multi-Campus Management", duration: "9 min", desc: "How school groups manage multiple campuses from one dashboard." },
];

const webinars = [
  {
    title: "Digitising Your School in 30 Days",
    date: "Monthly — Next session TBA",
    desc: "A step-by-step plan to move from spreadsheets to EduMyles.",
    cta: "Save Your Seat",
  },
  {
    title: "Mastering Fee Collection",
    date: "Monthly — Next session TBA",
    desc: "Best practices for reducing late payments and automating reminders.",
    cta: "Save Your Seat",
  },
  {
    title: "EduMyles for School Groups",
    date: "Quarterly — Next session TBA",
    desc: "How multi-campus networks use EduMyles for unified management.",
    cta: "Save Your Seat",
  },
];

const guides = [
  { title: "Implementation Guide", desc: "Step-by-step onboarding for new schools." },
  { title: "Data Migration Guide", desc: "How to import existing student and fee data." },
  { title: "Admin Best Practices", desc: "Tips for school administrators using EduMyles." },
  { title: "Finance Module Guide", desc: "Setting up fee structures, invoices, and payments." },
  { title: "Parent Communication Guide", desc: "How to keep parents informed using SMS and in-app messaging." },
  { title: "Integration Setup Guide", desc: "Connecting M-Pesa, Airtel Money, and other services." },
];

export default function ResourcesPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Resources</p>
          <h1>Learn, grow, succeed.</h1>
          <p className="subtext">
            Videos, webinars, guides, and insights to help your school get the
            most out of EduMyles.
          </p>
        </div>
      </section>

      {/* Videos */}
      <section className="content-section" id="videos">
        <div className="content-inner">
          <div className="section-header">
            <h2>Product Videos</h2>
            <p className="section-subtitle">Walkthrough and tutorial videos for every module.</p>
          </div>
          <div className="resources-grid">
            {videos.map((v) => (
              <div key={v.title} className="resource-card">
                <div className="resource-card-play">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <h3>{v.title}</h3>
                <span className="resource-meta">{v.duration}</span>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Webinars */}
      <section className="content-section alt" id="webinars">
        <div className="content-inner">
          <div className="section-header">
            <h2>Live Webinars</h2>
            <p className="section-subtitle">Join our upcoming live sessions and Q&amp;A.</p>
          </div>
          <div className="resources-grid three-col">
            {webinars.map((w) => (
              <div key={w.title} className="resource-card webinar-card">
                <span className="resource-meta">{w.date}</span>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
                <Link className="btn btn-sm btn-primary" href="/contact">
                  {w.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="content-section" id="guides">
        <div className="content-inner">
          <div className="section-header">
            <h2>Guides &amp; Documentation</h2>
            <p className="section-subtitle">Step-by-step documentation for implementation and best practices.</p>
          </div>
          <div className="resources-grid">
            {guides.map((g) => (
              <div key={g.title} className="resource-card guide-card">
                <div className="resource-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                </div>
                <h3>{g.title}</h3>
                <p>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="content-section green-bg" id="newsletter">
        <div className="content-inner">
          <div className="newsletter-block">
            <div className="newsletter-text">
              <h2>Into the Zone</h2>
              <p>
                Our monthly newsletter with product updates, school management
                tips, and insights from the EduMyles team. Join 500+ school
                leaders already subscribed.
              </p>
              <Link className="btn btn-amber" href="mailto:info@edumyles.com?subject=Newsletter%20Subscription">
                Subscribe to Newsletter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Press */}
      <section className="content-section" id="press">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Press &amp; Media</h2>
            <p className="section-subtitle">
              For press inquiries, media kits, and interview requests, contact
              us at{" "}
              <a href="mailto:info@edumyles.com" className="text-link">
                info@edumyles.com
              </a>.
            </p>
          </div>
        </div>
      </section>

      {/* Analyst Reports */}
      <section className="content-section alt" id="reports">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Analyst Reports</h2>
            <p className="section-subtitle">
              Independent reviews and analysis of EduMyles. Contact{" "}
              <a href="mailto:info@edumyles.com" className="text-link">
                info@edumyles.com
              </a>{" "}
              to request access to full reports.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Need help getting started?</h2>
          <p>Our team is here to help you every step of the way.</p>
          <div className="actions centered-actions">
            <Link className="btn btn-primary" href="/concierge">
              Book Free Consultation
            </Link>
            <Link className="btn btn-secondary" href="mailto:support@edumyles.com">
              Email Support
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
