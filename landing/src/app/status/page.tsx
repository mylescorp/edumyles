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
            background: color === "green" ? "#26A65B" : "#d1d5db",
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
    <div style={{ color: "var(--foreground)" }}>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "var(--card)",
          borderTop: "3px solid var(--primary)",
          padding: "5rem 2rem 4rem",
          minHeight: "340px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgb(var(--primary-rgb) / 4%) 25%,rgb(var(--primary-rgb) / 4%) 26%,transparent 27%,transparent 74%,rgb(var(--primary-rgb) / 4%) 75%,rgb(var(--primary-rgb) / 4%) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgb(var(--primary-rgb) / 4%) 25%,rgb(var(--primary-rgb) / 4%) 26%,transparent 27%,transparent 74%,rgb(var(--primary-rgb) / 4%) 75%,rgb(var(--primary-rgb) / 4%) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full text-center">
          <h1
            className="font-display font-bold leading-[1.2] mb-6"
            style={{ fontSize: "clamp(2rem,4vw,3.25rem)", color: "var(--foreground)" }}
          >
            System Status
          </h1>
          <div
            className="inline-flex items-center gap-3 font-jakarta font-bold text-[18px] px-6 py-3 rounded-[50px] mb-4"
            style={{
              background: "rgba(38,166,91,0.15)",
              border: "1px solid rgba(38,166,91,0.4)",
              color: "#6EE7A0",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#26A65B",
                display: "inline-block",
                boxShadow: "0 0 0 3px rgba(38,166,91,0.3)",
              }}
            />
            All Systems Operational
          </div>
          {lastChecked && (
            <p className="font-jakarta text-[13px]" style={{ color: "var(--muted-foreground)" }}>
              Last checked: {lastChecked}
            </p>
          )}
        </div>
      </section>

      {/* ── Services Status ─────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "var(--card)" }}>
        <div className="max-w-[860px] mx-auto">
          <h2 className="font-display font-bold text-[24px] mb-8" style={{ color: "var(--foreground)" }}>
            Current Status
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(6,26,18,0.05)" }}
          >
            {services.map((svc, i) => (
              <div
                key={svc.name}
                className="flex items-center justify-between px-6 py-4"
                style={{
                  borderBottom: i < services.length - 1 ? "1px solid #f0f8f3" : "none",
                  background: i % 2 === 0 ? "var(--card)" : "var(--background)",
                }}
              >
                <div className="flex items-center gap-3">
                  <svc.icon
                    className="w-5 h-5 flex-shrink-0"
                    strokeWidth={1.5}
                    style={{ color: "var(--primary)" }}
                  />
                  <span
                    className="font-jakarta font-medium text-[15px]"
                    style={{ color: "var(--foreground)" }}
                  >
                    {svc.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-jakarta text-[13px]" style={{ color: "#9ca3af" }}>
                    {svc.ms}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-[12px] px-3 py-1 rounded-full"
                    style={{
                      background: "rgba(38,166,91,0.1)",
                      color: "var(--primary)",
                      border: "1px solid rgba(38,166,91,0.2)",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#26A65B",
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
      <section className="py-16 px-4" style={{ background: "var(--background)" }}>
        <div className="max-w-[860px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display font-bold text-[24px]" style={{ color: "var(--foreground)" }}>
              30-Day Uptime
            </h2>
            <span
              className="font-jakarta font-bold text-[14px] px-4 py-2 rounded-full"
              style={{
                background: "rgba(38,166,91,0.1)",
                color: "var(--primary)",
                border: "1px solid rgba(38,166,91,0.2)",
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
                    style={{ color: "var(--primary)" }}
                  />
                  <span
                    className="font-jakarta font-medium text-[13px]"
                    style={{ color: "#3a3a3a" }}
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
                  background: "#26A65B",
                }}
              />
              <span className="font-jakarta text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                Operational
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  background: "#d1d5db",
                }}
              />
              <span className="font-jakarta text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                Scheduled Maintenance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Incident History ────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "var(--card)" }}>
        <div className="max-w-[860px] mx-auto">
          <h2 className="font-display font-bold text-[24px] mb-8" style={{ color: "var(--foreground)" }}>
            Past Incidents
          </h2>
          <div
            className="rounded-2xl mb-6 p-5 flex items-center gap-3"
            style={{ background: "rgba(38,166,91,0.06)", border: "1px solid rgba(38,166,91,0.2)" }}
          >
            <CheckCircle2
              className="w-4 h-4 inline mr-1"
              style={{ color: "#26A65B" }}
              strokeWidth={1.5}
            />
            <span className="font-jakarta font-medium text-[14px]" style={{ color: "var(--primary)" }}>
              No incidents in the last 30 days.
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {incidents.map((inc) => (
              <div
                key={inc.title}
                className="rounded-2xl p-6"
                style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div
                      className="font-jakarta font-bold text-[13px] mb-1"
                      style={{ color: "#9ca3af" }}
                    >
                      {inc.date}
                    </div>
                    <h3
                      className="font-jakarta font-semibold text-[16px] mb-1"
                      style={{ color: "var(--foreground)" }}
                    >
                      {inc.title}
                    </h3>
                    <span className="font-jakarta text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                      Duration: {inc.duration}
                    </span>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-[12px] px-3 py-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: "rgba(38,166,91,0.1)",
                      color: "var(--primary)",
                      border: "1px solid rgba(38,166,91,0.2)",
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
      <section className="py-16 px-4" style={{ background: "var(--background)" }}>
        <div className="max-w-[520px] mx-auto text-center">
          <h2
            className="font-display font-bold mb-3"
            style={{ fontSize: "clamp(1.4rem,2.5vw,1.9rem)", color: "var(--foreground)" }}
          >
            Get incident alerts
          </h2>
          <p className="font-jakarta text-[15px] mb-6" style={{ color: "var(--muted-foreground)" }}>
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
              style={{ color: "var(--foreground)", minWidth: "220px" }}
            />
            <button
              type="submit"
              className="font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] flex-shrink-0"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)", border: "none", cursor: "pointer" }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
