import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CreditCard,
  BarChart2,
  Users,
  CalendarDays,
  GraduationCap,
  CheckCircle2,
  X,
  ArrowRight,
  ClipboardList,
  Wallet,
  Building2,
  FileText,
  Star,
  MessageSquare,
  Shield,
  Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "EduMyles for Primary Schools — CBC-Ready School Management",
  description:
    "School management software built for Kenyan primary schools. CBC gradebook, M-Pesa fees, parent communication, and NEMIS-ready reports. PP1 to Class 8.",
  alternates: { canonical: "/solutions/primary" },
};

/* ── Data ──────────────────────────────────────────────────────────────── */

const painPoints = [
  {
    icon: ClipboardList,
    title: "CBC assessment chaos",
    text: "CBC tracking across strands and sub-strands is complex. Most schools still use Excel — and it breaks every term, losing weeks of teacher work.",
  },
  {
    icon: Wallet,
    title: "Fee collection is a nightmare",
    text: "Parents pay in cash, recording is manual, and outstanding balances get lost between terms. Chasing fees wastes your admin's entire week.",
  },
  {
    icon: Building2,
    title: "NEMIS eats days, not hours",
    text: "Manually re-keying student records for government returns takes days of work. One typo and the whole submission bounces back.",
  },
];

const modules = [
  {
    icon: BookOpen,
    title: "CBC Gradebook",
    desc: "Track all CBC strands and sub-strands. Auto-generate KNEC-format report cards. Fully supports PP1/PP2 and Class 1–8.",
  },
  {
    icon: CreditCard,
    title: "M-Pesa Fee Collection",
    desc: "Parents pay via Paybill. Auto-reconciliation. Real-time receipts. Fee balance dashboard updated instantly.",
  },
  {
    icon: BarChart2,
    title: "NEMIS Reporting",
    desc: "One-click NEMIS-compliant export. Student bio-data, enrollment, and class composition — ready for submission.",
  },
  {
    icon: CalendarDays,
    title: "Attendance Tracking",
    desc: "One-tap daily roll call. Auto SMS to parents on absence. Trend reports by class and term, exportable instantly.",
  },
  {
    icon: MessageSquare,
    title: "Parent Communication",
    desc: "SMS, in-app, and WhatsApp alerts. Broadcast to a single class or the whole school. Multilingual: English and Swahili.",
  },
  {
    icon: Users,
    title: "Student Admissions",
    desc: "Digital admission forms. Student profiles with photos. Transfer and promotion management fully automated.",
  },
  {
    icon: GraduationCap,
    title: "Class & Stream Management",
    desc: "Multi-stream support. Auto-promotion at year end. Class statistics dashboard for every teacher and admin.",
  },
  {
    icon: FileText,
    title: "CBC Portfolio Management",
    desc: "Store learner portfolio evidence. Teacher notes per competency. Export for moderation with one click.",
  },
];

const cbcLevels = [
  {
    code: "EE",
    label: "Exceeds Expectations",
    borderColor: "var(--color-action-primary)",
    badgeBg: "color-mix(in srgb, var(--color-action-primary) 12%, transparent)",
    badgeColor: "var(--color-status-warning-solid)",
    dot: "var(--color-text-on-primary-subtle)",
  },
  {
    code: "ME",
    label: "Meets Expectations",
    borderColor: "var(--color-action-primary)",
    badgeBg: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)",
    badgeColor: "var(--color-action-primary)",
    dot: "var(--color-action-primary)",
  },
  {
    code: "AE",
    label: "Approaches Expectations",
    borderColor: "var(--color-status-warning-solid)",
    badgeBg: "color-mix(in srgb, var(--color-status-warning-solid) 10%, transparent)",
    badgeColor: "var(--color-status-warning-on-subtle)",
    dot: "var(--color-status-warning-solid)",
  },
  {
    code: "BE",
    label: "Below Expectations",
    borderColor: "var(--color-status-danger-solid)",
    badgeBg: "color-mix(in srgb, var(--color-status-danger-solid) 8%, transparent)",
    badgeColor: "var(--color-status-danger-on-subtle)",
    dot: "var(--color-status-danger-solid)",
  },
];

const autoGenerates = [
  "End-of-term CBC report cards (KNEC format)",
  "Sub-strand performance per learner",
  "Class-level competency analysis",
  "Intervention flags for BE learners",
  "Portfolio evidence log",
  "NEMIS export in one click",
];

