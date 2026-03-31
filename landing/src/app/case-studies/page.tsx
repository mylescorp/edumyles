import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case Studies — EduMyles | Real Schools, Real Results",
  description:
    "Real school transformation stories from East Africa. See how schools are saving time, increasing fee collection, and improving parent communication with EduMyles.",
};

const caseStudies = [
  {
    tag: "Primary School · Nairobi, Kenya",
    title: "How Nairobi Green Academy Increased Fee Collection by 40%",
    excerpt:
      "The school was manually tracking 800+ student fee balances in Excel. After switching to EduMyles, fee collection hit 92% within one term.",
    metrics: [
      { value: "40%", label: "Fee collection increase" },
      { value: "800", label: "Students" },
      { value: "3 weeks", label: "To go live" },
    ],
    slug: "nairobi-green-academy",
  },
  {
    tag: "Secondary School · Kisumu, Kenya",
    title: "St. Francis Cut Report Card Generation from 3 Days to 3 Hours",
    excerpt:
      "Three teachers used to spend an entire weekend on end-of-term reports. With EduMyles gradebook and auto-report generation, it now takes an afternoon.",
    metrics: [
      { value: "96%", label: "Time saved on reports" },
      { value: "1,200", label: "Students" },
      { value: "CBC + 8-4-4", label: "Support" },
    ],
    slug: "st-francis-kisumu",
  },
  {
    tag: "International Prep · Nairobi, Kenya",
    title: "Brookside Prep Went Fully Digital in 11 Days",
    excerpt:
      "From paper registers and WhatsApp groups to a fully digital school with parent portal, attendance tracking, and digital gradebook — in under two weeks.",
    metrics: [
      { value: "11 days", label: "To go live" },
      { value: "450", label: "Students" },
      { value: "98%", label: "Parent portal adoption" },
    ],
    slug: "brookside-prep",
  },
];

const numbers = [
  { value: "KES 120M+", label: "Fees processed" },
  { value: "94%", label: "Average attendance improvement" },
  { value: "15 hrs/week", label: "Saved per administrator" },
  { value: "2 weeks", label: "Average onboarding time" },
];

export default function CaseStudiesPage() {
  return (
    <div style={{ color: "#212121" }}>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "6rem 2rem 5rem",
          minHeight: "480px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full">
          <div className="max-w-[720px]">
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}
            >
              Case Studies
            </div>
            <h1
              className="font-playfair font-bold leading-[1.15] mb-5"
              style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
            >
              Real schools.{" "}
              <em className="italic" style={{ color: "#E8A020" }}>Real results.</em>
            </h1>
            <p
              className="font-jakarta font-light leading-[1.8] mb-8"
              style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "580px" }}
            >
              See how schools across East Africa are saving time, increasing fee collection, and improving parent communication with EduMyles.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                "40% increase in fee collection",
                "15 hrs/week saved per school",
                "2-week average go-live time",
              ].map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center font-jakarta font-medium text-[13px] px-4 py-2 rounded-[50px]"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#E8E8E8" }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Case Studies Grid ───────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {caseStudies.map((cs) => (
              <div
                key={cs.title}
                className="rounded-2xl flex flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1"
                style={{ background: "#ffffff", border: "1px solid #e8f4ec", boxShadow: "0 2px 16px rgba(6,26,18,0.06)" }}
              >
                <div className="p-7 flex flex-col flex-1">
                  <span
                    className="font-jakarta font-semibold text-[12px] mb-4 px-3 py-1 rounded-full self-start"
                    style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
                  >
                    {cs.tag}
                  </span>
                  <h2
                    className="font-playfair font-bold leading-[1.3] mb-4"
                    style={{ fontSize: "1.2rem", color: "#061A12" }}
                  >
                    {cs.title}
                  </h2>
                  <p
                    className="font-jakarta text-[14px] leading-[1.8] mb-6 flex-1"
                    style={{ color: "#5a5a5a" }}
                  >
                    {cs.excerpt}
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {cs.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="rounded-xl p-3 text-center"
                        style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
                      >
                        <div
                          className="font-playfair font-bold text-[16px] mb-0.5"
                          style={{ color: "#E8A020" }}
                        >
                          {m.value}
                        </div>
                        <div className="font-jakarta text-[10px] font-medium leading-tight" style={{ color: "#6B9E83" }}>
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/case-studies/${cs.slug}`}
                    className="font-jakarta font-bold text-[14px] no-underline"
                    style={{ color: "#0F4C2A" }}
                  >
                    Read Case Study →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── By the Numbers ─────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              Aggregate Results
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Results Across{" "}
              <em className="italic" style={{ color: "#E8A020" }}>All Schools</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {numbers.map((n) => (
              <div
                key={n.label}
                className="rounded-2xl p-8 text-center transition-transform duration-200 hover:-translate-y-1"
                style={{ background: "#ffffff", border: "1px solid #d4eade", boxShadow: "0 2px 12px rgba(6,26,18,0.05)" }}
              >
                <div
                  className="font-playfair font-bold mb-2"
                  style={{ fontSize: "2.2rem", color: "#E8A020" }}
                >
                  {n.value}
                </div>
                <div className="font-jakarta text-[14px] font-medium" style={{ color: "#5a5a5a" }}>
                  {n.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#061A12" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-playfair font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3.5vw,3rem)", color: "#ffffff" }}
          >
            Want results like these?{" "}
            <em className="italic" style={{ color: "#E8A020" }}>Start your free 30-day trial.</em>
          </h2>
          <p className="font-jakarta text-[17px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Join 50+ schools already running better with EduMyles. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/auth/signup/api"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial →
            </a>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              Book a Demo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
