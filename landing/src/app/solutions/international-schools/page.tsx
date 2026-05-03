import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Globe2,
  CreditCard,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowRight,
  BookOpen,
  Wallet,
  Bell,
  FileText,
  Users,
  Layers,
  Network,
  Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "EduMyles for International Schools — IGCSE School Management",
  description:
    "The premium school management platform for international and private schools in Africa. IGCSE curriculum, multi-currency fees, SSO, and white-label options.",
};

/* ─── Data ─────────────────────────────────────────────────────── */

const painPoints: { num: string; icon: LucideIcon; title: string; text: string }[] = [
  {
    num: "01",
    icon: Globe2,
    title: "Your parents expect a premium digital experience",
    text: "International parents expect a premium digital experience — not PDF circulars or WhatsApp groups. Your platform needs to match your school's brand and deliver the polish families are paying for.",
  },
  {
    num: "02",
    icon: CreditCard,
    title: "Multi-currency fees with no unified reporting",
    text: "Multi-currency fee collection — KES, USD, GBP, EUR — with international bank transfers, card payments, and M-Pesa all needing unified reporting. Currently you're reconciling across three systems.",
  },
  {
    num: "03",
    icon: Lock,
    title: "Enterprise security requirements generic tools can't meet",
    text: "Enterprise security requirements: SSO, MFA, granular role permissions, and audit logs that generic tools simply cannot provide. Your IT policy demands more.",
  },
];

const howItWorks: { step: string; title: string; desc: string; when: string }[] = [
  {
    step: "01",
    title: "White-label & configure",
    desc: "Apply your school branding, set curriculum type, configure access roles and data residency.",
    when: "Day 1–2",
  },
  {
    step: "02",
    title: "Onboard parents & staff",
    desc: "SSO setup, parent portal invites, staff role assignment and permissions by department.",
    when: "Day 3–7",
  },
  {
    step: "03",
    title: "Go fully digital",
    desc: "Grades, fees, attendance, and communication all live. Your school is fully operational on EduMyles.",
    when: "Day 11",
  },
];

const modules: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: BookOpen,
    title: "IGCSE Gradebook",
    desc: "Configure IGCSE subjects and grade scales, predicted grades, internal assessment tracking, and examiner-ready reports.",
  },
  {
    icon: Wallet,
    title: "Multi-Currency Fee Collection",
    desc: "Accept KES, USD, GBP, EUR. Bank transfer reconciliation, M-Pesa, and card payments. Unified fee dashboard across all currencies.",
  },
  {
    icon: Star,
    title: "White-Label Platform",
    desc: "Deploy EduMyles under your school's brand. Custom domain, logo, and colours. Parents and staff see your brand, not EduMyles.",
  },
  {
    icon: KeyRound,
    title: "SSO & Enterprise Auth",
    desc: "Google Workspace and Microsoft 365 SSO. MFA enforcement for administrator accounts, with provisioning workflows for larger schools.",
  },
  {
    icon: Bell,
    title: "Parent Premium Portal",
    desc: "Branded mobile experience. Real-time grades, attendance, fee receipts. Push notifications available in English, French, and Swahili.",
  },
  {
    icon: FileText,
    title: "Audit Logs & Compliance",
    desc: "Full activity audit trail, Kenya DPA-aware controls, export workflows, and data residency options.",
  },
  {
    icon: Users,
    title: "Admissions & CRM",
    desc: "Online application forms, applicant tracking, offer letters, and full enrolment management from enquiry to first day.",
  },
  {
    icon: Network,
    title: "Multi-Campus (for school groups)",
    desc: "Manage multiple international campuses from one account. Network-level reporting and data isolation between schools.",
  },
];

const curricula = [
  "IGCSE (Grades 9–11)",
  "ACE",
  "CBC",
  "8-4-4",
  "Kenya CBC / KCSE (mixed intake)",
];

const gradebookFeatures = [
  "Custom grading scales per subject",
  "Predicted grade tracking",
  "Internal Assessment (IA) management",
  "Parent visibility controls per assessment",
  "Examiner-format PDF exports",
  "Transcript generation",
];