const stats = [
  { value: "40%", label: "Average fee collection improvement" },
  { value: "4 hrs", label: "End-of-term report generation (was 3 days)" },
  { value: "92%", label: "Parent portal adoption rate" },
  { value: "2 weeks", label: "Average onboarding time" },
];

const comparisonRows = [
  {
    feature: "CBC report cards",
    manual: "3 days per term",
    edumyles: "4 hours (auto-generated)",
  },
  {
    feature: "M-Pesa reconciliation",
    manual: "Manual every Monday",
    edumyles: "Real-time, automatic",
  },
  {
    feature: "Parent communication",
    manual: "WhatsApp groups",
    edumyles: "Automated SMS & portal",
  },
  {
    feature: "NEMIS export",
    manual: "Manual re-entry",
    edumyles: "One-click export",
  },
  {
    feature: "Fee tracking",
    manual: "Excel + paper receipts",
    edumyles: "Live dashboard, auto-receipts",
  },
  {
    feature: "Attendance",
    manual: "Paper registers",
    edumyles: "One-tap, SMS alerts",
  },
];

const integrations = [
  { name: "M-Pesa (Safaricom)", tag: "Native", color: "var(--color-action-primary)" },
  { name: "SMS Gateway", tag: "Native", color: "var(--color-action-primary)" },
  { name: "WhatsApp Business", tag: "Native", color: "var(--color-action-primary)" },
  { name: "NEMIS (Ministry of Education)", tag: "Native", color: "var(--color-action-primary)" },
  { name: "Google Classroom", tag: "Beta", color: "var(--color-action-primary-text)" },
  { name: "Excel / Sheets Export", tag: "Native", color: "var(--color-action-primary)" },
];

