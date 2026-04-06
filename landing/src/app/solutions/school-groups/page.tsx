import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  BarChart2,
  Users,
  Network,
  Layers,
  TrendingUp,
  CheckCircle2,
  X,
  ArrowRight,
  Briefcase,
  MessageSquare,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

export const metadata: Metadata = {
  title: "EduMyles for School Groups & Networks — Multi-Campus Management",
  description:
    "One platform for every campus in your school network. Multi-campus dashboard, network-wide reporting, central HR, and data isolation — built for school groups in Africa.",
};

/* ─── Data ─────────────────────────────────────────────────────── */

const painPoints: { num: string; icon: LucideIcon; title: string; text: string }[] = [
  {
    num: "01",
    icon: Building2,
    title: "Managing 5 schools means 5 of everything",
    text: "Managing 5 schools means 5 spreadsheets, 5 WhatsApp groups, and 5 separate conversations with 5 bursars. Nothing is consolidated and every report is a manual exercise.",
  },
  {
    num: "02",
    icon: BarChart2,
    title: "Network reporting takes days — and it's already outdated",
    text: "Getting a network-wide view of enrollment, fees, and performance takes days of manual data compilation. By the time the report is ready, it's already outdated.",
  },
  {
    num: "03",
    icon: Users,
    title: "Staff and HR across campuses is impossible without one system",
    text: "Staff transfers between campuses, central HR policy enforcement, and group-wide payroll are impossible without a unified system. Right now it's paperwork and phone calls.",
  },
];

const howItWorks: { step: string; title: string; desc: string; when: string }[] = [
  {
    step: "01",
    title: "Create your network",
    desc: "Set up your group account, add all campuses, and configure data isolation rules and permissions per school.",
    when: "Day 1–3",
  },
  {
    step: "02",
    title: "Onboard each campus",
    desc: "Each school admin onboards their teachers, students, and historical data independently, at their own pace.",
    when: "Week 1–2",
  },
  {
    step: "03",
    title: "See your whole network",
    desc: "Network dashboard goes live with real-time data from all campuses — enrollment, fees, performance, attendance.",
    when: "Week 3",
  },
];

const modules: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Network,
    title: "Network Command Dashboard",
    desc: "Real-time enrollment, fees, attendance, and performance across all campuses from one screen.",
  },
  {
    icon: Layers,
    title: "Campus Data Isolation",
    desc: "Each school sees only its own data. Network admin sees all. Full role-based access control per campus.",
  },
  {
    icon: CreditCard,
    title: "Consolidated Billing",
    desc: "One invoice for all campuses. Group pricing with per-school breakdown and central finance reporting.",
  },
  {
    icon: Briefcase,
    title: "Central HR & Payroll",
    desc: "Manage staff across all campuses. Process group-wide payroll. Handle inter-campus transfers digitally.",
  },
  {
    icon: BarChart2,
    title: "Network Performance Analytics",
    desc: "Compare academic performance, fee collection rates, and attendance across all schools. Benchmark every campus.",
  },
  {
    icon: Users,
    title: "Unified Parent Portal",
    desc: "Parents with children across multiple schools see all their children in one login — one portal, one experience.",
  },
  {
    icon: MessageSquare,
    title: "Group-wide Communication",
    desc: "Broadcast announcements to all schools simultaneously. Target school-specific or network-wide audiences.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Audit",
    desc: "Network-level audit logs. All campus activity visible to group admin. Export compliance reports at any time.",
  },
];

const networkMetrics = [
  "Total enrollment across all campuses",
  "Network fee collection rate (%)",
  "Campuses meeting performance targets",
  "Staff headcount by campus",
  "Outstanding fee balances network-wide",
  "New admissions this term vs last term",
];

