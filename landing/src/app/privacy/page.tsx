import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, Database, UserCheck, Mail, FileText, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — EduMyles",
  description:
    "EduMyles Privacy Policy. How we collect, use, and protect data for schools, students, parents, and staff across East Africa.",
};

const sections = [
  { id: "collection", label: "Data We Collect" },
  { id: "usage", label: "How We Use It" },
  { id: "sharing", label: "Data Sharing" },
  { id: "rights", label: "Your Rights" },
  { id: "retention", label: "Data Retention" },
  { id: "security", label: "Security" },
  { id: "dpa", label: "Kenya DPA" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPage() {
  return (
    <div style={{ color: "var(--color-text-default)" }}>
      {/* Hero */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "var(--color-surface-default)",
          borderTop: "3px solid var(--color-action-primary)",
          padding: "5rem 2rem 4rem",
          minHeight: "320px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[860px] mx-auto w-full">
          <div
            className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-5 px-4 py-2 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--color-action-primary) 12%, transparent)",
              border: "1px solid var(--color-text-on-primary-subtle)",
              color: "var(--color-text-on-primary-subtle)",
            }}
          >
            <Shield className="w-3.5 h-3.5" strokeWidth={2} />
            Privacy Policy
          </div>
          <h1
            className="font-display font-bold leading-tight mb-4"
            style={{ fontSize: "clamp(2rem,4vw,3.25rem)", color: "var(--color-text-default)" }}
          >
            Your data,{" "}
            <em className="italic" style={{ color: "var(--color-text-on-primary-subtle)" }}>
              protected.
            </em>
          </h1>
          <p className="font-jakarta text-[15px] mb-6" style={{ color: "var(--color-text-muted)" }}>
            Last updated: March 2026 · Effective: 1 January 2025
          </p>
          {/* Quick nav */}
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="font-jakarta font-medium text-[12px] px-4 py-2 rounded-full no-underline transition-colors duration-200"
                style={{
                  background: "color-mix(in srgb, var(--color-surface-default) 7%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-surface-default) 12%, transparent)",
                  color: "var(--color-text-muted)",
                }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-[860px] mx-auto px-6 py-16 flex flex-col gap-14">
        {/* Intro */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--color-surface-page)", border: "1px solid var(--color-border-default)" }}
        >
          <p className="font-jakarta text-[14px] leading-[1.9]" style={{ color: "var(--color-text-muted)" }}>
            EduMyles (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a school management
            platform operated by <strong>MylesCorp Technologies Ltd</strong>, incorporated in Kenya.
            This Privacy Policy explains how we collect, use, store, and protect personal data when
            you use our platform. We comply with the{" "}
            <strong>Kenya Data Protection Act, 2019</strong> and applicable East African data
            protection laws.
          </p>
        </div>

        {/* 1 — Data We Collect */}
        <section id="collection" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <Database className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              Data We Collect
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Student Data",
                items: [
                  "Full name, date of birth, admission number",
                  "Academic records, grades, CBC competency scores",
                  "Attendance records",
                  "Fee balance and payment history",
                ],
              },
              {
                title: "Parent / Guardian Data",
                items: [
                  "Name, phone number (M-Pesa registered)",
                  "Email address, relationship to student",
                  "Communication preferences",
                  "M-Pesa transaction IDs",
                ],
              },
              {
                title: "Staff Data",
                items: [
                  "Name, national ID number, role",
                  "Payroll information, bank details",
                  "Contact details, address",
                  "Leave records, performance data",
                ],
              },
              {
                title: "Usage & Technical Data",
                items: [
                  "Pages visited, features used",
                  "Login timestamps, device information",
                  "IP address, browser type",
                  "Session duration, click patterns",
                ],
              },
            ].map((group) => (
              <div
                key={group.title}
                className="rounded-xl p-5"
                style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
              >
                <h3
                  className="font-jakarta font-bold text-[14px] mb-3"
                  style={{ color: "var(--color-text-default)" }}
                >
                  {group.title}
                </h3>
                <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="font-jakarta text-[13px] flex items-start gap-2"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <span style={{ color: "var(--color-action-primary)", flexShrink: 0, marginTop: 3 }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="mt-4 rounded-xl p-4 flex items-start gap-3"
            style={{
              background: "color-mix(in srgb, var(--color-action-primary) 6%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-action-primary) 20%, transparent)",
            }}
          >
            <AlertCircle
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              strokeWidth={1.5}
              style={{ color: "var(--color-text-on-primary-subtle)" }}
            />
            <p className="font-jakarta text-[13px]" style={{ color: "var(--color-text-muted)" }}>
              We do <strong>not</strong> store full card numbers, M-Pesa PINs, or passwords in plain
              text. Payment data is processed via Safaricom Daraja API and we only retain
              transaction reference IDs.
            </p>
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--color-surface-sunken)" }} />

        {/* 2 — How We Use It */}
        <section id="usage" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <Eye className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              How We Use Your Data
            </h2>
          </div>
          <ul className="flex flex-col gap-3">
            {[
              "Provide, maintain, and improve the EduMyles platform",
              "Generate academic reports, fee statements, and attendance records for schools",
              "Send automated SMS/email alerts to parents (fee reminders, report cards, attendance alerts)",
              "Process M-Pesa fee payments via Safaricom Daraja API",
              "Comply with Kenya's CBC, NEMIS, and KNEC reporting requirements",
              "Analyse anonymised usage patterns to improve product features",
              "Respond to support requests and resolve technical issues",
              "Send product update emails (you can unsubscribe at any time)",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 font-jakarta text-[14px] leading-[1.7]"
                style={{ color: "var(--color-text-muted)", listStyle: "none" }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "var(--color-surface-page)", border: "1px solid var(--color-border-default)" }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--color-action-primary)",
                      display: "block",
                    }}
                  />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <div style={{ borderTop: "1px solid var(--color-surface-sunken)" }} />

        {/* 3 — Data Sharing */}
        <section id="sharing" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <FileText className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              Data Sharing
            </h2>
          </div>
          <div
            className="rounded-2xl p-5 mb-5"
            style={{ background: "var(--color-surface-page)", border: "2px solid var(--color-border-default)" }}
          >
            <p className="font-jakarta font-bold text-[14px]" style={{ color: "var(--color-action-primary)" }}>
              We do NOT sell, rent, or trade your personal data to any third party — ever.
            </p>
          </div>
          <p className="font-jakarta text-[14px] leading-[1.8] mb-4" style={{ color: "var(--color-text-muted)" }}>
            Data is shared only with the following processors, bound by data processing agreements:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: "Safaricom (M-Pesa/Daraja)", purpose: "Process school fee payments" },
              { name: "SMS provider", purpose: "SMS delivery to parents and staff" },
              {
                name: "Amazon Web Services (AWS)",
                purpose: "Cloud infrastructure and data storage",
              },
              { name: "Hosting provider", purpose: "Platform hosting and delivery" },
              {
                name: "NEMIS / KNEC (Kenya Govt.)",
                purpose: "Mandatory government reporting only",
              },
              { name: "Authentication provider", purpose: "Authentication and single sign-on" },
            ].map((p) => (
              <div
                key={p.name}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
              >
                <span style={{ color: "var(--color-action-primary)", flexShrink: 0, marginTop: 2 }}>→</span>
                <div>
                  <span
                    className="font-jakarta font-semibold text-[13px]"
                    style={{ color: "var(--color-text-default)" }}
                  >
                    {p.name}
                  </span>
                  <span className="font-jakarta text-[12.5px] block" style={{ color: "var(--color-text-muted)" }}>
                    {p.purpose}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--color-surface-sunken)" }} />

        {/* 4 — Your Rights */}
        <section id="rights" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <UserCheck className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              Your Rights
            </h2>
          </div>
          <p className="font-jakarta text-[14px] leading-[1.8] mb-6" style={{ color: "var(--color-text-muted)" }}>
            Under the Kenya Data Protection Act, 2019, you have the following rights:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                right: "Right to Access",
                detail: "Request a copy of all personal data we hold about you or your school.",
              },
              {
                right: "Right to Correction",
                detail: "Update or correct inaccurate student, parent, or staff records.",
              },
              {
                right: "Right to Deletion",
                detail: "Request deletion of your data (subject to legal retention requirements).",
              },
              {
                right: "Right to Portability",
                detail: "Export your school's complete data in CSV or Excel format at any time.",
              },
              {
                right: "Right to Object",
                detail: "Opt out of non-essential communications such as marketing emails.",
              },
              {
                right: "Right to Withdraw Consent",
                detail: "Where processing is consent-based, you may withdraw consent at any time.",
              },
            ].map((r) => (
              <div
                key={r.right}
                className="rounded-xl p-5"
                style={{ background: "var(--color-surface-page)", border: "1px solid var(--color-border-default)" }}
              >
                <h3
                  className="font-jakarta font-bold text-[13.5px] mb-1.5"
                  style={{ color: "var(--color-action-primary)" }}
                >
                  {r.right}
                </h3>
                <p className="font-jakarta text-[13px] leading-[1.7]" style={{ color: "var(--color-text-muted)" }}>
                  {r.detail}
                </p>
              </div>
            ))}
          </div>
          <p className="font-jakarta text-[13px] mt-4" style={{ color: "var(--color-text-muted)" }}>
            To exercise any of these rights, email{" "}
            <a href="mailto:privacy@edumyles.com" style={{ color: "var(--color-action-primary)" }}>
              privacy@edumyles.com
            </a>
            . We respond within 30 business days.
          </p>
        </section>

        <div style={{ borderTop: "1px solid var(--color-surface-sunken)" }} />

        {/* 5 — Retention */}
        <section id="retention" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <FileText className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              Data Retention
            </h2>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border-default)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "var(--color-surface-default)" }}>
                  <th
                    className="font-jakarta font-bold text-[12px] text-left px-5 py-3"
                    style={{ color: "var(--color-text-on-primary-subtle)" }}
                  >
                    Data Type
                  </th>
                  <th
                    className="font-jakarta font-bold text-[12px] text-left px-5 py-3"
                    style={{ color: "var(--color-text-on-primary-subtle)" }}
                  >
                    Retention Period
                  </th>
                  <th
                    className="font-jakarta font-bold text-[12px] text-left px-5 py-3 hidden sm:table-cell"
                    style={{ color: "var(--color-text-on-primary-subtle)" }}
                  >
                    Legal Basis
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Active student records", "7 years after leaving school", "Kenya Education Act"],
                  ["Payment records", "7 years", "Kenya Revenue Authority"],
                  [
                    "Inactive school accounts",
                    "2 years after subscription ends",
                    "Business necessity",
                  ],
                  ["Staff HR records", "7 years after employment ends", "Employment Act, Kenya"],
                  ["Usage logs", "90 days", "Security & debugging"],
                  ["Marketing emails", "Until unsubscribed", "Consent"],
                ].map(([type, period, basis], i) => (
                  <tr key={type} style={{ background: i % 2 === 0 ? "var(--color-surface-default)" : "var(--color-surface-sunken)" }}>
                    <td className="font-jakarta text-[13px] px-5 py-3" style={{ color: "var(--color-text-muted)" }}>
                      {type}
                    </td>
                    <td
                      className="font-jakarta font-semibold text-[13px] px-5 py-3"
                      style={{ color: "var(--color-action-primary)" }}
                    >
                      {period}
                    </td>
                    <td
                      className="font-jakarta text-[12px] px-5 py-3 hidden sm:table-cell"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {basis}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--color-surface-sunken)" }} />

        {/* 6 — Security */}
        <section id="security" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <Lock className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              Security Measures
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "256-bit AES encryption for all data at rest",
              "TLS 1.3 for all data in transit",
              "Multi-factor authentication for admin accounts",
              "Role-based access control (teachers see only their classes)",
              "Regular penetration testing by third-party security firms",
              "Documented security and access-control processes",
              "All staff undergo data protection training annually",
              "Automatic session timeout after inactivity",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: "var(--color-surface-page)", border: "1px solid var(--color-border-default)" }}
              >
                <Lock
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  strokeWidth={1.5}
                  style={{ color: "var(--color-action-primary)" }}
                />
                <span
                  className="font-jakarta text-[13px] leading-[1.6]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--color-surface-sunken)" }} />

        {/* 7 — Kenya DPA */}
        <section id="dpa" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <Shield className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              Kenya DPA Compliance
            </h2>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--color-surface-page)", border: "1px solid var(--color-border-default)" }}
          >
            <p className="font-jakarta text-[14px] leading-[1.9] mb-4" style={{ color: "var(--color-text-muted)" }}>
              MylesCorp Technologies Ltd is registered as a <strong>data processor</strong> under
              Kenya&apos;s Data Protection Act, 2019. Schools using EduMyles are the{" "}
              <strong>data controllers</strong> for their students&apos; and staff&apos; personal
              data.
            </p>
            <ul className="flex flex-col gap-2">
              {[
                "Data Protection Officer: dpo@edumyles.com",
                "Data stored in Nairobi, Kenya and EU (Ireland, AWS) — never transferred outside adequate-safeguard regions",
                "Annual Data Protection Impact Assessments (DPIAs) conducted",
                "Schools provided with a Data Processing Agreement (DPA) on request",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 font-jakarta text-[13px]"
                  style={{ color: "var(--color-text-muted)", listStyle: "none" }}
                >
                  <span style={{ color: "var(--color-action-primary)", flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--color-surface-sunken)" }} />

        {/* 8 — Contact */}
        <section id="contact" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <Mail className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              Contact Our Privacy Team
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                label: "Privacy enquiries",
                value: "privacy@edumyles.com",
                href: "mailto:privacy@edumyles.com",
              },
              {
                label: "Data Protection Officer",
                value: "dpo@edumyles.com",
                href: "mailto:dpo@edumyles.com",
              },
              { label: "Postal address", value: "WesternHeights, Nairobi, Kenya", href: null },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl p-5"
                style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
              >
                <p
                  className="font-jakarta text-[11px] uppercase tracking-wider mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {c.label}
                </p>
                {c.href ? (
                  <a
                    href={c.href}
                    className="font-jakarta font-semibold text-[13.5px] no-underline"
                    style={{ color: "var(--color-action-primary)" }}
                  >
                    {c.value}
                  </a>
                ) : (
                  <p
                    className="font-jakarta font-semibold text-[13.5px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {c.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--color-surface-default)" }}>
          <h3 className="font-display font-bold text-[20px] text-foreground mb-2">
            Questions about your data?
          </h3>
          <p className="font-jakarta text-[14px] mb-5" style={{ color: "var(--color-text-muted)" }}>
            Our privacy team typically responds within 2 business days.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] no-underline"
            style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
