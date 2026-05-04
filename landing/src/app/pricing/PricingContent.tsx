"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { PUBLIC_PRICING_PLANS, formatPublicKes } from "@edumyles/shared/constants/publicCatalog";

const plans = PUBLIC_PRICING_PLANS;

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes — every plan comes with a free 30-day trial with full access to all features. No credit card required to start.",
  },
  {
    q: "How is pricing calculated?",
    a: "Pricing is per school per month, not per student. You get unlimited users within your student cap. Annual billing saves you 20%.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept M-Pesa, Airtel Money, card payments, and direct bank transfers. We'll work with whatever is easiest for your school.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. Upgrade at any time and get immediate access to new features. Downgrade takes effect at the next billing cycle.",
  },
  {
    q: "Do you offer discounts for NGOs or government schools?",
    a: "Yes. We work with CBOs, NGOs, county education departments, and government schools with special pricing. Contact our sales team for details.",
  },
  {
    q: "What is included in onboarding?",
    a: "All plans include a free onboarding session where our team helps you set up your school, import data, and train your staff. Professional and Enterprise get extended training.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Yes. We offer a 30-day money-back guarantee on all paid plans. If EduMyles doesn't work for your school, we'll refund in full — no questions asked.",
  },
  {
    q: "What does NEMIS integration mean?",
    a: "EduMyles can export student data in formats compatible with the Kenya National Education Management Information System (NEMIS), saving hours of manual data entry.",
  },
];

const comparisonRows = [
  { feature: "Student Information System", starter: true, pro: true, enterprise: true },
  { feature: "Admissions Management", starter: true, pro: true, enterprise: true },
  { feature: "Finance & Fee Tracking", starter: "Basic", pro: true, enterprise: true },
  { feature: "M-Pesa / Airtel Money", starter: false, pro: true, enterprise: true },
  { feature: "Timetable & Scheduling", starter: false, pro: true, enterprise: true },
  { feature: "Academics & Gradebook", starter: "Basic", pro: true, enterprise: true },
  { feature: "HR & Payroll", starter: false, pro: true, enterprise: true },
  { feature: "Library Management", starter: false, pro: true, enterprise: true },
  { feature: "Transport Management", starter: false, pro: true, enterprise: true },
  { feature: "Communications (SMS/Email)", starter: "SMS only", pro: true, enterprise: true },
  { feature: "eWallet", starter: false, pro: true, enterprise: true },
  { feature: "School Shop", starter: false, pro: true, enterprise: true },
  { feature: "Multi-campus support", starter: false, pro: true, enterprise: true },
  { feature: "Parent & Teacher Portals", starter: false, pro: true, enterprise: true },
  { feature: "Advanced Analytics", starter: false, pro: true, enterprise: true },
  { feature: "API Access", starter: false, pro: false, enterprise: true },
  { feature: "White-label", starter: false, pro: false, enterprise: true },
  { feature: "Dedicated CSM", starter: false, pro: false, enterprise: true },
  { feature: "Custom SLA", starter: false, pro: false, enterprise: true },
];

function Cell({ val }: { val: boolean | string }) {
  if (val === true) return <span style={{ color: "#26A65B", fontSize: 18 }}>✓</span>;
  if (val === false) return <span style={{ color: "#ccc" }}>—</span>;
  return <span style={{ color: "#E8A020", fontSize: 13, fontWeight: 600 }}>{val}</span>;
}