const permissionsModel = [
  {
    role: "Group Admin",
    scope: "Sees ALL campuses",
    description: "Full network visibility, billing, HR, and reporting",
    depth: 0,
  },
  {
    role: "Campus Principal",
    scope: "Sees their campus only",
    description: "Full access within their school boundary",
    depth: 1,
  },
  {
    role: "Teachers",
    scope: "See their classes only",
    description: "Grades, attendance, and communication for assigned classes",
    depth: 2,
  },
  {
    role: "Parents",
    scope: "See their children only",
    description: "Fees, grades, attendance, and school communications",
    depth: 3,
  },
];

const stats = [
  { value: "4+", label: "avg. campuses per network" },
  { value: "80%", label: "time saved on network reporting" },
  { value: "1 login", label: "to see all your schools" },
  { value: "Zero", label: "data leakage between campuses" },
];

const comparisonRows = [
  {
    challenge: "Network fee overview",
    before: "4 phone calls + manual Excel",
    after: "One dashboard, real-time",
  },
  {
    challenge: "Staff transfer between campuses",
    before: "Manual HR paperwork",
    after: "Digital transfer request, instant",
  },
  {
    challenge: "Network performance report",
    before: "3-day manual compilation",
    after: "Auto-generated, always live",
  },
  {
    challenge: "Billing across campuses",
    before: "Separate invoices, separate systems",
    after: "Consolidated group billing",
  },
  {
    challenge: "Parent with kids in 2 schools",
    before: "2 logins, 2 portals",
    after: "One login, one portal",
  },
  {
    challenge: "Compliance audit",
    before: "Manual log review",
    after: "Automated audit trail",
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "How many campuses can be on one network account?",
    a: "There is no hard cap. Current networks range from 2 to 12+ campuses. Enterprise pricing applies for 5+ campuses.",
  },
  {
    q: "Can each campus have its own branding?",
    a: "Yes — each campus can have its own name and subdomain while sharing the group network account and billing.",
  },
  {
    q: "Is data completely isolated between campuses?",
    a: "Yes. Campus staff and teachers only see their own campus data. The network admin controls what is visible at each level.",
  },
  {
    q: "Can we process payroll centrally for all campuses?",
    a: "Yes — Group HR can process network-wide payroll in one run, or delegate payroll to individual campus admins.",
  },
  {
    q: "What does 'network pricing' mean?",
    a: "Networks receive volume discounts. Contact us for a custom quote based on total student count across all campuses.",
  },
  {
    q: "Can students transfer between campuses seamlessly?",
    a: "Yes — inter-campus transfers retain the full student record, academic history, and fee ledger without any data re-entry.",
  },
];

const integrations = [
  "M-Pesa (per campus)",
  "Bank Transfer",
  "NEMIS (per campus)",
  "Africa's Talking",
  "WhatsApp",
  "Excel / Sheets",
  "Power BI",
];

/* ─── Page ─────────────────────────────────────────────────────── */

