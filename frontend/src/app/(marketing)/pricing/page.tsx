import Link from "next/link";

const plans = [
  {
    name: "Starter", price: "Free", period: "",
    desc: "Perfect for small schools getting started with digital management",
    features: ["Up to 100 students", "Student information system", "Basic fee tracking", "Single admin user", "Email support", "Basic report cards"],
    cta: "Start Free", featured: false,
  },
  {
    name: "Standard", price: "KSh 1,050", period: "/student/month",
    desc: "For growing schools needing advanced modules and payment integrations",
    features: ["Up to 500 students", "All 11 modules included", "M-Pesa & Airtel Money", "Parent & teacher portals", "SMS & email communications", "Priority support & training", "Unlimited admin users", "Advanced gradebook (CBC + 8-4-4)"],
    cta: "Start Free Trial", featured: true,
  },
  {
    name: "Pro", price: "KSh 1,950", period: "/student/month",
    desc: "Comprehensive solution for established and multi-campus schools",
    features: ["Unlimited students", "Multi-campus support", "Advanced analytics & reports", "Custom integrations & API", "Dedicated account manager", "Priority phone support", "White-label options", "SLA guarantee"],
    cta: "Start Free Trial", featured: false,
  },
];

const faqs = [
  { q: "Do I need to pay upfront?", a: "No. All plans include a free 30-day trial with full access. No credit card required to start." },
  { q: "How does per-student pricing work?", a: "You pay based on active enrolled students. Inactive or graduated students are not counted. Billing adjusts automatically." },
  { q: "Can I switch plans later?", a: "Yes. Upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle." },
  { q: "What payment methods do you accept?", a: "M-Pesa, Airtel Money, bank transfers, and cards (Visa/Mastercard) via Stripe. Monthly or annual billing available." },
  { q: "Is there an annual discount?", a: "Yes. Schools paying annually receive a 15% discount on Standard and Pro plans." },
  { q: "What happens after my trial?", a: "Your account switches to the free Starter plan. Data is preserved for 90 days so you can upgrade without loss." },
];

export default function PricingPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Pricing</p>
          <h1>Simple Pricing That Scales With You</h1>
          <p className="subtext">Transparent plans for schools of all sizes. No hidden fees, no long-term contracts.</p>
        </div>
      </section>

      <section className="pricing-section">
        <div className="pricing-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {plans.map((plan) => (
            <div key={plan.name} className={`pricing-card ${plan.featured ? "featured" : ""}`}>
              {plan.featured && <span className="pricing-badge">Most Popular</span>}
              <h3>{plan.name}</h3>
              <div className="pricing-price">
                <span className="price-amount">{plan.price}</span>
                {plan.period && <span className="price-period">{plan.period}</span>}
              </div>
              <p className="pricing-desc">{plan.desc}</p>
              <ul className="pricing-modules">
                {plan.features.map((f) => (<li key={f}><span className="check-icon">&#10003;</span> {f}</li>))}
              </ul>
              <Link className="btn btn-primary" href="/auth/signup">{plan.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>What every plan includes</h2>
          </div>
          <div className="features-grid four-col">
            <div className="feature-card"><h3>Free Onboarding</h3><p>Guided setup, data import, and staff training at no extra cost.</p></div>
            <div className="feature-card"><h3>Automatic Updates</h3><p>New features deployed automatically. No downtime, no extra charges.</p></div>
            <div className="feature-card"><h3>Data Security</h3><p>Encrypted storage, role-based access, audit trails, tenant isolation.</p></div>
            <div className="feature-card"><h3>99.9% Uptime</h3><p>Enterprise-grade infrastructure with automatic failover and global CDN.</p></div>
          </div>
        </div>
      </section>

      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered"><h2>Pricing FAQs</h2></div>
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

      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Start free. Scale when ready.</h2>
          <p>Every plan includes a 30-day free trial with full access. No credit card required.</p>
          <div className="centered-actions">
            <Link className="btn btn-primary" href="/auth/signup">Start Free Trial</Link>
            <Link className="btn btn-outline" href="/contact">Talk to Sales</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
