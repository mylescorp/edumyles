import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Product Roadmap — EduMyles | What We're Building Next",
  description:
    "EduMyles public product roadmap. See what's shipped, what's in progress, and what's planned. Updated quarterly. Shape what we build next.",
};

type TagType =
  | "Feature"
  | "AI"
  | "Enhancement"
  | "Compliance"
  | "Platform"
  | "Accessibility"
  | "Reliability";

interface RoadmapItem {
  title: string;
  description: string;
  tag: TagType;
}

interface Column {
  label: string;
  emoji: string;
  Icon: React.ElementType;
  headerBg: string;
  headerText: string;
  items: RoadmapItem[];
}

const tagStyles: Record<TagType, { bg: string; color: string }> = {
  Feature: { bg: "var(--color-status-success-subtle)", color: "var(--color-status-success-on-subtle)" },
  AI: { bg: "var(--color-action-primary-subtle)", color: "var(--color-text-muted)" },
  Enhancement: { bg: "var(--color-status-info-subtle)", color: "var(--color-action-primary-hover)" },
  Compliance: { bg: "var(--color-status-warning-subtle)", color: "var(--color-status-warning-on-subtle)" },
  Platform: { bg: "var(--color-status-warning-subtle)", color: "var(--color-status-warning-on-subtle)" },
  Accessibility: { bg: "var(--color-status-success-subtle)", color: "var(--color-status-success-on-subtle)" },
  Reliability: { bg: "var(--color-surface-page)", color: "var(--color-text-muted)" },
};

