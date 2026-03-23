import type { Metadata } from "next";
import PartnerForm from "@/components/ui/PartnerForm";

export const metadata: Metadata = {
  title: "Partner Programme — EduMyles",
  description:
    "Join the EduMyles partner programme. Earn recurring commission by referring schools to Africa's leading school management platform.",
};

const partnerTypes = [
  {
    icon: "🤝",
    title: "Referral Partner",
    forWho: "Teachers, consultants, school network leads",
    howItWorks:
      "Share your unique link. When a school signs up and goes live, you earn 20% of their monthly subscription — every month they stay.",
    earn: "Earn KES 2,580 – 7,780/month per school referred",
    cta: "Become a Referral Partner →",
    href: "#apply",
    featured: false,
  },
  {
    icon: "🏢",
    title: "Reseller Partner",
    forWho: "EdTech companies, school suppliers, ICT firms",
    howItWorks:
      "Bundle EduMyles with your services. We provide white-label options, co-branded materials, and a dedicated partner manager.",
    earn: "Up to 30% recurring commission + co-sell support",
    cta: "Apply as Reseller →",
    href: "#apply",
    featured: true,
  },
  {
    icon: "🔌",
    title: "Integration Partner",
    forWho: "SaaS companies with complementary tools",
    howItWorks:
      "Build an integration with EduMyles via our API. List your integration in our marketplace and reach 50+ schools on day one.",
    earn: "Access to 10,000+ student records via API",
    cta: "Explore API Docs →",
    href: "/platform",
    featured: false,
  },
];

const steps = [
  { num: "1", title: "Apply online", detail: "2 minutes — fill in the form below." },
  { num: "2", title: "Get your partner kit", detail: "Unique link, marketing assets, and product training." },
  { num: "3", title: "Introduce schools to EduMyles", detail: "Use your network, content, or direct outreach." },
  { num: "4", title: "Earn monthly commissions", detail: "Automatic payouts every month — no chasing invoices." },
];

const benefits = [
  { icon: "💰", title: "Recurring 20% commission", detail: "Not one-time — you earn every month the school stays." },
  { icon: "📊", title: "Real-time partner dashboard", detail: "Track clicks, signups, and earnings in one place." },
  { icon: "🎓", title: "Free product training & certification", detail: "Know EduMyles inside out before you start selling." },
  { icon: "🛠️", title: "Dedicated partner success manager", detail: "A named person who picks up when you call." },
  { icon: "📣", title: "Co-marketing opportunities", detail: "Case studies, webinars, and joint campaigns." },
  { icon: "🌍", title: "Expand across Africa", detail: "Uganda, Tanzania, Rwanda, Zambia, and beyond." },
];

