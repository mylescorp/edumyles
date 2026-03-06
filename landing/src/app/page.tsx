"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Frontend app URL for authentication
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "https://edumyles.vercel.app";

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
      "Streamline fee collection, invoicing, and financial reporting with support for local payment methods and automated reminders.",
    apps: [
      { name: "Fee Management", desc: "Tuition, billing, payment plans" },
      { name: "M-Pesa Integration", desc: "Mobile money payments" },
      { name: "Financial Reports", desc: "Revenue, expenses, analytics" },
      { name: "Payment Reminders", desc: "Automated notifications" },
    ],
  },
  {
    key: "operations",
    label: "Operations & HR",
    description:
      "Manage staff, payroll, inventory, and facilities with comprehensive tools for school administration and resource management.",
    apps: [
      { name: "HR Management", desc: "Staff records, payroll, attendance" },
      { name: "Inventory", desc: "Assets, supplies, tracking" },
      { name: "Facilities", desc: "Classroom scheduling, maintenance" },
      { name: "Transport", desc: "Bus routes, fleet management" },
    ],
  },
];

const trustedSchools = [
  "Nairobi Academy",
  "Kampala International",
  "Dar es Salaam School",
  "Addis Ababa Academy",
  "Kigali Heights School",
  "Mombasa Scholars",
  "Entebbe Prep",
  "Arusha International",
  "Bujumbura School",
  "Dar Prep",
  "Kigali Heights School",
  "Addis Scholars",
  "Accra Montessori",
];

