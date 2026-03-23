import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EduMyles for International Schools — IGCSE, IB & Cambridge School Management",
  description:
    "School management software for international and private schools in East Africa. IGCSE, IB, Cambridge curriculum, multi-currency fees, SSO, and white-label options.",
};

const painPoints = [
  {
    icon: "🌍",
    text: "International parents expect a premium digital experience — not a WhatsApp group or PDF circular.",
  },
  {
    icon: "💳",
    text: "Multi-currency fee collection (KES, USD, GBP) with bank transfers, Stripe, and M-Pesa all feeding different reports.",
  },
  {
    icon: "🔐",
    text: "Enterprise schools require SSO, MFA, and audit logs that consumer-grade tools can't provide.",
  },
];

const features = [
  {
    icon: "🎓",
    title: "IGCSE / IB / Cambridge Gradebook",
    desc: "Configure any curriculum. IGCSE A*–G grades, IB 1–7 scale, Cambridge checkpoint — all supported with custom report templates.",
  },
  {
    icon: "💱",
    title: "Multi-Currency Finance",
    desc: "Accept KES, USD, GBP, EUR. Automatic currency conversion in reports. Stripe for cards, M-Pesa for local parents.",
  },
  {
    icon: "🔑",
    title: "SSO & WorkOS",
    desc: "Single sign-on via Google Workspace, Microsoft 365, or SAML. MFA enforced. SCIM provisioning for staff onboarding.",
  },
  {
    icon: "🏷️",
    title: "White-Label Branding",
    desc: "Your school name, your logo, your domain. EduMyles powers the platform invisibly — parents see your brand throughout.",
  },
  {
    icon: "📋",
    title: "Custom Reporting",
    desc: "Build custom report templates, house system reports, and pastoral care notes that fit your school's unique format.",
  },
  {
    icon: "🎯",
    title: "Dedicated Success Manager",
    desc: "Enterprise plans include a dedicated customer success manager — your direct line for onboarding, training, and ongoing support.",
  },
];

const securityItems = [
  { icon: "🛡️", label: "SOC 2 Type I certified" },
  { icon: "⏱️", label: "99.9% uptime SLA (contractual)" },
  { icon: "🔒", label: "End-to-end encryption (TLS 1.3 + AES-256)" },
  { icon: "📜", label: "GDPR & Kenya DPA compliant" },
  { icon: "🌐", label: "Custom data residency available" },
];

export default function InternationalSchoolsPage() {
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
            International Schools
          </div>
          <h1
            className="font-playfair font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
          >
            Enterprise school management for{" "}
            <em className="italic" style={{ color: "#E8A020" }}>East Africa&apos;s international schools.</em>
          </h1>
          <p
            className="font-light leading-[1.8] mb-8 mx-auto"
            style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "660px" }}
          >
            IGCSE, IB, and Cambridge curriculum support. Multi-currency fees. SSO with WorkOS. White-label branding. Everything a world-class school expects.
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
            {["IGCSE & IB Ready", "Multi-Currency", "SSO / WorkOS"].map((badge) => (
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
              The challenges international schools face
            </p>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
            >
              Your school deserves better.
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
              Enterprise Features
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Everything an international school expects
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
              Enterprise-grade features, built for the complexity of world-class education in East Africa
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

      {/* ── Enterprise Security ───────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              Security & Compliance
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2] mb-3"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Built for schools that{" "}
              <em className="italic" style={{ color: "#E8A020" }}>can&apos;t afford downtime</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {securityItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 rounded-2xl p-5"
                style={{ background: "#ffffff", border: "1px solid rgba(38,166,91,0.15)", boxShadow: "0 2px 10px rgba(6,26,18,0.05)" }}
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <span className="font-semibold text-[14px]" style={{ color: "#061A12" }}>{item.label}</span>
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
            We are an IB school with families from 28 countries. EduMyles handled our Stripe + M-Pesa setup in one day, and the white-label option means parents think it&apos;s our own platform. The SSO integration with Google Workspace took 20 minutes.
          </blockquote>
          <p className="font-semibold text-[14px]" style={{ color: "#0F4C2A" }}>
            — Michael T., IT Director, Accent International School, Nairobi
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
            Enterprise Pricing
          </div>
          <h2
            className="font-playfair font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
          >
            Custom pricing for international schools
          </h2>
          <p className="text-[16px] leading-[1.8] mb-6" style={{ color: "#5a5a5a" }}>
            International schools use our Enterprise plan — custom pricing based on student count, campuses, and required integrations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:sales@edumyles.com"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3 rounded-[50px] no-underline"
              style={{ background: "#061A12", color: "#ffffff" }}
            >
              Contact Sales →
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-7 py-3 rounded-[50px] no-underline"
              style={{ border: "2px solid #061A12", color: "#061A12" }}
            >
              See pricing overview →
            </Link>
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
            Ready to elevate your{" "}
            <em className="italic" style={{ color: "#E8A020" }}>international school?</em>
          </h2>
          <p className="text-[17px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Talk to our enterprise team and get a bespoke demo tailored to your curriculum and infrastructure.
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
