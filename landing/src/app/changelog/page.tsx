import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { Sparkles, Star, Bug, ShieldCheck, Rocket, CalendarDays } from "lucide-react";
import SubscribeForm from "./subscribe-form";

export const metadata: Metadata = {
  title: "Changelog — EduMyles | Product Updates",
  description:
    "Latest features, improvements, and fixes shipped to EduMyles. We release improvements every week.",
};

type ChangeTag = "new" | "improved" | "fixed" | "security";

interface Change {
  tag: ChangeTag;
  text: string;
}

interface Release {
  version: string;
  date: string;
  changes: Change[];
}

const releases: Release[] = [
  {
    version: "v2.4.0",
    date: "March 2026",
    changes: [
      { tag: "new", text: "Live chat widget added to all public pages" },
      { tag: "new", text: "BrandValues section added to landing page" },
      { tag: "improved", text: "Parent portal performance improvements (50% faster load)" },
      { tag: "improved", text: "M-Pesa receipt generation redesigned" },
      { tag: "fixed", text: "Fixed timetable conflict detection edge case" },
    ],
  },
  {
    version: "v2.3.0",
    date: "February 2026",
    changes: [
      { tag: "new", text: "eWallet module launched — cashless canteen payments" },
      { tag: "new", text: "School Shop module — online uniform & book orders" },
      { tag: "improved", text: "CBC gradebook updated for 2026 KICD curriculum changes" },
      { tag: "improved", text: "Bulk SMS now supports SMS gateway Unicode templates" },
      { tag: "fixed", text: "Fixed attendance report date range filter" },
      { tag: "security", text: "Security controls and data protection review completed" },
    ],
  },
  {
    version: "v2.2.0",
    date: "January 2026",
    changes: [
      { tag: "new", text: "Student portal launched (grades, attendance, fee balance)" },
      { tag: "new", text: "Teacher portal: one-tap attendance, digital gradebook" },
      { tag: "improved", text: "Dashboard redesigned with real-time data cards" },
      { tag: "improved", text: "Multi-campus switching now instant" },
      { tag: "fixed", text: "Fixed NEMIS export formatting for Class 8" },
    ],
  },
  {
    version: "v2.1.0",
    date: "December 2025",
    changes: [
      { tag: "new", text: "Transport module: GPS tracking + parent SMS alerts" },
      { tag: "new", text: "Library module: barcode scanning + overdue fines" },
      { tag: "improved", text: "Fee reminder automation with configurable escalation" },
      { tag: "improved", text: "Report card templates updated for KCPE/KCSE format" },
      { tag: "fixed", text: "Fixed M-Pesa STK push timeout handling" },
    ],
  },
  {
    version: "v2.0.0",
    date: "November 2025",
    changes: [
      { tag: "new", text: "Full platform rebuild for faster live updates" },
      { tag: "new", text: "Role-based access control (14 roles)" },
      { tag: "new", text: "Multi-tenant school isolation" },
      { tag: "new", text: "13 production modules available" },
      { tag: "improved", text: "10x faster page loads" },
      { tag: "security", text: "End-to-end encryption for student data" },
    ],
  },
];

const tagConfig: Record<
  ChangeTag,
  { icon: LucideIcon; label: string; bg: string; color: string; border: string }
> = {
  new: {
    icon: Sparkles,
    label: "New",
    bg: "rgba(38,166,91,0.1)",
    color: "#0F4C2A",
    border: "rgba(38,166,91,0.25)",
  },
  improved: {
    icon: Star,
    label: "Improved",
    bg: "rgba(232,160,32,0.1)",
    color: "#9A5D00",
    border: "rgba(232,160,32,0.25)",
  },
  fixed: {
    icon: Bug,
    label: "Fixed",
    bg: "rgba(59,130,246,0.1)",
    color: "#1e40af",
    border: "rgba(59,130,246,0.25)",
  },
  security: {
    icon: ShieldCheck,
    label: "Security",
    bg: "rgba(139,92,246,0.1)",
    color: "#6b21a8",
    border: "rgba(139,92,246,0.25)",
  },
};