const faqs = [
  {
    q: "Is EduMyles suitable for small schools (< 100 learners)?",
    a: "Yes, our Starter plan covers up to 500 learners and is perfect for small primary schools. You only pay for what you need.",
  },
  {
    q: "Does it support both CBC and 8-4-4?",
    a: "Yes, both are fully supported. You can have CBC classes and 8-4-4 classes in the same school account with no configuration conflict.",
  },
  {
    q: "What if we have poor internet connectivity?",
    a: "EduMyles is optimised for low bandwidth. Core features work on 2G/3G and we have an offline mode in development for areas with no coverage.",
  },
  {
    q: "How long does it take to go live?",
    a: "Most primary schools are fully live within 2 weeks. Our onboarding team guides you every step of the way — from data import to first report card.",
  },
  {
    q: "Can parents access grades in real time?",
    a: "Yes — the parent portal shows CBC performance, attendance, and fee balance the moment teachers update them. No more parent queues at the office.",
  },
  {
    q: "Is NEMIS export free?",
    a: "Yes, NEMIS export is included in all plans at no additional cost. We believe government compliance should never be a premium feature.",
  },
];

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function PrimarySchoolsPage() {
  return (
    <div style={{ color: "var(--color-text-default)" }}>
      {/* ─────────────────────────────────────────────────────────
          SECTION 1 · HERO
      ───────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "var(--color-surface-default)",
          borderTop: "3px solid var(--color-action-primary)",
          padding: "6rem 2rem 5rem",
          minHeight: "580px",
        }}
      >
        {/* Gold grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full text-center">
          {/* Eyebrow */}
          <div
            className="inline-block font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
            style={{
              background: "color-mix(in srgb, var(--color-action-primary) 12%, transparent)",
              border: "1px solid var(--color-text-on-primary-subtle)",
              color: "var(--color-text-on-primary-subtle)",
            }}
          >
            For Primary Schools
          </div>

          {/* H1 */}
          <h1
            className="font-display font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "var(--color-text-default)" }}
          >
            Built for CBC. Made for{" "}
            <em className="italic" style={{ color: "var(--color-text-on-primary-subtle)" }}>
              primary schools.
            </em>
          </h1>

          {/* Subtitle */}
          <p
            className="font-jakarta font-light leading-[1.8] mb-8 mx-auto"
            style={{ fontSize: "18px", color: "var(--color-text-muted)", maxWidth: "660px" }}
          >
            From PP1 to Class 8 — EduMyles handles CBC assessment, M-Pesa fee collection, NEMIS
            reporting, and parent communication in one platform built for Kenya.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <a
              href="/waitlist"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{
                background: "transparent",
                border: "2px solid color-mix(in srgb, var(--color-surface-default) 40%, transparent)",
                color: "var(--color-text-inverse)",
              }}
            >
              Book a Demo
            </a>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[
              "CBC & 8-4-4 Gradebook",
              "M-Pesa Integration",
              "NEMIS Export Ready",
              "Offline-capable",
            ].map((badge) => (
              <span
                key={badge}
                className="font-semibold text-[12px] px-4 py-2 rounded-[50px]"
                style={{
                  background: "color-mix(in srgb, var(--color-surface-default) 7%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-surface-default) 20%, transparent)",
                  color: "var(--color-text-muted)",
                }}
              >
                ✓ {badge}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div
            className="inline-flex flex-wrap justify-center gap-0 rounded-2xl overflow-hidden mx-auto"
            style={{ border: "1px solid color-mix(in srgb, var(--color-action-primary) 20%, transparent)" }}
          >
            {[
              { value: "520 avg", sub: "students per school" },
              { value: "3 hrs", sub: "to generate all reports" },
              { value: "2-week", sub: "onboarding" },
            ].map((s, i) => (
              <div
                key={i}
                className="px-8 py-4 text-center"
                style={{
                  background: "color-mix(in srgb, var(--color-action-primary) 6%, transparent)",
                  borderRight: i < 2 ? "1px solid color-mix(in srgb, var(--color-action-primary) 20%, transparent)" : "none",
                }}
              >
                <div className="font-display font-bold text-[1.5rem]" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                  {s.value}
                </div>
                <div className="font-jakarta text-[12px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 2 · PAIN POINTS
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--color-chrome-platform)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p
              className="font-jakarta font-semibold text-[13px] uppercase tracking-[0.12em] mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              The challenges primary schools face
            </p>
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "var(--color-text-inverse)" }}
            >
              Sound familiar?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((p, i) => (
              <div
                key={i}
                className="rounded-2xl p-8"
                style={{
                  background: "color-mix(in srgb, var(--color-surface-default) 5%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-action-primary) 20%, transparent)",
                }}
              >
                {/* Number badge */}
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="font-display font-bold text-[22px] leading-none"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="font-jakarta text-[11px] font-semibold uppercase tracking-[0.1em] px-3 py-1 rounded-[50px]"
                    style={{ background: "color-mix(in srgb, var(--color-surface-default) 12%, transparent)", color: "var(--color-surface-page)" }}
                  >
                    Before EduMyles
                  </span>
                </div>
                <div className="mb-4">
                  <p.icon className="w-10 h-10" strokeWidth={1.5} style={{ color: "var(--color-text-muted)" }} />
                </div>
                <h3
                  className="font-display font-bold text-[18px] mb-3"
                  style={{ color: "var(--color-text-inverse)" }}
                >
                  {p.title}
                </h3>
                <p className="font-jakarta leading-[1.8] text-[15px]" style={{ color: "var(--color-action-primary-disabled)" }}>
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 3 · HOW EDUMYLES SOLVES IT (3-step process)
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-default)" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)", color: "var(--color-action-primary)" }}
            >
              Getting started
            </div>
            <h2
              className="font-display font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "var(--color-text-default)" }}
            >
              From chaos to clarity in{" "}
              <em className="italic" style={{ color: "var(--color-action-primary)" }}>
                3 steps
              </em>
            </h2>
            <p
              className="font-jakarta text-[16px] leading-[1.7]"
              style={{ color: "var(--color-text-muted)", maxWidth: "520px", margin: "0 auto" }}
            >
              Most primary schools are fully live and generating reports within two weeks.
            </p>
          </div>

          {/* Steps — horizontal on desktop, vertical on mobile */}
          <div className="relative">
            {/* Connector line (desktop only) */}
            <div
              className="hidden md:block absolute top-[38px] left-[calc(16.66%-8px)] right-[calc(16.66%-8px)] h-[2px]"
              style={{ background: "linear-gradient(90deg,var(--color-text-on-primary-subtle),var(--color-action-primary),var(--color-action-primary))", zIndex: 0 }}
            />

            <div className="grid md:grid-cols-3 gap-8 relative" style={{ zIndex: 1 }}>
              {[
                {
                  step: "1",
                  title: "Set up your school",
                  desc: "Import students, configure classes, and set up CBC strands. Our team handles the heavy lifting.",
                  time: "Day 1",
                  timeBg: "color-mix(in srgb, var(--color-action-primary) 12%, transparent)",
                  timeColor: "var(--color-status-warning-solid)",
                },
                {
                  step: "2",
                  title: "Connect M-Pesa & communication",
                  desc: "Paybill linked, parent SMS active. Parents can pay and receive alerts from day two.",
                  time: "Day 2",
                  timeBg: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)",
                  timeColor: "var(--color-action-primary)",
                },
                {
                  step: "3",
                  title: "Go live & grow",
                  desc: "Attendance, grades, and reports all flowing. Your school runs on one connected platform.",
                  time: "Week 2",
                  timeBg: "color-mix(in srgb, var(--color-status-success-on-subtle) 10%, transparent)",
                  timeColor: "var(--color-action-primary)",
                },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center text-center">
                  {/* Numbered circle */}
                  <div
                    className="flex items-center justify-center font-display font-bold text-[22px] rounded-full mb-6 flex-shrink-0"
                    style={{
                      width: "64px",
                      height: "64px",
                      background: "var(--color-action-primary)",
                      color: "var(--color-text-on-primary)",
                      boxShadow: "0 0 0 6px color-mix(in srgb, var(--color-action-primary) 15%, transparent)",
                    }}
                  >
                    {s.step}
                  </div>
                  <span
                    className="font-jakarta font-semibold text-[12px] px-3 py-1 rounded-[50px] mb-3"
                    style={{ background: s.timeBg, color: s.timeColor }}
                  >
                    {s.time}
                  </span>
                  <h3
                    className="font-display font-bold text-[19px] mb-3"
                    style={{ color: "var(--color-text-default)" }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="font-jakarta text-[14px] leading-[1.75]"
                    style={{ color: "var(--color-text-muted)", maxWidth: "280px" }}
                  >
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 4 · CORE MODULES (8 modules)
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-default)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "color-mix(in srgb, var(--color-action-primary) 10%, transparent)", color: "var(--color-status-warning-solid)" }}
            >
              Features for Primary Schools
            </div>
            <h2
              className="font-display font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "var(--color-text-default)" }}
            >
              Everything a primary school needs
            </h2>
            <p className="font-jakarta text-[16px] leading-[1.7]" style={{ color: "var(--color-text-muted)" }}>
              8 integrated modules, configured for CBC primary education
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((m) => (
              <div
                key={m.title}
                className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: "var(--color-surface-default)",
                  border: "1px solid var(--color-border-default)",
                  boxShadow: "0 2px 16px color-mix(in srgb, var(--color-surface-page) 5%, transparent)",
                }}
              >
                <div
                  className="flex items-center justify-center mb-4 rounded-[14px]"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)",
                  }}
                >
                  <m.icon className="w-6 h-6" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
                </div>
                <h3
                  className="font-display font-bold text-[17px] mb-2"
                  style={{ color: "var(--color-text-default)" }}
                >
                  {m.title}
                </h3>
                <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "var(--color-text-muted)" }}>
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 5 · CBC DEEP-DIVE
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-page)" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)", color: "var(--color-action-primary)" }}
            >
              CBC Grading System
            </div>
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "var(--color-text-default)" }}
            >
              CBC grading,{" "}
              <em className="italic" style={{ color: "var(--color-action-primary)" }}>
                done right.
              </em>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Left: performance levels */}
            <div>
              <p
                className="font-jakarta font-semibold text-[13px] uppercase tracking-[0.1em] mb-5 text-accent-foreground"
              >
                4 CBC performance levels
              </p>
              <div className="flex flex-col gap-4">
                {cbcLevels.map((lvl) => (
                  <div
                    key={lvl.code}
                    className="flex items-center gap-4 rounded-xl p-4"
                    style={{
                      background: "var(--color-surface-default)",
                      border: `2px solid ${lvl.borderColor}20`,
                      boxShadow: "0 1px 8px color-mix(in srgb, var(--color-surface-page) 5%, transparent)",
                    }}
                  >
                    <div
                      className="flex-shrink-0 flex items-center justify-center font-display font-bold text-[18px] rounded-[10px]"
                      style={{
                        width: "52px",
                        height: "52px",
                        background: lvl.badgeBg,
                        color: lvl.badgeColor,
                      }}
                    >
                      {lvl.code}
                    </div>
                    <div>
                      <div
                        className="font-display font-bold text-[16px]"
                        style={{ color: "var(--color-text-default)" }}
                      >
                        {lvl.code}
                      </div>
                      <div className="font-jakarta text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                        {lvl.label}
                      </div>
                    </div>
                    <div
                      className="ml-auto w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: lvl.dot }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: what EduMyles generates */}
            <div
              className="rounded-2xl p-8"
              style={{
                background: "var(--color-surface-default)",
                border: "1px solid var(--color-border-default)",
                boxShadow: "0 2px 16px color-mix(in srgb, var(--color-surface-page) 6%, transparent)",
              }}
            >
              <p className="font-display font-bold text-[20px] mb-6" style={{ color: "var(--color-text-default)" }}>
                What EduMyles auto-generates
              </p>
              <ul className="flex flex-col gap-4">
                {autoGenerates.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      strokeWidth={2}
                      style={{ color: "var(--color-action-primary)" }}
                    />
                    <span
                      className="font-jakarta text-[15px] leading-[1.65]"
                      style={{ color: "var(--color-text-default)" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--color-border-default)" }}>
                <a
                  href="/waitlist"
                  className="inline-flex items-center gap-2 font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] no-underline"
                  style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
                >
                  Preview a report card <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 6 · RESULTS / STATS BAR
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-default)" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "var(--color-text-default)" }}
            >
              What primary schools achieve with{" "}
              <em className="italic" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                EduMyles
              </em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s) => (
              <div
                key={s.value}
                className="rounded-2xl p-8 text-center"
                style={{
                  background: "color-mix(in srgb, var(--color-surface-default) 5%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-action-primary) 20%, transparent)",
                }}
              >
                <div
                  className="font-display font-bold mb-3"
                  style={{ fontSize: "clamp(2rem,3.5vw,2.75rem)", color: "var(--color-text-on-primary-subtle)", lineHeight: 1 }}
                >
                  {s.value}
                </div>
                <p className="font-jakarta text-[14px] leading-[1.6]" style={{ color: "var(--color-text-muted)" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 7 · TESTIMONIAL
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-sunken)" }}>
        <div className="max-w-[840px] mx-auto text-center">
          {/* Stars */}
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className="w-5 h-5"
                fill="var(--color-text-on-primary-subtle)"
                strokeWidth={0}
                style={{ color: "var(--color-text-on-primary-subtle)" }}
              />
            ))}
          </div>
          {/* Large quotation mark */}
          <div
            className="font-display leading-none mb-4 select-none"
            style={{ fontSize: "6rem", color: "var(--color-text-on-primary-subtle)", lineHeight: 0.7, opacity: 0.5 }}
          >
            &ldquo;
          </div>
          <blockquote
            className="font-display italic leading-[1.8] mb-7"
            style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)", color: "var(--color-text-default)" }}
          >
            We have 520 learners from PP2 to Class 8. Before EduMyles, CBC report cards alone took
            three teachers an entire weekend every term. Now it takes four hours. The M-Pesa
            integration means zero cash handling — parents love it.
          </blockquote>
          <p className="font-jakarta font-semibold text-[14px]" style={{ color: "var(--color-action-primary)" }}>
            — James M., Head Teacher, Greenfield Primary School, Thika
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 8 · COMPARISON TABLE
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-default)" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "color-mix(in srgb, var(--color-surface-page) 7%, transparent)", color: "var(--color-text-default)" }}
            >
              Why switch?
            </div>
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "var(--color-text-default)" }}
            >
              EduMyles vs{" "}
              <em className="italic" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                the old way
              </em>
            </h2>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-border-default)", boxShadow: "0 2px 20px color-mix(in srgb, var(--color-surface-page) 7%, transparent)" }}
          >
            {/* Header */}
            <div className="grid grid-cols-3" style={{ background: "var(--color-chrome-platform)" }}>
              <div
                className="px-6 py-4 font-jakarta font-semibold text-[13px] uppercase tracking-[0.08em]"
                style={{ color: "var(--color-surface-page)" }}
              >
                Feature
              </div>
              <div
                className="px-6 py-4 font-jakarta font-semibold text-[13px] uppercase tracking-[0.08em] text-center"
                style={{ color: "var(--color-status-danger-on-subtle)" }}
              >
                Manual / Excel
              </div>
              <div
                className="px-6 py-4 font-jakarta font-semibold text-[13px] uppercase tracking-[0.08em] text-center"
                style={{ color: "var(--color-text-muted)" }}
              >
                EduMyles
              </div>
            </div>
            {/* Rows */}
            {comparisonRows.map((row, i) => (
              <div
                key={row.feature}
                className="grid grid-cols-3 items-center"
                style={{
                  background: i % 2 === 0 ? "var(--color-surface-default)" : "var(--color-surface-sunken)",
                  borderTop: "1px solid var(--color-border-default)",
                }}
              >
                <div
                  className="px-6 py-4 font-jakarta font-semibold text-[14px]"
                  style={{ color: "var(--color-text-default)" }}
                >
                  {row.feature}
                </div>
                <div className="px-6 py-4 text-center">
                  <span
                    className="inline-flex items-center gap-1.5 font-jakarta text-[13px]"
                    style={{ color: "var(--color-status-danger-solid)" }}
                  >
                    <X className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
                    {row.manual}
                  </span>
                </div>
                <div className="px-6 py-4 text-center">
                  <span
                    className="inline-flex items-center gap-1.5 font-jakarta text-[13px] font-semibold"
                    style={{ color: "var(--color-action-primary)" }}
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                    {row.edumyles}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 9 · INTEGRATIONS
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-page)" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)", color: "var(--color-action-primary)" }}
            >
              Integrations
            </div>
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "var(--color-text-default)" }}
            >
              Plays well with{" "}
              <em className="italic" style={{ color: "var(--color-action-primary)" }}>
                what you already use
              </em>
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {integrations.map((intg) => (
              <div
                key={intg.name}
                className="flex items-center gap-3 rounded-[50px] px-5 py-3"
                style={{
                  background: "var(--color-surface-default)",
                  border: "1px solid var(--color-border-default)",
                  boxShadow: "0 1px 8px color-mix(in srgb, var(--color-surface-page) 5%, transparent)",
                }}
              >
                <Globe className="w-4 h-4" strokeWidth={1.5} style={{ color: intg.color }} />
                <span
                  className="font-jakarta font-semibold text-[14px]"
                  style={{ color: "var(--color-text-default)" }}
                >
                  {intg.name}
                </span>
                <span
                  className="font-jakarta font-semibold text-[11px] px-2 py-0.5 rounded-[50px]"
                  style={{
                    background:
                      intg.color === "var(--color-action-primary)" ? "color-mix(in srgb, var(--color-action-primary) 10%, transparent)" : "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)",
                    color: intg.color,
                  }}
                >
                  {intg.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 10 · FAQ
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-default)" }}>
        <div className="max-w-[860px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "color-mix(in srgb, var(--color-action-primary) 10%, transparent)", color: "var(--color-status-warning-solid)" }}
            >
              FAQ
            </div>
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "var(--color-text-default)" }}
            >
              Common questions from primary schools
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl p-7"
                style={{
                  background: "var(--color-surface-default)",
                  border: "1px solid var(--color-border-default)",
                  boxShadow: "0 1px 8px color-mix(in srgb, var(--color-surface-page) 4%, transparent)",
                }}
              >
                <h3
                  className="font-display font-bold text-[17px] mb-3"
                  style={{ color: "var(--color-text-default)" }}
                >
                  {faq.q}
                </h3>
                <p className="font-jakarta text-[14px] leading-[1.8]" style={{ color: "var(--color-text-muted)" }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 11 · PRICING CALLOUT
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-page)" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)", color: "var(--color-action-primary)" }}
            >
              Pricing
            </div>
            <h2
              className="font-display font-bold leading-[1.2] mb-4"
              style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "var(--color-text-default)" }}
            >
              Affordable for every primary school
            </h2>
            <p className="font-jakarta text-[15px]" style={{ color: "var(--color-text-muted)" }}>
              30-day free trial · No credit card required
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              {
                plan: "Starter",
                price: "KES 12,900",
                period: "/month",
                capacity: "Up to 500 learners",
                highlight: false,
                features: [
                  "CBC Gradebook (PP1–Class 8)",
                  "M-Pesa Integration",
                  "NEMIS Export",
                  "Parent SMS Alerts",
                  "Attendance Tracking",
                ],
              },
              {
                plan: "Growth",
                price: "KES 21,500",
                period: "/month",
                capacity: "Up to 1,000 learners",
                highlight: true,
                features: [
                  "Everything in Starter",
                  "CBC Portfolio Management",
                  "WhatsApp Alerts",
                  "Advanced Analytics",
                  "Priority Support",
                ],
              },
            ].map((tier) => (
              <div
                key={tier.plan}
                className="rounded-2xl p-8"
                style={{
                  background: tier.highlight ? "var(--color-action-primary)" : "var(--color-surface-default)",
                  border: tier.highlight ? "2px solid var(--color-action-primary)" : "1px solid var(--color-border-default)",
                  boxShadow: tier.highlight
                    ? "0 8px 32px color-mix(in srgb, var(--color-action-primary) 20%, transparent)"
                    : "0 2px 16px color-mix(in srgb, var(--color-surface-page) 6%, transparent)",
                }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p
                      className="font-jakarta font-semibold text-[13px] uppercase tracking-[0.1em] mb-1"
                      style={{ color: tier.highlight ? "var(--color-text-on-primary-subtle)" : "var(--color-action-primary)" }}
                    >
                      {tier.plan}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="font-display font-bold"
                        style={{ fontSize: "2rem", color: tier.highlight ? "var(--color-text-on-primary)" : "var(--color-text-default)" }}
                      >
                        {tier.price}
                      </span>
                      <span
                        className="font-jakarta text-[14px]"
                        style={{ color: tier.highlight ? "var(--color-text-on-primary)" : "var(--color-text-muted)" }}
                      >
                        {tier.period}
                      </span>
                    </div>
                    <p
                      className="font-jakarta text-[13px] mt-1"
                      style={{ color: tier.highlight ? "var(--color-text-on-primary)" : "var(--color-text-muted)" }}
                    >
                      {tier.capacity}
                    </p>
                  </div>
                  {tier.highlight && (
                    <span
                      className="font-jakarta font-bold text-[11px] px-3 py-1 rounded-[50px]"
                      style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
                    >
                      Most Popular
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0"
                        strokeWidth={2}
                        style={{ color: tier.highlight ? "var(--color-text-on-primary-subtle)" : "var(--color-action-primary)" }}
                      />
                      <span
                        className="font-jakarta text-[14px]"
                        style={{ color: tier.highlight ? "var(--color-text-on-primary)" : "var(--color-text-default)" }}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/waitlist"
                  className="block text-center font-jakarta font-bold text-[15px] px-6 py-3 rounded-[50px] no-underline"
                  style={{
                    background: tier.highlight ? "var(--color-action-primary)" : "var(--color-action-primary)",
                    color: "var(--color-text-on-primary)",
                  }}
                >
                  Start Free Trial
                </a>
              </div>
            ))}
          </div>

          <div className="text-center flex flex-wrap justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-7 py-3 rounded-[50px] no-underline"
              style={{ border: "2px solid var(--color-border-default)", color: "var(--color-text-default)" }}
            >
              See full pricing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 12 · FINAL CTA
      ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "var(--color-action-primary)" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <div className="flex justify-center gap-1 mb-8">
            <Shield className="w-8 h-8" strokeWidth={1.5} style={{ color: "var(--color-text-on-primary)" }} />
          </div>
          <h2
            className="font-display font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3.5vw,3rem)", color: "var(--color-text-on-primary)" }}
          >
            Ready to bring your primary school{" "}
            <em className="italic" style={{ color: "var(--color-text-on-primary)" }}>
              into the digital age?
            </em>
          </h2>
          <p className="font-jakarta text-[17px] leading-[1.7] mb-8" style={{ color: "var(--color-text-on-primary)" }}>
            Join hundreds of Kenyan primary schools already running on EduMyles. Set up in days, not
            months.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a
              href="/waitlist"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "var(--color-text-on-primary)", color: "var(--color-action-primary)" }}
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{
                background: "transparent",
                border: "2px solid color-mix(in srgb, var(--color-text-on-primary) 45%, transparent)",
                color: "var(--color-text-on-primary)",
              }}
            >
              Book a Demo
            </a>
          </div>
          <p className="font-jakarta text-[13px]" style={{ color: "var(--color-text-on-primary)" }}>
            30-day free trial · No credit card required · Onboarding included
          </p>
        </div>
      </section>
    </div>
  );
}
