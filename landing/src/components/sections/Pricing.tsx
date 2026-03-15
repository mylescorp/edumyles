"use client";

import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 12900,
    annualPrice: 10320,
    description: "Perfect for small schools getting started with digital management",
    limit: "Up to 500 students",
    features: [
      "Student information system",
      "Basic fee tracking",
      "Parent communication (SMS)",
      "Attendance management",
      "Basic gradebook",
      "Email support",
      "1 campus",
    ],
    cta: "Get Started Free",
    href: "https://app.edumyles.com/auth/signup",
    featured: false,
  },
  {
    name: "Professional",
    monthlyPrice: 38900,
    annualPrice: 31120,
    description: "For growing schools needing all modules and priority support",
    limit: "501–2,000 students",
    features: [
      "All 11 modules included",
      "M-Pesa & Airtel Money",
      "Multi-campus support",
      "Parent & teacher portals",
      "Advanced analytics",
      "Priority support & training",
      "Unlimited admin users",
      "CBC & 8-4-4 gradebook",
      "NEMIS integration",
    ],
    cta: "Get Started",
    href: "https://app.edumyles.com/auth/signup",
    featured: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    description: "For large institutions and multi-school networks",
    limit: "2,000+ students",
    features: [
      "Everything in Professional",
      "Custom SLA agreement",
      "Dedicated Customer Success Manager",
      "API access & custom integrations",
      "SSO / WorkOS",
      "County & MoE reporting",
      "White-label options",
      "On-site training",
    ],
    cta: "Contact Sales",
    href: "/contact?subject=enterprise",
    featured: false,
  },
];

function formatKES(n: number): string {
  return "KES " + n.toLocaleString("en-KE");
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section
      id="pricing"
      className="py-20 lg:py-32 bg-navy relative overflow-hidden"
      aria-label="Pricing plans"
    >
      {/* Background radial */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, #C79639 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="font-inter font-semibold text-gold uppercase tracking-widest text-sm mb-3">
            Pricing
          </p>
          <h2 className="font-jakarta font-bold text-4xl lg:text-5xl text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="font-inter text-lg text-white/70 max-w-2xl mx-auto mb-8">
            No hidden fees. Pay per school per month. Cancel anytime. Start free for 30 days.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`font-inter text-sm font-medium ${!annual ? "text-white" : "text-white/50"}`}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                annual ? "bg-gold" : "bg-white/20"
              }`}
              aria-label="Toggle annual billing"
              aria-checked={annual}
              role="switch"
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  annual ? "translate-x-6" : ""
                }`}
              />
            </button>
            <span
              className={`font-inter text-sm font-medium ${annual ? "text-white" : "text-white/50"}`}
            >
              Annual{" "}
              <span className="bg-gold/20 text-gold px-1.5 py-0.5 rounded-full text-xs font-semibold ml-1">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 lg:p-8 flex flex-col ${
                plan.featured
                  ? "bg-white shadow-2xl border-2 border-gold md:scale-[1.02]"
                  : "bg-white/5 border border-white/10 backdrop-blur-sm"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gold text-white font-inter font-semibold text-xs px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    ⭐ Most Popular
                  </span>
                </div>
              )}

              <h3
                className={`font-jakarta font-bold text-2xl mb-1 ${
                  plan.featured ? "text-navy" : "text-white"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`font-inter text-xs mb-4 ${
                  plan.featured ? "text-mid-grey" : "text-white/50"
                }`}
              >
                {plan.limit}
              </p>

              <div className="mb-4">
                {plan.monthlyPrice === null ? (
                  <div
                    className={`font-jakarta font-bold text-4xl ${
                      plan.featured ? "text-navy" : "text-white"
                    }`}
                  >
                    Custom
                  </div>
                ) : (
                  <>
                    <div
                      className={`font-jakarta font-extrabold text-4xl ${
                        plan.featured ? "text-navy" : "text-white"
                      }`}
                    >
                      {formatKES(annual ? plan.annualPrice! : plan.monthlyPrice)}
                    </div>
                    <div
                      className={`font-inter text-sm ${
                        plan.featured ? "text-mid-grey" : "text-white/50"
                      }`}
                    >
                      /month
                    </div>
                  </>
                )}
              </div>

              <p
                className={`font-inter text-sm leading-relaxed mb-6 ${
                  plan.featured ? "text-mid-grey" : "text-white/60"
                }`}
              >
                {plan.description}
              </p>

              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-gold font-bold text-sm mt-0.5 flex-shrink-0">✓</span>
                    <span
                      className={`font-inter text-sm ${
                        plan.featured ? "text-dark-grey" : "text-white/70"
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center font-inter font-semibold text-base py-3.5 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  plan.featured
                    ? "bg-gold hover:bg-gold-dark text-white shadow-md hover:shadow-gold-glow"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="font-inter text-sm text-white/50">
            30-day money-back guarantee · No setup fees · M-Pesa or bank transfer
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link
              href="/pricing"
              className="font-inter text-sm text-gold hover:underline"
            >
              Compare all features →
            </Link>
            <span className="text-white/20">·</span>
            <Link
              href="/contact"
              className="font-inter text-sm text-white/50 hover:text-gold transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
