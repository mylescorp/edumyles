import type { Metadata } from "next";
import PartnerForm from "@/components/ui/PartnerForm";
import {
  Handshake, Building, Plug, Banknote, BarChart2,
  GraduationCap, Wrench,
  CheckCircle2, Star, Users, Shield,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Reseller Programme — EduMyles | Resell & Earn",
  description:
    "Join the EduMyles Reseller Programme. Resell Africa's leading school management platform and earn up to 30% recurring monthly commission. White-label available.",
};

const tiers = [
  {
    icon: Handshake,
    title: "Referral Partner",
    forWho: "Teachers, consultants, education NGOs",
    desc: "Share your unique referral link. When a school signs up and goes live, you earn 20% of their monthly subscription — every single month they stay.",
    earn: "KES 2,580 – 7,780 / month per school",
    features: [
      "Unique tracking link + QR code",
      "Real-time referral dashboard",
      "Monthly M-Pesa / bank payouts",
      "Marketing assets pack",
      "Free product certification",
    ],
    featured: false,
    cta: "Become a Referral Partner →",
    href: "#apply",
  },
  {
    icon: Building,
    title: "Reseller Partner",
    forWho: "ICT firms, EdTech companies, school suppliers, system integrators",
    desc: "Bundle EduMyles with your products and services. White-label the platform under your brand. Get a dedicated partner manager, co-sell support, and reseller pricing.",
    earn: "Up to 30% recurring + implementation fees",
    features: [
      "White-label branding rights",
      "Dedicated partner success manager",
      "Co-branded sales deck + proposal templates",
      "Reseller pricing (buy at discount)",
      "Technical onboarding support",
      "Territory protection options",
      "Joint marketing campaigns",
      "Priority support SLA",
    ],
    featured: true,
    cta: "Apply as Reseller →",
    href: "#apply",
  },
  {
    icon: Plug,
    title: "Integration Partner",
    forWho: "SaaS companies with complementary tools",
    desc: "Build native integrations via our REST API. Get listed in the EduMyles marketplace and gain immediate distribution to 50+ schools on day one.",
    earn: "Revenue share on referred upgrades",
    features: [
      "Full REST API access",
      "Marketplace listing",
      "Sandbox environment",
      "Developer documentation",
      "Co-marketing opportunities",
    ],
    featured: false,
    cta: "Explore API Docs →",
    href: "/contact?subject=api-access",
  },
];

const resellerBenefits = [
  {
    icon: Star,
    title: "White-label & Custom Branding",
    detail: "Sell under your own brand name. We provide a white-label version with your logo, colours, and custom domain — your clients never need to know EduMyles powers it.",
  },
  {
    icon: Banknote,
    title: "30% Recurring Commission",
    detail: "Earn 30% of every monthly subscription — for as long as the school stays on the platform. No caps, no clawbacks.",
  },
  {
    icon: Users,
    title: "Co-sell Support",
    detail: "We join your sales calls, provide demo accounts, and help close complex school deals alongside you.",
  },
  {
    icon: BarChart2,
    title: "Reseller Pricing",
    detail: "Buy EduMyles at a discounted rate, bundle with your services, and set your own margin on top.",
  },
  {
    icon: Shield,
    title: "Territory Protection",
    detail: "Request exclusivity for a region, county, or school network. First-come, first-served.",
  },
  {
    icon: Wrench,
    title: "Partner Dashboard",
    detail: "Real-time view of your schools, their usage, subscription status, and your monthly earnings — all in one place.",
  },
];

const earnings = [
  { schools: "5 schools",  plan: "Starter",     monthly: "KES 19,350" },
  { schools: "10 schools", plan: "Growth",       monthly: "KES 64,500" },
  { schools: "20 schools", plan: "Growth mix",   monthly: "KES 129,000" },
  { schools: "50 schools", plan: "Mixed plans",  monthly: "KES 322,500+" },
];

const steps = [
  { num: "01", title: "Apply online",                detail: "2-minute form below. Tell us about your company and target market." },
  { num: "02", title: "Get your partner kit",        detail: "Training access, marketing assets, demo environment, and your dedicated manager." },
  { num: "03", title: "Introduce EduMyles",          detail: "Use your network, events, or direct outreach to connect schools with EduMyles." },
  { num: "04", title: "Earn monthly commissions",   detail: "Automatic M-Pesa or bank transfer payouts — no chasing invoices." },
];

