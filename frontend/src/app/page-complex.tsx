"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, lazy } from "react";
import dynamic from "next/dynamic";

// Lazy load heavy components
const HeroSection = dynamic(() => import("@/components/landing/HeroSection"), {
  loading: () => <div className="loading-state">Loading hero...</div>,
  ssr: false
});

const HighlightsSection = dynamic(() => import("@/components/landing/HighlightsSection"), {
  loading: () => <div className="loading-state">Loading highlights...</div>,
  ssr: false
});

const ModulesSection = dynamic(() => import("@/components/landing/ModulesSection"), {
  loading: () => <div className="loading-state">Loading modules...</div>,
  ssr: false
});

const integrations = [
  { name: "M-Pesa", category: "Payments" },
  { name: "Airtel Money", category: "Payments" },
  { name: "Stripe", category: "Payments" },
  { name: "WorkOS", category: "Auth" },
  { name: "Resend", category: "Email" },
  { name: "Africa's Talking", category: "SMS" },
  { name: "Convex", category: "Database" },
  { name: "Vercel", category: "Hosting" },
];

function LandingPageContent() {
  const [authError, setAuthError] = useState("");
  const searchParams = useSearchParams();

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
      {authError && (
        <div className="auth-error-banner" role="alert" aria-live="polite">
          <strong>Authentication Error:</strong> {authError}
        </div>
      )}
      
      <Suspense fallback={<div className="loading-state">Loading hero section...</div>}>
        <HeroSection />
      </Suspense>

      <Suspense fallback={<div className="loading-state">Loading highlights...</div>}>
        <HighlightsSection />
      </Suspense>

      <Suspense fallback={<div className="loading-state">Loading modules...</div>}>
        <ModulesSection />
      </Suspense>

      {/* ── Integrations ── */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Integrations that just work</h2>
            <p className="section-subtitle">
              Connect with the tools schools already use across Africa. Payment gateways, messaging
              services, and infrastructure - all pre-built and ready.
            </p>
          </div>
          <div className="integrations-grid">
            {integrations.map((item) => (
              <div key={item.name} className="integration-card">
                <span className="integration-name">{item.name}</span>
                <span className="integration-category">{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Concierge CTA ── */}
      <section className="concierge-section" id="concierge">
        <div className="concierge-content">
          <span className="concierge-label">EduMyles Concierge</span>
          <h2>Speak to a school-tech expert - free.</h2>
          <p>
            Get a personalized walkthrough of EduMyles tailored to your school&apos;s structure,
            curriculum, and workflows. Not a sales pitch - a genuine consultation to see if
            EduMyles is right for you.
          </p>
          <Link className="btn btn-amber" href="/concierge">
            Book Free Consultation
          </Link>
        </div>
      </section>

      {/* ── Success Stories ── */}
      <section className="stories-section" id="stories">
        <div className="section-header centered">
          <h2>Schools thriving with EduMyles</h2>
          <p className="section-subtitle">
            See how institutions across East Africa are transforming their operations with real,
            measurable results.
          </p>
        </div>

        <div className="stories-grid">
          {[
            {
              name: "Nairobi Academy",
              location: "Nairobi, Kenya",
              result: "40% faster enrollment",
              quote:
                "EduMyles transformed our admissions process from weeks to days. Parents can now apply online and track their application status in real time.",
              person: "Mary Wanjiku, Principal",
            },
            {
              name: "Kampala International",
              location: "Kampala, Uganda",
              result: "25% fee collection improvement",
              quote:
                "Mobile money integration has been a game-changer. Parents pay fees from their phones and we see it instantly. No more chasing receipts.",
              person: "David Okello, Bursar",
            },
            {
              name: "Dar Premium School",
              location: "Dar es Salaam, Tanzania",
              result: "50% reduction in admin work",
              quote:
                "Everything we need is in one place - from timetables to report cards. Staff spend more time on teaching and less on paperwork.",
              person: "Amina Hassan, Director",
            },
          ].map((story) => (
            <div key={story.name} className="story-card">
              <div className="story-metric">
                <span className="story-metric-value">{story.result.split(" ")[0]}</span>
                <span className="story-metric-label">{story.result.split(" ").slice(1).join(" ")}</span>
              </div>
              <p className="story-quote">&ldquo;{story.quote}&rdquo;</p>
              <div className="story-author">
                <div className="story-avatar">{story.person[0]}</div>
                <div>
                  <div className="story-name">{story.person}</div>
                  <div className="story-role">{story.name}</div>
                  <div className="story-location">{story.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Get started in 3 steps</h2>
            <p className="section-subtitle">
              From sign-up to fully operational in under a week. Our team guides you every step of the way.
            </p>
          </div>
          <div className="highlights">
            <div className="panel">
              <h3>1. Sign Up &amp; Configure</h3>
              <p>
                Create your school account, import student data, and configure your modules. Our
                onboarding wizard guides you through every setting.
              </p>
            </div>
            <div className="panel">
              <h3>2. Invite Your Team</h3>
              <p>
                Add staff with role-based access. Teachers, bursars, HR managers - everyone gets
                exactly the tools and permissions they need.
              </p>
            </div>
            <div className="panel">
              <h3>3. Go Live</h3>
              <p>
                Start managing your school from one dashboard. Parents and students access their
                portals, payments flow automatically, and reports generate in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand & Values ── */}
      <section className="brand-section" id="brand">
        <div className="section-header centered">
          <h2>The M.Y.L.E.S. Principle</h2>
          <p className="section-subtitle">
            Our core values framework that drives every decision we make - from product design to
            customer support.
          </p>
        </div>

        <div className="brand-grid">
          <div className="brand-column">
            <h3>Our Mission</h3>
            <p>
              To empower schools across Africa with intuitive, affordable technology that simplifies
              administration, enhances learning outcomes, and connects every stakeholder in the
              education journey - transforming schools, one mile at a time.
            </p>

            <h3>Our Vision</h3>
            <p>
              A world where every school, regardless of size or location, has access to world-class
              technology to deliver transformative education. We believe technology should be an
              enabler, not a barrier.
            </p>
          </div>

          <div className="brand-column">
            <h3>Our Values</h3>
            <ul className="brand-values-list">
              <li>
                <strong>M - Mastery:</strong> Pursue excellence relentlessly in how we build, ship,
                and serve.
              </li>
              <li>
                <strong>Y - Youth Empowerment:</strong> Design every decision to unlock the potential
                of Africa&apos;s young people.
              </li>
              <li>
                <strong>L - Leadership:</strong> Lead with integrity, courage, and accountability to
                every stakeholder.
              </li>
              <li>
                <strong>E - Entrepreneurship:</strong> Think like founders - innovate boldly, own
                outcomes fully.
              </li>
              <li>
                <strong>S - Service:</strong> Serve schools, students, and communities with purpose,
                humility, and heart.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="pricing-section" id="pricing">
        <div className="section-header centered">
          <h2>Simple, transparent pricing</h2>
          <p className="section-subtitle light">
            No hidden fees. Pay per student per month. Cancel anytime. Start free for 30 days.
          </p>
        </div>

        <div className="pricing-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            {
              name: "Starter",
              price: "Free",
              description: "Perfect for small schools getting started with digital management",
              features: [
                "Up to 100 students",
                "Student information system",
                "Basic fee tracking",
                "Email support",
                "1 admin user",
              ],
              featured: false,
            },
            {
              name: "Standard",
              price: "8",
              description: "For growing schools needing advanced modules and integrations",
              features: [
                "Up to 500 students",
                "All 11 modules included",
                "M-Pesa & Airtel Money",
                "Priority support & training",
                "Unlimited admin users",
              ],
              featured: true,
            },
            {
              name: "Pro",
              price: "15",
              description: "Comprehensive solution for established and multi-campus schools",
              features: [
                "Unlimited students",
                "Multi-campus support",
                "Advanced analytics & reports",
                "Dedicated account manager",
                "Custom integrations & API access",
              ],
              featured: false,
            },
          ].map((plan) => (
            <div key={plan.name} className={`pricing-card ${plan.featured ? "featured" : ""}`}>
              {plan.featured && <span className="pricing-badge">Most Popular</span>}
              <h3>{plan.name}</h3>
              <div className="pricing-price">
                {plan.price === "Free" ? (
                  <span className="price-amount">Free</span>
                ) : (
                  <>
                    <span className="price-amount">${plan.price}</span>
                    <span className="price-period">/student/month</span>
                  </>
                )}
              </div>
              <p className="pricing-desc">{plan.description}</p>
              <ul className="pricing-modules">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="check-icon">&#10003;</span> {feature}
                  </li>
                ))}
              </ul>
              <Link className="btn btn-primary" href="/auth/signup">
                {plan.price === "Free" ? "Start Free" : "Start Free Trial"}
              </Link>
            </div>
          ))}
        </div>

        <div className="pricing-links">
          <Link href="/pricing">View Full Plan Details</Link>
          <span className="divider">|</span>
          <Link href="/contact">Talk to Sales</Link>
        </div>
      </section>

      {/* ── FAQ Preview ── */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Frequently asked questions</h2>
          </div>
          <div className="faq-grid">
            {[
              {
                q: "How long does it take to set up?",
                a: "Most schools are fully operational within 3-5 days. Our onboarding team guides you through data import, module configuration, and staff training.",
              },
              {
                q: "Can I import existing student data?",
                a: "Yes. EduMyles supports CSV/Excel imports for students, staff, fees, and grades. We also offer assisted migration for larger institutions.",
              },
              {
                q: "Which payment methods are supported?",
                a: "We support M-Pesa (Safaricom), Airtel Money, MTN MoMo, bank transfers, and card payments via Stripe. More providers are added regularly.",
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We use encrypted storage, role-based access controls, full audit trails, and strict tenant isolation for multi-school deployments.",
              },
              {
                q: "Do you support the CBC curriculum?",
                a: "Yes. EduMyles supports both CBC (Competency-Based Curriculum) and 8-4-4 systems, with flexible grading scales that can be configured per school.",
              },
              {
                q: "Can parents access the system?",
                a: "Yes. Parents get a dedicated portal to view grades, attendance, fee balances, make payments, and communicate with teachers.",
              },
            ].map((faq) => (
              <div key={faq.q} className="faq-item">
                <h4>{faq.q}</h4>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Choose EduMyles. Transform your school.</h2>
          <p>
            Join 50+ schools across East Africa already running smarter with one unified platform.
            Start your free 30-day trial today - no credit card required.
          </p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <Link className="btn btn-primary" href="/auth/signup">
              Activate Free Trial
            </Link>
            <Link className="btn btn-outline" href="/concierge">
              Talk to an Expert
            </Link>
          </div>
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