export default function PartnersPage() {
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
              Partner Programme
            </div>
            <h1
              className="font-playfair font-bold leading-[1.15] mb-5"
              style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
            >
              Earn with EduMyles.{" "}
              <em className="italic" style={{ color: "#E8A020" }}>Help schools run better.</em>
            </h1>
            <p
              className="font-jakarta font-light leading-[1.8] mb-8"
              style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "580px" }}
            >
              Join our referral and reseller programme. Every school you bring to EduMyles earns you recurring monthly commission. No cap.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                "20% recurring commission",
                "90-day cookie window",
                "Monthly payouts",
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

      {/* ── Partner Types ───────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              Partnership Tiers
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Find the right{" "}
              <em className="italic" style={{ color: "#E8A020" }}>partnership for you</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {partnerTypes.map((pt) => (
              <div
                key={pt.title}
                className="rounded-2xl flex flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1 relative"
                style={{
                  background: pt.featured ? "#061A12" : "#ffffff",
                  border: pt.featured ? "2px solid #E8A020" : "1px solid #e8f4ec",
                  boxShadow: pt.featured
                    ? "0 8px 32px rgba(232,160,32,0.15)"
                    : "0 2px 12px rgba(6,26,18,0.05)",
                }}
              >
                {pt.featured && (
                  <div
                    className="absolute top-0 left-0 right-0 text-center font-jakarta font-bold text-[11px] py-2"
                    style={{ background: "#E8A020", color: "#061A12" }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <div className={`p-7 flex flex-col flex-1 ${pt.featured ? "pt-10" : ""}`}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] mb-4"
                    style={{ background: pt.featured ? "rgba(232,160,32,0.15)" : "#F3FBF6" }}
                  >
                    {pt.icon}
                  </div>
                  <h2
                    className="font-playfair font-bold text-[20px] mb-2"
                    style={{ color: pt.featured ? "#ffffff" : "#061A12" }}
                  >
                    {pt.title}
                  </h2>
                  <div
                    className="font-jakarta text-[12px] font-semibold uppercase tracking-wide mb-4"
                    style={{ color: pt.featured ? "#6B9E83" : "#9ca3af" }}
                  >
                    For: {pt.forWho}
                  </div>
                  <p
                    className="font-jakarta text-[14px] leading-[1.8] mb-5 flex-1"
                    style={{ color: pt.featured ? "#A8E6C3" : "#5a5a5a" }}
                  >
                    {pt.howItWorks}
                  </p>
                  <div
                    className="rounded-xl p-4 mb-6"
                    style={{
                      background: pt.featured ? "rgba(232,160,32,0.1)" : "#F3FBF6",
                      border: `1px solid ${pt.featured ? "rgba(232,160,32,0.25)" : "#d4eade"}`,
                    }}
                  >
                    <span
                      className="font-jakarta font-bold text-[13px]"
                      style={{ color: pt.featured ? "#E8A020" : "#0F4C2A" }}
                    >
                      {pt.earn}
                    </span>
                  </div>
                  <a
                    href={pt.href}
                    className="inline-flex items-center justify-center font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] no-underline transition-colors duration-200"
                    style={{
                      background: pt.featured ? "#E8A020" : "#061A12",
                      color: pt.featured ? "#061A12" : "#ffffff",
                    }}
                  >
                    {pt.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              Simple Process
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              How It{" "}
              <em className="italic" style={{ color: "#E8A020" }}>Works</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-2xl p-7 text-center"
                style={{ background: "#ffffff", border: "1px solid #d4eade", boxShadow: "0 2px 8px rgba(6,26,18,0.04)" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-playfair font-bold text-[20px] mx-auto mb-4"
                  style={{ background: "#E8A020", color: "#061A12" }}
                >
                  {step.num}
                </div>
                <h3 className="font-playfair font-bold text-[16px] mb-2" style={{ color: "#061A12" }}>
                  {step.title}
                </h3>
                <p className="font-jakarta text-[13px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner Benefits ────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              What You Get
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Partner{" "}
              <em className="italic" style={{ color: "#E8A020" }}>Benefits</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="flex items-start gap-4 rounded-2xl p-6"
                style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
                  style={{ background: "#ffffff", border: "1px solid #d4eade" }}
                >
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-jakarta font-bold text-[15px] mb-1" style={{ color: "#061A12" }}>
                    {b.title}
                  </h3>
                  <p className="font-jakarta text-[13px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
                    {b.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application Form ────────────────────────────────── */}
      <section id="apply" className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[720px] mx-auto">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              Ready to Start
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
            >
              Apply to{" "}
              <em className="italic" style={{ color: "#E8A020" }}>Join</em>
            </h2>
            <p className="font-jakarta text-[15px]" style={{ color: "#5a5a5a" }}>
              Takes 2 minutes. Our partnerships team will respond within 48 hours.
            </p>
          </div>
          <div
            className="rounded-2xl p-8 sm:p-10"
            style={{ background: "#ffffff", border: "1px solid #d4eade", boxShadow: "0 4px 20px rgba(6,26,18,0.06)" }}
          >
            <PartnerForm />
          </div>
        </div>
      </section>
    </div>
  );
}
