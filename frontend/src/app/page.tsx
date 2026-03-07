"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
      "Handle enrollment, class allocation, academics, report cards, and parent communication - one connected flow from day one.",
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
      "Manage the entire student lifecycle - from admissions and enrollment through academics, assessments, and alumni tracking. Every record in one place.",
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
] as const;

function LandingPageContent() {
  const [activeTab, setActiveTab] = useState<(typeof moduleCategories)[number]["key"]>("student");
  const [authError, setAuthError] = useState("");
  const searchParams = useSearchParams();

  const activeCategory = moduleCategories.find((c) => c.key === activeTab) ?? moduleCategories[0];

  useEffect(() => {
    const error = searchParams.get("auth_error");
    if (!error) return;

    const decoded = decodeURIComponent(error);
    const safeError = decoded.replace(/[<>]/g, "");
    setAuthError(safeError);

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("auth_error");
    window.history.replaceState({}, "", newUrl.toString());
  }, [searchParams]);

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">EduMyles</p>
          <h1>Transforming schools, one mile at a time.</h1>

          {authError && (
            <div className="auth-error-banner" role="alert" aria-live="polite">
              <strong>Authentication Error:</strong> {authError}
            </div>
          )}

          <p className="subtext">
            EduMyles is the operating system for schools across Africa - intuitive, affordable technology
            that simplifies administration, enhances learning outcomes, and connects every stakeholder in
            the education journey.
          </p>
          <div className="actions">
            <Link className="btn btn-primary" href="/auth/login">
              Get Started
            </Link>
            <Link className="btn btn-secondary" href="/#concierge">
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

      <section className="social-proof-section">
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="highlights-zone">
        <div className="section-header centered">
          <h2>Why schools choose EduMyles</h2>
          <p className="section-subtitle">
            Built specifically for East African schools with local payment methods, curricula support, and
            multi-language capabilities.
          </p>
        </div>
        <div className="highlights">
          {highlights.map((highlight) => (
            <div key={highlight.title} className="panel">
              <h3>{highlight.title}</h3>
              <p>{highlight.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="modules-section">
        <div className="section-header centered">
          <h2>11 modules. One platform.</h2>
          <p className="section-subtitle">
            Everything you need to run your school efficiently - from admissions to alumni.
          </p>
        </div>

        <div className="module-tabs" role="tablist" aria-label="Module categories">
          {moduleCategories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              role="tab"
              className={`module-tab ${activeTab === cat.key ? "active" : ""}`}
              aria-selected={activeTab === cat.key}
              aria-controls={`module-panel-${cat.key}`}
              onClick={() => setActiveTab(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="module-tab-content" role="tabpanel" id={`module-panel-${activeCategory.key}`}>
          <div className="module-tab-text">
            <h3>{activeCategory.label}</h3>
            <p>{activeCategory.description}</p>
            <Link className="btn btn-primary" href="/auth/login">
              Try It Free
            </Link>
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

      <section className="concierge-section" id="concierge">
        <div className="concierge-content">
          <span className="concierge-label">EduMyles Concierge</span>
          <h2>Speak to a school-tech expert - free.</h2>
          <p>
            Get a personalized walkthrough of EduMyles tailored to your school&apos;s structure,
            curriculum, and workflows. Not a sales call - a genuine consultation.
          </p>
          <Link className="btn btn-amber" href="/#concierge">
            Book Free Consultation
          </Link>
        </div>
      </section>

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
          ].map((story) => (
            <div key={story.name} className="story-card">
              <h3>{story.name}</h3>
              <p className="story-location">{story.location}</p>
              <div className="story-result">{story.result}</div>
              <p className="story-quote">&quot;{story.quote}&quot;</p>
            </div>
          ))}
        </div>
      </section>

      <section className="brand-section" id="brand">
        <div className="section-header centered">
          <h2>EduMyles - Brand Identity &amp; Foundation</h2>
          <p className="section-subtitle">
            Built on a clear mission, bold vision, and the M.Y.L.E.S. principle - our core values framework.
          </p>
        </div>

        <div className="brand-grid">
          <div className="brand-column">
            <h3>Mission</h3>
            <p>
              To empower schools across Africa with intuitive, affordable technology that simplifies
              administration, enhances learning outcomes, and connects every stakeholder in the education
              journey - transforming schools, one mile at a time.
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
                <strong>M - Mastery:</strong> Pursue excellence relentlessly in how we build, ship, and serve.
              </li>
              <li>
                <strong>Y - Youth Empowerment:</strong> Design every decision to unlock the potential of
                Africa&apos;s young people.
              </li>
              <li>
                <strong>L - Leadership:</strong> Lead with integrity, courage, and accountability to every
                stakeholder.
              </li>
              <li>
                <strong>E - Entrepreneurship:</strong> Think like founders - innovate boldly, own outcomes
                fully.
              </li>
              <li>
                <strong>S - Service:</strong> Serve schools, students, and communities with purpose, humility,
                and heart.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-header centered">
          <h2>Simple, transparent pricing</h2>
          <p className="section-subtitle">No hidden fees. Pay per student per month. Cancel anytime.</p>
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
          ].map((plan) => (
            <div key={plan.name} className="pricing-card">
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
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link className="btn btn-primary" href="/auth/login">
                Get Started
              </Link>
            </div>
          ))}
        </div>

        <div className="pricing-links">
          <Link href="/#pricing">View Plan Details</Link>
          <span className="divider">|</span>
          <Link href="/#pricing">Pricing FAQs</Link>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Choose EduMyles. Transform your school.</h2>
          <p>Join 50+ schools across East Africa already running smarter with one unified platform.</p>
          <Link className="btn btn-primary" href="/auth/login">
            Activate Free Trial
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="loading-state">Loading...</div>}>
      <LandingPageContent />
    </Suspense>
  );
}
