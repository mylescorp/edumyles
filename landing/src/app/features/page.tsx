import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Zap,
  ShieldCheck,
  Building2,
  Smartphone,
  Radio,
  CreditCard,
  KeyRound,
  Cloud,
  Mail,
  CalendarDays,
  Wallet,
  BarChart2,
  Bell,
  FileText,
  Bus,
  Users,
  UserPlus,
  Banknote,
  CalendarClock,
  BookOpen,
  Briefcase,
  BookMarked,
  MessageSquare,
  ShoppingBag,
  LayoutGrid,
  Repeat2,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features — EduMyles School Management System",
  description:
    "Explore all 13 integrated modules of EduMyles — student information, admissions, M-Pesa finance, timetable, academics, HR, library, transport, communications, eWallet, school shop, multi-campus management, and automated payment integrations. Built for schools in Kenya, Uganda, Tanzania, and across East Africa.",
};

const platformHighlights: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Zap,
    title: "Real-Time Sync",
    desc: "Powered by Convex — every update reflects instantly across all devices and dashboards. No page refreshes needed.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    desc: "14 built-in roles from Platform Admin to Student. Every user sees only what they need, nothing more.",
  },
  {
    icon: Building2,
    title: "Multi-Campus Ready",
    desc: "Strict data isolation per school. Run multiple campuses from one platform with zero data bleed.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    desc: "Works on any device — phone, tablet, or desktop. No app download required. Just a browser.",
  },
];