export default function ChangelogPage() {
  return (
    <div style={{ color: "#212121" }}>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "6rem 2rem 5rem",
          minHeight: "420px",
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
          <div className="max-w-[680px]">
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
              style={{
                background: "rgba(232,160,32,0.12)",
                border: "1px solid #E8A020",
                color: "#E8A020",
              }}
            >
              Product Updates
            </div>
            <h1
              className="font-display font-bold leading-[1.15] mb-5"
              style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
            >
              What&apos;s new in{" "}
              <em className="italic" style={{ color: "#E8A020" }}>
                EduMyles
              </em>
            </h1>
            <p
              className="font-jakarta font-light leading-[1.8] mb-8"
              style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "540px" }}
            >
              We ship improvements every week. Here&apos;s everything that&apos;s been updated,
              fixed, or launched.
            </p>
            <div className="flex flex-wrap gap-3">
              <span
                className="inline-flex items-center gap-1.5 font-jakarta font-medium text-[13px] px-4 py-2 rounded-[50px]"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#E8E8E8",
                }}
              >
                <Rocket className="w-3.5 h-3.5" strokeWidth={1.5} /> Latest release: v2.4.0
              </span>
              <span
                className="inline-flex items-center gap-1.5 font-jakarta font-medium text-[13px] px-4 py-2 rounded-[50px]"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#E8E8E8",
                }}
              >
                <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.5} /> Last updated: March 2026
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Changelog Timeline ─────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[820px] mx-auto">
          <div className="flex flex-col gap-0">
            {releases.map((release, i) => (
              <div key={release.version} className="flex gap-8">
                {/* Timeline spine */}
                <div className="flex flex-col items-center flex-shrink-0" style={{ width: "48px" }}>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-jakarta font-bold text-[11px] z-10 flex-shrink-0"
                    style={{
                      background: i === 0 ? "#E8A020" : "#F3FBF6",
                      color: i === 0 ? "#061A12" : "#0F4C2A",
                      border: `2px solid ${i === 0 ? "#E8A020" : "#d4eade"}`,
                    }}
                  >
                    {release.version.replace("v", "")}
                  </div>
                  {i < releases.length - 1 && (
                    <div
                      className="flex-1 my-2"
                      style={{ width: "2px", background: "#e8f4ec", minHeight: "40px" }}
                    />
                  )}
                </div>
                {/* Entry content */}
                <div className="pb-12 flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="font-display font-bold text-[22px]" style={{ color: "#061A12" }}>
                      {release.version}
                    </h2>
                    <span
                      className="font-jakarta text-[13px] font-medium px-3 py-1 rounded-full"
                      style={{ background: "#F3FBF6", color: "#6B9E83" }}
                    >
                      {release.date}
                    </span>
                    {i === 0 && (
                      <span
                        className="font-jakarta font-bold text-[11px] px-3 py-1 rounded-full"
                        style={{ background: "#E8A020", color: "#061A12" }}
                      >
                        Latest
                      </span>
                    )}
                  </div>
                  <div
                    className="rounded-2xl p-6"
                    style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}
                  >
                    <ul className="flex flex-col gap-3">
                      {release.changes.map((change, ci) => {
                        const cfg = tagConfig[change.tag];
                        return (
                          <li key={ci} className="flex items-start gap-3">
                            <span
                              className="inline-flex items-center gap-1 font-jakarta font-semibold text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                              style={{
                                background: cfg.bg,
                                color: cfg.color,
                                border: `1px solid ${cfg.border}`,
                              }}
                            >
                              <cfg.icon className="w-3 h-3 inline mr-0.5" strokeWidth={1.5} />{" "}
                              {cfg.label}
                            </span>
                            <span
                              className="font-jakarta text-[14px] leading-[1.7]"
                              style={{ color: "#3a3a3a" }}
                            >
                              {change.text}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subscribe Strip ────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[560px] mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
            style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
          >
            Stay Updated
          </div>
          <h2
            className="font-display font-bold mb-3"
            style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", color: "#061A12" }}
          >
            Get notified of new releases
          </h2>
          <p className="font-jakarta text-[15px] mb-6" style={{ color: "#5a5a5a" }}>
            No spam — just a short email when we ship something meaningful.
          </p>
          <SubscribeForm />
        </div>
      </section>
    </div>
  );
}
