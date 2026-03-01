"use client";

import { useState } from "react";



// ── Data ────────────────────────────────────────────────────

const stats = [
  { value: "50+", label: "Schools Managed" },
  { value: "11", label: "Core Modules" },
  { value: "6", label: "East African Countries" },
  { value: "1000+", label: "Integrations Ready" },
];

const highlights = [
  {
    title: "Admissions to Alumni",
    description:
      "Handle enrollment, class allocation, academics, report cards, and parent communication — one connected flow from day one.",
  },
  {
    title: "Built for Multi-Campus",
    description:
      "Run multiple schools from a single platform with strict tenant isolation and granular role-based access controls.",
  },
  {
    title: "East Africa Ready",
    description:
      "M-Pesa, Airtel Money, and local payment workflows built in. Supports 6 East African currencies and curricula out of the box.",
  },
];

const moduleCategories = [
  {
    key: "student",
    label: "Student Management",
    description:
      "Manage the entire student lifecycle — from admissions and enrollment through academics, assessments, and alumni tracking. Every record in one place.",
    apps: [
      { name: "Student Information System", desc: "Student profiles, classes, streams" },
      { name: "Admissions", desc: "Applications, enrollment, waitlists" },
      { name: "Academics", desc: "Gradebook, assessments, report cards" },
      { name: "Communications", desc: "SMS, email, in-app messaging" },
    ],
  },
  {
    key: "finance",
    label: "Finance & Billing",
    description:
      "Streamline fee collection with M-Pesa, Airtel Money, Stripe, and bank transfers. Auto-generate invoices, track payments, and manage bursaries.",
    apps: [
      { name: "Finance & Fees", desc: "Fee collection, invoices, receipts" },
      { name: "eWallet", desc: "Digital wallet for students & parents" },
      { name: "School Shop", desc: "Uniform, books, supplies store" },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    description:
      "Schedule timetables, manage transport routes, organise library resources, and run HR & payroll — all from one dashboard.",
    apps: [
      { name: "Timetable & Scheduling", desc: "Scheduling, substitutions, room bookings" },
      { name: "HR & Payroll", desc: "Staff records, attendance, payroll" },
      { name: "Transport", desc: "Routes, vehicles, student tracking" },
      { name: "Library", desc: "Book catalog, borrowing, fines" },
    ],
  },
];

const successStories = [
  {
    school: "Greenfield Academy",
    location: "Nairobi, Kenya",
    quote:
      "EduMyles replaced 5 different tools we were using. Our admin team now spends 60% less time on manual data entry.",
    person: "Sarah Mwangi",
    role: "Principal",
    metric: "60%",
    metricLabel: "less admin time",
  },
  {
    school: "Kampala International School",
    location: "Kampala, Uganda",
    quote:
      "Fee collection used to be our biggest headache. With M-Pesa integration, parents pay on time and we have full visibility.",
    person: "David Okello",
    role: "Bursar",
    metric: "85%",
    metricLabel: "on-time payments",
  },
  {
    school: "Dar es Salaam Prep",
    location: "Dar es Salaam, Tanzania",
    quote:
      "Rolling out across 3 campuses was seamless. Each campus has its own setup but we see everything from one dashboard.",
    person: "Amina Hassan",
    role: "School Administrator",
    metric: "3",
    metricLabel: "campuses unified",
  },
];

const pricingTiers = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For small schools getting started",
    modules: ["Student Information", "Admissions", "Finance & Fees", "Communications"],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Standard",
    price: "$3",
    period: "/student/month",
    description: "For growing schools that need more",
    modules: [
      "Everything in Starter",
      "Timetable & Scheduling",
      "Academics & Gradebook",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$5",
    period: "/student/month",
    description: "For established institutions",
    modules: [
      "Everything in Standard",
      "HR & Payroll",
      "Library",
      "Transport",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For multi-campus networks & partners",
    modules: [
      "Everything in Pro",
      "eWallet",
      "School Shop",
      "White-label & API access",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const reviewPlatforms = [
  { name: "G2", rating: "4.6" },
  { name: "Capterra", rating: "4.5" },
  { name: "GetApp", rating: "4.5" },
];

const trustedSchools = [
  "Greenfield Academy",
  "Kampala International",
  "Dar Prep",
  "Kigali Heights School",
  "Addis Scholars",
  "Accra Montessori",
];

// ── Component ───────────────────────────────────────────────

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("student");

  const activeCategory = moduleCategories.find((c) => c.key === activeTab)!;

  return (
    <>
      {/* ════════════════════════════════════════════════════
          1. HERO SECTION — White Background
      ════════════════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">EduMyles</p>
          <h1>The operating system for schools in East Africa.</h1>
          <p className="subtext">
            Replace disconnected spreadsheets, WhatsApp groups, and siloed
            tools with one unified platform for admissions, billing,
            academics, HR, and communication.
          </p>
          <div className="actions">
            <a className="btn btn-primary" href="/auth/signup">
              Sign Up Free
            </a>
            <a className="btn btn-secondary" href="/concierge">
              Contact Sales
            </a>
          </div>
          <div className="trust-signals">
            <span className="trust-signal">
              <span className="check">&#10003;</span> Free for 30 days
            </span>
            <span className="trust-signal">
              <span className="check">&#10003;</span> No card details required
            </span>
            <span className="trust-signal">
              <span className="check">&#10003;</span> Free support &amp; training
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="dashboard-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span /><span /><span />
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          2. SOCIAL PROOF / STATS — Off-White
      ════════════════════════════════════════════════════ */}
      <section className="social-proof-section" id="features">
        {/* Review Ratings */}
        <div className="review-bar">
          <div className="review-overall">
            <span className="review-score">4.5/5</span>
            <span className="review-stars">&#9733;&#9733;&#9733;&#9733;&#9734;</span>
            <span className="review-count">Based on 500+ reviews</span>
          </div>
          <div className="review-platforms">
            {reviewPlatforms.map((p) => (
              <div key={p.name} className="review-platform">
                <span className="platform-name">{p.name}</span>
                <span className="platform-rating">{p.rating}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((item) => (
            <div key={item.label} className="stat-item">
              <div className="stat-value">{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Trusted By */}
        <div className="trusted-by">
          <p className="trusted-label">Trusted by schools across East Africa</p>
          <div className="trusted-logos">
            {trustedSchools.map((school) => (
              <span key={school} className="school-logo">{school}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          3. HIGHLIGHTS — Amber/Yellow Zone
      ════════════════════════════════════════════════════ */}
      <section className="highlights-zone">
        <div className="section-header centered">
          <h2>Why schools choose EduMyles</h2>
          <p className="section-subtitle">
            Built from the ground up for how schools in East Africa actually operate.
          </p>
        </div>
        <div className="highlights" aria-label="Platform highlights">
          {highlights.map((item) => (
            <article key={item.title} className="panel">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <a href="/features" className="panel-link">
                Learn more &rarr;
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          4. MODULE CATEGORIES — Tab-Based (White)
      ════════════════════════════════════════════════════ */}
      <section className="modules-section" id="modules">
        <div className="section-header centered">
          <h2>11 modules. One platform.</h2>
          <p className="section-subtitle">
            Every tool your school needs — student management, finance,
            operations — working together seamlessly.
          </p>
        </div>

        <div className="module-tabs">
          {moduleCategories.map((cat) => (
            <button
              key={cat.key}
              className={`module-tab ${activeTab === cat.key ? "active" : ""}`}
              onClick={() => setActiveTab(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="module-tab-content">
          <div className="module-tab-text">
            <h3>{activeCategory.label}</h3>
            <p>{activeCategory.description}</p>
            <a className="btn btn-primary" href="/auth/signup">
              Try It Free
            </a>
          </div>
          <div className="module-tab-apps">
            {activeCategory.apps.map((app) => (
              <div key={app.name} className="module-app-card">
                <h4>{app.name}</h4>
                <p>{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          5. CONCIERGE — Dark Green Banner
      ════════════════════════════════════════════════════ */}
      <section className="concierge-section" id="concierge">
        <div className="concierge-content">
          <span className="concierge-label">EduMyles Concierge</span>
          <h2>Speak to a school-tech expert — free.</h2>
          <p>
            Get a personalized walkthrough of EduMyles tailored to your
            school&apos;s structure, curriculum, and workflows. Not a sales call —
            a genuine consultation.
          </p>
          <a className="btn btn-amber" href="/concierge">
            Book Free Consultation
          </a>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          6. SUCCESS STORIES — White
      ════════════════════════════════════════════════════ */}
      <section className="stories-section" id="stories">
        <div className="section-header centered">
          <h2>Schools thriving with EduMyles</h2>
          <p className="section-subtitle">
            See how institutions across East Africa are transforming their operations.
          </p>
        </div>
        <div className="stories-grid">
          {successStories.map((story) => (
            <div key={story.school} className="story-card">
              <div className="story-metric">
                <span className="story-metric-value">{story.metric}</span>
                <span className="story-metric-label">{story.metricLabel}</span>
              </div>
              <blockquote className="story-quote">
                &ldquo;{story.quote}&rdquo;
              </blockquote>
              <div className="story-author">
                <div className="story-avatar">
                  {story.person.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="story-name">{story.person}</div>
                  <div className="story-role">
                    {story.role}, {story.school}
                  </div>
                  <div className="story-location">{story.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          7. PRICING PREVIEW — Forest Green
      ════════════════════════════════════════════════════ */}
      <section className="pricing-section" id="pricing">
        <div className="section-header centered">
          <h2>Simple, transparent pricing</h2>
          <p className="section-subtitle light">
            Start free. Scale as you grow. Every plan includes onboarding support.
          </p>
        </div>
        <div className="pricing-grid">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`pricing-card ${tier.highlight ? "featured" : ""}`}
            >
              {tier.highlight && <span className="pricing-badge">Most Popular</span>}
              <h3>{tier.name}</h3>
              <div className="pricing-price">
                <span className="price-amount">{tier.price}</span>
                {tier.period && <span className="price-period">{tier.period}</span>}
              </div>
              <p className="pricing-desc">{tier.description}</p>
              <ul className="pricing-modules">
                {tier.modules.map((m) => (
                  <li key={m}>
                    <span className="check-icon">&#10003;</span> {m}
                  </li>
                ))}
              </ul>
              <a
                className={`btn ${tier.highlight ? "btn-primary" : "btn-outline"}`}
                href={tier.name === "Enterprise" ? "mailto:hello@edumyles.com?subject=Enterprise%20Inquiry" : "/auth/signup"}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
        <div className="pricing-links">
          <a href="/pricing">View Plan Details</a>
          <span className="divider">|</span>
          <a href="/pricing#faq">Pricing FAQs</a>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          8. FINAL CTA — Amber
      ════════════════════════════════════════════════════ */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Choose EduMyles. Transform your school.</h2>
          <p>
            Join 50+ schools across East Africa already running smarter with
            one unified platform.
          </p>
          <a className="btn btn-primary" href="/auth/signup">
            Activate Free Trial
          </a>
        </div>
      </section>
    </>
  );
}