const columns: Column[] = [
  {
    label: "Shipped",
    emoji: "✅",
    Icon: CheckCircle2,
    headerBg: "var(--color-action-primary)",
    headerText: "var(--color-text-on-primary)",
    items: [
      {
        title: "Multi-Campus Support",
        description:
          "Manage multiple school branches from one account with network-level reporting.",
        tag: "Feature",
      },
      {
        title: "CBC Gradebook v2",
        description: "Full competency scoring with auto-generated CBC report cards.",
        tag: "Feature",
      },
      {
        title: "M-Pesa Auto-Reconciliation",
        description: "Real-time fee matching — zero manual entry.",
        tag: "Enhancement",
      },
      {
        title: "Parent Mobile App (Beta)",
        description: "iOS & Android app for parents to view attendance and fees.",
        tag: "Feature",
      },
      {
        title: "WhatsApp Fee Reminders",
        description: "Automated fee reminders via WhatsApp Business API.",
        tag: "Feature",
      },
    ],
  },
  {
    label: "In Progress",
    emoji: "🔄",
    Icon: Clock,
    headerBg: "var(--color-action-primary-hover)",
    headerText: "var(--color-text-on-primary)",
    items: [
      {
        title: "AI Timetabling Assistant",
        description:
          "Auto-generate conflict-free timetables based on teacher availability and room capacity.",
        tag: "AI",
      },
      {
        title: "Student Performance Analytics",
        description: "Predictive analytics to identify at-risk students before term end.",
        tag: "AI",
      },
      {
        title: "Payroll Automation v2",
        description: "Auto-calculate NHIF, NSSF, PAYE with direct bank integration.",
        tag: "Enhancement",
      },
      {
        title: "Teacher Mobile App",
        description: "Mobile app for teachers: attendance, gradebook, parent messaging.",
        tag: "Feature",
      },
      {
        title: "NEMIS v3 Compliance",
        description: "Updated NEMIS export for 2026 Ministry requirements.",
        tag: "Compliance",
      },
    ],
  },
  {
    label: "Planned",
    emoji: "🔮",
    Icon: Star,
    headerBg: "var(--color-text-on-primary-subtle)",
    headerText: "var(--color-text-default)",
    items: [
      {
        title: "AI Report Writing Assistant",
        description: "AI drafts personalized teacher comments for each student's report card.",
        tag: "AI",
      },
      {
        title: "Alumni Portal",
        description: "Track graduates, collect testimonials, manage alumni community.",
        tag: "Feature",
      },
      {
        title: "EduMyles Marketplace",
        description: "Buy/sell lesson plans, assessment templates, school forms.",
        tag: "Platform",
      },
      {
        title: "Voice Attendance",
        description: "Mark attendance by voice — for schools with limited smartphones.",
        tag: "Accessibility",
      },
      {
        title: "Offline Mode",
        description: "Work without internet — sync when connection restored.",
        tag: "Reliability",
      },
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div style={{ color: "var(--color-text-default)" }}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "var(--color-surface-default)",
          borderTop: "3px solid var(--color-action-primary)",
          padding: "6rem 2rem 5rem",
          minHeight: "420px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full text-center">
          <div
            className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
            style={{
              background: "color-mix(in srgb, var(--color-action-primary) 12%, transparent)",
              border: "1px solid var(--color-text-on-primary-subtle)",
              color: "var(--color-text-on-primary-subtle)",
            }}
          >
            Product Roadmap
          </div>
          <h1
            className="font-display font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "var(--color-text-default)" }}
          >
            What we&apos;re{" "}
            <em className="italic" style={{ color: "var(--color-text-on-primary-subtle)" }}>
              building next.
            </em>
          </h1>
          <p
            className="font-jakarta font-light leading-[1.8] mx-auto mb-8"
            style={{ fontSize: "18px", color: "var(--color-text-muted)", maxWidth: "560px" }}
          >
            Our public roadmap. Shipped, in progress, and planned. Updated quarterly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span
              className="font-jakarta text-[13px] font-medium px-4 py-2 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--color-surface-default) 7%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-surface-default) 15%, transparent)",
                color: "var(--color-action-primary-disabled)",
              }}
            >
              Last updated: March 2026
            </span>
          </div>
        </div>
      </section>

      {/* ── Roadmap Kanban ────────────────────────────────── */}
      <section style={{ background: "var(--color-surface-default)", padding: "5rem 2rem" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {columns.map(({ label, emoji, Icon, headerBg, headerText, items }) => (
              <div
                key={label}
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--color-status-success-subtle)" }}
              >
                {/* Column header */}
                <div className="px-5 py-4 flex items-center gap-3" style={{ background: headerBg }}>
                  <Icon size={18} style={{ color: headerText, opacity: 0.9 }} />
                  <span
                    className="font-jakarta font-bold"
                    style={{ fontSize: "15px", color: headerText }}
                  >
                    {emoji} {label}
                  </span>
                  <span
                    className="ml-auto font-jakarta font-semibold text-[12px] px-2 py-0.5 rounded-full"
                    style={{
                      background: "color-mix(in srgb, var(--color-surface-default) 15%, transparent)",
                      color: headerText,
                    }}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Items */}
                <div className="p-3 space-y-2.5" style={{ background: "var(--color-text-default)" }}>
                  {items.map((item) => {
                    const ts = tagStyles[item.tag];
                    return (
                      <div
                        key={item.title}
                        className="rounded-xl p-4 transition-transform duration-150 hover:-translate-y-0.5"
                        style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div
                            className="font-jakarta font-bold"
                            style={{ fontSize: "14px", color: "var(--color-text-default)", lineHeight: 1.4 }}
                          >
                            {item.title}
                          </div>
                          <span
                            className="font-jakarta font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                            style={{
                              fontSize: "10px",
                              background: ts.bg,
                              color: ts.color,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.tag}
                          </span>
                        </div>
                        <p
                          className="font-jakarta"
                          style={{ fontSize: "12.5px", color: "var(--color-text-disabled)", lineHeight: 1.6 }}
                        >
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feedback Section ──────────────────────────────── */}
      <section style={{ background: "var(--color-surface-page)", padding: "5rem 2rem" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-display font-bold mb-4"
            style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "var(--color-text-default)" }}
          >
            Suggest a feature
          </h2>
          <p
            className="font-jakarta font-light mb-8 mx-auto"
            style={{ fontSize: "17px", color: "var(--color-text-muted)", maxWidth: "540px", lineHeight: 1.8 }}
          >
            Our roadmap is shaped by what schools need. Vote on upcoming features or tell us what to
            build next.
          </p>
          <Link
            href="/contact?subject=feature-request"
            className="inline-block font-jakarta font-semibold px-7 py-3.5 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)", fontSize: "15px" }}
          >
            Submit Feature Request →
          </Link>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--color-surface-default)", padding: "5rem 2rem" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[700px] mx-auto text-center">
          <h2
            className="font-display font-bold mb-4"
            style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "var(--color-text-default)" }}
          >
            Start using EduMyles today — and shape what we build tomorrow.
          </h2>
          <p
            className="font-jakarta font-light mb-8"
            style={{ fontSize: "17px", color: "var(--color-text-muted)" }}
          >
            Join schools already running better with EduMyles.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/waitlist"
              className="font-jakarta font-semibold px-7 py-3.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)", fontSize: "15px" }}
            >
              Start Free Trial →
            </Link>
            <Link
              href="/contact"
              className="font-jakarta font-semibold px-7 py-3.5 rounded-xl transition-colors"
              style={{
                background: "transparent",
                border: "1.5px solid var(--color-border-default)",
                color: "var(--color-text-default)",
                fontSize: "15px",
              }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
