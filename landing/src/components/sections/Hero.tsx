"use client";

import { useEffect } from "react";
import Link from "next/link";
import ArtDashboard from "@/components/sections/ArtDashboard";
import { BarChart2 } from "lucide-react";

export default function Hero() {
  useEffect(() => {
    const referralCode = new URLSearchParams(window.location.search).get("ref");
    if (!referralCode) return;
    fetch("/api/referral/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referralCode,
        source: "landing_page",
        landingPage: window.location.pathname,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      }),
    }).catch(() => undefined);
  }, []);

  return (
    <section
      id="hero"
      className="relative flex items-center overflow-hidden px-4 sm:px-8 py-20 sm:py-24"
      aria-label="Hero section"
      style={{
        background: "var(--color-surface-default)",
        minHeight: "90vh",
        borderTop: "3px solid var(--color-action-primary)",
      }}
    >
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, color-mix(in srgb, var(--color-action-primary) 5%, transparent) 25%, color-mix(in srgb, var(--color-action-primary) 5%, transparent) 26%, transparent 27%, transparent 74%, color-mix(in srgb, var(--color-action-primary) 5%, transparent) 75%, color-mix(in srgb, var(--color-action-primary) 5%, transparent) 76%, transparent 77%),
            linear-gradient(90deg, transparent 24%, color-mix(in srgb, var(--color-action-primary) 5%, transparent) 25%, color-mix(in srgb, var(--color-action-primary) 5%, transparent) 26%, transparent 27%, transparent 74%, color-mix(in srgb, var(--color-action-primary) 5%, transparent) 75%, color-mix(in srgb, var(--color-action-primary) 5%, transparent) 76%, transparent 77%)
          `,
          backgroundSize: "50px 50px",
        }}
      />
      {/* Radial glow */}
      <div
        className="absolute pointer-events-none z-[2]"
        style={{
          top: "10%",
          right: "-10%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, color-mix(in srgb, var(--color-status-success-solid) 30%, transparent) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-[3] max-w-[1200px] mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left — Text content */}
          <div className="fade-in">
            {/* Eyebrow */}
            <div className="flex items-center gap-[10px] mb-6">
              <div className="w-[26px] h-[2px] flex-shrink-0" style={{ background: "var(--color-action-primary)" }} />
              <div
                className="text-[10px] font-bold tracking-[2.5px] uppercase"
                style={{ color: "var(--color-text-on-primary-subtle)" }}
              >
                Trusted by Regional Schools Across Africa
              </div>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-bold leading-[1.2] mb-6"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.25rem)", color: "var(--color-text-default)" }}
            >
              The All-in-One{" "}
              <em className="italic" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                School Management System
              </em>{" "}
              Built for African Schools
            </h1>

            {/* Sub-headline */}
            <p
              className="font-jakarta font-light leading-[1.8] mb-8"
              style={{ fontSize: "18px", color: "var(--color-text-muted)", maxWidth: "520px" }}
            >
              Manage admissions, fees, attendance, exams &amp; parent communication from one
              powerful platform. No more Excel chaos. No more WhatsApp groups for school updates.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-10">
              <a
                href="/waitlist"
                className="inline-flex items-center justify-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-[8px] transition-colors duration-300 no-underline"
                style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-action-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-action-primary)")}
              >
                Join the School Waitlist →
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-[8px] transition-all duration-300 no-underline"
                style={{
                  background: "transparent",
                  color: "var(--color-text-default)",
                  border: "1.5px solid color-mix(in srgb, var(--color-text-on-primary) 20%, transparent)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-action-primary)";
                  e.currentTarget.style.color = "var(--color-text-on-primary-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "color-mix(in srgb, var(--color-text-on-primary) 20%, transparent)";
                  e.currentTarget.style.color = "var(--color-text-default)";
                }}
              >
                See Pricing
              </a>
            </div>

            {/* Stat badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "15 hrs/week", label: "saved per school" },
                { value: "Regional Schools", label: "trust us" },
                { value: "Multi-campus", label: "students managed" },
              ].map((stat) => (
                <div
                  key={stat.value}
                  className="text-center px-2 sm:px-4 py-3 rounded-[12px]"
                  style={{
                    background: "color-mix(in srgb, var(--color-surface-default) 5%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--color-action-primary) 20%, transparent)",
                  }}
                >
                  <strong
                    className="block text-[14px] sm:text-[18px] font-bold"
                    style={{ color: "var(--color-text-on-primary-subtle)" }}
                  >
                    {stat.value}
                  </strong>
                  <small className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                    {stat.label}
                  </small>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Floating dashboard mockup */}
          <div className="relative hidden lg:block" style={{ height: "400px" }}>
            {/* Sample data badge */}
            <div
              className="absolute z-10 rounded-full font-jakarta font-semibold"
              style={{
                top: "-28px",
                left: "50%",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                background: "color-mix(in srgb, var(--color-action-primary) 15%, transparent)",
                border: "1px solid var(--color-text-on-primary-subtle)",
                color: "var(--color-text-on-primary-subtle)",
                fontSize: "11px",
                padding: "4px 12px",
              }}
            >
              <BarChart2 className="w-4 h-4" strokeWidth={1.5} /> Sample data — see your real
              numbers after setup
            </div>
            {/* Card 1 — Total Students */}
            <div
              className="absolute rounded-[12px] p-6 shadow-[0_8px_32px_color-mix(in_srgb,_var(--color-surface-page)_30%,_transparent)] animate-float"
              style={{
                top: 0,
                left: 0,
                width: "220px",
                background: "color-mix(in srgb, var(--color-surface-default) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-action-primary) 30%, transparent)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-[12px] mb-2" style={{ color: "var(--color-text-muted)" }}>
                Total Students
              </div>
              <div className="font-mono-brand font-bold text-[22px]" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                1,250
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                +42 this term
              </div>
            </div>

            {/* Card 2 — Fees Collected */}
            <div
              className="absolute rounded-[12px] p-6 shadow-[0_8px_32px_color-mix(in_srgb,_var(--color-surface-page)_30%,_transparent)] animate-float-delay"
              style={{
                top: "150px",
                right: 0,
                width: "210px",
                background: "color-mix(in srgb, var(--color-surface-default) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-action-primary) 30%, transparent)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-[12px] mb-2" style={{ color: "var(--color-text-muted)" }}>
                Fees Collected
              </div>
              <div className="font-mono-brand font-bold text-[22px]" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                Ksh 2.4M
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                87% collection rate
              </div>
            </div>

            {/* Card 3 — Attendance */}
            <div
              className="absolute rounded-[12px] p-6 shadow-[0_8px_32px_color-mix(in_srgb,_var(--color-surface-page)_30%,_transparent)] animate-float-slow"
              style={{
                bottom: 0,
                left: "50px",
                width: "250px",
                background: "color-mix(in srgb, var(--color-surface-default) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-action-primary) 30%, transparent)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-[12px] mb-2" style={{ color: "var(--color-text-muted)" }}>
                Attendance Rate
              </div>
              <div className="font-mono-brand font-bold text-[22px]" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                94%
              </div>
              <div
                className="mt-2 h-1.5 rounded-full"
                style={{ background: "color-mix(in_srgb,_var(--color-surface-default)_10%,_transparent)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: "94%", background: "linear-gradient(90deg, var(--color-action-primary), var(--color-text-on-primary-subtle))" }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="handoff-home-art">
          <ArtDashboard />
          <div className="handoff-payment-note" aria-hidden="true">
            <span>✓</span><div><b>M-Pesa payment confirmed</b><small>Receipt sent to parent</small></div>
          </div>
        </div>
      </div>
      <div className="handoff-home-stats" aria-label="Platform highlights">
        {[
          ["50+", "Schools onboarded"],
          ["Multi-campus", "Ready from day one"],
          ["5", "Countries"],
          ["Automated", "Fee payments"],
        ].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </div>
      <div className="handoff-home-integrations" aria-label="Supported integrations">
        {["M-Pesa", "Airtel Money", "SMS", "Card payments", "Google SSO", "Microsoft SSO", "WhatsApp Business"].map((label) => <span key={label}>{label}</span>)}
      </div>
    </section>
  );
}
