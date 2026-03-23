import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EduMyles for Secondary Schools — KCSE & CBC Senior School Management",
  description:
    "School management software for Kenyan secondary schools. KCSE gradebook, M-Pesa fees, timetabling, HR & payroll, and multi-stream management.",
};

const painPoints = [
  {
    icon: "📊",
    text: "Managing Grades 9–12 or Form 1–4 across multiple streams and subjects is overwhelming with paper or Excel. One missed entry breaks the whole report.",
  },
  {
    icon: "📅",
    text: "Timetabling for secondary schools — balancing 50+ subjects, 30+ teachers, and limited classrooms — takes weeks and still has conflicts.",
  },
  {
    icon: "👩‍🏫",
    text: "Staff payroll with KRA, NHIF, and NSSF deductions is complex. Most schools still use external accountants or error-prone spreadsheets.",
  },
];

const features = [
  {
    icon: "📝",
    title: "KCSE & CBC Gradebook",
    desc: "Marks entry, weighted averages, mean grades, rank generation, and one-click KCSE-format report cards. Supports 8-4-4 and CBC Senior School.",
  },
  {
    icon: "⏰",
    title: "Auto-Timetabling",
    desc: "Generate conflict-free timetables in seconds. Set teacher availability, room capacity, and double-lesson rules — EduMyles handles the rest.",
  },
  {
    icon: "💰",
    title: "Fee & Billing",
    desc: "Invoices, M-Pesa collection, bank transfer tracking, and outstanding balance alerts. Works for boarding, day, and mixed schools.",
  },
  {
    icon: "👨‍💼",
    title: "HR & Payroll",
    desc: "Staff contracts, leave management, and automated payroll with KRA, NHIF, and NSSF calculations. Generate payslips in one click.",
  },
  {
    icon: "📚",
    title: "Subject & Stream Management",
    desc: "Manage Arts, Sciences, and technical subjects across streams. Track class performance and identify at-risk students early.",
  },
  {
    icon: "🔔",
    title: "Parent & Student Portals",
    desc: "Parents track fees, grades, and attendance. Students access their own results. No more phone calls — everything is self-service.",
  },
];

const benefitTiles = [
  {
    icon: "🏆",
    text: "Supports Kenya's transition to CBC Senior School — Grade 9, 10, 11, and 12 structure fully configured.",
  },
  {
    icon: "🏫",
    text: "Multi-stream support — manage Science, Arts, and Technical streams independently.",
  },
  {
    icon: "📱",
    text: "Teachers mark attendance and enter grades from their phones in seconds.",
  },
];

export default function SecondarySchoolsPage() {
  return (
    <div style={{ color: "#212121" }}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "6rem 2rem 5rem",
          minHeight: "520px",
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
            className="inline-block font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
            style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}
          >
            Secondary Schools
          </div>
          <h1
            className="font-playfair font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
          >
            From Form 1 to Form 4.{" "}
            <em className="italic" style={{ color: "#E8A020" }}>Every module your secondary school needs.</em>
          </h1>
          <p
            className="font-light leading-[1.8] mb-8 mx-auto"
            style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "660px" }}
          >
            KCSE gradebook, automated timetabling, M-Pesa fee collection, HR &amp; payroll, and a parent portal that keeps families informed — all in one platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <a
              href="/auth/signup/api"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial →
            </a>
            <a
              href="https://wa.me/254743993715"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              Book a Demo
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {["KCSE & CBC Senior Ready", "Auto-Timetabling", "HR & Payroll Built-In"].map((badge) => (
              <span
                key={badge}
                className="font-semibold text-[12px] px-4 py-2 rounded-[50px]"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.2)", color: "#A8E6C3" }}
              >
                ✓ {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain Points ───────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#0C3020" }}>
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
            {painPoints.map((p) => (
              <div
                key={p.icon}
                className="rounded-2xl p-7"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,160,32,0.2)" }}
              >
                <div className="text-4xl mb-4">{p.icon}</div>
                <p className="leading-[1.8] text-[15px]" style={{ color: "#A8E6C3" }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              Features for Secondary Schools
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Everything a secondary school needs
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              11 integrated modules, built for the demands of Kenyan secondary education
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6"
                style={{ border: "1px solid #e8f4ec", boxShadow: "0 2px 16px rgba(6,26,18,0.05)" }}
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-playfair font-bold text-[19px] mb-3" style={{ color: "#061A12" }}>
                  {f.title}
                </h3>
                <p className="text-[14px] leading-[1.75]" style={{ color: "#5a5a5a" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefit Tiles ─────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Built for{" "}
              <em className="italic" style={{ color: "#E8A020" }}>how secondary schools actually work</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {benefitTiles.map((t) => (
              <div
                key={t.icon}
                className="rounded-2xl p-7 text-center"
                style={{ background: "#ffffff", border: "1px solid rgba(38,166,91,0.15)", boxShadow: "0 2px 12px rgba(6,26,18,0.06)" }}
              >
                <div className="text-4xl mb-4">{t.icon}</div>
                <p className="text-[15px] leading-[1.75]" style={{ color: "#3d3d3d" }}>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ───────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#FEF3DC" }}>
        <div className="max-w-[800px] mx-auto text-center">
          <div className="text-5xl mb-6" style={{ color: "#E8A020" }}>&ldquo;</div>
          <blockquote
            className="font-playfair italic leading-[1.8] mb-6"
            style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)", color: "#2d2d2d" }}
          >
            Our school has 1,100 students across 12 streams. Timetabling used to take our deputy principal two weeks. EduMyles generates a conflict-free timetable in under an hour. That time is now spent on teaching.
          </blockquote>
          <p className="font-semibold text-[14px]" style={{ color: "#0F4C2A" }}>
            — Sarah K., Deputy Principal, Upperhill Secondary School, Nairobi
          </p>
        </div>
      </section>

      {/* ── Pricing Callout ───────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[800px] mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 font-semibold text-[13px] mb-5 px-4 py-2 rounded-[50px]"
            style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
          >
            Pricing
          </div>
          <h2
            className="font-playfair font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
          >
            Priced for secondary schools
          </h2>
          <p className="text-[16px] leading-[1.8] mb-6" style={{ color: "#5a5a5a" }}>
            Most secondary schools (400–2,000 students) use our Professional plan at{" "}
            <strong style={{ color: "#0F4C2A" }}>KES 38,900/month</strong> — including all 11 modules, HR &amp; payroll, CBC Senior gradebook, and priority support.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-7 py-3 rounded-[50px] no-underline"
              style={{ border: "2px solid #061A12", color: "#061A12" }}
            >
              See full pricing →
            </Link>
            <a
              href="/auth/signup/api"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3 rounded-[50px] no-underline"
              style={{ background: "#061A12", color: "#ffffff" }}
            >
              Start Free Trial →
            </a>
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
            Ready to modernise your{" "}
            <em className="italic" style={{ color: "#E8A020" }}>secondary school?</em>
          </h2>
          <p className="text-[17px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Start your free 30-day trial or book a personalised demo with our school-tech experts.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/auth/signup/api"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial →
            </a>
            <a
              href="https://wa.me/254743993715"
              target="_blank"
              rel="noopener noreferrer"
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
