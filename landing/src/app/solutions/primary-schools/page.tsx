import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EduMyles for Primary Schools — CBC-Ready School Management",
  description:
    "School management software built for Kenyan primary schools. CBC gradebook, M-Pesa fees, parent communication, and NEMIS-ready reports.",
};

const painPoints = [
  {
    icon: "📋",
    text: "CBC assessment tracking across strands and sub-strands is complex. Most schools still use Excel — and it breaks every term.",
  },
  {
    icon: "💰",
    text: "Fee collection is chaotic. Parents pay in cash, recording is manual, and outstanding balances get lost between terms.",
  },
  {
    icon: "🏫",
    text: "NEMIS data entry takes days. Manually re-keying student records for government returns wastes precious admin time.",
  },
];

const features = [
  {
    icon: "📚",
    title: "CBC Gradebook",
    desc: "Track learner performance across all CBC strands and sub-strands. Auto-generate formative and summative assessment reports aligned to KICD standards.",
  },
  {
    icon: "💳",
    title: "M-Pesa Fee Collection",
    desc: "Parents pay directly via M-Pesa STK push. Receipts are automatic. Outstanding balances are tracked in real-time.",
  },
  {
    icon: "📊",
    title: "NEMIS-Ready Reporting",
    desc: "Export NEMIS-compliant reports in one click. Student bio-data, enrollment figures, and class composition — ready for submission.",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Parent Communication",
    desc: "Send SMS or in-app alerts to parents about fees, attendance, events, and grades. All from one dashboard.",
  },
  {
    icon: "📅",
    title: "Attendance Tracking",
    desc: "One-tap daily attendance. Auto-alert parents when a child is absent. Track trends by class and term.",
  },
  {
    icon: "🎓",
    title: "Class & Stream Management",
    desc: "Manage class allocation, streams, transfers, and promotions as learners progress from PP1 through Class 8.",
  },
];

const benefitTiles = [
  {
    icon: "⚡",
    text: "Works on any device — phone, tablet, or computer. No app download required.",
  },
  {
    icon: "🇰🇪",
    text: "Designed for Kenyan curriculum — CBC, 8-4-4, PP1/PP2, and Class 1–8 all supported.",
  },
  {
    icon: "📶",
    text: "Works in low-bandwidth environments — even on 2G, your school keeps running.",
  },
];

export default function PrimarySchoolsPage() {
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
            Primary Schools
          </div>
          <h1
            className="font-playfair font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
          >
            Built for CBC. Made for{" "}
            <em className="italic" style={{ color: "#E8A020" }}>Kenyan primary schools.</em>
          </h1>
          <p
            className="font-light leading-[1.8] mb-8 mx-auto"
            style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "640px" }}
          >
            From Class 1 to Class 8 — EduMyles handles CBC assessment, M-Pesa fee collection, parent communication, and NEMIS reporting in one simple platform.
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
            {["CBC & 8-4-4 Gradebook", "M-Pesa Integration", "NEMIS Export Ready"].map((badge) => (
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
              Features for Primary Schools
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Everything a primary school needs
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              11 integrated modules, configured for CBC primary education
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

      {/* ── How It Looks ──────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Simple enough for every teacher,{" "}
              <em className="italic" style={{ color: "#E8A020" }}>powerful enough for every admin</em>
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
            We have 520 learners from PP2 to Class 8. Before EduMyles, CBC report cards alone took three teachers an entire weekend every term. Now it takes four hours. The M-Pesa integration also means zero cash handling — parents love it.
          </blockquote>
          <p className="font-semibold text-[14px]" style={{ color: "#0F4C2A" }}>
            — James M., Head Teacher, Greenfield Primary School, Thika
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
            Affordable for every primary school
          </h2>
          <p className="text-[16px] leading-[1.8] mb-6" style={{ color: "#5a5a5a" }}>
            Most primary schools fit our Starter plan at{" "}
            <strong style={{ color: "#0F4C2A" }}>KES 12,900/month</strong> — covering up to 500 learners with full CBC gradebook, M-Pesa integration, and parent communication.
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
            Ready to bring your primary school{" "}
            <em className="italic" style={{ color: "#E8A020" }}>into the digital age?</em>
          </h2>
          <p className="text-[17px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Join hundreds of Kenyan primary schools already using EduMyles.
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
