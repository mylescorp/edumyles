"use client";

import Link from "next/link";

const stats = [
  { value: "50+",  label: "Schools Managed" },
  { value: "11",   label: "Core Modules" },
  { value: "6",    label: "East African Countries" },
  { value: "10K+", label: "Students on Platform" },
];

const schools = [
  "Nairobi Academy",
  "Kampala International",
  "Dar Premium School",
  "Kigali Prep",
  "Bujumbura Lycée",
];

export default function HeroSection() {
  return (
    <>
      {/* ── Announcement Bar ── */}
      <div className="announcement-bar">
        Now available in Kenya, Uganda, Tanzania, Rwanda, Burundi &amp; South Sudan
        <span className="badge">New</span>
      </div>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">The Operating System for African Schools</p>

          <h1>Transforming schools,<br />one mile at a time.</h1>

          <p className="subtext">
            EduMyles is the all-in-one platform for schools across Africa — intuitive, affordable
            technology that simplifies administration, enhances learning outcomes, and connects every
            stakeholder from admissions to alumni.
          </p>

          <div className="actions">
            <a className="btn btn-primary" href="/auth/signup/api">
              Get Started Free
            </a>
            <Link className="btn btn-secondary" href="/concierge">
              Book a Demo
            </Link>
          </div>

          <div className="trust-signals">
            <span className="trust-signal">
              <span className="check">✓</span> Free for 30 days
            </span>
            <span className="trust-signal">
              <span className="check">✓</span> No credit card required
            </span>
            <span className="trust-signal">
              <span className="check">✓</span> Free onboarding &amp; training
            </span>
          </div>
        </div>

        {/* ── Dashboard Mockup ── */}
        <div className="hero-visual">
          <div className="dashboard-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="mockup-title">EduMyles Dashboard</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar">
                <div className="mockup-sidebar-item active" />
                <div className="mockup-sidebar-item" />
                <div className="mockup-sidebar-item" />
                <div className="mockup-sidebar-item" />
                <div className="mockup-sidebar-item" />
              </div>
              <div className="mockup-main">
                <div className="mockup-stat-row">
                  <div className="mockup-stat-card c1" />
                  <div className="mockup-stat-card c2" />
                  <div className="mockup-stat-card c3" />
                </div>
                <div className="mockup-chart" />
                <div className="mockup-table">
                  <div className="mockup-table-row" />
                  <div className="mockup-table-row" />
                  <div className="mockup-table-row" />
                  <div className="mockup-table-row" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof / Stats ── */}
      <section className="social-proof-section">
        <div className="stats-grid" data-reveal>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="stat-card"
              data-reveal
              data-reveal-delay={String(i * 100)}
            >
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="trusted-by" data-reveal data-reveal-delay="200">
          <p className="trusted-label">Trusted by schools across East Africa</p>
          <div className="trusted-logos">
            {schools.map((name) => (
              <span key={name} className="school-logo">{name}</span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