export default function SchoolGroupsPage() {
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
            style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}
          >
            For School Groups &amp; Networks
          </div>
          {/* H1 */}
          <h1
            className="font-playfair font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
          >
            One platform. Every campus.{" "}
            <em className="italic" style={{ color: "#E8A020" }}>Complete control.</em>
          </h1>
          {/* subtitle */}
          <p
            className="font-jakarta font-light leading-[1.8] mb-8 mx-auto"
            style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "660px" }}
          >
            Multi-campus dashboard, network-wide reporting, central HR, and strict data isolation between schools — all in one platform built for school groups in Africa.
          </p>
          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Link
              href="/contact?subject=school-groups"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Get a Group Quote <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/waitlist"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              Start Free Trial
            </a>
          </div>
          {/* badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              "Multi-Campus Dashboard",
              "Network-wide Reporting",
              "Data Isolation",
              "Central HR",
            ].map((badge) => (
              <span
                key={badge}
                className="font-semibold text-[12px] px-4 py-2 rounded-[50px]"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.2)", color: "#A8E6C3" }}
              >
                ✓ {badge}
              </span>
            ))}
          </div>
          {/* stats */}
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { value: "4+", label: "campus networks" },
              { value: "1 login", label: "all schools" },
              { value: "Real-time", label: "network view" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-playfair font-bold text-[2rem]" style={{ color: "#E8A020" }}>{s.value}</div>
                <div className="text-[13px] font-semibold uppercase tracking-[0.08em] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
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
              The challenges school networks face
            </p>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
            >
              Sound familiar?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((p) => (
              <div
                key={p.num}
                className="rounded-2xl p-8"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,160,32,0.2)" }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <span
                    className="font-playfair font-bold text-[2.5rem] leading-none"
                    style={{ color: "rgba(232,160,32,0.25)" }}
                  >
                    {p.num}
                  </span>
                  <p.icon className="w-9 h-9 flex-shrink-0 mt-1" strokeWidth={1.5} style={{ color: "#E8A020" }} />
                </div>
                <h3 className="font-playfair font-bold text-[17px] mb-3" style={{ color: "#ffffff" }}>
                  {p.title}
                </h3>
                <p className="leading-[1.8] text-[14px]" style={{ color: "#A8E6C3" }}>{p.text}</p>
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
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Your network is live in{" "}
              <em className="italic" style={{ color: "#E8A020" }}>three weeks.</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl p-8"
                style={{ border: "1px solid #e8f4ec", boxShadow: "0 2px 16px rgba(6,26,18,0.05)" }}
              >
                <div
                  className="font-playfair font-bold text-[3rem] leading-none mb-4"
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
                <h3 className="font-playfair font-bold text-[19px] mb-3" style={{ color: "#061A12" }}>
                  {s.title}
                </h3>
                <p className="text-[14px] leading-[1.75]" style={{ color: "#5a5a5a" }}>{s.desc}</p>
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
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Everything a school network needs
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              8 modules that give group leadership real oversight without removing campus autonomy
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
                <h3 className="font-playfair font-bold text-[17px] mb-2" style={{ color: "#061A12" }}>
                  {m.title}
                </h3>
                <p className="text-[13px] leading-[1.7]" style={{ color: "#5a5a5a" }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Network Dashboard Deep-Dive ──────────────── */}
      <section className="py-20 px-4" style={{ background: "#A8E6C3" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              The Network Admin dashboard —{" "}
              <em className="italic" style={{ color: "#0F4C2A" }}>everything, at a glance.</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: metrics */}
            <div
              className="rounded-2xl p-8"
              style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(6,26,18,0.08)" }}
            >
              <h3 className="font-playfair font-bold text-[21px] mb-6" style={{ color: "#061A12" }}>
                Key metrics visible to Group Admin
              </h3>
              <ul className="space-y-3">
                {networkMetrics.map((metric) => (
                  <li key={metric} className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={2} style={{ color: "#1A7A4A" }} />
                    <span className="text-[14px] leading-[1.65]" style={{ color: "#3d3d3d" }}>{metric}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Right: permissions model */}
            <div
              className="rounded-2xl p-8"
              style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(6,26,18,0.08)" }}
            >
              <h3 className="font-playfair font-bold text-[21px] mb-6" style={{ color: "#061A12" }}>
                Permissions model
              </h3>
              <div className="space-y-3">
                {permissionsModel.map((level) => (
                  <div
                    key={level.role}
                    className="rounded-xl p-4"
                    style={{
                      marginLeft: `${level.depth * 16}px`,
                      background: level.depth === 0
                        ? "rgba(15,76,42,0.08)"
                        : level.depth === 1
                        ? "rgba(26,122,74,0.06)"
                        : level.depth === 2
                        ? "rgba(168,230,195,0.35)"
                        : "rgba(168,230,195,0.18)",
                      border: `1px solid ${level.depth === 0 ? "rgba(15,76,42,0.2)" : "rgba(26,122,74,0.12)"}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[14px]" style={{ color: "#061A12" }}>{level.role}</span>
                      <span
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-[50px]"
                        style={{ background: "rgba(15,76,42,0.1)", color: "#0F4C2A" }}
                      >
                        {level.scope}
                      </span>
                    </div>
                    <p className="text-[12px] leading-[1.55]" style={{ color: "#5a5a5a" }}>{level.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: Stats Bar ────────────────────────────────── */}
      <section className="py-14 px-4" style={{ background: "#0F4C2A" }}>
        <div className="max-w-[1000px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div
                  className="font-playfair font-bold leading-none mb-2"
                  style={{ fontSize: "clamp(2rem,3.5vw,2.75rem)", color: "#E8A020" }}
                >
                  {s.value}
                </div>
                <div className="font-semibold text-[12px] uppercase tracking-[0.1em]" style={{ color: "rgba(168,230,195,0.7)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: Benefits ─────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-playfair font-bold leading-[1.2] mb-4"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Why School Groups Choose{" "}
              <span style={{ color: "#E8A020" }}>EduMyles</span>
            </h2>
            <p 
              className="font-jakarta text-lg max-w-[700px] mx-auto"
              style={{ color: "#5a5a5a", lineHeight: "1.7" }}
            >
              Experience unified management across your entire educational network with our purpose-built platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Network,
                title: "Real-Time Network Visibility",
                description: "See enrollment, fees, attendance, and performance across all campuses from one dashboard in real-time."
              },
              {
                icon: TrendingUp,
                title: "40% Administrative Efficiency",
                description: "Reduce administrative overhead by 40% through centralized processes and automated workflows."
              },
              {
                icon: Briefcase,
                title: "Unified HR Management",
                description: "Manage staff transfers, payroll, and HR policies across all campuses with one integrated system."
              },
              {
                icon: CreditCard,
                title: "Consolidated Billing",
                description: "One invoice for all campuses with volume discounts and simplified financial management."
              },
              {
                icon: ShieldCheck,
                title: "Data Isolation & Security",
                description: "Each campus sees only their data while network admin has complete oversight with enterprise-grade security."
              },
              {
                icon: Users,
                title: "Unified Parent Experience",
                description: "Parents with children across multiple schools see everything in one portal with single login."
              }
            ].map((benefit, _index) => (
              <div
                key={benefit.title}
                className="text-center p-6 rounded-2xl"
                style={{ 
                  background: "linear-gradient(135deg, #F3FBF6 0%, #E8F5EE 100%)", 
                  border: "1px solid rgba(26,122,74,0.2)" 
                }}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(26,122,74,0.15)" }}
                >
                  <benefit.icon className="w-8 h-8" style={{ color: "#1A7A4A" }} />
                </div>
                <h3 
                  className="font-playfair font-bold text-xl mb-3"
                  style={{ color: "#061A12" }}
                >
                  {benefit.title}
                </h3>
                <p 
                  className="font-jakarta text-sm leading-[1.6]"
                  style={{ color: "#5a5a5a" }}
                >
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 8: Testimonial ─────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#FEF3DC" }}>
        <div className="max-w-[820px] mx-auto text-center">
          <div className="text-[5rem] leading-none mb-4" style={{ color: "#E8A020" }}>&ldquo;</div>
          <blockquote
            className="font-playfair italic leading-[1.85] mb-8"
            style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)", color: "#2d2d2d" }}
          >
            We manage four schools. Before EduMyles, I&apos;d spend the entire first Monday of the month on the phone with four different bursars. Now I open one dashboard and see everything — fees, enrollment, staff attendance. I took that Monday back.
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-playfair font-bold text-[16px]"
              style={{ background: "#0F4C2A", color: "#ffffff" }}
            >
              PM
            </div>
            <div className="text-left">
              <p className="font-semibold text-[14px]" style={{ color: "#0F4C2A" }}>Dr. Peter Maina</p>
              <p className="text-[13px]" style={{ color: "#666" }}>Group CEO, Greenbrook Education Network, Nairobi</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 8: Comparison Table ────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Before and after EduMyles
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              The difference a unified platform makes across your entire network.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e0e0e0", boxShadow: "0 4px 24px rgba(6,26,18,0.07)" }}>
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#061A12" }}>
                  <th className="text-left py-4 px-6 font-semibold text-[14px]" style={{ color: "#ffffff" }}>Challenge</th>
                  <th className="text-center py-4 px-6 font-semibold text-[14px]" style={{ color: "rgba(255,255,255,0.7)" }}>Before EduMyles</th>
                  <th className="text-center py-4 px-6 font-semibold text-[14px]" style={{ color: "#E8A020" }}>With EduMyles</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.challenge}
                    style={{ background: i % 2 === 0 ? "#ffffff" : "#f9fafb", borderBottom: "1px solid #f0f0f0" }}
                  >
                    <td className="py-4 px-6 font-semibold text-[14px]" style={{ color: "#061A12" }}>{row.challenge}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "#5a5a5a" }}>
                        <X className="w-4 h-4 flex-shrink-0" style={{ color: "#e53935" }} />
                        {row.before}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "#1A7A4A" }}>
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

      {/* ── Section 9: FAQ ─────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[820px] mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
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
                <h3 className="font-playfair font-bold text-[17px] mb-3" style={{ color: "#061A12" }}>
                  {faq.q}
                </h3>
                <p className="text-[14px] leading-[1.75]" style={{ color: "#5a5a5a" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 10: Integrations ────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#A8E6C3" }}>
        <div className="max-w-[1100px] mx-auto text-center">
          <p
            className="font-semibold text-[13px] uppercase tracking-[0.12em] mb-5"
            style={{ color: "#0F4C2A" }}
          >
            Integrations
          </p>
          <h2
            className="font-playfair font-bold leading-[1.2] mb-8"
            style={{ fontSize: "clamp(1.4rem,2.5vw,2rem)", color: "#061A12" }}
          >
            Works with the tools your network already uses
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {integrations.map((int) => (
              <span
                key={int}
                className="font-semibold text-[13px] px-5 py-2.5 rounded-[50px]"
                style={{ background: "#ffffff", color: "#0F4C2A", border: "1px solid rgba(15,76,42,0.2)", boxShadow: "0 1px 4px rgba(6,26,18,0.08)" }}
              >
                {int}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 11: Pricing Callout ──────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[760px] mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 font-semibold text-[13px] mb-5 px-4 py-2 rounded-[50px]"
            style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
          >
            Group Pricing
          </div>
          <h2
            className="font-playfair font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
          >
            School group pricing is custom
          </h2>
          <p className="text-[16px] leading-[1.8] mb-8" style={{ color: "#5a5a5a" }}>
            Contact us with your campus count and student numbers and we&apos;ll build a quote that reflects your network&apos;s size. Volume discounts apply from 3+ campuses. Or start with a free trial on your first campus.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact?subject=school-groups"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3 rounded-[50px] no-underline"
              style={{ background: "#061A12", color: "#ffffff" }}
            >
              Get a group quote <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/waitlist"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-7 py-3 rounded-[50px] no-underline"
              style={{ border: "2px solid #061A12", color: "#061A12" }}
            >
              Start free trial
            </a>
          </div>
        </div>
      </section>

      {/* ── Section 12: Final CTA ────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "#0F4C2A" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-playfair font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3.5vw,3rem)", color: "#ffffff" }}
          >
            Ready to bring your school network{" "}
            <em className="italic" style={{ color: "#E8A020" }}>under one roof?</em>
          </h2>
          <p className="text-[17px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Join school groups across Africa that have already unified their campuses on EduMyles.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact?subject=school-groups"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Get a Group Quote <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
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

