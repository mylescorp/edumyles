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
    borderColor: "#E8A020",
    badgeBg: "rgba(232,160,32,0.12)",
    badgeColor: "#9A5D00",
    dot: "#E8A020",
  },
  {
    code: "ME",
    label: "Meets Expectations",
    borderColor: "#1A7A4A",
    badgeBg: "rgba(26,122,74,0.1)",
    badgeColor: "#0F4C2A",
    dot: "#1A7A4A",
  },
  {
    code: "AE",
    label: "Approaches Expectations",
    borderColor: "#D97706",
    badgeBg: "rgba(217,119,6,0.1)",
    badgeColor: "#92400E",
    dot: "#D97706",
  },
  {
    code: "BE",
    label: "Below Expectations",
    borderColor: "#DC2626",
    badgeBg: "rgba(220,38,38,0.08)",
    badgeColor: "#991B1B",
    dot: "#DC2626",
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
  { name: "M-Pesa (Safaricom)", tag: "Native", color: "#1A7A4A" },
  { name: "Africa's Talking SMS", tag: "Native", color: "#1A7A4A" },
  { name: "WhatsApp Business", tag: "Native", color: "#1A7A4A" },
  { name: "NEMIS (Ministry of Education)", tag: "Native", color: "#1A7A4A" },
  { name: "Google Classroom", tag: "Beta", color: "#6366F1" },
  { name: "Excel / Sheets Export", tag: "Native", color: "#1A7A4A" },
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
    <div style={{ color: "#212121" }}>

      {/* ─────────────────────────────────────────────────────────
          SECTION 1 · HERO
      ───────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "6rem 2rem 5rem",
          minHeight: "580px",
        }}
      >
        {/* Gold grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full text-center">
          {/* Eyebrow */}
          <div
            className="inline-block font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
            style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}
          >
            For Primary Schools
          </div>

          {/* H1 */}
          <h1
            className="font-playfair font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
          >
            Built for CBC. Made for{" "}
            <em className="italic" style={{ color: "#E8A020" }}>primary schools.</em>
          </h1>

          {/* Subtitle */}
          <p
            className="font-jakarta font-light leading-[1.8] mb-8 mx-auto"
            style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "660px" }}
          >
            From PP1 to Class 8 — EduMyles handles CBC assessment, M-Pesa fee collection,
            NEMIS reporting, and parent communication in one platform built for Kenya.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <a
              href="/waitlist"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              Book a Demo
            </a>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {["CBC & 8-4-4 Gradebook", "M-Pesa Integration", "NEMIS Export Ready", "Offline-capable"].map((badge) => (
              <span
                key={badge}
                className="font-semibold text-[12px] px-4 py-2 rounded-[50px]"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.2)", color: "#A8E6C3" }}
              >
                ✓ {badge}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div
            className="inline-flex flex-wrap justify-center gap-0 rounded-2xl overflow-hidden mx-auto"
            style={{ border: "1px solid rgba(232,160,32,0.2)" }}
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
                  background: "rgba(232,160,32,0.06)",
                  borderRight: i < 2 ? "1px solid rgba(232,160,32,0.2)" : "none",
                }}
              >
                <div className="font-playfair font-bold text-[1.5rem]" style={{ color: "#E8A020" }}>{s.value}</div>
                <div className="font-jakarta text-[12px] mt-0.5" style={{ color: "#90CAF9" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 2 · PAIN POINTS
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#0C3020" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p
              className="font-jakarta font-semibold text-[13px] uppercase tracking-[0.12em] mb-3"
              style={{ color: "#E8A020" }}
            >
              The challenges primary schools face
            </p>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
            >
              Sound familiar?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((p, i) => (
              <div
                key={i}
                className="rounded-2xl p-8"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,160,32,0.2)" }}
              >
                {/* Number badge */}
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="font-playfair font-bold text-[22px] leading-none"
                    style={{ color: "#E8A020" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="font-jakarta text-[11px] font-semibold uppercase tracking-[0.1em] px-3 py-1 rounded-[50px]"
                    style={{ background: "rgba(232,160,32,0.1)", color: "#E8A020" }}
                  >
                    Before EduMyles
                  </span>
                </div>
                <div className="mb-4">
                  <p.icon className="w-10 h-10" strokeWidth={1.5} style={{ color: "#E8A020" }} />
                </div>
                <h3 className="font-playfair font-bold text-[18px] mb-3" style={{ color: "#ffffff" }}>
                  {p.title}
                </h3>
                <p className="font-jakarta leading-[1.8] text-[15px]" style={{ color: "#A8E6C3" }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 3 · HOW EDUMYLES SOLVES IT (3-step process)
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(26,122,74,0.1)", color: "#0F4C2A" }}
            >
              Getting started
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              From chaos to clarity in{" "}
              <em className="italic" style={{ color: "#1A7A4A" }}>3 steps</em>
            </h2>
            <p className="font-jakarta text-[16px] leading-[1.7]" style={{ color: "#5a5a5a", maxWidth: "520px", margin: "0 auto" }}>
              Most primary schools are fully live and generating reports within two weeks.
            </p>
          </div>

          {/* Steps — horizontal on desktop, vertical on mobile */}
          <div className="relative">
            {/* Connector line (desktop only) */}
            <div
              className="hidden md:block absolute top-[38px] left-[calc(16.66%-8px)] right-[calc(16.66%-8px)] h-[2px]"
              style={{ background: "linear-gradient(90deg,#E8A020,#1A7A4A,#0F4C2A)", zIndex: 0 }}
            />

            <div className="grid md:grid-cols-3 gap-8 relative" style={{ zIndex: 1 }}>
              {[
                {
                  step: "1",
                  title: "Set up your school",
                  desc: "Import students, configure classes, and set up CBC strands. Our team handles the heavy lifting.",
                  time: "Day 1",
                  timeBg: "rgba(232,160,32,0.12)",
                  timeColor: "#9A5D00",
                },
                {
                  step: "2",
                  title: "Connect M-Pesa & communication",
                  desc: "Paybill linked, parent SMS active. Parents can pay and receive alerts from day two.",
                  time: "Day 2",
                  timeBg: "rgba(26,122,74,0.1)",
                  timeColor: "#0F4C2A",
                },
                {
                  step: "3",
                  title: "Go live & grow",
                  desc: "Attendance, grades, and reports all flowing. Your school runs on one connected platform.",
                  time: "Week 2",
                  timeBg: "rgba(15,76,42,0.1)",
                  timeColor: "#0F4C2A",
                },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center text-center">
                  {/* Numbered circle */}
                  <div
                    className="flex items-center justify-center font-playfair font-bold text-[22px] rounded-full mb-6 flex-shrink-0"
                    style={{
                      width: "64px",
                      height: "64px",
                      background: "#E8A020",
                      color: "#061A12",
                      boxShadow: "0 0 0 6px rgba(232,160,32,0.15)",
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
                  <h3 className="font-playfair font-bold text-[19px] mb-3" style={{ color: "#061A12" }}>
                    {s.title}
                  </h3>
                  <p className="font-jakarta text-[14px] leading-[1.75]" style={{ color: "#5a5a5a", maxWidth: "280px" }}>
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
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              Features for Primary Schools
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Everything a primary school needs
            </h2>
            <p className="font-jakarta text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              8 integrated modules, configured for CBC primary education
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((m) => (
              <div
                key={m.title}
                className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e8f4ec",
                  boxShadow: "0 2px 16px rgba(6,26,18,0.05)",
                }}
              >
                <div
                  className="flex items-center justify-center mb-4 rounded-[14px]"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "rgba(26,122,74,0.1)",
                  }}
                >
                  <m.icon className="w-6 h-6" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
                </div>
                <h3 className="font-playfair font-bold text-[17px] mb-2" style={{ color: "#061A12" }}>
                  {m.title}
                </h3>
                <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 5 · CBC DEEP-DIVE
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(26,122,74,0.1)", color: "#0F4C2A" }}
            >
              CBC Grading System
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              CBC grading,{" "}
              <em className="italic" style={{ color: "#1A7A4A" }}>done right.</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Left: performance levels */}
            <div>
              <p className="font-jakarta font-semibold text-[13px] uppercase tracking-[0.1em] mb-5" style={{ color: "#5a5a5a" }}>
                4 CBC performance levels
              </p>
              <div className="flex flex-col gap-4">
                {cbcLevels.map((lvl) => (
                  <div
                    key={lvl.code}
                    className="flex items-center gap-4 rounded-xl p-4"
                    style={{ background: "#ffffff", border: `2px solid ${lvl.borderColor}20`, boxShadow: "0 1px 8px rgba(6,26,18,0.05)" }}
                  >
                    <div
                      className="flex-shrink-0 flex items-center justify-center font-playfair font-bold text-[18px] rounded-[10px]"
                      style={{ width: "52px", height: "52px", background: lvl.badgeBg, color: lvl.badgeColor }}
                    >
                      {lvl.code}
                    </div>
                    <div>
                      <div className="font-playfair font-bold text-[16px]" style={{ color: "#061A12" }}>{lvl.code}</div>
                      <div className="font-jakarta text-[13px]" style={{ color: "#5a5a5a" }}>{lvl.label}</div>
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
              style={{ background: "#ffffff", border: "1px solid #e8f4ec", boxShadow: "0 2px 16px rgba(6,26,18,0.06)" }}
            >
              <p className="font-playfair font-bold text-[20px] mb-6" style={{ color: "#061A12" }}>
                What EduMyles auto-generates
              </p>
              <ul className="flex flex-col gap-4">
                {autoGenerates.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={2} style={{ color: "#1A7A4A" }} />
                    <span className="font-jakarta text-[15px] leading-[1.65]" style={{ color: "#3d3d3d" }}>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6" style={{ borderTop: "1px solid #e8f4ec" }}>
                <a
                  href="/waitlist"
                  className="inline-flex items-center gap-2 font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] no-underline"
                  style={{ background: "#1A7A4A", color: "#ffffff" }}
                >
                  See a sample report card <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 6 · RESULTS / STATS BAR
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#061A12" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#ffffff" }}
            >
              What primary schools achieve with{" "}
              <em className="italic" style={{ color: "#E8A020" }}>EduMyles</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s) => (
              <div
                key={s.value}
                className="rounded-2xl p-8 text-center"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,160,32,0.2)" }}
              >
                <div
                  className="font-playfair font-bold mb-3"
                  style={{ fontSize: "clamp(2rem,3.5vw,2.75rem)", color: "#E8A020", lineHeight: 1 }}
                >
                  {s.value}
                </div>
                <p className="font-jakarta text-[14px] leading-[1.6]" style={{ color: "#A8E6C3" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 7 · TESTIMONIAL
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#FEF3DC" }}>
        <div className="max-w-[840px] mx-auto text-center">
          {/* Stars */}
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className="w-5 h-5" fill="#E8A020" strokeWidth={0} style={{ color: "#E8A020" }} />
            ))}
          </div>
          {/* Large quotation mark */}
          <div
            className="font-playfair leading-none mb-4 select-none"
            style={{ fontSize: "6rem", color: "#E8A020", lineHeight: 0.7, opacity: 0.5 }}
          >
            &ldquo;
          </div>
          <blockquote
            className="font-playfair italic leading-[1.8] mb-7"
            style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)", color: "#2d2d2d" }}
          >
            We have 520 learners from PP2 to Class 8. Before EduMyles, CBC report cards alone took three teachers an entire weekend every term. Now it takes four hours. The M-Pesa integration means zero cash handling — parents love it.
          </blockquote>
          <p className="font-jakarta font-semibold text-[14px]" style={{ color: "#0F4C2A" }}>
            — James M., Head Teacher, Greenfield Primary School, Thika
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 8 · COMPARISON TABLE
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(6,26,18,0.07)", color: "#061A12" }}
            >
              Why switch?
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              EduMyles vs{" "}
              <em className="italic" style={{ color: "#E8A020" }}>the old way</em>
            </h2>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e8f4ec", boxShadow: "0 2px 20px rgba(6,26,18,0.07)" }}>
            {/* Header */}
            <div className="grid grid-cols-3" style={{ background: "#061A12" }}>
              <div className="px-6 py-4 font-jakarta font-semibold text-[13px] uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.5)" }}>
                Feature
              </div>
              <div className="px-6 py-4 font-jakarta font-semibold text-[13px] uppercase tracking-[0.08em] text-center" style={{ color: "#FCA5A5" }}>
                Manual / Excel
              </div>
              <div className="px-6 py-4 font-jakarta font-semibold text-[13px] uppercase tracking-[0.08em] text-center" style={{ color: "#A8E6C3" }}>
                EduMyles
              </div>
            </div>
            {/* Rows */}
            {comparisonRows.map((row, i) => (
              <div
                key={row.feature}
                className="grid grid-cols-3 items-center"
                style={{ background: i % 2 === 0 ? "#ffffff" : "#F9FDFB", borderTop: "1px solid #e8f4ec" }}
              >
                <div className="px-6 py-4 font-jakarta font-semibold text-[14px]" style={{ color: "#061A12" }}>
                  {row.feature}
                </div>
                <div className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1.5 font-jakarta text-[13px]" style={{ color: "#DC2626" }}>
                    <X className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
                    {row.manual}
                  </span>
                </div>
                <div className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1.5 font-jakarta text-[13px] font-semibold" style={{ color: "#1A7A4A" }}>
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
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(26,122,74,0.1)", color: "#0F4C2A" }}
            >
              Integrations
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
            >
              Plays well with{" "}
              <em className="italic" style={{ color: "#1A7A4A" }}>what you already use</em>
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {integrations.map((intg) => (
              <div
                key={intg.name}
                className="flex items-center gap-3 rounded-[50px] px-5 py-3"
                style={{ background: "#ffffff", border: "1px solid #e8f4ec", boxShadow: "0 1px 8px rgba(6,26,18,0.05)" }}
              >
                <Globe className="w-4 h-4" strokeWidth={1.5} style={{ color: intg.color }} />
                <span className="font-jakarta font-semibold text-[14px]" style={{ color: "#061A12" }}>{intg.name}</span>
                <span
                  className="font-jakarta font-semibold text-[11px] px-2 py-0.5 rounded-[50px]"
                  style={{
                    background: intg.color === "#6366F1" ? "rgba(99,102,241,0.1)" : "rgba(26,122,74,0.1)",
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
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[860px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              FAQ
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
            >
              Common questions from primary schools
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl p-7"
                style={{ background: "#ffffff", border: "1px solid #e8f4ec", boxShadow: "0 1px 8px rgba(6,26,18,0.04)" }}
              >
                <h3 className="font-playfair font-bold text-[17px] mb-3" style={{ color: "#061A12" }}>
                  {faq.q}
                </h3>
                <p className="font-jakarta text-[14px] leading-[1.8]" style={{ color: "#5a5a5a" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 11 · PRICING CALLOUT
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(26,122,74,0.1)", color: "#0F4C2A" }}
            >
              Pricing
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-4"
              style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
            >
              Affordable for every primary school
            </h2>
            <p className="font-jakarta text-[15px]" style={{ color: "#5a5a5a" }}>
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
                features: ["CBC Gradebook (PP1–Class 8)", "M-Pesa Integration", "NEMIS Export", "Parent SMS Alerts", "Attendance Tracking"],
              },
              {
                plan: "Growth",
                price: "KES 21,500",
                period: "/month",
                capacity: "Up to 1,000 learners",
                highlight: true,
                features: ["Everything in Starter", "CBC Portfolio Management", "WhatsApp Alerts", "Advanced Analytics", "Priority Support"],
              },
            ].map((tier) => (
              <div
                key={tier.plan}
                className="rounded-2xl p-8"
                style={{
                  background: tier.highlight ? "#061A12" : "#ffffff",
                  border: tier.highlight ? "2px solid #E8A020" : "1px solid #e8f4ec",
                  boxShadow: tier.highlight ? "0 8px 32px rgba(232,160,32,0.2)" : "0 2px 16px rgba(6,26,18,0.06)",
                }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p
                      className="font-jakarta font-semibold text-[13px] uppercase tracking-[0.1em] mb-1"
                      style={{ color: tier.highlight ? "#E8A020" : "#1A7A4A" }}
                    >
                      {tier.plan}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="font-playfair font-bold"
                        style={{ fontSize: "2rem", color: tier.highlight ? "#ffffff" : "#061A12" }}
                      >
                        {tier.price}
                      </span>
                      <span className="font-jakarta text-[14px]" style={{ color: tier.highlight ? "#A8E6C3" : "#5a5a5a" }}>
                        {tier.period}
                      </span>
                    </div>
                    <p className="font-jakarta text-[13px] mt-1" style={{ color: tier.highlight ? "#A8E6C3" : "#5a5a5a" }}>
                      {tier.capacity}
                    </p>
                  </div>
                  {tier.highlight && (
                    <span
                      className="font-jakarta font-bold text-[11px] px-3 py-1 rounded-[50px]"
                      style={{ background: "#E8A020", color: "#061A12" }}
                    >
                      Most Popular
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" strokeWidth={2} style={{ color: tier.highlight ? "#E8A020" : "#1A7A4A" }} />
                      <span className="font-jakarta text-[14px]" style={{ color: tier.highlight ? "#A8E6C3" : "#3d3d3d" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/waitlist"
                  className="block text-center font-jakarta font-bold text-[15px] px-6 py-3 rounded-[50px] no-underline"
                  style={{
                    background: tier.highlight ? "#E8A020" : "#061A12",
                    color: tier.highlight ? "#061A12" : "#ffffff",
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
              style={{ border: "2px solid #061A12", color: "#061A12" }}
            >
              See full pricing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 12 · FINAL CTA
      ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "#0F4C2A" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <div className="flex justify-center gap-1 mb-8">
            <Shield className="w-8 h-8" strokeWidth={1.5} style={{ color: "#A8E6C3" }} />
          </div>
          <h2
            className="font-playfair font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3.5vw,3rem)", color: "#ffffff" }}
          >
            Ready to bring your primary school{" "}
            <em className="italic" style={{ color: "#E8A020" }}>into the digital age?</em>
          </h2>
          <p className="font-jakarta text-[17px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Join hundreds of Kenyan primary schools already running on EduMyles.
            Set up in days, not months.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a
              href="/waitlist"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              Book a Demo
            </a>
          </div>
          <p className="font-jakarta text-[13px]" style={{ color: "rgba(168,230,195,0.6)" }}>
            30-day free trial · No credit card required · Onboarding included
          </p>
        </div>
      </section>

    </div>
  );
}