const securityCards: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: KeyRound,
    title: "SSO",
    desc: "Google, Microsoft, or custom SAML SSO for staff and parents.",
  },
  {
    icon: ShieldCheck,
    title: "MFA",
    desc: "Enforced multi-factor authentication for all administrator accounts.",
  },
  {
    icon: FileText,
    title: "Audit Logs",
    desc: "Every action logged with user, timestamp, and IP. Fully exportable.",
  },
  {
    icon: Layers,
    title: "Data Residency",
    desc: "Data stored in Kenya + EU (Ireland). Never transferred outside adequate-safeguard regions.",
  },
];

const stats = [
  { value: "11 days", label: "avg. go-live" },
  { value: "98%", label: "parent portal adoption" },
  { value: "Secure", label: "access controls" },
  { value: "Audit", label: "activity logs" },
];

const comparisonRows = [
  {
    feature: "International curricula (IGCSE)",
    before: "Not supported",
    after: "Full support",
  },
  {
    feature: "White-label branding",
    before: "Not available",
    after: "Included",
  },
  {
    feature: "Multi-currency fees",
    before: "Single currency only",
    after: "KES, USD, GBP, EUR",
  },
  {
    feature: "SSO (Google / Microsoft)",
    before: "Limited",
    after: "Full SSO & MFA",
  },
  {
    feature: "Audit logs",
    before: "Basic",
    after: "Full audit trail",
  },
  {
    feature: "Africa integrations (M-Pesa, NEMIS)",
    before: "None",
    after: "Native",
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "Can we use our own domain and branding?",
    a: "Yes, full white-label is available. Your school's name, logo, colours, and custom domain — parents and staff never see the EduMyles brand.",
  },
  {
    q: "Which international curricula are supported?",
    a: "IGCSE is the supported international curriculum today. EduMyles also supports CBC, ACE, and 8-4-4 for schools with mixed programmes.",
  },
  {
    q: "Does it support multi-currency fee collection?",
    a: "Yes — KES, USD, GBP, and EUR with bank transfer and card payment support, unified into one reporting dashboard.",
  },
  {
    q: "Is SSO available?",
    a: "Yes — Google Workspace and Microsoft 365 SSO, plus custom SAML. Included in the Enterprise plan.",
  },
  {
    q: "How do you handle data protection?",
    a: "EduMyles supports Kenya DPA-aware controls, role-based access, export workflows, and data processing agreements for schools that require them.",
  },
  {
    q: "What support level is included?",
    a: "International schools receive Priority Support: a dedicated account manager and a 4-hour response SLA.",
  },
];

const integrations = [
  "Card Payments",
  "M-Pesa",
  "Google Workspace SSO",
  "Microsoft 365 SSO",
  "SMS Gateway",
  "WhatsApp Business",
  "Excel / Sheets",
  "Power BI",
];

/* ─── Page ─────────────────────────────────────────────────────── */

