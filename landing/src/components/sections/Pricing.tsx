"use client";

import { useState } from "react";
import Link from "next/link";
import { PUBLIC_PRICING_PLANS, formatPublicKes } from "@edumyles/shared/constants/publicCatalog";

const plans = PUBLIC_PRICING_PLANS;

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section
      id="pricing"
      className="py-16 px-4 sm:px-8 relative overflow-hidden"
      aria-label="Pricing plans"
      style={{ background: "#F3FBF6" }}
    >
      <div className="relative max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <div className="section-eyebrow justify-center mb-2">Pricing</div>
          <h2
            className="font-display font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 3rem)", color: "#061A12" }}
          >
            Simple,{" "}
            <em className="italic" style={{ color: "#E8A020" }}>
              Transparent Pricing
            </em>
          </h2>
          <p className="font-jakarta text-lg text-mid-grey max-w-2xl mx-auto mb-8">
            No hidden fees. Pay per school per month. Cancel anytime. Start free for 30 days.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`font-inter text-sm font-medium ${!annual ? "text-navy" : "text-mid-grey"}`}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                annual ? "bg-gold" : "bg-light-grey"
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
              className={`font-inter text-sm font-medium ${annual ? "text-navy" : "text-mid-grey"}`}
            >
              Annual{" "}
              <span className="bg-gold/10 text-gold px-1.5 py-0.5 rounded text-xs font-semibold ml-1">
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
                  ? "bg-navy shadow-2xl border-2 border-gold lg:scale-[1.02]"
                  : "bg-white border border-light-grey shadow-card"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gold text-white font-inter font-semibold text-xs px-4 py-1.5 rounded-lg shadow-md whitespace-nowrap">
                    ⭐ Most Popular
                  </span>
                </div>
              )}

              <h3
                className={`font-jakarta font-bold text-2xl mb-1 ${
                  plan.featured ? "text-gold" : "text-navy"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`font-inter text-xs mb-4 ${
                  plan.featured ? "text-white/60" : "text-mid-grey"
                }`}
              >
                {plan.studentLimitLabel} · {plan.campusLabel}
              </p>

              <div className="mb-4">
                {plan.monthlyPriceKes === null ? (
                  <div
                    className={`font-jakarta font-bold text-4xl ${
                      plan.featured ? "text-gold" : "text-navy"
                    }`}
                  >
                    Custom
                  </div>
                ) : (
                  <>
                    <div
                      className={`font-jakarta font-extrabold text-4xl ${
                        plan.featured ? "text-gold" : "text-navy"
                      }`}
                    >
                      {formatPublicKes(
                        annual ? plan.annualMonthlyPriceKes! : plan.monthlyPriceKes
                      )}
                    </div>
                    <div
                      className={`font-inter text-sm ${
                        plan.featured ? "text-white/60" : "text-mid-grey"
                      }`}
                    >
                      /month
                    </div>
                  </>
                )}
              </div>

              <p
                className={`font-inter text-sm leading-relaxed mb-6 ${
                  plan.featured ? "text-white/70" : "text-mid-grey"
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
                        plan.featured ? "text-white/80" : "text-dark-grey"
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center font-inter font-semibold text-base py-3.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  plan.featured
                    ? "bg-gold hover:bg-gold-dark text-white shadow-md hover:shadow-gold-glow"
                    : "bg-navy hover:bg-navy-dark text-white border border-navy"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="font-inter text-sm text-mid-grey">
            30-day money-back guarantee · No setup fees · M-Pesa or bank transfer
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link
              href="/contact?subject=pricing"
              className="font-inter text-sm text-gold hover:underline"
            >
              Request custom pricing →
            </Link>
            <span className="text-light-grey">·</span>
            <Link
              href="/contact"
              className="font-inter text-sm text-mid-grey hover:text-gold transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