const modules: {
  abbr: string;
  color: string;
  iconBg: string;
  icon: LucideIcon;
  name: string;
  desc: string;
  features: string[];
}[] = [
  {
    abbr: "SIS",
    color: "#1A7A4A",
    iconBg: "rgba(26,122,74,0.10)",
    icon: Users,
    name: "Student Information System",
    desc: "Complete student profiles, class allocation, streams, and full academic history in one place.",
    features: ["Student profiles & photos", "Class & stream management", "Enrollment tracking", "Parent/guardian linking", "Transfer management", "Alumni records"],
  },
  {
    abbr: "ADM",
    color: "#E8A020",
    iconBg: "rgba(232,160,32,0.10)",
    icon: UserPlus,
    name: "Admissions",
    desc: "Digital applications, enrollment workflows, waitlists, and automated communication — paperless from day one.",
    features: ["Online application forms", "Document collection", "Waitlist management", "Enrollment automation", "Acceptance letters", "Intake analytics"],
  },
  {
    abbr: "FIN",
    color: "#26A65B",
    iconBg: "rgba(38,166,91,0.10)",
    icon: Banknote,
    name: "Finance & Fees",
    desc: "Fee structures, invoicing, M-Pesa collection, receipts, and full financial reporting. No more Excel chaos.",
    features: ["Fee structure builder", "Auto-invoicing", "M-Pesa & Airtel Money", "Bank transfer support", "Receipt generation", "Financial reports & audit trail"],
  },
  {
    abbr: "TTB",
    color: "#6B9E83",
    iconBg: "rgba(107,158,131,0.10)",
    icon: CalendarClock,
    name: "Timetable & Scheduling",
    desc: "Automated timetable generation, substitution management, room bookings, and conflict detection.",
    features: ["Auto-generate timetables", "Teacher substitutions", "Room & resource booking", "Conflict detection", "Print & export", "Real-time updates"],
  },
  {
    abbr: "ACA",
    color: "#1565C0",
    iconBg: "rgba(21,101,192,0.10)",
    icon: BookOpen,
    name: "Academics & Gradebook",
    desc: "Assessments, grading, report cards, and curriculum tracking. Supports CBC, 8-4-4, UNEB, and more.",
    features: ["Digital gradebook", "Assessment management", "Auto report cards", "Curriculum mapping", "CBC & 8-4-4 support", "Parent report portal"],
  },
  {
    abbr: "HR",
    color: "#0F4C2A",
    iconBg: "rgba(15,76,42,0.10)",
    icon: Briefcase,
    name: "HR & Payroll",
    desc: "Staff records, attendance, leave management, payroll processing, and statutory compliance (KRA, NHIF, NSSF).",
    features: ["Staff profiles & contracts", "Attendance tracking", "Leave management", "Payroll processing", "KRA / NHIF / NSSF", "Payslip generation"],
  },
  {
    abbr: "LIB",
    color: "#9A5D00",
    iconBg: "rgba(154,93,0,0.10)",
    icon: BookMarked,
    name: "Library",
    desc: "Book cataloguing, borrowing, returns, fines, overdue notices, and digital resource management.",
    features: ["Book catalogue", "Borrowing & returns", "Fine management", "Barcode scanning", "Overdue notifications", "Digital resources"],
  },
  {
    abbr: "TRN",
    color: "#1A7A4A",
    iconBg: "rgba(26,122,74,0.10)",
    icon: Bus,
    name: "Transport",
    desc: "Route planning, vehicle tracking, driver assignment, and real-time parent notifications for safe journeys.",
    features: ["Route planning", "Vehicle management", "Driver assignment", "Student tracking", "Parent SMS notifications", "Trip history"],
  },
  {
    abbr: "COM",
    color: "#26A65B",
    iconBg: "rgba(38,166,91,0.10)",
    icon: MessageSquare,
    name: "Communications",
    desc: "SMS, email, and in-app messaging to parents, staff, and students. Bulk announcements in seconds.",
    features: ["Bulk SMS (Africa's Talking)", "Email campaigns", "In-app notifications", "Broadcast announcements", "Message templates", "Delivery reports"],
  },
  {
    abbr: "WAL",
    color: "#6B9E83",
    iconBg: "rgba(107,158,131,0.10)",
    icon: Wallet,
    name: "eWallet",
    desc: "Digital wallet for cashless transactions within the school ecosystem. Parents top up, students spend.",
    features: ["Digital wallet top-up", "Cashless payments", "Transaction history", "Parent spending controls", "Balance alerts", "Canteen integration"],
  },
  {
    abbr: "SHP",
    color: "#1565C0",
    iconBg: "rgba(21,101,192,0.10)",
    icon: ShoppingBag,
    name: "School Shop",
    desc: "Online storefront for uniforms, books, and school supplies with full inventory management.",
    features: ["Product catalogue", "Online ordering", "Inventory tracking", "M-Pesa payment", "Order fulfilment", "Sales reporting"],
  },
  {
    abbr: "MCC",
    color: "#0F4C2A",
    iconBg: "rgba(15,76,42,0.10)",
    icon: LayoutGrid,
    name: "Multi-Campus & Curriculum",
    desc: "Manage your institution, all in one place — multiple campuses, curricula, and academic calendars unified under one dashboard.",
    features: ["Multi-campus dashboard", "Curriculum builder", "Academic calendar sync", "Cross-campus analytics", "Campus-level isolation", "Centralised admin controls"],
  },
  {
    abbr: "PAY",
    color: "#E8A020",
    iconBg: "rgba(232,160,32,0.10)",
    icon: Repeat2,
    name: "Automated Payment Integrations",
    desc: "Seamlessly connect M-Pesa, Airtel Money, Stripe, and bank transfers. Auto-reconcile, send receipts, and track every shilling — no manual entries.",
    features: ["M-Pesa Daraja STK Push", "Airtel Money API", "Stripe for card payments", "Bank transfer reconciliation", "Auto-receipt generation", "Real-time payment dashboard"],
  },
];

type IntegrationEntry =
  | { name: string; region: string; logo: string; desc: string; isEmoji: true }
  | { name: string; region: string; logo: LucideIcon; desc: string; isEmoji: false };

const integrations: IntegrationEntry[] = [
  { name: "M-Pesa Daraja", region: "Kenya", logo: "🇰🇪", desc: "Mobile money — the primary payment method for Kenyan schools", isEmoji: true },
  { name: "Airtel Money", region: "EA Region", logo: "🌍", desc: "Mobile money for Uganda, Tanzania, Rwanda, and Zambia", isEmoji: true },
  { name: "Africa's Talking", region: "Pan-Africa", logo: Radio, desc: "SMS & USSD messaging for parent communications", isEmoji: false },
  { name: "Stripe", region: "International", logo: CreditCard, desc: "Credit/debit card payments for international families", isEmoji: false },
  { name: "WorkOS", region: "Global", logo: KeyRound, desc: "Enterprise SSO, MFA, and authentication", isEmoji: false },
  { name: "Cloudinary", region: "Global", logo: Cloud, desc: "Image and document storage for student files", isEmoji: false },
  { name: "Resend", region: "Global", logo: Mail, desc: "Transactional email delivery at scale", isEmoji: false },
  { name: "Convex", region: "Global", logo: Zap, desc: "Real-time database powering instant sync", isEmoji: false },
];