export default function InternationalSchoolsPage() {
  return (
    <div style={{ color: "#212121" }}>
      {/* ── Section 1: Hero ─────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "6rem 2rem 5rem",
          minHeight: "560px",
        }}
      >
        {/* grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full text-center">
          {/* eyebrow */}
          <div
            className="inline-block font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
            style={{
              background: "rgba(232,160,32,0.12)",
              border: "1px solid #E8A020",
              color: "#E8A020",
            }}
          >
            For International Schools
          </div>
          {/* H1 */}
          <h1
            className="font-display font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
          >
            The premium school management platform for{" "}
            <em className="italic" style={{ color: "#E8A020" }}>
              international schools in Africa.
            </em>
          </h1>
          {/* subtitle */}
          <p
            className="font-jakarta font-light leading-[1.8] mb-8 mx-auto"
            style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "660px" }}
          >
            IGCSE curriculum support. Multi-currency fee collection. SSO and MFA. White-label
            options so your school brand is always front and centre.
          </p>
          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Link
              href="/contact?subject=enterprise"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Contact Sales <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{
                background: "transparent",
                border: "2px solid rgba(255,255,255,0.4)",
                color: "#ffffff",
              }}
            >
              Book a Demo
            </a>
          </div>
          {/* badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              "IGCSE Support",
              "Multi-Currency Fees",
              "SSO & MFA",
              "White-Label Available",
            ].map((badge) => (
              <span
                key={badge}
                className="font-semibold text-[12px] px-4 py-2 rounded-[50px]"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#A8E6C3",
                }}
              >
                ✓ {badge}
              </span>
            ))}
          </div>
          {/* stats */}
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { value: "98%", label: "parent portal adoption" },
              { value: "11 days", label: "average go-live" },
              { value: "White-label", label: "ready" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display font-bold text-[2rem]" style={{ color: "#E8A020" }}>
                  {s.value}
                </div>
                <div
                  className="text-[13px] font-semibold uppercase tracking-[0.08em] mt-1"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Pain Points ──────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#0C3020" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p
              className="font-semibold text-[13px] uppercase tracking-[0.12em] mb-3"
              style={{ color: "#E8A020" }}
            >
              The challenges international schools face
            </p>
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
            >
              Your school deserves better.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((p) => (
              <div
                key={p.num}
                className="rounded-2xl p-8"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(232,160,32,0.2)",
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <span
                    className="font-display font-bold text-[2.5rem] leading-none"
                    style={{ color: "rgba(232,160,32,0.25)" }}
                  >
                    {p.num}
                  </span>
                  <p.icon
                    className="w-9 h-9 flex-shrink-0 mt-1"
                    strokeWidth={1.5}
                    style={{ color: "#E8A020" }}
                  />
                </div>
                <h3
                  className="font-display font-bold text-[17px] mb-3"
                  style={{ color: "#ffffff" }}
                >
                  {p.title}
                </h3>
                <p className="leading-[1.8] text-[14px]" style={{ color: "#A8E6C3" }}>
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: How It Works ─────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              How It Works
            </div>
            <h2
              className="font-display font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              From contract to fully live in{" "}
              <em className="italic" style={{ color: "#E8A020" }}>
                11 days.
              </em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl p-8 relative"
                style={{ border: "1px solid #e8f4ec", boxShadow: "0 2px 16px rgba(6,26,18,0.05)" }}
              >
                <div
                  className="font-display font-bold text-[3rem] leading-none mb-4"
                  style={{ color: "rgba(15,76,42,0.12)" }}
                >
                  {s.step}
                </div>
                <span
                  className="inline-block font-semibold text-[11px] uppercase tracking-[0.1em] mb-3 px-3 py-1 rounded-[50px]"
                  style={{ background: "rgba(232,160,32,0.12)", color: "#9A5D00" }}
                >
                  {s.when}
                </span>
                <h3
                  className="font-display font-bold text-[19px] mb-3"
                  style={{ color: "#061A12" }}
                >
                  {s.title}
                </h3>
                <p className="text-[14px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Core Modules ─────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              Core Modules
            </div>
            <h2
              className="font-display font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Everything an international school expects
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              8 integrated modules built for the complexity of world-class education in Africa
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((m) => (
              <div
                key={m.title}
                className="rounded-2xl p-6"
                style={{ border: "1px solid #e8f4ec", boxShadow: "0 2px 16px rgba(6,26,18,0.05)" }}
              >
                <div className="mb-4">
                  <m.icon className="w-8 h-8" strokeWidth={1.5} style={{ color: "#0F4C2A" }} />
                </div>
                <h3
                  className="font-display font-bold text-[17px] mb-2"
                  style={{ color: "#061A12" }}
                >
                  {m.title}
                </h3>
                <p className="text-[13px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Curriculum Deep-Dive ────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#A8E6C3" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-display font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Curriculum support,{" "}
              <em className="italic" style={{ color: "#0F4C2A" }}>
                built to the standard you teach to.
              </em>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: supported curricula */}
            <div
              className="rounded-2xl p-8"
              style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(6,26,18,0.08)" }}
            >
              <h3 className="font-display font-bold text-[21px] mb-6" style={{ color: "#061A12" }}>
                Supported curricula
              </h3>
              <div className="flex flex-wrap gap-3">
                {curricula.map((c) => (
                  <span
                    key={c}
                    className="text-[13px] font-semibold px-4 py-2 rounded-[50px]"
                    style={{
                      background: "rgba(26,122,74,0.1)",
                      color: "#0F4C2A",
                      border: "1px solid rgba(26,122,74,0.2)",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            {/* Right: gradebook features */}
            <div
              className="rounded-2xl p-8"
              style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(6,26,18,0.08)" }}
            >
              <h3 className="font-display font-bold text-[21px] mb-6" style={{ color: "#061A12" }}>
                What makes our gradebook premium
              </h3>
              <ul className="space-y-3">
                {gradebookFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      strokeWidth={2}
                      style={{ color: "#1A7A4A" }}
                    />
                    <span className="text-[14px] leading-[1.65]" style={{ color: "#3d3d3d" }}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: Security & Compliance ───────────────────── */}
      <section className="py-20 px-4" style={{ background: "#061A12" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.12)", color: "#E8A020" }}
            >
              Security & Compliance
            </div>
            <h2
              className="font-display font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
            >
              Enterprise-grade security, built in.
            </h2>
            <p
              className="text-[16px] leading-[1.7]"
              style={{ color: "#90CAF9", maxWidth: "560px", margin: "0 auto" }}
            >
              Every control your IT team will ask for — available on day one.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {securityCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl p-7"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(232,160,32,0.2)",
                }}
              >
                <card.icon
                  className="w-8 h-8 mb-4"
                  strokeWidth={1.5}
                  style={{ color: "#E8A020" }}
                />
                <h3
                  className="font-display font-bold text-[18px] mb-2"
                  style={{ color: "#ffffff" }}
                >
                  {card.title}
                </h3>
                <p className="text-[13px] leading-[1.7]" style={{ color: "#A8E6C3" }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: Stats Bar ────────────────────────────────── */}
      <section className="py-14 px-4" style={{ background: "#0F4C2A" }}>
        <div className="max-w-[1000px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div
                  className="font-display font-bold leading-none mb-2"
                  style={{ fontSize: "clamp(2rem,3.5vw,2.75rem)", color: "#E8A020" }}
                >
                  {s.value}
                </div>
                <div
                  className="font-semibold text-[12px] uppercase tracking-[0.1em]"
                  style={{ color: "rgba(168,230,195,0.7)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 8: Benefits ─────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-display font-bold leading-[1.2] mb-4"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Why International Schools Choose <span style={{ color: "#E8A020" }}>EduMyles</span>
            </h2>
            <p
              className="font-jakarta text-lg max-w-[700px] mx-auto"
              style={{ color: "#5a5a5a", lineHeight: "1.7" }}
            >
              Experience the difference with our premium platform designed for international
              education standards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Globe2,
                title: "99% Parent Portal Adoption",
                description:
                  "International parents expect premium digital experiences. Our branded portal achieves 99% adoption within weeks.",
              },
              {
                icon: CreditCard,
                title: "Multi-Currency Excellence",
                description:
                  "Seamlessly handle KES, USD, GBP, EUR with automatic reconciliation and unified financial reporting.",
              },
              {
                icon: ShieldCheck,
                title: "Enterprise Security",
                description:
                  "SSO, MFA, audit logs, and data residency options that exceed international school requirements.",
              },
              {
                icon: Star,
                title: "White-Label Experience",
                description:
                  "Deploy under your school's brand with custom domain, logo, and colors. Parents see only your brand.",
              },
              {
                icon: Network,
                title: "Global Curriculum Support",
                description:
                  "Support for IGCSE alongside CBC, ACE, and 8-4-4 with flexible grading systems.",
              },
              {
                icon: Users,
                title: "Premium Support",
                description:
                  "Dedicated account manager, 24/7 priority support, and custom onboarding for international schools.",
              },
            ].map((benefit, _index) => (
              <div
                key={benefit.title}
                className="text-center p-6 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #FEF3DC 0%, #FFF8E7 100%)",
                  border: "1px solid rgba(232,160,32,0.2)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(232,160,32,0.15)" }}
                >
                  <benefit.icon className="w-8 h-8" style={{ color: "#E8A020" }} />
                </div>
                <h3 className="font-display font-bold text-xl mb-3" style={{ color: "#061A12" }}>
                  {benefit.title}
                </h3>
                <p className="font-jakarta text-sm leading-[1.6]" style={{ color: "#5a5a5a" }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 9: Testimonial ─────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#FEF3DC" }}>
        <div className="max-w-[820px] mx-auto text-center">
          <div className="text-[5rem] leading-none mb-4" style={{ color: "#E8A020" }}>
            &ldquo;
          </div>
          <blockquote
            className="font-display italic leading-[1.85] mb-8"
            style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)", color: "#2d2d2d" }}
          >
            What impressed us most was the parent portal adoption rate. Within two weeks, 98% of our
            parents were checking their child&apos;s attendance and fees online. The white-label
            option means parents only ever see our brand.
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-[16px]"
              style={{ background: "#0F4C2A", color: "#ffffff" }}
            >
              CN
            </div>
            <div className="text-left">
              <p className="font-semibold text-[14px]" style={{ color: "#0F4C2A" }}>
                Catherine Njoroge
              </p>
              <p className="text-[13px]" style={{ color: "#666" }}>
                Head of Administration, Brookside International Preparatory, Karen
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 9: Comparison Table ────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-display font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              EduMyles vs generic SIS tools
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              See what you get that other platforms simply don&apos;t offer.
            </p>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid #e0e0e0", boxShadow: "0 4px 24px rgba(6,26,18,0.07)" }}
          >
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#061A12" }}>
                  <th
                    className="text-left py-4 px-6 font-semibold text-[14px]"
                    style={{ color: "#ffffff" }}
                  >
                    Feature
                  </th>
                  <th
                    className="text-center py-4 px-6 font-semibold text-[14px]"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    Generic SIS Tools
                  </th>
                  <th
                    className="text-center py-4 px-6 font-semibold text-[14px]"
                    style={{ color: "#E8A020" }}
                  >
                    EduMyles
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    style={{
                      background: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <td
                      className="py-4 px-6 font-semibold text-[14px]"
                      style={{ color: "#061A12" }}
                    >
                      {row.feature}
                    </td>
                    <td className="py-4 px-6 text-center" style={{ color: "#5a5a5a" }}>
                      <span className="inline-flex items-center gap-1.5 text-[13px]">
                        <X className="w-4 h-4 flex-shrink-0" style={{ color: "#e53935" }} />
                        {row.before}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
                        style={{ color: "#1A7A4A" }}
                      >
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        {row.after}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section 10: FAQ ─────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[820px] mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-display font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl p-7"
                style={{ border: "1px solid #e8f4ec", boxShadow: "0 2px 10px rgba(6,26,18,0.04)" }}
              >
                <h3
                  className="font-display font-bold text-[17px] mb-3"
                  style={{ color: "#061A12" }}
                >
                  {faq.q}
                </h3>
                <p className="text-[14px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 11: Integrations ────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#A8E6C3" }}>
        <div className="max-w-[1100px] mx-auto text-center">
          <p
            className="font-semibold text-[13px] uppercase tracking-[0.12em] mb-5"
            style={{ color: "#0F4C2A" }}
          >
            Integrations
          </p>
          <h2
            className="font-display font-bold leading-[1.2] mb-8"
            style={{ fontSize: "clamp(1.4rem,2.5vw,2rem)", color: "#061A12" }}
          >
            Works with the tools your school already uses
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {integrations.map((int) => (
              <span
                key={int}
                className="font-semibold text-[13px] px-5 py-2.5 rounded-[50px]"
                style={{
                  background: "#ffffff",
                  color: "#0F4C2A",
                  border: "1px solid rgba(15,76,42,0.2)",
                  boxShadow: "0 1px 4px rgba(6,26,18,0.08)",
                }}
              >
                {int}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 12: Pricing Callout ──────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[760px] mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 font-semibold text-[13px] mb-5 px-4 py-2 rounded-[50px]"
            style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
          >
            Enterprise Pricing
          </div>
          <h2
            className="font-display font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
          >
            Custom pricing for international schools
          </h2>
          <p className="text-[16px] leading-[1.8] mb-8" style={{ color: "#5a5a5a" }}>
            International schools use our Enterprise plan — custom pricing based on student count,
            campus configuration, and required integrations. Contact us for a white-glove onboarding
            experience.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact?subject=enterprise"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3 rounded-[50px] no-underline"
              style={{ background: "#061A12", color: "#ffffff" }}
            >
              Contact Sales <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-7 py-3 rounded-[50px] no-underline"
              style={{ border: "2px solid #061A12", color: "#061A12" }}
            >
              See pricing overview
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 13: Final CTA ────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "#0F4C2A" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-display font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3.5vw,3rem)", color: "#ffffff" }}
          >
            Ready to give your international school{" "}
            <em className="italic" style={{ color: "#E8A020" }}>
              the platform it deserves?
            </em>
          </h2>
          <p className="text-[17px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Talk to our enterprise team and get a bespoke demo tailored to your curriculum and
            infrastructure.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact?subject=enterprise"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Contact Sales <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{
                background: "transparent",
                border: "2px solid rgba(255,255,255,0.4)",
                color: "#ffffff",
              }}
            >
              Book a Demo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