const testimonials = [
  {
    quote: "We bundled EduMyles with our school ICT setup service. Three schools in the first month alone — the commission covers our office rent.",
    name: "TechBridge East Africa",
    location: "Nairobi",
  },
  {
    quote: "The white-label feature was the game-changer. Our clients see our brand, we earn the EduMyles commission in the background. Perfect.",
    name: "EduTech Solutions KE",
    location: "Mombasa",
  },
  {
    quote: "As a school consultant, recommending EduMyles is a no-brainer. It's the best product and the 20% commission is a great ongoing bonus.",
    name: "Sarah M.",
    location: "School Management Consultant, Kisumu",
  },
];

const faqs = [
  {
    q: "How quickly can I start earning?",
    a: "Once approved (usually within 48 hours), you'll receive your reseller kit and can start immediately.",
  },
  {
    q: "Is white-labelling available for all resellers?",
    a: "White-label is available for Reseller Partners only. Referral Resellers use standard EduMyles branding.",
  },
  {
    q: "How are commissions paid?",
    a: "Monthly via M-Pesa or bank transfer, by the 5th of each month. No minimums.",
  },
  {
    q: "Is there a minimum number of schools I must refer?",
    a: "No minimums. Even one school earns you ongoing recurring commission every month.",
  },
  {
    q: "Do I need technical knowledge to become a reseller?",
    a: "No. We provide full training. Referral resellers only need to make introductions.",
  },
  {
    q: "Can I become a reseller from outside Kenya?",
    a: "Yes — we have resellers in Uganda, Tanzania, and Rwanda. We're actively expanding.",
  },
];

