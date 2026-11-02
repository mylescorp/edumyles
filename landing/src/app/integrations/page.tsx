import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, MessageSquare, FileText, BookOpen, BarChart2, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Integrations — EduMyles | M-Pesa, SMS, NEMIS & More",
  description:
    "Native integrations with M-Pesa, SMS, NEMIS, learning tools, and more. Built for East African schools.",
};

type StatusType = "Native" | "Beta" | "Planned";

interface Integration {
  name: string;
  description: string;
  status: StatusType;
}

interface Category {
  title: string;
  Icon: React.ElementType;
  color: string;
  tintBg: string;
  integrations: Integration[];
}

const statusStyles: Record<StatusType, { bg: string; color: string }> = {
  Native: { bg: "var(--color-status-success-subtle)", color: "var(--color-status-success-on-subtle)" },
  Beta: { bg: "var(--color-status-info-subtle)", color: "var(--color-action-primary-hover)" },
  Planned: { bg: "var(--color-surface-page)", color: "var(--color-text-disabled)" },
};

const categories: Category[] = [
  {
    title: "Payments",
    Icon: CreditCard,
    color: "var(--color-action-primary)",
    tintBg: "color-mix(in srgb, var(--color-status-success-solid) 8%, transparent)",
    integrations: [
      {
        name: "M-Pesa",
        description:
          "Collect school fees directly via M-Pesa. Automatic reconciliation, real-time parent alerts.",
        status: "Native",
      },
      {
        name: "Equity Bank",
        description: "Bank transfer payment matching and reconciliation.",
        status: "Beta",
      },
      {
        name: "KCB Merchant",
        description: "KCB school fee collection portal integration.",
        status: "Planned",
      },
    ],
  },
  {
    title: "Communication",
    Icon: MessageSquare,
    color: "var(--color-action-primary-hover)",
    tintBg: "color-mix(in srgb, var(--color-action-primary-hover) 8%, transparent)",
    integrations: [
      {
        name: "SMS Gateway",
        description: "Automated SMS to parents for fees, attendance, reports, emergencies.",
        status: "Native",
      },
      {
        name: "WhatsApp Business",
        description: "Send report cards and fee reminders via WhatsApp.",
        status: "Native",
      },
      {
        name: "Gmail / Google Workspace",
        description: "Email reports and fee statements from your school domain.",
        status: "Native",
      },
    ],
  },
  {
    title: "Government & Compliance",
    Icon: FileText,
    color: "var(--color-status-warning-solid)",
    tintBg: "color-mix(in srgb, var(--color-status-warning-solid) 8%, transparent)",
    integrations: [
      {
        name: "NEMIS",
        description:
          "Direct data export in NEMIS-compatible format for Ministry of Education reporting.",
        status: "Native",
      },
      {
        name: "KNEC",
        description: "Grade 6 and KCSE result import for internal analysis and reporting.",
        status: "Beta",
      },
    ],
  },
  {
    title: "Productivity",
    Icon: BookOpen,
    color: "var(--color-action-primary-text)",
    tintBg: "color-mix(in srgb, var(--color-action-primary-text) 8%, transparent)",
    integrations: [
      {
        name: "Google Classroom",
        description: "Sync assignments and grades between Google Classroom and EduMyles gradebook.",
        status: "Beta",
      },
      {
        name: "Microsoft Teams",
        description: "Class scheduling and parent communication sync.",
        status: "Planned",
      },
      {
        name: "Zoom",
        description: "Schedule and launch online classes directly from EduMyles timetable.",
        status: "Planned",
      },
    ],
  },
  {
    title: "Data & Reporting",
    Icon: BarChart2,
    color: "var(--color-status-warning-solid)",
    tintBg: "color-mix(in srgb, var(--color-action-primary) 10%, transparent)",
    integrations: [
      {
        name: "Excel / Google Sheets",
        description: "One-click export of any report, register, or fee statement.",
        status: "Native",
      },
      {
        name: "Power BI",
        description: "Connect EduMyles data to Power BI for custom school analytics dashboards.",
        status: "Beta",
      },
    ],
  },
];

const apiFeatures = [
  {
    title: "Full REST API",
    desc: "Query student records, fee balances, attendance, and more via a documented REST API.",
  },
  {
    title: "Webhook Events",
    desc: "Subscribe to real-time events — payment received, attendance marked, report generated.",
  },
  {
    title: "Sandbox Environment",
    desc: "Build and test integrations in a full-featured sandbox before going live.",
  },
];

