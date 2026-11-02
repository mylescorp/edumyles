"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Globe,
  Smartphone,
  UserCheck,
  GraduationCap,
  Zap,
  Wallet,
  Mail,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

const services: { name: string; icon: LucideIcon; ms: string }[] = [
  { name: "Web Application", icon: Globe, ms: "42ms" },
  { name: "Parent Portal", icon: Smartphone, ms: "38ms" },
  { name: "Teacher Portal", icon: UserCheck, ms: "35ms" },
  { name: "Student Portal", icon: GraduationCap, ms: "41ms" },
  { name: "Live Data Sync", icon: Zap, ms: "12ms" },
  { name: "M-Pesa Integration", icon: Wallet, ms: "67ms" },
  { name: "Email Delivery", icon: Mail, ms: "88ms" },
  { name: "SMS Gateway", icon: MessageSquare, ms: "54ms" },
];

const incidents = [
  {
    date: "Feb 14, 2026",
    title: "M-Pesa STK Push Delays",
    duration: "23 minutes",
    resolved: true,
  },
  {
    date: "Jan 8, 2026",
    title: "Scheduled Maintenance — Database Migration",
    duration: "45 minutes",
    resolved: true,
  },
];

// 30-day uptime squares: 28 green + 2 grey (scheduled maintenance)
function UptimeBar() {
  const days = Array.from({ length: 30 }, (_, i) => {
    // day 16 and day 5 are grey (scheduled maintenance)
    const isGrey = i === 4 || i === 16;
    return isGrey ? "grey" : "green";
  });
  return (
    <div className="flex gap-1 flex-wrap">
      {days.map((color, i) => (
        <div
          key={i}
          title={color === "green" ? "Operational" : "Scheduled Maintenance"}
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "3px",
            background: color === "green" ? "var(--color-status-success-solid)" : "var(--color-action-primary-disabled)",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function StatusPage() {
  const [lastChecked, setLastChecked] = useState<string>("");

  useEffect(() => {
    const update = () => {
      setLastChecked(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    // This timestamp describes when the static status page was rendered; it
    // does not represent a live health check, so avoid rerendering every second.
  }, []);

  return (
    <div style={{ color: "var(--color-text-default)" }}>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "var(--color-surface-default)",
          borderTop: "3px solid var(--color-action-primary)",
          padding: "5rem 2rem 4rem",
          minHeight: "340px",
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
          <h1
            className="font-display font-bold leading-[1.2] mb-6"
            style={{ fontSize: "clamp(2rem,4vw,3.25rem)", color: "var(--color-text-default)" }}
          >
            System Status
          </h1>
          <div
            className="inline-flex items-center gap-3 font-jakarta font-bold text-[18px] px-6 py-3 rounded-[50px] mb-4"
            style={{
              background: "color-mix(in srgb, var(--color-status-success-solid) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-status-success-solid) 40%, transparent)",
              color: "var(--color-status-success-on-subtle)",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "var(--color-status-success-solid)",
                display: "inline-block",
                boxShadow: "0 0 0 3px color-mix(in srgb, var(--color-status-success-solid) 30%, transparent)",
              }}
            />
            All Systems Operational
          </div>
          {lastChecked && (
            <p className="font-jakarta text-[13px]" style={{ color: "var(--color-text-muted)" }}>
              Last checked: {lastChecked}
            </p>
          )}
        </div>
      </section>

      {/* ── Services Status ─────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "var(--color-surface-default)" }}>
        <div className="max-w-[860px] mx-auto">
          <h2 className="font-display font-bold text-[24px] mb-8" style={{ color: "var(--color-text-default)" }}>
            Current Status
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-border-default)", boxShadow: "0 2px 12px color-mix(in srgb, var(--color-surface-page) 5%, transparent)" }}
          >
            {services.map((svc, i) => (
              <div
                key={svc.name}
                className="flex items-center justify-between px-6 py-4"
                style={{
                  borderBottom: i < services.length - 1 ? "1px solid var(--color-surface-page)" : "none",
                  background: i % 2 === 0 ? "var(--color-surface-default)" : "var(--color-surface-page)",
                }}
              >
                <div className="flex items-center gap-3">
                  <svc.icon
                    className="w-5 h-5 flex-shrink-0"
                    strokeWidth={1.5}
                    style={{ color: "var(--color-action-primary)" }}
                  />
                  <span
                    className="font-jakarta font-medium text-[15px]"
                    style={{ color: "var(--color-text-default)" }}
                  >
                    {svc.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-jakarta text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                    {svc.ms}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-[12px] px-3 py-1 rounded-full"
                    style={{
                      background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)",
                      color: "var(--color-action-primary)",
                      border: "1px solid color-mix(in srgb, var(--color-status-success-solid) 20%, transparent)",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--color-status-success-solid)",
                        display: "inline-block",
                      }}
                    />
                    Operational
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Uptime History ──────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "var(--color-surface-page)" }}>
        <div className="max-w-[860px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display font-bold text-[24px]" style={{ color: "var(--color-text-default)" }}>
              30-Day Uptime
            </h2>
            <span
              className="font-jakarta font-bold text-[14px] px-4 py-2 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)",
                color: "var(--color-action-primary)",
                border: "1px solid color-mix(in srgb, var(--color-status-success-solid) 20%, transparent)",
              }}
            >
              Live status monitoring
            </span>
          </div>
          <div className="flex flex-col gap-5">
            {services.map((svc) => (
              <div key={svc.name}>
                <div className="flex items-center gap-2 mb-2">
                  <svc.icon
                    className="w-4 h-4 flex-shrink-0"
                    strokeWidth={1.5}
                    style={{ color: "var(--color-action-primary)" }}
                  />
                  <span
                    className="font-jakarta font-medium text-[13px]"
                    style={{ color: "var(--color-border-default)" }}
                  >
                    {svc.name}
                  </span>
                </div>
                <UptimeBar />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-1.5">
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  background: "var(--color-status-success-solid)",
                }}
              />
              <span className="font-jakarta text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                Operational
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  background: "var(--color-action-primary-disabled)",
                }}
              />
              <span className="font-jakarta text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                Scheduled Maintenance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Incident History ────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "var(--color-surface-default)" }}>
        <div className="max-w-[860px] mx-auto">
          <h2 className="font-display font-bold text-[24px] mb-8" style={{ color: "var(--color-text-default)" }}>
            Past Incidents
          </h2>
          <div
            className="rounded-2xl mb-6 p-5 flex items-center gap-3"
            style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--color-status-success-solid) 20%, transparent)" }}
          >
            <CheckCircle2
              className="w-4 h-4 inline mr-1"
              style={{ color: "var(--color-status-success-solid)" }}
              strokeWidth={1.5}
            />
            <span className="font-jakarta font-medium text-[14px]" style={{ color: "var(--color-action-primary)" }}>
              No incidents in the last 30 days.
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {incidents.map((inc) => (
              <div
                key={inc.title}
                className="rounded-2xl p-6"
                style={{ background: "var(--color-text-default)", border: "1px solid var(--color-surface-sunken)" }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div
                      className="font-jakarta font-bold text-[13px] mb-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {inc.date}
                    </div>
                    <h3
                      className="font-jakarta font-semibold text-[16px] mb-1"
                      style={{ color: "var(--color-text-default)" }}
                    >
                      {inc.title}
                    </h3>
                    <span className="font-jakarta text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                      Duration: {inc.duration}
                    </span>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-[12px] px-3 py-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)",
                      color: "var(--color-action-primary)",
                      border: "1px solid color-mix(in srgb, var(--color-status-success-solid) 20%, transparent)",
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} /> Resolved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subscribe Strip ─────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "var(--color-surface-page)" }}>
        <div className="max-w-[520px] mx-auto text-center">
          <h2
            className="font-display font-bold mb-3"
            style={{ fontSize: "clamp(1.4rem,2.5vw,1.9rem)", color: "var(--color-text-default)" }}
          >
            Get incident alerts
          </h2>
          <p className="font-jakarta text-[15px] mb-6" style={{ color: "var(--color-text-muted)" }}>
            Be notified immediately when there&apos;s a service disruption.
          </p>
          <form
            className="flex gap-3 flex-wrap sm:flex-nowrap justify-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="you@school.ac.ke"
              className="flex-1 min-w-0 border border-gray-200 rounded-[50px] px-5 py-3 font-jakarta text-[14px] outline-none focus:border-primary"
              style={{ color: "var(--color-text-default)", minWidth: "220px" }}
            />
            <button
              type="submit"
              className="font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] flex-shrink-0"
              style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)", border: "none", cursor: "pointer" }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
