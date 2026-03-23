import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EduMyles for School Groups & Multi-Campus Networks",
  description:
    "Manage multiple schools or campuses from one platform. Network-wide reporting, strict data isolation, central HR, and consolidated billing.",
};

const painPoints = [
  {
    icon: "🏫",
    text: "Managing 5 schools means 5 different spreadsheets, 5 different WhatsApp groups, and 5 separate conversations with 5 different bursars.",
  },
  {
    icon: "📊",
    text: "Getting a consolidated view of enrollment, fees, and performance across all your schools takes days of manual data compilation.",
  },
  {
    icon: "👥",
    text: "Staff transfers between campuses, central payroll, and cross-school HR policies are impossible to manage without a unified system.",
  },
];

const features = [
  {
    icon: "🌐",
    title: "Multi-Campus Dashboard",
    desc: "See enrollment, fee collection, attendance rates, and academic performance across all schools from a single command centre.",
  },
  {
    icon: "🔒",
    title: "Strict Data Isolation",
    desc: "Each school sees only its own data. Principals and teachers can't access other schools — ever. Network admins see everything.",
  },
  {
    icon: "📊",
    title: "Network Reporting",
    desc: "Generate consolidated reports for all schools or compare performance between campuses. Export for board meetings in one click.",
  },
  {
    icon: "👤",
    title: "Central HR",
    desc: "Manage staff across all campuses from one HR system. Handle transfers, cross-campus payroll, and unified leave management.",
  },
  {
    icon: "💰",
    title: "Consolidated Billing",
    desc: "One invoice, one contract. Add new schools to your network instantly. Volume discounts apply automatically.",
  },
  {
    icon: "🎯",
    title: "Dedicated Account Manager",
    desc: "Your network gets a dedicated EduMyles account manager — one person who knows all your schools and handles everything.",
  },
];

const steps = [
  "We set up your network organisation and all school accounts",
  "Each school imports its own data independently",
  "Network admins get full visibility; school admins see only their school",
  "One monthly invoice covers all schools — with discounts at 3, 5, and 10+ schools",
];

const pricingTiers = [
  {
    range: "2–4 schools",
    discount: "10% off",
    detail: "per school",
    highlight: false,
  },
  {
    range: "5–9 schools",
    discount: "20% off",
    detail: "per school",
    highlight: true,
  },
  {
    range: "10+ schools",
    discount: "Custom pricing",
    detail: "dedicated infrastructure",
    highlight: false,
  },
];

export default function SchoolGroupsPage() {
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
            School Groups
          </div>
          <h1
            className="font-playfair font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
          >
            One platform.{" "}
            <em className="italic" style={{ color: "#E8A020" }}>Every school in your network.</em>
          </h1>
          <p
            className="font-light leading-[1.8] mb-8 mx-auto"
            style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "660px" }}
          >
            Whether you run 2 campuses or 20 schools, EduMyles gives you network-wide visibility while keeping each school&apos;s data completely separate and secure.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <a
              href="mailto:sales@edumyles.com"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Contact Sales →
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
            {["Network-wide reporting", "Strict data isolation", "Consolidated billing"].map((badge) => (
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
              The challenges school networks face
            </p>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
            >
              Managing multiple schools shouldn&apos;t be this hard.
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

      {/* ── Network Features ──────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              Network Features
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Built for school networks at every scale
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              All the tools a school group needs — with the visibility, security, and control you demand
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

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              How It Works
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Up and running in{" "}
              <em className="italic" style={{ color: "#E8A020" }}>days, not months</em>
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-5 rounded-2xl p-6"
                style={{ background: "#ffffff", border: "1px solid rgba(38,166,91,0.15)", boxShadow: "0 2px 10px rgba(6,26,18,0.05)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[16px] flex-shrink-0"
                  style={{ background: "#061A12", color: "#E8A020" }}
                >
                  {i + 1}
                </div>
                <p className="text-[15px] leading-[1.7] my-auto" style={{ color: "#3d3d3d" }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Volume Pricing ────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              Volume Pricing
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Volume discounts for school networks
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              The more schools in your network, the more you save.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {pricingTiers.map((tier) => (
              <div
                key={tier.range}
                className="rounded-2xl p-7 text-center"
                style={{
                  border: tier.highlight ? "2px solid #E8A020" : "1px solid #e8f4ec",
                  boxShadow: tier.highlight ? "0 4px 24px rgba(232,160,32,0.15)" : "0 2px 16px rgba(6,26,18,0.05)",
                  background: tier.highlight ? "#FEF3DC" : "#ffffff",
                }}
              >
                <p
                  className="font-semibold text-[13px] uppercase tracking-[0.1em] mb-3"
                  style={{ color: tier.highlight ? "#9A5D00" : "#6B9E83" }}
                >
                  {tier.range}
                </p>
                <p
                  className="font-playfair font-bold leading-[1.1] mb-2"
                  style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", color: "#061A12" }}
                >
                  {tier.discount}
                </p>
                <p className="text-[14px]" style={{ color: "#5a5a5a" }}>{tier.detail}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a
              href="mailto:sales@edumyles.com"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#061A12", color: "#ffffff" }}
            >
              Contact Sales for a custom quote →
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
            Ready to manage your entire network{" "}
            <em className="italic" style={{ color: "#E8A020" }}>from one platform?</em>
          </h2>
          <p className="text-[17px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Talk to our team and get a demo tailored to your network size and structure.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:sales@edumyles.com"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Contact Sales →
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