export default function IntegrationsPage() {
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
            Integrations
          </div>
          <h1
            className="font-display font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "var(--color-text-default)" }}
          >
            Connect EduMyles with the{" "}
            <em className="italic" style={{ color: "var(--color-text-on-primary-subtle)" }}>
              tools your school uses.
            </em>
          </h1>
          <p
            className="font-jakarta font-light leading-[1.8] mx-auto mb-8"
            style={{ fontSize: "18px", color: "var(--color-text-muted)", maxWidth: "600px" }}
          >
            Native integrations with M-Pesa, SMS gateways, government systems, and education tools —
            no extra cost.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["20+ Integrations", "No extra cost", "API-first"].map((pill) => (
              <span
                key={pill}
                className="font-jakarta text-[13px] font-medium px-4 py-2 rounded-full"
                style={{
                  background: "color-mix(in srgb, var(--color-surface-default) 7%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-surface-default) 15%, transparent)",
                  color: "var(--color-action-primary-disabled)",
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integration Categories ────────────────────────── */}
      <section style={{ background: "var(--color-surface-default)", padding: "5rem 2rem" }}>
        <div className="max-w-[1200px] mx-auto">
          <h2
            className="font-display font-bold text-center mb-14"
            style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "var(--color-text-default)" }}
          >
            All Integrations
          </h2>

          <div className="space-y-14">
            {categories.map(({ title, Icon, color, tintBg, integrations }) => (
              <div key={title}>
                {/* Category heading */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: tintBg }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <h3
                    className="font-display font-bold"
                    style={{ fontSize: "1.35rem", color: "var(--color-text-default)" }}
                  >
                    {title}
                  </h3>
                  <div className="flex-1 h-px ml-2" style={{ background: "color-mix(in_srgb,_var(--color-surface-page)_8%,_transparent)" }} />
                </div>

                {/* Integration cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrations.map((item) => {
                    const st = statusStyles[item.status];
                    return (
                      <div
                        key={item.name}
                        className="rounded-xl p-5 transition-shadow duration-200 hover:shadow-md"
                        style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: tintBg }}
                          >
                            <Icon size={18} style={{ color }} />
                          </div>
                          <span
                            className="font-jakarta font-bold px-2 py-0.5 rounded-full shrink-0 mt-1"
                            style={{
                              fontSize: "10px",
                              background: st.bg,
                              color: st.color,
                            }}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div
                          className="font-display font-bold mb-1.5"
                          style={{ fontSize: "16px", color: "var(--color-text-default)" }}
                        >
                          {item.name}
                        </div>
                        <p
                          className="font-jakarta"
                          style={{ fontSize: "13px", color: "var(--color-text-disabled)", lineHeight: 1.6 }}
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

      {/* ── API Section ───────────────────────────────────── */}
      <section style={{ background: "var(--color-surface-page)", padding: "5rem 2rem" }}>
        <div className="max-w-[900px] mx-auto text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "color-mix(in srgb, var(--color-status-success-on-subtle) 10%, transparent)" }}
          >
            <Zap size={22} style={{ color: "var(--color-action-primary)" }} />
          </div>
          <h2
            className="font-display font-bold mb-4"
            style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "var(--color-text-default)" }}
          >
            Build your own integration
          </h2>
          <p
            className="font-jakarta font-light mb-10 mx-auto"
            style={{ fontSize: "17px", color: "var(--color-text-muted)", maxWidth: "600px", lineHeight: 1.8 }}
          >
            EduMyles has a full REST API. Query student records, push attendance, trigger payments,
            and subscribe to webhook events.
          </p>

          <div className="grid sm:grid-cols-3 gap-5 mb-10">
            {apiFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-5 text-left"
                style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
              >
                <div
                  className="font-jakarta font-bold mb-2"
                  style={{ fontSize: "14px", color: "var(--color-text-default)" }}
                >
                  {f.title}
                </div>
                <p
                  className="font-jakarta"
                  style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/contact?subject=api-access"
            className="inline-block font-jakarta font-semibold px-7 py-3.5 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)", fontSize: "15px" }}
          >
            Request API Access →
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
            Missing an integration? Let us know.
          </h2>
          <p
            className="font-jakarta font-light mb-8"
            style={{ fontSize: "17px", color: "var(--color-text-muted)" }}
          >
            We add new integrations based on what schools need most.
          </p>
          <Link
            href="/contact?subject=integration-request"
            className="inline-block font-jakarta font-semibold px-7 py-3.5 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)", fontSize: "15px" }}
          >
            Request Integration →
          </Link>
        </div>
      </section>
    </div>
  );
}