export default function PricingContent() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* ── Pricing Cards ─────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span
              className="font-jakarta text-[14px] font-medium"
              style={{ color: annual ? "#6B9E83" : "#061A12" }}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setAnnual(!annual)}
              className="relative w-12 h-6 rounded-full transition-colors duration-300"
              style={{ background: annual ? "#E8A020" : "rgba(6,26,18,0.2)" }}
              aria-label="Toggle annual billing"
            >
              <div
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
                style={{ transform: annual ? "translateX(24px)" : "translateX(0)" }}
              />
            </button>
            <span
              className="font-jakarta text-[14px] font-medium"
              style={{ color: annual ? "#061A12" : "#6B9E83" }}
            >
              Annual{" "}
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-[20px] ml-1"
                style={{ background: "#E8A020", color: "#061A12" }}
              >
                Save 20%
              </span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="relative rounded-2xl flex flex-col"
                style={{
                  background: plan.featured ? "#061A12" : "#ffffff",
                  border: plan.featured ? "2px solid #E8A020" : "1px solid #e8f4ec",
                  padding: "2rem",
                  boxShadow: plan.featured
                    ? "0 20px 60px rgba(6,26,18,0.3)"
                    : "0 4px 20px rgba(6,26,18,0.06)",
                  transform: plan.featured ? "scale(1.02)" : "none",
                }}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span
                      className="font-jakarta font-bold text-[12px] px-4 py-1.5 rounded-[20px] whitespace-nowrap"
                      style={{ background: "#E8A020", color: "#061A12" }}
                    >
                      <Star
                        className="w-3 h-3 inline mr-1 -mt-0.5"
                        strokeWidth={2}
                        fill="currentColor"
                      />
                      {plan.highlight}
                    </span>
                  </div>
                )}

                <h3
                  className="font-display font-bold text-[24px] mb-1"
                  style={{ color: plan.featured ? "#E8A020" : "#061A12" }}
                >
                  {plan.name}
                </h3>
                <p className="font-jakarta text-[13px] mb-4" style={{ color: "#6B9E83" }}>
                  {plan.tagline}
                </p>

                <div className="mb-4">
                  {plan.monthlyPriceKes === null ? (
                    <div
                      className="font-display font-bold text-[40px]"
                      style={{ color: plan.featured ? "#E8A020" : "#061A12" }}
                    >
                      Custom
                    </div>
                  ) : (
                    <>
                      <div
                        className="font-display font-bold text-[38px]"
                        style={{ color: plan.featured ? "#E8A020" : "#061A12" }}
                      >
                        {formatPublicKes(
                          annual ? plan.annualMonthlyPriceKes! : plan.monthlyPriceKes
                        )}
                      </div>
                      <div
                        className="font-jakarta text-[13px]"
                        style={{ color: plan.featured ? "rgba(255,255,255,0.5)" : "#8a8a8a" }}
                      >
                        per school / month {annual ? "(billed annually)" : ""}
                      </div>
                    </>
                  )}
                </div>

                <p
                  className="font-jakarta text-[14px] leading-[1.7] mb-6"
                  style={{ color: plan.featured ? "rgba(255,255,255,0.65)" : "#5a5a5a" }}
                >
                  {plan.description}
                </p>

                <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span
                        className="font-bold text-[14px] flex-shrink-0 mt-0.5"
                        style={{ color: "#26A65B" }}
                      >
                        ✓
                      </span>
                      <span
                        className="font-jakarta text-[14px]"
                        style={{ color: plan.featured ? "rgba(255,255,255,0.8)" : "#3d3d3d" }}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className="block text-center font-jakarta font-bold text-[15px] py-3.5 rounded-[50px] no-underline transition-all duration-200"
                  style={
                    plan.featured
                      ? { background: "#E8A020", color: "#061A12" }
                      : { background: "#061A12", color: "#ffffff" }
                  }
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          <p className="text-center font-jakarta text-[13px] mt-8" style={{ color: "#8a8a8a" }}>
            30-day money-back guarantee · No setup fees · Prices in KES · M-Pesa or bank transfer
          </p>
        </div>
      </section>

      {/* ── Comparison Table ──────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#ffffff" }} id="compare">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-10">
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", color: "#061A12" }}
            >
              Compare{" "}
              <em className="italic" style={{ color: "#E8A020" }}>
                all features
              </em>
            </h2>
          </div>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid #e8f4ec" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#061A12" }}>
                  <th
                    className="font-jakarta font-bold text-[14px] text-left py-4 px-5"
                    style={{ color: "#ffffff", width: "40%" }}
                  >
                    Feature
                  </th>
                  {["Starter", "Professional", "Enterprise"].map((p) => (
                    <th
                      key={p}
                      className="font-jakarta font-bold text-[14px] text-center py-4 px-5"
                      style={{ color: p === "Professional" ? "#E8A020" : "#ffffff" }}
                    >
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    style={{
                      background: i % 2 === 0 ? "#ffffff" : "#F3FBF6",
                      borderBottom: "1px solid #e8f4ec",
                    }}
                  >
                    <td
                      className="font-jakarta text-[14px] py-3.5 px-5"
                      style={{ color: "#3d3d3d" }}
                    >
                      {row.feature}
                    </td>
                    <td className="text-center py-3.5 px-5">
                      <Cell val={row.starter} />
                    </td>
                    <td className="text-center py-3.5 px-5">
                      <Cell val={row.pro} />
                    </td>
                    <td className="text-center py-3.5 px-5">
                      <Cell val={row.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#F3FBF6" }} id="faq">
        <div className="max-w-[760px] mx-auto">
          <div className="text-center mb-10">
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", color: "#061A12" }}
            >
              Pricing{" "}
              <em className="italic" style={{ color: "#E8A020" }}>
                FAQs
              </em>
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid #d4eade", background: "#ffffff" }}
              >
                <button
                  type="button"
                  className="w-full flex justify-between items-center gap-4 text-left font-jakarta font-semibold text-[15px] py-5 px-6 transition-colors duration-200"
                  style={{
                    color: openFaq === i ? "#E8A020" : "#061A12",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <span
                    className="flex-shrink-0 text-[20px] transition-transform duration-300"
                    style={{
                      transform: openFaq === i ? "rotate(45deg)" : "none",
                      color: "#E8A020",
                    }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p
                      className="font-jakarta text-[14px] leading-[1.8]"
                      style={{ color: "#5a5a5a" }}
                    >
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#0F4C2A" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-display font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3.5vw,3rem)", color: "#ffffff" }}
          >
            Ready to get started?{" "}
            <em className="italic" style={{ color: "#E8A020" }}>
              It&apos;s free for 30 days.
            </em>
          </h2>
          <p className="font-jakarta text-[17px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            No credit card required. No setup fees. Full access from day one.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/waitlist"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial →
            </a>
            <Link
              href="/contact?subject=pricing"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{
                background: "transparent",
                border: "2px solid rgba(255,255,255,0.4)",
                color: "#ffffff",
              }}
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
