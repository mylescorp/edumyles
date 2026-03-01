import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — EduMyles",
  description:
    "Simple, transparent pricing for schools of every size. Start free and scale as you grow.",
};

const tiers = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For small schools getting started with digital management.",
    modules: [
      "Student Information System",
      "Admissions",
      "Finance & Fees",
      "Communications",
      "Up to 100 students",
      "Email support",
    ],
    cta: "Get Started Free",
    ctaStyle: "btn-outline",
    highlight: false,
    href: "/contact",
  },
  {
    name: "Standard",
    price: "$3",
    period: "/student/month",
    description: "For growing schools that need scheduling and academics.",
    modules: [
      "Everything in Starter",
      "Timetable & Scheduling",
      "Academics & Gradebook",
      "Unlimited students",
      "Priority email support",
      "Onboarding assistance",
    ],
    cta: "Start Free Trial",
    ctaStyle: "btn-primary",
    highlight: true,
    href: "/contact",
  },
  {
    name: "Pro",
    price: "$5",
    period: "/student/month",
    description: "For established institutions needing full operations.",
    modules: [
      "Everything in Standard",
      "HR & Payroll",
      "Library Management",
      "Transport Management",
      "Phone & email support",
      "Dedicated account manager",
    ],
    cta: "Start Free Trial",
    ctaStyle: "btn-outline",
    highlight: false,
    href: "/contact",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For multi-campus networks and partners needing white-label.",
    modules: [
      "Everything in Pro",
      "eWallet",
      "School Shop",
      "White-label & API access",
      "Custom integrations",
      "Dedicated support & SLA",
    ],
    cta: "Contact Sales",
    ctaStyle: "btn-outline",
    highlight: false,
    href: "mailto:sales@edumyles.com?subject=Enterprise%20Inquiry",
  },
];

const faqs = [
  {
    q: "Is there really a free plan?",
    a: "Yes. The Starter plan is completely free for schools with up to 100 students. No credit card required, no time limit.",
  },
  {
    q: "How is pricing calculated?",
    a: "Pricing is per active student per month, billed annually. Only count students who are currently enrolled — alumni and inactive records don't count.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. Upgrade or downgrade at any time. When you upgrade, you get immediate access to the new modules. When you downgrade, changes take effect at your next billing cycle.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept M-Pesa, Airtel Money, Stripe (credit/debit cards), and direct bank transfers. We'll work with whatever's easiest for your school.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "Yes. Every paid plan comes with a free 30-day trial with full access to all features. No credit card required to start.",
  },
  {
    q: "What about the Enterprise white-label option?",
    a: "Our Enterprise plan includes full white-labeling capabilities for partners who want to offer EduMyles under their own brand. Contact our sales team for custom pricing and setup.",
  },
  {
    q: "Do you offer discounts for large schools?",
    a: "Yes. Schools with more than 500 students get volume discounts. Contact our sales team at sales@edumyles.com for a custom quote.",
  },
  {
    q: "What kind of support is included?",
    a: "All plans include email support. Standard adds priority support, Pro adds phone support, and Enterprise gets a dedicated support team with SLA guarantees.",
  },
];

const supportPlans = [
  {
    name: "Basic Support",
    description: "Included with all plans",
    features: ["Email support", "Knowledge base access", "Community forums", "Response within 48 hours"],
  },
  {
    name: "Priority Support",
    description: "Included with Standard and above",
    features: ["Priority email support", "Response within 24 hours", "Onboarding assistance", "Video call support"],
  },
  {
    name: "Premium Support",
    description: "Included with Pro and above",
    features: ["Phone & email support", "Response within 4 hours", "Dedicated account manager", "Quarterly reviews"],
  },
  {
    name: "Enterprise Support",
    description: "Custom SLA",
    features: ["24/7 support", "Response within 1 hour", "Dedicated support team", "On-site training available"],
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero green-hero">
        <div className="page-hero-inner">
          <p className="eyebrow light">Pricing</p>
          <h1 className="light-heading">Simple, transparent pricing</h1>
          <p className="subtext light">
            Start free. Scale as you grow. Every plan includes onboarding
            support and a 30-day free trial.
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="pricing-section">
        <div className="pricing-grid">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`pricing-card ${tier.highlight ? "featured" : ""}`}
            >
              {tier.highlight && (
                <span className="pricing-badge">Most Popular</span>
              )}
              <h3>{tier.name}</h3>
              <div className="pricing-price">
                <span className="price-amount">{tier.price}</span>
                {tier.period && (
                  <span className="price-period">{tier.period}</span>
                )}
              </div>
              <p className="pricing-desc">{tier.description}</p>
              <ul className="pricing-modules">
                {tier.modules.map((m) => (
                  <li key={m}>
                    <span className="check-icon">&#10003;</span> {m}
                  </li>
                ))}
              </ul>
              <Link className={`btn ${tier.ctaStyle}`} href={tier.href}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Support Plans */}
      <section className="content-section alt" id="support">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Support plans</h2>
            <p className="section-subtitle">
              Every school deserves great support. Here&apos;s what&apos;s included at each level.
            </p>
          </div>
          <div className="features-grid four-col">
            {supportPlans.map((plan) => (
              <div key={plan.name} className="feature-card">
                <h3>{plan.name}</h3>
                <p className="support-plan-desc">{plan.description}</p>
                <ul className="module-features-list">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className="check-icon">&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="content-section" id="faq">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Pricing FAQs</h2>
            <p className="section-subtitle">
              Common questions about our pricing and plans.
            </p>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.q} className="faq-item">
                <summary className="faq-question">{faq.q}</summary>
                <p className="faq-answer">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Ready to get started?</h2>
          <p>Start your free trial today — no credit card required.</p>
          <div className="actions centered-actions">
            <Link className="btn btn-primary" href="/contact">
              Activate Free Trial
            </Link>
            <Link className="btn btn-secondary" href="mailto:sales@edumyles.com">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