export default function ResellersPage() {
  return (
    <div style={{ color: "#212121" }}>

      {/* ── Hero ── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{ background: "#061A12", borderTop: "3px solid #E8A020", padding: "6rem 2rem 5rem", minHeight: "480px" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
          backgroundSize: "50px 50px",
        }} />
        <div className="relative max-w-[1200px] mx-auto w-full">
          <div className="max-w-[760px]">
            <div className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]" style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}>
              Reseller Programme
            </div>
            <h1 className="font-playfair font-bold leading-[1.1] mb-5" style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}>
              Resell EduMyles.{" "}
              <em className="italic" style={{ color: "#E8A020" }}>Earn recurring income.</em>
            </h1>
            <p className="font-jakarta font-light leading-[1.8] mb-8" style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "600px" }}>
              Join 20+ active resellers earning monthly recurring commissions by bringing EduMyles to schools across East Africa. White-label available for resellers.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["Up to 30% commission", "Monthly M-Pesa payouts", "White-label ready", "90-day cookie window"].map((pill) => (
                <span key={pill} className="inline-flex items-center font-jakarta font-medium text-[13px] px-4 py-2 rounded-[50px]" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#E8E8E8" }}>
                  {pill}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="#apply" className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-7 py-4 rounded-[50px] no-underline" style={{ background: "#E8A020", color: "#061A12" }}>
                Apply as Reseller →
              </a>
              <a href="#tiers" className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-7 py-4 rounded-[50px] no-underline" style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.3)", color: "#ffffff" }}>
                See All Reseller Types
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Reseller Tiers ── */}
      <section id="tiers" className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]" style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}>
              Reseller Tiers
            </div>
            <h2 className="font-playfair font-bold leading-[1.2]" style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}>
              Find the right{" "}
              <em className="italic" style={{ color: "#E8A020" }}>reseller option for you</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((t) => (
              <div key={t.title} className="rounded-2xl flex flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1 relative" style={{ background: t.featured ? "#061A12" : "#ffffff", border: t.featured ? "2px solid #E8A020" : "1px solid #e8f4ec", boxShadow: t.featured ? "0 8px 32px rgba(232,160,32,0.15)" : "0 2px 12px rgba(6,26,18,0.05)" }}>
                {t.featured && (
                  <div className="text-center font-jakarta font-bold text-[11px] py-2" style={{ background: "#E8A020", color: "#061A12" }}>
                    MOST POPULAR — RESELLER
                  </div>
                )}
                <div className="p-7 flex flex-col flex-1">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: t.featured ? "rgba(232,160,32,0.15)" : "#F3FBF6" }}>
                    <t.icon className="w-6 h-6" strokeWidth={1.5} style={{ color: t.featured ? "#E8A020" : "#0F4C2A" }} />
                  </div>
                  <h2 className="font-playfair font-bold text-[20px] mb-1" style={{ color: t.featured ? "#ffffff" : "#061A12" }}>
                    {t.title}
                  </h2>
                  <p className="font-jakarta text-[11.5px] font-semibold uppercase tracking-wide mb-4" style={{ color: t.featured ? "#6B9E83" : "#9ca3af" }}>
                    For: {t.forWho}
                  </p>
                  <p className="font-jakarta text-[13.5px] leading-[1.8] mb-5 flex-1" style={{ color: t.featured ? "#A8E6C3" : "#5a5a5a" }}>
                    {t.desc}
                  </p>
                  <div className="rounded-xl p-4 mb-5" style={{ background: t.featured ? "rgba(232,160,32,0.1)" : "#F3FBF6", border: `1px solid ${t.featured ? "rgba(232,160,32,0.25)" : "#d4eade"}` }}>
                    <span className="font-jakarta font-bold text-[13px]" style={{ color: t.featured ? "#E8A020" : "#0F4C2A" }}>
                      {t.earn}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2 mb-6">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 font-jakarta text-[12.5px]" style={{ color: t.featured ? "#A8E6C3" : "#5a5a5a", listStyle: "none" }}>
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={2} style={{ color: t.featured ? "#26A65B" : "#1A7A4A" }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href={t.href} className="inline-flex items-center justify-center font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] no-underline transition-colors duration-200" style={{ background: t.featured ? "#E8A020" : "#061A12", color: t.featured ? "#061A12" : "#ffffff" }}>
                    {t.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reseller Deep-Dive ── */}
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]" style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}>
              Reseller Programme
            </div>
            <h2 className="font-playfair font-bold leading-[1.2]" style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}>
              Everything you need to{" "}
              <em className="italic" style={{ color: "#E8A020" }}>sell EduMyles</em>
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: benefits list */}
            <div className="grid gap-5">
              {resellerBenefits.map((b) => (
                <div key={b.title} className="flex items-start gap-4 rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #d4eade" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
                    <b.icon className="w-5 h-5" strokeWidth={1.5} style={{ color: "#0F4C2A" }} />
                  </div>
                  <div>
                    <h3 className="font-jakarta font-bold text-[14.5px] mb-1" style={{ color: "#061A12" }}>{b.title}</h3>
                    <p className="font-jakarta text-[13px] leading-[1.7]" style={{ color: "#5a5a5a" }}>{b.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Right: starter kit card */}
            <div className="rounded-2xl p-8 sticky top-24" style={{ background: "#061A12", border: "2px solid rgba(232,160,32,0.4)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(232,160,32,0.15)" }}>
                <GraduationCap className="w-6 h-6" strokeWidth={1.5} style={{ color: "#E8A020" }} />
              </div>
              <h3 className="font-playfair font-bold text-[22px] text-white mb-2">Reseller Starter Kit</h3>
              <p className="font-jakarta text-[13.5px] mb-6" style={{ color: "#6B9E83" }}>What you receive on day one of approval:</p>
              <ul className="flex flex-col gap-3 mb-8">
                {[
                  "White-label demo environment",
                  "Co-branded sales deck (Figma + PDF)",
                  "Pricing & proposal templates",
                  "EduMyles certification course (online)",
                  "Dedicated partner Slack channel",
                  "Named partner success manager",
                  "Marketing asset library",
                  "90-day cookie tracking window",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-jakarta text-[13px] text-white" style={{ listStyle: "none" }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" strokeWidth={2} style={{ color: "#E8A020" }} />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#apply" className="block text-center font-jakarta font-bold text-[14px] px-6 py-3.5 rounded-[50px] no-underline" style={{ background: "#E8A020", color: "#061A12" }}>
                Apply Now — It&apos;s Free →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Earnings Calculator ── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]" style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}>
              Earnings Potential
            </div>
            <h2 className="font-playfair font-bold leading-[1.2]" style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}>
              How much could{" "}
              <em className="italic" style={{ color: "#E8A020" }}>you earn?</em>
            </h2>
            <p className="font-jakarta text-[15px] mt-3" style={{ color: "#5a5a5a" }}>Based on 30% Reseller commission rate</p>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e8f4ec" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "#061A12" }}>
                  {["Schools Onboarded", "Plan Mix", "Your Monthly Commission"].map((h) => (
                    <th key={h} className="font-jakarta font-bold text-[12px] text-left px-6 py-4" style={{ color: "#E8A020" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {earnings.map((row, i) => (
                  <tr key={row.schools} style={{ background: i === earnings.length - 1 ? "rgba(232,160,32,0.06)" : i % 2 === 0 ? "#ffffff" : "#F9FEFE" }}>
                    <td className="font-jakarta font-semibold text-[14px] px-6 py-4" style={{ color: "#061A12" }}>{row.schools}</td>
                    <td className="font-jakarta text-[13.5px] px-6 py-4" style={{ color: "#5a5a5a" }}>{row.plan}</td>
                    <td className="font-playfair font-bold text-[16px] px-6 py-4" style={{ color: i === earnings.length - 1 ? "#E8A020" : "#0F4C2A" }}>{row.monthly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-jakarta text-[12px] mt-3 text-center" style={{ color: "#9ca3af" }}>
            * Referral Partners earn 20% commission. Reseller Partners earn up to 30%.
          </p>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]" style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}>
              Simple Process
            </div>
            <h2 className="font-playfair font-bold leading-[1.2]" style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}>
              How It{" "}
              <em className="italic" style={{ color: "#E8A020" }}>Works</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="rounded-2xl p-7 text-center" style={{ background: "#ffffff", border: "1px solid #d4eade" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-playfair font-bold text-[18px] mx-auto mb-5" style={{ background: "#E8A020", color: "#061A12" }}>
                  {step.num}
                </div>
                <h3 className="font-playfair font-bold text-[17px] mb-2" style={{ color: "#061A12" }}>{step.title}</h3>
                <p className="font-jakarta text-[13px] leading-[1.7]" style={{ color: "#5a5a5a" }}>{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reseller Testimonials ── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-playfair font-bold leading-[1.2]" style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}>
              Resellers who are{" "}
              <em className="italic" style={{ color: "#E8A020" }}>winning</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl p-7 flex flex-col" style={{ background: "#F3FBF6", borderLeft: "4px solid #E8A020" }}>
                <p className="font-playfair italic text-[15px] leading-[1.8] flex-1 mb-5" style={{ color: "#374151" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-jakarta font-bold text-[13px]" style={{ color: "#061A12" }}>{t.name}</p>
                  <p className="font-jakarta text-[12px]" style={{ color: "#6B9E83" }}>{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[800px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-playfair font-bold leading-[1.2]" style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}>
              Frequently Asked{" "}
              <em className="italic" style={{ color: "#E8A020" }}>Questions</em>
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #d4eade" }}>
                <h3 className="font-jakarta font-bold text-[14.5px] mb-2" style={{ color: "#061A12" }}>{faq.q}</h3>
                <p className="font-jakarta text-[13.5px] leading-[1.8]" style={{ color: "#5a5a5a" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application Form ── */}
      <section id="apply" className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[720px] mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]" style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}>
              Ready to Start
            </div>
            <h2 className="font-playfair font-bold leading-[1.2] mb-3" style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}>
              Apply to{" "}
              <em className="italic" style={{ color: "#E8A020" }}>Join</em>
            </h2>
            <p className="font-jakarta text-[15px]" style={{ color: "#5a5a5a" }}>
              Takes 2 minutes. Our resellers team responds within 48 hours.
            </p>
          </div>
          <div className="rounded-2xl p-8 sm:p-10" style={{ background: "#ffffff", border: "1px solid #d4eade", boxShadow: "0 4px 20px rgba(6,26,18,0.06)" }}>
            <PartnerForm />
          </div>
        </div>
      </section>

    </div>
  );
}