const automations: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: CalendarDays,
    title: "Auto-Generated Timetables",
    desc: "Set constraints — teacher availability, room capacity, subject hours — and EduMyles generates a conflict-free schedule in seconds.",
  },
  {
    icon: Wallet,
    title: "Fee Reminder Automation",
    desc: "Automated SMS and email reminders sent to parents before and after fee due dates, with configurable escalation workflows.",
  },
  {
    icon: BarChart2,
    title: "Real-Time Analytics",
    desc: "Live dashboards for enrollment trends, fee collection rates, attendance patterns, and academic performance by class and student.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Role-specific alerts — late students, unpaid fees, pending approvals — delivered instantly to the right person.",
  },
  {
    icon: FileText,
    title: "Report Card Generation",
    desc: "One-click generation of formatted report cards for every student, ready to print or share digitally with parents.",
  },
  {
    icon: Bus,
    title: "Transport Tracking",
    desc: "Automated parent notifications when school buses depart, arrive, and when their child boards or alights.",
  },
];

export default function FeaturesPage() {
  return (
    <div style={{ color: "#212121" }}>

      {/* ── Hero ─────────────────────────────────────────── */}
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
        <div className="relative max-w-[1200px] mx-auto w-full text-center">
          <div
            className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
            style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}
          >
            Platform Features
          </div>
          <h1
            className="font-playfair font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
          >
            Everything your school needs.{" "}
            <em className="italic" style={{ color: "#E8A020" }}>One platform.</em>
          </h1>
          <p
            className="font-jakarta font-light leading-[1.8] mb-8 mx-auto"
            style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "620px" }}
          >
            13 integrated modules covering student management, finance, operations, HR, multi-campus, payments, and communication — all working together so your school runs itself.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/auth/signup"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[8px] no-underline transition-colors duration-200"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial →
            </a>
            <Link
              href="/book-demo"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[8px] no-underline transition-all duration-200"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Platform Highlights ───────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              Built on a unified platform
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Not stitched-together tools.{" "}
              <em className="italic" style={{ color: "#E8A020" }}>One integrated platform.</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformHighlights.map((h) => (
              <div
                key={h.title}
                className="rounded-2xl p-7 flex flex-col gap-4 group transition-all duration-300 hover:-translate-y-1"
                style={{ background: "#ffffff", border: "1px solid rgba(38,166,91,0.15)", boxShadow: "0 2px 12px rgba(6,26,18,0.06)" }}
              >
                {/* Icon circle */}
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-colors duration-300"
                  style={{ background: "rgba(26,122,74,0.08)" }}
                >
                  <h.icon className="w-6 h-6" strokeWidth={1.75} style={{ color: "#1A7A4A" }} />
                </div>
                <div>
                  <h3 className="font-playfair font-bold text-[18px] mb-2" style={{ color: "#061A12" }}>{h.title}</h3>
                  <p className="font-jakarta text-[14px] leading-[1.7]" style={{ color: "#5a5a5a" }}>{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── All 13 Modules ────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }} id="modules">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              All 13 Modules
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-4"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Every module.{" "}
              <em className="italic" style={{ color: "#E8A020" }}>Deeply integrated.</em>
            </h2>
            <p className="font-jakarta text-[16px] leading-[1.7]" style={{ color: "#5a5a5a", maxWidth: "540px", margin: "0 auto" }}>
              No data silos. No duplicate entry. One action in one module updates everything else automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
            {modules.map((mod) => (
              <div
                key={mod.name}
                className="rounded-2xl p-7 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  border: "1px solid #e8f4ec",
                  boxShadow: "0 2px 16px rgba(6,26,18,0.05)",
                  background: "#ffffff",
                }}
              >
                {/* Header: icon + abbr chip */}
                <div className="flex items-center justify-between">
                  {/* Large icon */}
                  <div
                    className="w-14 h-14 rounded-[16px] flex items-center justify-center flex-shrink-0"
                    style={{ background: mod.iconBg, border: `1.5px solid ${mod.color}22` }}
                  >
                    <mod.icon className="w-7 h-7" strokeWidth={1.75} style={{ color: mod.color }} />
                  </div>
                  {/* Abbr chip */}
                  <span
                    className="font-mono font-bold text-[11px] px-3 py-1 rounded-[6px] tracking-widest"
                    style={{ background: `${mod.color}18`, color: mod.color, border: `1px solid ${mod.color}30` }}
                  >
                    {mod.abbr}
                  </span>
                </div>

                {/* Name + desc */}
                <div>
                  <h3 className="font-playfair font-bold text-[19px] leading-[1.3] mb-2" style={{ color: "#061A12" }}>{mod.name}</h3>
                  <p className="font-jakarta text-[13.5px] leading-[1.75]" style={{ color: "#5a5a5a" }}>{mod.desc}</p>
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid #f0f0f0" }} />

                {/* Feature list */}
                <ul className="flex flex-col gap-2 mt-auto">
                  {mod.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 font-jakarta text-[13px]" style={{ color: "#3d3d3d" }}>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2} style={{ color: mod.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Smart Automation / Deeply Integrated ──────────── */}
      <section className="py-20 px-4" style={{ background: "#061A12" }} id="automation">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.12)", border: "1px solid rgba(232,160,32,0.3)", color: "#E8A020" }}
            >
              Smart Automation
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-4"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
            >
              Let the platform handle{" "}
              <em className="italic" style={{ color: "#E8A020" }}>the repetitive tasks.</em>
            </h2>
            <p className="font-jakarta text-[16px] leading-[1.7]" style={{ color: "#A8E6C3", maxWidth: "540px", margin: "0 auto" }}>
              EduMyles automates the work that eats your team&apos;s time — so you can focus on what matters: educating students.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {automations.map((a) => (
              <div
                key={a.title}
                className="rounded-2xl p-7 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(232,160,32,0.18)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {/* Icon badge */}
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(232,160,32,0.12)", border: "1px solid rgba(232,160,32,0.25)" }}
                >
                  <a.icon className="w-6 h-6" strokeWidth={1.75} style={{ color: "#E8A020" }} />
                </div>
                <div>
                  <h3 className="font-playfair font-bold text-[18px] mb-2" style={{ color: "#ffffff" }}>{a.title}</h3>
                  <p className="font-jakarta text-[14px] leading-[1.75]" style={{ color: "#A8E6C3" }}>{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ──────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }} id="integrations">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              Integrations
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-4"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Integrations that{" "}
              <em className="italic" style={{ color: "#E8A020" }}>East African schools actually use.</em>
            </h2>
            <p className="font-jakarta text-[15px] leading-[1.7]" style={{ color: "#5a5a5a", maxWidth: "500px", margin: "0 auto" }}>
              Every integration is deeply connected — data flows automatically between tools, no manual syncing.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {integrations.map((int) => (
              <div
                key={int.name}
                className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                style={{ background: "#ffffff", border: "1px solid rgba(38,166,91,0.15)", boxShadow: "0 2px 10px rgba(6,26,18,0.05)" }}
              >
                <div className="flex items-center gap-3">
                  {/* Icon badge */}
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(26,122,74,0.08)", border: "1px solid rgba(26,122,74,0.15)" }}
                  >
                    {int.isEmoji ? (
                      <span className="text-xl leading-none">{int.logo}</span>
                    ) : (
                      <int.logo className="w-5 h-5" strokeWidth={1.75} style={{ color: "#1A7A4A" }} />
                    )}
                  </div>
                  <div>
                    <div className="font-jakarta font-bold text-[14px]" style={{ color: "#061A12" }}>{int.name}</div>
                    <div
                      className="font-jakarta text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "#6B9E83" }}
                    >
                      {int.region}
                    </div>
                  </div>
                </div>
                <p className="font-jakarta text-[13px] leading-[1.65]" style={{ color: "#5a5a5a" }}>{int.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#0F4C2A" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-playfair font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3.5vw,3rem)", color: "#ffffff" }}
          >
            Ready to see it{" "}
            <em className="italic" style={{ color: "#E8A020" }}>in action?</em>
          </h2>
          <p className="font-jakarta text-[17px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Start your free 30-day trial or book a personalised demo with our school-tech experts.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/auth/signup"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[8px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial →
            </a>
            <Link
              href="/book-demo"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[8px] no-underline"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

