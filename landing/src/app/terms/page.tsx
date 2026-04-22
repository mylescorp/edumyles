import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  CheckCircle,
  Building2,
  CreditCard,
  Database,
  Code2,
  XCircle,
  Scale,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — EduMyles",
  description:
    "EduMyles Terms of Service. Fair, transparent terms governing the use of our school management platform across East Africa.",
};

const sections = [
  { id: "acceptance", label: "Acceptance" },
  { id: "services", label: "Services" },
  { id: "accounts", label: "Accounts" },
  { id: "billing", label: "Billing" },
  { id: "data", label: "Data" },
  { id: "ip", label: "Intellectual Property" },
  { id: "termination", label: "Termination" },
  { id: "law", label: "Governing Law" },
];

export default function TermsPage() {
  return (
    <div style={{ color: "#212121" }}>
      {/* Hero */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "5rem 2rem 4rem",
          minHeight: "320px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[860px] mx-auto w-full">
          <div
            className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-5 px-4 py-2 rounded-full"
            style={{
              background: "rgba(232,160,32,0.12)",
              border: "1px solid #E8A020",
              color: "#E8A020",
            }}
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={2} />
            Terms of Service
          </div>
          <h1
            className="font-display font-bold leading-tight mb-4"
            style={{ fontSize: "clamp(2rem,4vw,3.25rem)", color: "#ffffff" }}
          >
            Fair, transparent{" "}
            <em className="italic" style={{ color: "#E8A020" }}>
              terms.
            </em>
          </h1>
          <p className="font-jakarta text-[15px] mb-6" style={{ color: "#90CAF9" }}>
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
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#A8E6C3",
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
          style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
        >
          <p className="font-jakarta text-[14px] leading-[1.9]" style={{ color: "#374151" }}>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of EduMyles,
            a school management platform operated by <strong>MylesCorp Technologies Ltd</strong>,
            incorporated in Kenya. By using EduMyles you agree to be bound by these Terms. Please
            read them carefully.
          </p>
        </div>

        {/* 1 — Acceptance */}
        <section id="acceptance" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(26,122,74,0.1)" }}
            >
              <CheckCircle className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "#061A12" }}>
              Acceptance of Terms
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <p className="font-jakarta text-[14px] leading-[1.85]" style={{ color: "#374151" }}>
              By accessing or using EduMyles — whether by creating an account, clicking
              &ldquo;Accept&rdquo;, or simply using the platform — you agree to these Terms and our{" "}
              <Link href="/privacy" style={{ color: "#1A7A4A" }}>
                Privacy Policy
              </Link>
              .
            </p>
            <div
              className="rounded-xl p-5"
              style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
            >
              <p className="font-jakarta font-bold text-[13.5px] mb-2" style={{ color: "#0F4C2A" }}>
                Accepting on behalf of a school or institution
              </p>
              <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
                If you are accepting these Terms on behalf of a school, college, or other
                institution, you represent and warrant that you have the authority to bind that
                institution to these Terms. In that case, &ldquo;you&rdquo; and &ldquo;your&rdquo;
                refer to that institution.
              </p>
            </div>
            <p className="font-jakarta text-[14px] leading-[1.85]" style={{ color: "#374151" }}>
              We may update these Terms from time to time. We will notify you of material changes by
              email and/or by posting a notice on the platform. Continued use after the effective
              date of an update constitutes acceptance of the new Terms.
            </p>
          </div>
        </section>

        <div style={{ borderTop: "1px solid #f0f0f0" }} />

        {/* 2 — Services */}
        <section id="services" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(26,122,74,0.1)" }}
            >
              <Building2 className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "#061A12" }}>
              Services
            </h2>
          </div>
          <p className="font-jakarta text-[14px] leading-[1.85] mb-5" style={{ color: "#374151" }}>
            EduMyles provides a cloud-based school management platform. Services are delivered on a
            subscription basis and include:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            {[
              {
                title: "Student Information System",
                detail: "Admissions, profiles, CBC competency tracking, NEMIS integration",
              },
              {
                title: "Fee Management",
                detail:
                  "M-Pesa integrated billing, payment tracking, fee statements, arrears management",
              },
              {
                title: "CBC / KCSE Academic Reporting",
                detail: "Competency-based and examination-based report generation and distribution",
              },
              {
                title: "Attendance Tracking",
                detail: "Daily register, automated parent SMS alerts, attendance analytics",
              },
              {
                title: "Staff & Payroll Management",
                detail: "HR records, leave management, payslip generation, PAYE calculations",
              },
              {
                title: "Parent Communication Portal",
                detail: "SMS, email, and in-app notifications; parent portal for result access",
              },
            ].map((svc) => (
              <div
                key={svc.title}
                className="rounded-xl p-4"
                style={{ background: "#ffffff", border: "1px solid #e8f4ec" }}
              >
                <p className="font-jakarta font-bold text-[13px] mb-1" style={{ color: "#061A12" }}>
                  {svc.title}
                </p>
                <p
                  className="font-jakarta text-[12.5px] leading-[1.6]"
                  style={{ color: "#6B9E83" }}
                >
                  {svc.detail}
                </p>
              </div>
            ))}
          </div>
          <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
            We reserve the right to modify, suspend, or discontinue any feature with reasonable
            notice. We target 99.9% uptime and will communicate planned maintenance at least 48
            hours in advance.
          </p>
        </section>

        <div style={{ borderTop: "1px solid #f0f0f0" }} />

        {/* 3 — Accounts */}
        <section id="accounts" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(26,122,74,0.1)" }}
            >
              <Building2 className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "#061A12" }}>
              Account Registration
            </h2>
          </div>
          <ul className="flex flex-col gap-3">
            {[
              {
                point: "School administrator responsibility",
                detail:
                  "The school administrator who registers the account is responsible for all activity that occurs under that account, including actions by staff members granted access.",
              },
              {
                point: "Accurate information",
                detail:
                  "You must provide accurate, current, and complete information when creating your account and keep it updated. Providing false information may result in immediate termination.",
              },
              {
                point: "One account per school",
                detail:
                  "Each school is provisioned with one tenant account and subdomain. Multi-campus plans are available for institutions operating multiple sites under a single administration.",
              },
              {
                point: "Unauthorised access",
                detail:
                  "You must notify us immediately at security@edumyles.com if you suspect any unauthorised access to your account or credentials.",
              },
              {
                point: "Credential confidentiality",
                detail:
                  "You are responsible for maintaining the confidentiality of your login credentials. Do not share passwords. Use the role-based access system to grant staff appropriate permissions.",
              },
            ].map((item) => (
              <li
                key={item.point}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: "#F3FBF6", border: "1px solid #e8f4ec", listStyle: "none" }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#ffffff", border: "1px solid #d4eade" }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#1A7A4A",
                      display: "block",
                    }}
                  />
                </span>
                <div>
                  <p
                    className="font-jakarta font-bold text-[13px] mb-1"
                    style={{ color: "#061A12" }}
                  >
                    {item.point}
                  </p>
                  <p
                    className="font-jakarta text-[13px] leading-[1.7]"
                    style={{ color: "#5a5a5a" }}
                  >
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div style={{ borderTop: "1px solid #f0f0f0" }} />

        {/* 4 — Billing */}
        <section id="billing" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(26,122,74,0.1)" }}
            >
              <CreditCard className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "#061A12" }}>
              Subscription &amp; Billing
            </h2>
          </div>

          {/* Pricing table */}
          <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid #e8f4ec" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "#061A12" }}>
                  <th
                    className="font-jakarta font-bold text-[12px] text-left px-5 py-3"
                    style={{ color: "#E8A020" }}
                  ></th>
                  <th
                    className="font-jakarta font-bold text-[12px] text-left px-5 py-3"
                    style={{ color: "#E8A020" }}
                  >
                    Starter
                  </th>
                  <th
                    className="font-jakarta font-bold text-[12px] text-left px-5 py-3"
                    style={{ color: "#E8A020" }}
                  >
                    Growth
                  </th>
                  <th
                    className="font-jakarta font-bold text-[12px] text-left px-5 py-3"
                    style={{ color: "#E8A020" }}
                  >
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Monthly", "KES 12,900", "KES 21,500", "Custom"],
                  ["Annual (save 20%)", "KES 123,840", "KES 206,400", "Custom"],
                  ["Free trial", "30 days", "30 days", "Custom demo"],
                ].map(([label, starter, growth, enterprise], i) => (
                  <tr key={label} style={{ background: i % 2 === 0 ? "#ffffff" : "#F9FEFE" }}>
                    <td
                      className="font-jakarta font-semibold text-[13px] px-5 py-3"
                      style={{ color: "#061A12" }}
                    >
                      {label}
                    </td>
                    <td className="font-jakarta text-[13px] px-5 py-3" style={{ color: "#374151" }}>
                      {starter}
                    </td>
                    <td className="font-jakarta text-[13px] px-5 py-3" style={{ color: "#374151" }}>
                      {growth}
                    </td>
                    <td className="font-jakarta text-[13px] px-5 py-3" style={{ color: "#6B9E83" }}>
                      {enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key billing terms */}
          <div className="flex flex-col gap-2.5">
            {[
              "Billing is monthly or annual. Annual plans receive a 20% discount applied at checkout.",
              "30-day free trial available on all plans — no credit card required to start.",
              "Payment accepted via M-Pesa (Lipa Na M-Pesa), bank transfer (KES), or card (Stripe).",
              "Subscriptions auto-renew unless cancelled at least 7 days before the renewal date.",
              "No refunds are issued for partial months or unused portions of annual subscriptions.",
              "Prices may change with 30 days' written notice to the account administrator.",
              "Accounts more than 60 days in arrears may be suspended until payment is received.",
            ].map((term) => (
              <div
                key={term}
                className="flex items-start gap-3 font-jakarta text-[13.5px] leading-[1.75]"
                style={{ color: "#374151" }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#1A7A4A",
                      display: "block",
                    }}
                  />
                </span>
                {term}
              </div>
            ))}
          </div>
        </section>

        <div style={{ borderTop: "1px solid #f0f0f0" }} />

        {/* 5 — Data Ownership */}
        <section id="data" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(26,122,74,0.1)" }}
            >
              <Database className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "#061A12" }}>
              Data Ownership
            </h2>
          </div>
          <div
            className="rounded-2xl p-5 mb-5"
            style={{ background: "#F3FBF6", border: "2px solid #d4eade" }}
          >
            <p className="font-jakarta font-bold text-[14px]" style={{ color: "#0F4C2A" }}>
              Your school owns all data entered into EduMyles — full stop.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "You are the data controller",
                detail:
                  "Schools retain full ownership and control of all student, staff, and financial data. EduMyles acts as a data processor only, under your instructions.",
              },
              {
                title: "Export any time",
                detail:
                  "You may export your complete data set — students, fees, academic records, staff — in CSV or Excel format at any point during your subscription.",
              },
              {
                title: "30-day export window",
                detail:
                  "Upon termination or expiry of your subscription, you have 30 days to export all your data before it is permanently deleted from our systems.",
              },
              {
                title: "Permanent deletion",
                detail:
                  "After the 30-day export window, all school data is permanently and irreversibly deleted from EduMyles servers, except where retention is legally required.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl p-5"
                style={{ background: "#ffffff", border: "1px solid #e8f4ec" }}
              >
                <h3
                  className="font-jakarta font-bold text-[13.5px] mb-1.5"
                  style={{ color: "#0F4C2A" }}
                >
                  {item.title}
                </h3>
                <p className="font-jakarta text-[13px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div style={{ borderTop: "1px solid #f0f0f0" }} />

        {/* 6 — Intellectual Property */}
        <section id="ip" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(26,122,74,0.1)" }}
            >
              <Code2 className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "#061A12" }}>
              Intellectual Property
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl p-5"
              style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
            >
              <h3
                className="font-jakarta font-bold text-[13.5px] mb-2"
                style={{ color: "#0F4C2A" }}
              >
                EduMyles platform &amp; brand
              </h3>
              <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
                The EduMyles platform, including its software, source code, user interface, brand
                identity, logo, and all associated intellectual property, is owned exclusively by{" "}
                <strong>MylesCorp Technologies Ltd</strong> and protected by Kenyan and
                international copyright law.
              </p>
            </div>
            <div
              className="rounded-xl p-5"
              style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
            >
              <h3
                className="font-jakarta font-bold text-[13.5px] mb-2"
                style={{ color: "#0F4C2A" }}
              >
                Licence granted to schools
              </h3>
              <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
                We grant you a limited, non-exclusive, non-transferable licence to access and use
                EduMyles solely for your school&apos;s internal administration during the term of
                your subscription.
              </p>
            </div>
            <div
              className="rounded-xl p-5"
              style={{
                background: "rgba(232,160,32,0.06)",
                border: "1px solid rgba(232,160,32,0.2)",
              }}
            >
              <h3
                className="font-jakarta font-bold text-[13.5px] mb-2"
                style={{ color: "#7A4A00" }}
              >
                Restrictions
              </h3>
              <ul className="flex flex-col gap-1.5">
                {[
                  "You may not copy, reproduce, or distribute any part of the platform",
                  "You may not reverse-engineer, decompile, or attempt to extract the source code",
                  "You may not resell, sublicense, or white-label the platform without an Enterprise agreement",
                  "You may not use EduMyles branding without prior written permission",
                ].map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 font-jakarta text-[13px]"
                    style={{ color: "#5a5a5a", listStyle: "none" }}
                  >
                    <span style={{ color: "#E8A020", flexShrink: 0 }}>×</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-xl p-5"
              style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
            >
              <h3
                className="font-jakarta font-bold text-[13.5px] mb-2"
                style={{ color: "#0F4C2A" }}
              >
                School-generated content
              </h3>
              <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
                All content generated by your school using EduMyles — including academic reports,
                fee statements, attendance records, and communications — belongs to your school.
                EduMyles claims no ownership over your school&apos;s data or documents.
              </p>
            </div>
          </div>
        </section>

        <div style={{ borderTop: "1px solid #f0f0f0" }} />

        {/* 7 — Termination */}
        <section id="termination" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(26,122,74,0.1)" }}
            >
              <XCircle className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "#061A12" }}>
              Termination
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div
              className="rounded-xl p-5"
              style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
            >
              <h3
                className="font-jakarta font-bold text-[13.5px] mb-3"
                style={{ color: "#0F4C2A" }}
              >
                Termination by either party
              </h3>
              <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
                Either party may terminate this agreement with{" "}
                <strong>30 days&apos; written notice</strong>. Schools may cancel through the
                account settings or by emailing support@edumyles.com.
              </p>
            </div>
            <div
              className="rounded-xl p-5"
              style={{
                background: "rgba(232,160,32,0.06)",
                border: "1px solid rgba(232,160,32,0.2)",
              }}
            >
              <h3
                className="font-jakarta font-bold text-[13.5px] mb-3"
                style={{ color: "#7A4A00" }}
              >
                Immediate termination by EduMyles
              </h3>
              <ul className="flex flex-col gap-1.5">
                {[
                  "Non-payment of fees after 60 days",
                  "Material breach of these Terms",
                  "Misuse or abuse of the platform",
                  "Illegal activity or fraudulent behaviour",
                ].map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 font-jakarta text-[13px]"
                    style={{ color: "#5a5a5a", listStyle: "none" }}
                  >
                    <span style={{ color: "#E8A020", flexShrink: 0 }}>!</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
          >
            <Database
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              strokeWidth={1.5}
              style={{ color: "#1A7A4A" }}
            />
            <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#374151" }}>
              <strong>Data after termination:</strong> Upon termination for any reason, you have{" "}
              <strong>30 days</strong> to export your school&apos;s data. After this window, all
              data is permanently deleted. We strongly recommend exporting your data before
              cancelling.
            </p>
          </div>
        </section>

        <div style={{ borderTop: "1px solid #f0f0f0" }} />

        {/* 8 — Governing Law */}
        <section id="law" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(26,122,74,0.1)" }}
            >
              <Scale className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "#061A12" }}>
              Governing Law
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-6"
              style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
            >
              <div className="grid sm:grid-cols-3 gap-5">
                {[
                  {
                    label: "Governing law",
                    detail:
                      "These Terms are governed by and construed in accordance with the laws of the Republic of Kenya.",
                  },
                  {
                    label: "Dispute resolution",
                    detail:
                      "Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Nairobi, Kenya.",
                  },
                  {
                    label: "Limitation of liability",
                    detail:
                      "EduMyles's total liability is capped at the subscription fees paid by the school in the 3 months preceding the claim.",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p
                      className="font-jakarta font-bold text-[12px] uppercase tracking-wider mb-2"
                      style={{ color: "#E8A020" }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="font-jakarta text-[13px] leading-[1.7]"
                      style={{ color: "#374151" }}
                    >
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
              Nothing in these Terms limits or excludes liability for death or personal injury
              caused by negligence, fraud, or any other liability that cannot be limited under
              Kenyan law.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ background: "#061A12" }}>
          <h3 className="font-display font-bold text-[20px] text-white mb-2">
            Questions about these terms?
          </h3>
          <p className="font-jakarta text-[14px] mb-5" style={{ color: "#A8E6C3" }}>
            Our legal team is happy to clarify anything. We typically respond within 2 business
            days.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] no-underline"
            style={{ background: "#E8A020", color: "#061A12" }}
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
