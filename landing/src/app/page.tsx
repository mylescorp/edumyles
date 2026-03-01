"use client";

import { useState } from "react";
import Link from "next/link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/* ── Data ─────────────────────────────────────────────────── */

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
    key: "hr",
    label: "HR & Staffing",
    description:
      "Manage staff records, attendance, leave, payroll, and performance reviews. Automate salary calculations with tax and statutory deductions.",
    apps: [
      { name: "HR & Payroll", desc: "Staff records, attendance, payroll" },
      { name: "Leave Management", desc: "Leave requests, approvals, balances" },
      { name: "Staff Directory", desc: "Profiles, qualifications, contacts" },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    description:
      "Schedule timetables, manage transport routes, organise library resources — all from one dashboard.",
    apps: [
      { name: "Timetable & Scheduling", desc: "Scheduling, substitutions, room bookings" },
      { name: "Transport", desc: "Routes, vehicles, student tracking" },
      { name: "Library", desc: "Book catalog, borrowing, fines" },
    ],
  },
  {
    key: "communication",
    label: "Communication",
    description:
      "Keep parents, teachers, and staff in the loop with SMS, email, and in-app notifications. Broadcast announcements and share reports instantly.",
    apps: [
      { name: "SMS & Email", desc: "Bulk messaging via Africa\u2019s Talking" },
      { name: "In-App Messaging", desc: "Real-time chat & notifications" },
      { name: "Announcements", desc: "School-wide broadcasts & alerts" },
    ],
  },
  {
    key: "ecommerce",
    label: "eCommerce",
    description:
      "Let parents purchase uniforms, books, and school supplies online. Manage inventory and process payments through the integrated school shop.",
    apps: [
      { name: "School Shop", desc: "Online store for school supplies" },
      { name: "eWallet", desc: "Cashless payments for students" },
      { name: "Inventory", desc: "Stock management & ordering" },
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

/* ── Component ────────────────────────────────────────────── */

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("student");
  const activeCategory = moduleCategories.find((c) => c.key === activeTab)!;

  return (
    <>
      {/* ═══ 1. HERO SECTION ═══ */}
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">The Operating System for Schools</p>
          <h1>Run your entire school from one platform.</h1>
          <p className="subtext">
            Replace disconnected spreadsheets, WhatsApp groups, and siloed tools
            with one unified platform for admissions, billing, academics, HR, and
            communication — built for East Africa.
          </p>
          <div className="actions">
            <a className="btn btn-primary" href={`${APP_URL}/auth/signup`}>
              Sign Up Free
            </a>
            <Link className="btn btn-secondary" href="/concierge">
              Contact Sales
            </Link>
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

      {/* ═══ 2. PRODUCT SHOWCASE — Yellow Section ═══ */}
      <section className="showcase-section">
        <div className="showcase-inner">
          <div className="section-header centered">
            <h2>See EduMyles in action</h2>
            <p className="section-subtitle dark">
              One dashboard for student records, fee collection, timetables, and communication — everything your school needs.
            </p>
          </div>
          <div className="showcase-mockup">
            <div className="showcase-browser">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span /><span /><span />
                </div>
                <span className="mockup-title">edumyles.com — School Dashboard</span>
              </div>
              <div className="showcase-body">
                <div className="showcase-sidebar">
                  {["Dashboard", "Students", "Finance", "Timetable", "Academics", "HR", "Library", "Transport", "Comms"].map((item, i) => (
                    <div key={item} className={`showcase-nav-item ${i === 0 ? "active" : ""}`}>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="showcase-content">
                  <div className="showcase-topbar">
                    <span className="showcase-greeting">Welcome back, Admin</span>
                    <div className="showcase-badges">
                      <span className="showcase-badge green">12 New Students</span>
                      <span className="showcase-badge amber">3 Fee Reminders</span>
                      <span className="showcase-badge red">1 Alert</span>
                    </div>
                  </div>
                  <div className="showcase-cards">
                    <div className="showcase-card">
                      <div className="showcase-card-value">1,247</div>
                      <div className="showcase-card-label">Total Students</div>
                    </div>
                    <div className="showcase-card">
                      <div className="showcase-card-value">KES 2.4M</div>
                      <div className="showcase-card-label">Fees Collected</div>
                    </div>
                    <div className="showcase-card">
                      <div className="showcase-card-value">96%</div>
                      <div className="showcase-card-label">Attendance Today</div>
                    </div>
                    <div className="showcase-card">
                      <div className="showcase-card-value">42</div>
                      <div className="showcase-card-label">Active Staff</div>
                    </div>
                  </div>
                  <div className="showcase-chart-area">
                    <div className="showcase-chart-block" />
                    <div className="showcase-list-block">
                      <div className="showcase-list-row" />
                      <div className="showcase-list-row" />
                      <div className="showcase-list-row" />
                      <div className="showcase-list-row" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. SOCIAL PROOF / STATS ═══ */}
      <section className="social-proof-section" id="social-proof">
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

        <div className="stats-grid">
          {stats.map((item) => (
            <div key={item.label} className="stat-item">
              <div className="stat-value">{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="trusted-by">
          <p className="trusted-label">Trusted by schools across East Africa</p>
          <div className="trusted-logos">
            {trustedSchools.map((school) => (
              <span key={school} className="school-logo">{school}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 4. HIGHLIGHTS — Amber/Yellow ═══ */}
      <section className="highlights-zone" id="highlights">
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
              <Link href="/features" className="panel-link">
                Learn more &rarr;
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ═══ 5. MODULE CATEGORIES — Tab-Based ═══ */}
      <section className="modules-section" id="modules">
        <div className="section-header centered">
          <h2>11 modules. One platform.</h2>
          <p className="section-subtitle">
            Every tool your school needs — student management, finance, HR,
            operations, communication, and eCommerce — working together seamlessly.
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
            <a className="btn btn-primary" href={`${APP_URL}/auth/signup`}>
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

      {/* ═══ 6. CONCIERGE — Dark Green ═══ */}
      <section className="concierge-section" id="concierge">
        <div className="concierge-content">
          <span className="concierge-label">EduMyles Concierge</span>
          <h2>Speak to a school-tech expert — free.</h2>
          <p>
            Get a personalized walkthrough of EduMyles tailored to your
            school&apos;s structure, curriculum, and workflows. Not a sales call —
            a genuine consultation.
          </p>
          <Link className="btn btn-amber" href="/concierge">
            Book Free Consultation
          </Link>
        </div>
      </section>

      {/* ═══ 7. SUCCESS STORIES ═══ */}
      <section className="stories-section" id="stories">
        <div className="section-header centered">
          <h2>Schools thriving with EduMyles</h2>
          <p className="section-subtitle">
            See how institutions across East Africa are transforming their
            operations with 150% boost in productivity.
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
                  <div className="story-role">{story.role}, {story.school}</div>
                  <div className="story-location">{story.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 8. PRICING PREVIEW — Forest Green ═══ */}
      <section className="pricing-preview-section" id="pricing">
        <div className="pricing-preview-card">
          <div className="pricing-preview-content">
            <h2>Simple, transparent pricing</h2>
            <p>
              All 11 modules for one per-student/month fee, billed annually.
              Start free with our Starter plan, or upgrade to Standard, Pro, or
              Enterprise as your school grows.
            </p>
            <div className="pricing-preview-actions">
              <Link className="btn btn-amber" href="/pricing">
                View Plan Details
              </Link>
              <Link className="btn btn-outline-light" href="/pricing#faq">
                View Pricing FAQs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 9. FINAL CTA — Amber ═══ */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Choose EduMyles. Transform your school.</h2>
          <p>
            Join 50+ schools across East Africa already running smarter with one
            unified platform.
          </p>
          <a className="btn btn-primary" href={`${APP_URL}/auth/signup`}>
            Activate Free Trial
          </a>
        </div>
      </section>
    </>
  );
}
