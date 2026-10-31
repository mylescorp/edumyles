"use client";

import { useEffect, useRef } from "react";
import { BarChart2 } from "lucide-react";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  // Track referral click when component mounts
  useEffect(() => {
    const referralCode = new URLSearchParams(window.location.search).get("ref");
    if (referralCode) {
      // Track the referral click
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
      }).catch(() => {
        // Silently fail tracking - don't interrupt user flow
      });
    }
  }, []);

  useEffect(() => {
    // Fade-in on scroll for stat badges
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative flex items-center overflow-hidden px-4 sm:px-8 py-20 sm:py-24"
      aria-label="Hero section"
      style={{
        background: "var(--card)",
        minHeight: "90vh",
        borderTop: "3px solid var(--primary)",
      }}
    >
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgb(var(--primary-rgb) / 5%) 25%, rgb(var(--primary-rgb) / 5%) 26%, transparent 27%, transparent 74%, rgb(var(--primary-rgb) / 5%) 75%, rgb(var(--primary-rgb) / 5%) 76%, transparent 77%),
            linear-gradient(90deg, transparent 24%, rgb(var(--primary-rgb) / 5%) 25%, rgb(var(--primary-rgb) / 5%) 26%, transparent 27%, transparent 74%, rgb(var(--primary-rgb) / 5%) 75%, rgb(var(--primary-rgb) / 5%) 76%, transparent 77%)
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
          background: "radial-gradient(circle, rgba(26,122,74,0.3) 0%, transparent 70%)",
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
              <div className="w-[26px] h-[2px] flex-shrink-0" style={{ background: "var(--primary)" }} />
              <div
                className="text-[10px] font-bold tracking-[2.5px] uppercase"
                style={{ color: "var(--accent-foreground)" }}
              >
                Trusted by Regional Schools Across Africa
              </div>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-bold leading-[1.2] mb-6"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.25rem)", color: "var(--foreground)" }}
            >
              The All-in-One{" "}
              <em className="italic" style={{ color: "var(--accent-foreground)" }}>
                School Management System
              </em>{" "}
              Built for African Schools
            </h1>

            {/* Sub-headline */}
            <p
              className="font-jakarta font-light leading-[1.8] mb-8"
              style={{ fontSize: "18px", color: "var(--muted-foreground)", maxWidth: "520px" }}
            >
              Manage admissions, fees, attendance, exams &amp; parent communication from one
              powerful platform. No more Excel chaos. No more WhatsApp groups for school updates.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-10">
              <a
                href="/waitlist"
                className="inline-flex items-center justify-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-[8px] transition-colors duration-300 no-underline"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--primary)")}
              >
                Join the School Waitlist →
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-[8px] transition-all duration-300 no-underline"
                style={{
                  background: "transparent",
                  color: "var(--foreground)",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.color = "var(--accent-foreground)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "var(--foreground)";
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
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgb(var(--primary-rgb) / 20%)",
                  }}
                >
                  <strong
                    className="block text-[14px] sm:text-[18px] font-bold"
                    style={{ color: "var(--accent-foreground)" }}
                  >
                    {stat.value}
                  </strong>
                  <small className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
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
                background: "rgb(var(--primary-rgb) / 15%)",
                border: "1px solid var(--accent-foreground)",
                color: "var(--accent-foreground)",
                fontSize: "11px",
                padding: "4px 12px",
              }}
            >
              <BarChart2 className="w-4 h-4" strokeWidth={1.5} /> Sample data — see your real
              numbers after setup
            </div>
            {/* Card 1 — Total Students */}
            <div
              className="absolute rounded-[12px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-float"
              style={{
                top: 0,
                left: 0,
                width: "220px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgb(var(--primary-rgb) / 30%)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-[12px] mb-2" style={{ color: "var(--muted-foreground)" }}>
                Total Students
              </div>
              <div className="font-mono-brand font-bold text-[22px]" style={{ color: "var(--accent-foreground)" }}>
                1,250
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                +42 this term
              </div>
            </div>

            {/* Card 2 — Fees Collected */}
            <div
              className="absolute rounded-[12px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-float-delay"
              style={{
                top: "150px",
                right: 0,
                width: "210px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgb(var(--primary-rgb) / 30%)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-[12px] mb-2" style={{ color: "var(--muted-foreground)" }}>
                Fees Collected
              </div>
              <div className="font-mono-brand font-bold text-[22px]" style={{ color: "var(--accent-foreground)" }}>
                Ksh 2.4M
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                87% collection rate
              </div>
            </div>

            {/* Card 3 — Attendance */}
            <div
              className="absolute rounded-[12px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-float-slow"
              style={{
                bottom: 0,
                left: "50px",
                width: "250px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgb(var(--primary-rgb) / 30%)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-[12px] mb-2" style={{ color: "var(--muted-foreground)" }}>
                Attendance Rate
              </div>
              <div className="font-mono-brand font-bold text-[22px]" style={{ color: "var(--accent-foreground)" }}>
                94%
              </div>
              <div
                className="mt-2 h-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: "94%", background: "linear-gradient(90deg, var(--primary), var(--accent-foreground))" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
