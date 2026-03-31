import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart2,
  CalendarDays,
  UserCheck,
  BookOpen,
  Clock,
  CreditCard,
  Users,
  DollarSign,
  Layers,
  MessageSquare,
  Home,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "EduMyles for Secondary Schools — KCSE, CBC Senior & Auto-Timetabling",
  description:
    "School management software built for Kenyan secondary schools. KCSE & CBC Senior gradebook, auto-timetabling, M-Pesa fee collection, HR & payroll — all 11 modules included.",
};

export default function SecondarySchoolsPage() {
  return (
    <div style={{ color: "#212121" }}>

      {/* ── SECTION 1: Hero ────────────────────────────────────────────── */}
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
            For Secondary Schools
          </div>

          {/* H1 */}
          <h1
            className="font-playfair font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
          >
            From Form 1 to Form 4.{" "}
            <br className="hidden sm:block" />
            Every module your{" "}
            <em className="italic" style={{ color: "#E8A020" }}>secondary school needs.</em>
          </h1>

          {/* Subtitle */}
          <p
            className="font-light leading-[1.8] mb-8 mx-auto"
            style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "680px" }}
          >
            KCSE gradebook, CBC Senior, auto-timetabling, M-Pesa fee collection, HR &amp; payroll — unified in one platform built for Kenyan secondary schools.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <a
              href="/auth/signup/api"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial →
            </a>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              Book a Demo
            </a>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[
              "KCSE & CBC Senior",
              "Auto-Timetabling",
              "HR & Payroll Built-In",
              "Multi-Stream",
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

          {/* Stats row */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-px mx-auto max-w-[900px] overflow-hidden rounded-2xl"
            style={{ border: "1px solid rgba(232,160,32,0.2)", background: "rgba(232,160,32,0.2)" }}
          >
            {[
              { stat: "1,100", label: "avg students per school" },
              { stat: "< 1 hr", label: "timetable generation" },
              { stat: "All 11", label: "modules included" },
            ].map(({ stat, label }) => (
              <div
                key={stat}
                className="text-center py-6 px-4"
                style={{ background: "rgba(6,26,18,0.95)" }}
              >
                <div
                  className="font-playfair font-bold mb-1"
                  style={{ fontSize: "clamp(1.6rem,3vw,2.25rem)", color: "#E8A020" }}
                >
                  {stat}
                </div>
                <div className="text-[13px] font-medium" style={{ color: "#A8E6C3" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Pain Points ─────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#0C3020" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <p
              className="font-semibold text-[13px] uppercase tracking-[0.12em] mb-3"
              style={{ color: "#E8A020" }}
            >
              The challenges secondary schools face
            </p>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
            >
              Sound familiar?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                Icon: BarChart2,
                text: "Managing Grades 9–12 or Form 1–4 across multiple streams with Excel breaks every term — one missed entry corrupts the entire report.",
              },
              {
                num: "02",
                Icon: CalendarDays,
                text: "Timetabling for 50+ subjects, 30+ teachers, and limited classrooms takes weeks and still has conflicts every term.",
              },
              {
                num: "03",
                Icon: UserCheck,
                text: "Staff payroll with PAYE, SHA/NHIF, and NSSF is complex — most schools use external accountants and still make errors.",
              },
            ].map(({ num, Icon, text }) => (
              <div
                key={num}
                className="rounded-2xl p-7"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,160,32,0.2)" }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <span
                    className="font-playfair font-bold text-[2rem] leading-none"
                    style={{ color: "#E8A020", opacity: 0.7 }}
                  >
                    {num}
                  </span>
                  <Icon className="w-8 h-8 mt-1 flex-shrink-0" strokeWidth={1.5} style={{ color: "#E8A020" }} />
                </div>
                <p className="leading-[1.8] text-[15px]" style={{ color: "#A8E6C3" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: How It Works ────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              Getting Started
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Live in under 4 weeks
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              A dedicated onboarding team guides you every step of the way.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "Step 1",
                title: "Import your school data",
                desc: "Students, classes, staff, subjects — we help you migrate everything. Most schools are fully imported within 1 day.",
                time: "Day 1",
              },
              {
                step: "Step 2",
                title: "Generate your timetable",
                desc: "Set your constraints — teacher availability, room capacities, double-lesson rules — then press generate. Conflict-free in minutes.",
                time: "Day 2–3",
              },
              {
                step: "Step 3",
                title: "Run payroll & collect fees",
                desc: "Auto-calculate PAYE, SHA, NSSF, and Housing Levy deductions. Collect M-Pesa fees from parents via Paybill. Everything reconciled automatically.",
                time: "Week 2",
              },
            ].map(({ step, title, desc, time }) => (
              <div
                key={step}
                className="relative rounded-2xl p-8"
                style={{ border: "1px solid #e8f4ec", boxShadow: "0 2px 16px rgba(6,26,18,0.05)" }}
              >
                <div
                  className="inline-flex items-center gap-2 font-semibold text-[12px] mb-5 px-3 py-1.5 rounded-[50px]"
                  style={{ background: "rgba(232,160,32,0.12)", color: "#9A5D00" }}
                >
                  {step}
                </div>
                <h3
                  className="font-playfair font-bold text-[1.3rem] mb-3 leading-[1.3]"
                  style={{ color: "#061A12" }}
                >
                  {title}
                </h3>
                <p className="text-[14px] leading-[1.75] mb-5" style={{ color: "#5a5a5a" }}>{desc}</p>
                <div
                  className="inline-flex items-center gap-1.5 font-semibold text-[12px] px-3 py-1 rounded-full"
                  style={{ background: "#F3FBF6", color: "#0F4C2A" }}
                >
                  <Clock className="w-3 h-3" />
                  {time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Core Modules ────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#F9FAFB" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              All 11 Modules
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Everything a secondary school needs
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              11 integrated modules, built for Kenyan secondary education from the ground up.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                Icon: BookOpen,
                title: "KCSE & CBC Senior Gradebook",
                desc: "Marks entry, weighted averages, mean grades, rank generation. Supports both 8-4-4 (Form 1–4) and CBC Senior School (G9–G12) in the same account.",
              },
              {
                Icon: CalendarDays,
                title: "Auto-Timetabling",
                desc: "Set teacher availability, room capacity, and double-lesson rules — EduMyles generates conflict-free timetables in under an hour, even for 50+ classes.",
              },
              {
                Icon: CreditCard,
                title: "M-Pesa Fee & Billing",
                desc: "Paybill integration, invoices, boarding vs day fee structures, bank transfer tracking, and outstanding balance alerts — all reconciled automatically.",
              },
              {
                Icon: Users,
                title: "HR & Staff Management",
                desc: "Staff contracts, leave management, disciplinary records, and performance tracking — digital and paperless.",
              },
              {
                Icon: DollarSign,
                title: "Payroll Automation",
                desc: "Auto-calculate PAYE, SHA, NSSF, and Housing Levy. Generate payslips and KRA P9 forms in one click, always updated to current statutory rates.",
              },
              {
                Icon: Layers,
                title: "Subject & Stream Management",
                desc: "Manage Sciences, Arts, and Technical streams. Track performance by subject, class, and stream to identify gaps early.",
              },
              {
                Icon: MessageSquare,
                title: "Parent & Student Portals",
                desc: "Parents check fees, balances, and grades instantly. Students view their results and timetables. Self-service — no more phone calls to admin.",
              },
              {
                Icon: Home,
                title: "Attendance & Boarding",
                desc: "Daily roll call, hostel and boarding management, parent SMS on absence, and student leave tracking — from one dashboard.",
              },
              {
                Icon: TrendingUp,
                title: "Analytics & Reporting",
                desc: "KCSE prediction analytics, at-risk student flags, school performance trends by subject and year — data-driven decisions made easy.",
              },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-6 bg-white"
                style={{ border: "1px solid #e8f4ec", boxShadow: "0 2px 16px rgba(6,26,18,0.05)" }}
              >
                <div className="mb-4">
                  <Icon className="w-8 h-8" strokeWidth={1.5} style={{ color: "#0F4C2A" }} />
                </div>
                <h3 className="font-playfair font-bold text-[1.1rem] mb-2 leading-[1.3]" style={{ color: "#061A12" }}>
                  {title}
                </h3>
                <p className="text-[14px] leading-[1.75]" style={{ color: "#5a5a5a" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: KCSE & Timetabling Deep-Dive ──────────────────── */}
      <section className="py-20 px-4" style={{ background: "#A8E6C3" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Two capabilities that{" "}
              <em className="italic" style={{ color: "#0F4C2A" }}>define a secondary school.</em>
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#2d5a3d" }}>
              Deep-dive into the modules that matter most.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEFT: KCSE Gradebook */}
            <div
              className="rounded-2xl p-8"
              style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(6,26,18,0.08)" }}
            >
              <div
                className="inline-flex items-center gap-2 font-semibold text-[12px] mb-5 px-3 py-1.5 rounded-[50px]"
                style={{ background: "rgba(232,160,32,0.12)", color: "#9A5D00" }}
              >
                KCSE &amp; CBC Senior Gradebook
              </div>
              <h3
                className="font-playfair font-bold text-[1.4rem] mb-5 leading-[1.3]"
                style={{ color: "#061A12" }}
              >
                Grades, ranks, and report cards — automated.
              </h3>
              <ul className="space-y-3">
                {[
                  "Support for all KCSE subjects — Mathematics, English, Sciences, Humanities, Technical",
                  "Mean grade calculation (A to E) with automatic letter grade mapping",
                  "Grade rank generation per class and per stream",
                  "One-click KCSE-format report cards, print-ready",
                  "CBC Senior (Grade 9–12) fully supported — both curricula coexist in one account",
                  "Predicted grade alerts mid-term to flag at-risk candidates early",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2} style={{ color: "#1A7A4A" }} />
                    <span className="text-[14px] leading-[1.7]" style={{ color: "#3d3d3d" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* RIGHT: Auto-Timetabling */}
            <div
              className="rounded-2xl p-8"
              style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(6,26,18,0.08)" }}
            >
              <div
                className="inline-flex items-center gap-2 font-semibold text-[12px] mb-5 px-3 py-1.5 rounded-[50px]"
                style={{ background: "rgba(26,122,74,0.1)", color: "#0F4C2A" }}
              >
                Auto-Timetabling
              </div>
              <h3
                className="font-playfair font-bold text-[1.4rem] mb-5 leading-[1.3]"
                style={{ color: "#061A12" }}
              >
                Two weeks of work done in under an hour.
              </h3>
              <ul className="space-y-3">
                {[
                  "Set teacher unavailability windows — free periods, part-time, TSC timetables",
                  "Define room capacities and subject-specific room requirements (labs, halls)",
                  "Prevents double-booking of teachers and rooms at every step",
                  "Generates conflict-free timetables for schools up to 50 classes in under 60 seconds",
                  "Handles double-lesson rules, assembly periods, and Games slots",
                  "Export to PDF or print directly — ready to pin on the staffroom noticeboard",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2} style={{ color: "#1A7A4A" }} />
                    <span className="text-[14px] leading-[1.7]" style={{ color: "#3d3d3d" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Payroll Deep-Dive ──────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#061A12" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-6">
            <h2
              className="font-playfair font-bold leading-[1.2] mb-5"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
            >
              Payroll that&apos;s actually accurate.
            </h2>
          </div>
          <div
            className="max-w-[800px] mx-auto rounded-2xl p-8 mb-12 text-center"
            style={{ background: "rgba(232,160,32,0.08)", border: "1px solid rgba(232,160,32,0.25)" }}
          >
            <p className="text-[16px] leading-[1.9]" style={{ color: "#FEF3DC" }}>
              Most Kenyan schools overpay or underpay statutory deductions because they use outdated calculators.{" "}
              <strong style={{ color: "#E8A020" }}>
                EduMyles is updated whenever PAYE, SHA, or NSSF rates change
              </strong>{" "}
              — so your payroll is always compliant, without any manual intervention.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[
              {
                title: "PAYE",
                subtitle: "Progressive rates",
                desc: "Automatically applies the current KRA PAYE bands to each employee's taxable income. Updated at every legislative change.",
              },
              {
                title: "SHA / NHIF",
                subtitle: "2.75% of gross",
                desc: "Calculates the Social Health Authority deduction under the new SHA Act replacing NHIF. Always current.",
              },
              {
                title: "NSSF",
                subtitle: "Tier I & Tier II",
                desc: "Handles both Tier I (KES 360) and Tier II contributions under the NSSF Act 2013 — employer and employee portions.",
              },
              {
                title: "Housing Levy",
                subtitle: "1.5% of gross",
                desc: "Deducts the Affordable Housing Levy from gross salary and matches it with employer contribution — auto-included in every payroll run.",
              },
            ].map(({ title, subtitle, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,160,32,0.2)" }}
              >
                <div
                  className="font-playfair font-bold text-[1.5rem] mb-1"
                  style={{ color: "#E8A020" }}
                >
                  {title}
                </div>
                <div
                  className="font-semibold text-[12px] uppercase tracking-wider mb-3"
                  style={{ color: "#A8E6C3" }}
                >
                  {subtitle}
                </div>
                <p className="text-[13px] leading-[1.7]" style={{ color: "#90CAF9" }}>{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/blog/how-kenyan-schools-manage-payroll"
              className="inline-flex items-center gap-2 font-semibold text-[14px] no-underline"
              style={{ color: "#E8A020" }}
            >
              See payroll docs →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: Results / Stats Bar ────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#1A7A4A" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { stat: "96%", label: "Time saved on report card generation" },
              { stat: "< 1 hr", label: "Timetable generation (was 2 weeks)" },
              { stat: "Zero", label: "Payroll calculation errors" },
              { stat: "15 hrs/wk", label: "Saved per administrator" },
            ].map(({ stat, label }) => (
              <div key={stat}>
                <div
                  className="font-playfair font-bold mb-2"
                  style={{ fontSize: "clamp(2rem,4vw,2.75rem)", color: "#FEF3DC" }}
                >
                  {stat}
                </div>
                <div className="text-[14px] font-medium leading-[1.5]" style={{ color: "#A8E6C3" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: Testimonial ────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#FEF3DC" }}>
        <div className="max-w-[820px] mx-auto text-center">
          <div className="text-[5rem] leading-none mb-4" style={{ color: "#E8A020" }}>&ldquo;</div>
          <blockquote
            className="font-playfair italic leading-[1.85] mb-8"
            style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)", color: "#2d2d2d" }}
          >
            Our school has 1,100 students across 12 streams. Timetabling used to take our deputy principal two weeks. EduMyles generates a conflict-free timetable in under an hour. That time is now spent on teaching.
          </blockquote>
          <div className="inline-flex items-center gap-3 mx-auto">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-playfair font-bold text-[1rem] flex-shrink-0"
              style={{ background: "#0F4C2A", color: "#FEF3DC" }}
            >
              SK
            </div>
            <p className="font-semibold text-[14px] text-left" style={{ color: "#0F4C2A" }}>
              Sarah K.
              <span className="block font-normal text-[13px]" style={{ color: "#5a5a5a" }}>
                Deputy Principal, Upperhill Secondary School, Nairobi
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: Comparison Table ───────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              EduMyles vs Traditional
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              See the difference clearly
            </h2>
          </div>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid #e8f4ec" }}>
            <table className="w-full text-[14px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#061A12" }}>
                  <th
                    className="text-left px-6 py-4 font-semibold"
                    style={{ color: "#A8E6C3", width: "30%" }}
                  >
                    Feature
                  </th>
                  <th className="text-left px-6 py-4 font-semibold" style={{ color: "#90CAF9" }}>
                    Manual / Traditional
                  </th>
                  <th className="text-left px-6 py-4 font-semibold" style={{ color: "#E8A020" }}>
                    EduMyles
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "Timetable generation",
                    manual: "2 weeks, many conflicts",
                    edumyles: "< 1 hour, conflict-free",
                  },
                  {
                    feature: "KCSE report cards",
                    manual: "Full weekend per term",
                    edumyles: "30 minutes, auto-generated",
                  },
                  {
                    feature: "Payroll deductions",
                    manual: "Error-prone spreadsheet",
                    edumyles: "Auto-calculated, always current",
                  },
                  {
                    feature: "Fee tracking",
                    manual: "Excel + manual M-Pesa",
                    edumyles: "Real-time, auto-reconciled",
                  },
                  {
                    feature: "Staff leave management",
                    manual: "Paper forms",
                    edumyles: "Digital, approval workflows",
                  },
                  {
                    feature: "Parent communication",
                    manual: "WhatsApp groups",
                    edumyles: "SMS + portal, automated",
                  },
                ].map(({ feature, manual, edumyles }, i) => (
                  <tr
                    key={feature}
                    style={{
                      background: i % 2 === 0 ? "#ffffff" : "#F9FAFB",
                      borderTop: "1px solid #e8f4ec",
                    }}
                  >
                    <td className="px-6 py-4 font-semibold" style={{ color: "#061A12" }}>{feature}</td>
                    <td className="px-6 py-4" style={{ color: "#888" }}>
                      <span className="flex items-center gap-2">
                        <span style={{ color: "#d32f2f" }}>✗</span> {manual}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium" style={{ color: "#0F4C2A" }}>
                      <span className="flex items-center gap-2">
                        <span style={{ color: "#1A7A4A" }}>✓</span> {edumyles}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── SECTION 10: FAQ ───────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#F9FAFB" }}>
        <div className="max-w-[800px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              Frequently Asked Questions
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Questions from secondary school leaders
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Does EduMyles support both KCSE (8-4-4) and CBC Senior School (G9–G12)?",
                a: "Yes, both curricula are fully supported and can coexist in the same school account. You can manage Form 1–4 students alongside Grade 9–12 learners on a single platform during the transition period.",
              },
              {
                q: "How accurate is the auto-timetabling?",
                a: "It handles up to 60 classes and 80 teachers. Our constraint-based algorithm prevents all teacher, room, and subject conflicts automatically. If a valid timetable cannot be generated with your constraints, the system tells you exactly which constraint is causing the conflict.",
              },
              {
                q: "Can the payroll module handle both TSC and BOM teachers?",
                a: "BOM payroll is fully managed within EduMyles — deductions, payslips, and P9 forms included. TSC teachers can be tracked for HR purposes (leave, attendance, performance) but their salaries are processed directly by the TSC.",
              },
              {
                q: "Does it handle boarding school fees separately from day school fees?",
                a: "Yes — boarding and day fee structures are configured separately, with individual invoicing and payment tracking per student. Parents of boarders receive boarding-specific statements, while day scholars receive day fee invoices.",
              },
              {
                q: "How long does implementation take for a secondary school?",
                a: "Secondary schools typically go live in 3–4 weeks due to the larger student and staff dataset. Our dedicated onboarding team assists with data migration, timetable setup, and staff training throughout the process.",
              },
              {
                q: "Is there training for teachers and administrative staff?",
                a: "Yes, comprehensive training is included in all plans at no extra cost. We offer live virtual training sessions, role-specific walkthroughs for teachers and administrators, and a library of recorded tutorials your team can revisit anytime.",
              },
            ].map(({ q, a }, i) => (
              <div
                key={i}
                className="rounded-2xl p-7 bg-white"
                style={{ border: "1px solid #e8f4ec", boxShadow: "0 2px 8px rgba(6,26,18,0.04)" }}
              >
                <h3
                  className="font-playfair font-bold text-[1.05rem] mb-3 leading-[1.4]"
                  style={{ color: "#061A12" }}
                >
                  {q}
                </h3>
                <p className="text-[14px] leading-[1.8]" style={{ color: "#5a5a5a" }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 11: Integrations ──────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#A8E6C3" }}>
        <div className="max-w-[1000px] mx-auto text-center">
          <p
            className="font-semibold text-[13px] uppercase tracking-[0.12em] mb-4"
            style={{ color: "#0F4C2A" }}
          >
            Integrations
          </p>
          <h2
            className="font-playfair font-bold leading-[1.2] mb-8"
            style={{ fontSize: "clamp(1.5rem,2.5vw,2.25rem)", color: "#061A12" }}
          >
            Connects with the tools your school already uses
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "M-Pesa",
              "Africa's Talking SMS",
              "KCB Merchant",
              "NEMIS",
              "KNEC",
              "Excel / Google Sheets",
              "WhatsApp Business",
              "Power BI",
            ].map((tool) => (
              <span
                key={tool}
                className="font-semibold text-[13px] px-5 py-2.5 rounded-[50px]"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(15,76,42,0.2)",
                  color: "#0F4C2A",
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 12: Pricing Callout ───────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-5 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              Pricing for Secondary Schools
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
            >
              Transparent, all-inclusive pricing
            </h2>
            <p className="text-[16px] leading-[1.8]" style={{ color: "#5a5a5a" }}>
              No module fees. No per-teacher charges. All 11 modules included in every plan.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Growth */}
            <div
              className="rounded-2xl p-8"
              style={{ border: "2px solid #e8f4ec", boxShadow: "0 4px 24px rgba(6,26,18,0.06)" }}
            >
              <div
                className="inline-flex items-center gap-2 font-semibold text-[12px] mb-4 px-3 py-1.5 rounded-[50px]"
                style={{ background: "rgba(26,122,74,0.1)", color: "#0F4C2A" }}
              >
                Growth
              </div>
              <div className="mb-1">
                <span
                  className="font-playfair font-bold"
                  style={{ fontSize: "clamp(2rem,3.5vw,2.75rem)", color: "#061A12" }}
                >
                  KES 21,500
                </span>
                <span className="text-[14px] ml-1" style={{ color: "#888" }}>/month</span>
              </div>
              <p className="text-[13px] mb-5" style={{ color: "#5a5a5a" }}>Up to 1,000 students</p>
              <ul className="space-y-2 text-[14px]" style={{ color: "#3d3d3d" }}>
                {[
                  "All 11 modules included",
                  "HR & payroll (BOM staff)",
                  "KCSE & CBC Senior gradebook",
                  "Auto-timetabling",
                  "M-Pesa fee collection",
                  "Parent & student portals",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" strokeWidth={2} style={{ color: "#1A7A4A" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Professional */}
            <div
              className="rounded-2xl p-8"
              style={{
                background: "#061A12",
                border: "2px solid #E8A020",
                boxShadow: "0 4px 32px rgba(232,160,32,0.15)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="inline-flex items-center gap-2 font-semibold text-[12px] px-3 py-1.5 rounded-[50px]"
                  style={{ background: "rgba(232,160,32,0.15)", color: "#E8A020" }}
                >
                  Professional
                </div>
                <span
                  className="font-semibold text-[11px] px-2.5 py-1 rounded-full"
                  style={{ background: "#E8A020", color: "#061A12" }}
                >
                  Most Popular
                </span>
              </div>
              <div className="mb-1">
                <span
                  className="font-playfair font-bold"
                  style={{ fontSize: "clamp(2rem,3.5vw,2.75rem)", color: "#E8A020" }}
                >
                  KES 38,900
                </span>
                <span className="text-[14px] ml-1" style={{ color: "#90CAF9" }}>/month</span>
              </div>
              <p className="text-[13px] mb-5" style={{ color: "#A8E6C3" }}>Up to 3,000 students</p>
              <ul className="space-y-2 text-[14px]" style={{ color: "#d4e8da" }}>
                {[
                  "Everything in Growth",
                  "Priority support & SLA",
                  "CBC Senior (G9–G12) gradebook",
                  "Advanced analytics & Power BI",
                  "Custom branding on portals",
                  "Dedicated onboarding manager",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" strokeWidth={2} style={{ color: "#E8A020" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 font-semibold text-[14px] no-underline"
              style={{ color: "#0F4C2A" }}
            >
              See full pricing breakdown →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 13: Final CTA ─────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "#0F4C2A" }}>
        <div className="max-w-[720px] mx-auto text-center">
          <div
            className="inline-block font-semibold text-[13px] mb-6 px-5 py-2 rounded-[50px]"
            style={{
              background: "rgba(232,160,32,0.15)",
              border: "1px solid rgba(232,160,32,0.3)",
              color: "#E8A020",
            }}
          >
            For Secondary Schools
          </div>
          <h2
            className="font-playfair font-bold leading-[1.2] mb-5"
            style={{ fontSize: "clamp(1.9rem,3.5vw,3rem)", color: "#ffffff" }}
          >
            Ready to bring your secondary school{" "}
            <em className="italic" style={{ color: "#E8A020" }}>
              into the digital age?
            </em>
          </h2>
          <p className="text-[17px] leading-[1.8] mb-4" style={{ color: "#A8E6C3" }}>
            Join hundreds of Kenyan secondary schools already using EduMyles to manage timetables, grades, fees, and payroll — all in one place.
          </p>
          <p className="text-[14px] mb-10 font-medium" style={{ color: "rgba(168,230,195,0.7)" }}>
            Free trial · No credit card required · Go live in 3–4 weeks
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/auth/signup/api"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-9 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial →
            </a>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-9 py-4 rounded-[50px] no-underline"
              style={{
                background: "transparent",
                border: "2px solid rgba(255,255,255,0.35)",
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