function LandingPageContent() {
  const [activeTab, setActiveTab] = useState("student");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const searchParams = useSearchParams();

  const activeCategory = moduleCategories.find((c) => c.key === activeTab)!;

  // Handle auth errors and success from URL parameters
  useEffect(() => {
    const error = searchParams.get("auth_error");
    const success = searchParams.get("auth_success");
    
    if (error) {
      const decoded = decodeURIComponent(error);
      const safeError = decoded.replace(/[<>]/g, "");
      setAuthError(safeError);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("auth_error");
      window.history.replaceState({}, "", newUrl.toString());
    }
    
    if (success === "true") {
      setAuthSuccess("Authentication successful! You are now logged in.");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("auth_success");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  return (
    <>
      {/* ════════════════════════════════════════════════════
          1. HERO SECTION — White Background
      ════════════════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">EduMyles</p>
          <h1>Transforming schools, one mile at a time.</h1>

          {/* Auth Error Display */}
          {authError && (
            <div className="auth-error-banner" style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#dc2626'
            }}>
              <strong>Authentication Error:</strong> {authError}
            </div>
          )}

          {/* Auth Success Display */}
          {authSuccess && (
            <div className="auth-success-banner" style={{
              backgroundColor: '#dcfce7',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#166534'
            }}>
              <strong>Success:</strong> {authSuccess}
            </div>
          )}

          <p className="subtext">
            EduMyles is the operating system for schools across Africa — intuitive, affordable technology
            that simplifies administration, enhances learning outcomes, and connects every stakeholder in
            the education journey.
          </p>
          {/* Deployment trigger: 2026-03-04-12:02 */}
          <div className="actions">
            <a className="btn btn-primary" href={`${FRONTEND_URL}/auth/login`}>
              Get Started
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
                  <div className="mockup-table-row" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          2. STATS — Dark Green Section
      ════════════════════════════════════════════════════ */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          3. HIGHLIGHTS — Amber/Yellow Zone
      ════════════════════════════════════════════════════ */}
      <section className="highlights-zone">
        <div className="section-header centered">
          <h2>Why schools choose EduMyles</h2>
          <p className="section-subtitle">
            Built specifically for East African schools with local payment methods,
            curricula support, and multi-language capabilities.
          </p>
        </div>
        <div className="highlights">
          {highlights.map((highlight, index) => (
            <div key={index} className="highlight-card">
              <h3>{highlight.title}</h3>
              <p>{highlight.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          4. MODULES — Interactive Tabs
      ════════════════════════════════════════════════════ */}
      <section className="modules-section">
        <div className="section-header centered">
          <h2>11 modules. One platform.</h2>
          <p className="section-subtitle">
            Everything you need to run your school efficiently — from admissions to alumni.
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
            <a className="btn btn-primary" href={`${FRONTEND_URL}/auth/login`}>
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
          {[
            {
              name: "Nairobi Academy",
              location: "Kenya",
              result: "40% faster enrollment",
              quote: "EduMyles transformed our admissions process from weeks to days.",
            },
            {
              name: "Kampala International",
              location: "Uganda",
              result: "25% fee collection improvement",
              quote: "Mobile money integration has been a game-changer for parents.",
            },
            {
              name: "Dar es Salaam School",
              location: "Tanzania",
              result: "50% reduction in admin work",
              quote: "Everything we need is in one place. It's been revolutionary.",
            },
          ].map((story, index) => (
            <div key={index} className="story-card">
              <h3>{story.name}</h3>
              <p className="story-location">{story.location}</p>
              <div className="story-result">{story.result}</div>
              <p className="story-quote">"{story.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          7b. BRAND FRAMEWORK — White
      ════════════════════════════════════════════════════ */}
      <section className="brand-section">
        <div className="section-header centered">
          <h2>EduMyles — Brand Identity & Foundation</h2>
          <p className="section-subtitle">
            Built on a clear mission, bold vision, and the M.Y.L.E.S. principle — our core values framework.
          </p>
        </div>

        <div className="brand-grid">
          <div className="brand-column">
            <h3>Mission</h3>
            <p>
              To empower schools across Africa with intuitive, affordable technology that simplifies
              administration, enhances learning outcomes, and connects every stakeholder in the education
              journey — transforming schools, one mile at a time.
            </p>

            <h3>Vision</h3>
            <p>
              A world where every school, regardless of size or location, has access to world-class
              technology to deliver transformative education.
            </p>
          </div>

          <div className="brand-column">
            <h3>The M.Y.L.E.S. Principle</h3>
            <ul className="brand-values-list">
              <li>
                <strong>M — Mastery:</strong> Pursue excellence relentlessly in how we build, ship, and serve.
              </li>
              <li>
                <strong>Y — Youth Empowerment:</strong> Design every decision to unlock the potential of Africa&apos;s young people.
              </li>
              <li>
                <strong>L — Leadership:</strong> Lead with integrity, courage, and accountability to every stakeholder.
              </li>
              <li>
                <strong>E — Entrepreneurship:</strong> Think like founders — innovate boldly, own outcomes fully.
              </li>
              <li>
                <strong>S — Service:</strong> Serve schools, students, and communities with purpose, humility, and heart.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          8. PRICING — Amber
      ════════════════════════════════════════════════════ */}
      <section className="pricing-section" id="pricing">
        <div className="section-header centered">
          <h2>Simple, transparent pricing</h2>
          <p className="section-subtitle">
            No hidden fees. Pay per student per month. Cancel anytime.
          </p>
        </div>
        <div className="pricing-grid">
          {[
            {
              name: "Starter",
              price: "Free",
              description: "Perfect for small schools getting started",
              features: [
                "Up to 100 students",
                "Basic student management",
                "Simple fee tracking",
                "Email support",
              ],
            },
            {
              name: "Standard",
              price: "8",
              description: "For growing schools needing more features",
              features: [
                "Up to 500 students",
                "Advanced academics",
                "Mobile money integration",
                "Priority support",
              ],
            },
            {
              name: "Pro",
              price: "15",
              description: "Comprehensive solution for established schools",
              features: [
                "Unlimited students",
                "All modules included",
                "Advanced reporting",
                "Dedicated support",
              ],
            },
          ].map((plan, index) => (
            <div key={index} className="pricing-card">
              <h3>{plan.name}</h3>
              <div className="price">
                {plan.price === "Free" ? (
                  <span className="amount">Free</span>
                ) : (
                  <>
                    <span className="currency">$</span>
                    <span className="amount">{plan.price}</span>
                  </>
                )}
                <span className="period">/student/month</span>
              </div>
              <p>{plan.description}</p>
              <ul className="features">
                {plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <a className="btn btn-primary" href={`${FRONTEND_URL}/auth/login`}>
                Get Started
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
          <a className="btn btn-primary" href={`${FRONTEND_URL}/auth/login`}>
            Activate Free Trial
          </a>
        </div>
      </section>
    </>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingPageContent />
    </Suspense>
  );
}
