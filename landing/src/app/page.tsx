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

const footerQuickLinks = [
  { label: "Getting Started", href: "#" },
  { label: "Product Videos", href: "#" },
  { label: "Integrations Guide", href: "#" },
  { label: "Webinars", href: "#" },
  { label: "Pricing FAQs", href: "#pricing" },
  { label: "Module FAQs", href: "#modules" },
  { label: "Terms of Service", href: "#" },
  { label: "EduMyles for Startups", href: "#" },
];

const footerExplore = [
  { label: "School Management Software", href: "#" },
  { label: "Why EduMyles?", href: "#" },
  { label: "EduMyles for Small Schools", href: "#" },
  { label: "Concierge", href: "#concierge" },
  { label: "Support Plans", href: "#" },
  { label: "Press", href: "#" },
  { label: "Newsletter", href: "#" },
];

const footerPartner = [
  { label: "Partner Program", href: "#" },
  { label: "Find a Partner", href: "#" },
  { label: "Become a Partner", href: "#" },
];

const legalLinks = [
  "Contact Us",
  "Security",
  "Compliance",
  "Terms of Service",
  "Privacy Policy",
  "Cookie Policy",
  "Abuse Policy",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeCategory = moduleCategories.find((c) => c.key === activeTab)!;

  return (
    <>
      {/* ── Announcement Bar ── */}
      <div className="announcement-bar">
        Introducing EduMyles — the operating system for schools in East Africa
        <span className="badge">NEW</span>
      </div>

      {/* ── Navbar ── */}
      <nav className="navbar">
        <a href="/" className="navbar-logo">
          EduMyles
        </a>

        <ul className="navbar-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#modules">Modules</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#stories">Success Stories</a></li>
          <li><a href="#concierge">Concierge</a></li>
        </ul>

        <div className="navbar-actions">
          <a className="navbar-cta" href="/auth/login">
            Get Started
          </a>
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${mobileMenuOpen ? "open" : ""}`} />
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#modules" onClick={() => setMobileMenuOpen(false)}>Modules</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <a href="#stories" onClick={() => setMobileMenuOpen(false)}>Success Stories</a>
          <a href="#concierge" onClick={() => setMobileMenuOpen(false)}>Concierge</a>
          <a href="/auth/login" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
            Get Started
          </a>
        </div>
      )}

      <main>
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
              <a className="btn btn-primary" href="/auth/login">
                Activate Free Trial
              </a>
              <a className="btn btn-secondary" href="#concierge">
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
                <a href="#modules" className="panel-link">
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
              <a className="btn btn-primary" href="/auth/login">
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
            <a className="btn btn-amber" href="mailto:hello@edumyles.com?subject=Concierge%20Request">
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
                  href={tier.name === "Enterprise" ? "mailto:hello@edumyles.com?subject=Enterprise%20Inquiry" : "/auth/login"}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
          <div className="pricing-links">
            <a href="#pricing">View Plan Details</a>
            <span className="divider">|</span>
            <a href="#pricing">Pricing FAQs</a>
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
            <a className="btn btn-primary" href="/auth/login">
              Activate Free Trial
            </a>
          </div>
        </section>
      </main>

      {/* ════════════════════════════════════════════════════
          FOOTER — Dark Charcoal
      ════════════════════════════════════════════════════ */}
      <footer className="footer">
        <div className="footer-main">
          {/* Promo Cards */}
          <div className="footer-promo">
            <div className="promo-card">
              <h4>Workshops</h4>
              <p>Live training events to help your team get the most out of EduMyles.</p>
              <a href="#" className="btn btn-sm btn-amber">
                Learn More
              </a>
            </div>
            <div className="promo-card">
              <h4>Live Webinars</h4>
              <p>Join upcoming sessions to see new features and best practices in action.</p>
              <a href="#" className="btn btn-sm btn-amber">
                Save Your Seat
              </a>
            </div>
          </div>

          {/* Link Columns */}
          <div className="footer-columns">
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                {footerQuickLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Explore EduMyles</h4>
              <ul>
                {footerExplore.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Partner Zone</h4>
              <ul>
                {footerPartner.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact & Social */}
        <div className="footer-contact">
          <a href="mailto:hello@edumyles.com" className="footer-email">
            hello@edumyles.com
          </a>
          <div className="footer-social">
            <a href="#" aria-label="Twitter / X" target="_blank" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="#" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
            <a href="#" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
            <a href="#" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" /></svg>
            </a>
          </div>
        </div>

        {/* Legal */}
        <div className="footer-legal">
          <div className="legal-links">
            {legalLinks.map((link, i) => (
              <span key={link}>
                <a href="#">{link}</a>
                {i < legalLinks.length - 1 && <span className="legal-divider">|</span>}
              </span>
            ))}
          </div>
          <p className="copyright">
            &copy; {new Date().getFullYear()} EduMyles. Built for East Africa.
          </p>
        </div>
      </footer>
    </>
  );
}
