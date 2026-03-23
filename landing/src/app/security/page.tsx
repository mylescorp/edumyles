import type { Metadata } from "next";
import React from "react";
import { LockKeyhole, Building2, KeyRound, ShieldCheck, ClipboardCheck, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Security & Privacy — EduMyles",
  description:
    "How EduMyles protects student data and school information. SOC 2, encryption, GDPR and Kenya Data Protection Act compliance.",
};

const features: { icon: LucideIcon | string; title: string; body: string }[] = [
  {
    icon: LockKeyhole,
    title: "End-to-End Encryption",
    body: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Student records, fee data, and communications are never stored in plain text.",
  },
  {
    icon: Building2,
    title: "School Data Isolation",
    body: "Strict multi-tenant architecture. Each school's data is completely isolated — no school can ever access another school's information.",
  },
  {
    icon: KeyRound,
    title: "Role-Based Access",
    body: "14 granular user roles. Every user sees only what they need. Principals see everything; students see only their own records.",
  },
  {
    icon: ShieldCheck,
    title: "SOC 2 Type I Certified",
    body: "We have completed our SOC 2 Type I audit, covering security, availability, and confidentiality. Type II audit in progress.",
  },
  {
    icon: "🇰🇪",
    title: "Kenya Data Protection Act",
    body: "Fully compliant with Kenya's Data Protection Act 2019. We process student data only for legitimate school management purposes.",
  },
  {
    icon: ClipboardCheck,
    title: "GDPR Ready",
    body: "For international schools with EU-connected families, we support GDPR data subject requests, deletion, and export.",
  },
];

const dataQA = [
  {
    q: "Where is data stored?",
    a: "All data is stored on servers in the EU (Frankfurt) with automatic backups to a secondary region. Kenyan-primary-data residency option available for Enterprise.",
  },
  {
    q: "Who can access school data?",
    a: "Only your school's users (based on roles you assign) and EduMyles engineers under strict need-to-know access controls. We never sell or share data with third parties.",
  },
  {
    q: "How long is data retained?",
    a: "Active school data is retained indefinitely while your subscription is active. After cancellation, data is retained for 90 days and then securely deleted on request.",
  },
  {
    q: "Can we export our data?",
    a: "Yes. You can export all your school data at any time in CSV or JSON format — no lock-in, no exit fees.",
  },
];

export default function SecurityPage() {
  return (
    <div style={{ color: "#212121" }}>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "5rem 2rem 4.5rem",
          minHeight: "400px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full">
          <div className="max-w-[700px]">
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}
            >
              Security &amp; Privacy
            </div>
            <h1
              className="font-playfair font-bold leading-[1.15] mb-5"
              style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
            >
              Your school data is{" "}
              <em className="italic" style={{ color: "#E8A020" }}>safe with us.</em>
            </h1>
            <p
              className="font-jakarta font-light leading-[1.8] mb-8"
              style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "560px" }}
            >
              Student data is sacred. We&apos;ve built EduMyles from the ground up with security, privacy, and compliance at every layer.
            </p>
            <div className="flex flex-wrap gap-3">
              {([
                { icon: <Lock className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />, label: "SOC 2 Type I" },
                { icon: <span className="flex-shrink-0">🇰🇪</span>, label: "Kenya DPA Compliant" },
                { icon: <LockKeyhole className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />, label: "End-to-End Encrypted" },
              ] as { icon: React.ReactNode; label: string }[]).map((badge) => (
                <span
                  key={badge.label}
                  className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] px-4 py-2 rounded-[50px]"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.2)", color: "#E8E8E8" }}
                >
                  {badge.icon}{badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Security Features Grid ──────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              Built-In Protections
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Security at{" "}
              <em className="italic" style={{ color: "#E8A020" }}>every layer</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-7 transition-transform duration-200 hover:-translate-y-1"
                style={{ background: "#ffffff", border: "1px solid #e8f4ec", boxShadow: "0 2px 12px rgba(6,26,18,0.05)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] mb-4"
                  style={{ background: "#F3FBF6" }}
                >
                  {typeof f.icon === "string" ? (
                    f.icon
                  ) : (
                    <f.icon className="w-6 h-6" strokeWidth={1.5} style={{ color: "#0F4C2A" }} />
                  )}
                </div>
                <h3 className="font-playfair font-bold text-[18px] mb-3" style={{ color: "#061A12" }}>
                  {f.title}
                </h3>
                <p className="font-jakarta text-[14px] leading-[1.8]" style={{ color: "#5a5a5a" }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data Practices ──────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              Transparency
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              How We Handle{" "}
              <em className="italic" style={{ color: "#E8A020" }}>Your Data</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {dataQA.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl p-7"
                style={{ background: "#ffffff", border: "1px solid #d4eade", boxShadow: "0 2px 8px rgba(6,26,18,0.04)" }}
              >
                <div
                  className="font-jakarta font-bold text-[12px] mb-1 uppercase tracking-wide"
                  style={{ color: "#E8A020" }}
                >
                  Q
                </div>
                <h3 className="font-playfair font-bold text-[17px] mb-3" style={{ color: "#061A12" }}>
                  {item.q}
                </h3>
                <p className="font-jakarta text-[14px] leading-[1.8]" style={{ color: "#5a5a5a" }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Security ────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#061A12" }}>
        <div className="max-w-[620px] mx-auto text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(232,160,32,0.15)", border: "1px solid rgba(232,160,32,0.3)" }}
          >
            <Lock className="w-6 h-6" strokeWidth={1.5} style={{ color: "#E8A020" }} />
          </div>
          <h2
            className="font-playfair font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", color: "#ffffff" }}
          >
            Found a vulnerability?
          </h2>
          <p className="font-jakarta text-[16px] leading-[1.8] mb-3" style={{ color: "#A8E6C3" }}>
            We have a responsible disclosure programme. Security researchers who report issues in good faith are protected and acknowledged.
          </p>
          <p className="font-jakarta text-[14px] mb-8" style={{ color: "#6B9E83" }}>
            Email:{" "}
            <a
              href="mailto:security@edumyles.com"
              style={{ color: "#E8A020", textDecoration: "none", fontWeight: 600 }}
            >
              security@edumyles.com
            </a>
          </p>
          <a
            href="mailto:security@edumyles.com?subject=Security%20Vulnerability%20Report"
            className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
            style={{ background: "#E8A020", color: "#061A12" }}
          >
            Report a security issue →
          </a>
        </div>
      </section>
    </div>
  );
}
