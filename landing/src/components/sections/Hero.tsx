"use client";

import { useEffect, useRef } from "react";

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
        background: "#061A12",
        minHeight: "90vh",
        borderTop: "3px solid #E8A020",
      }}
    >
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(232,160,32,0.05) 25%, rgba(232,160,32,0.05) 26%, transparent 27%, transparent 74%, rgba(232,160,32,0.05) 75%, rgba(232,160,32,0.05) 76%, transparent 77%),
            linear-gradient(90deg, transparent 24%, rgba(232,160,32,0.05) 25%, rgba(232,160,32,0.05) 26%, transparent 27%, transparent 74%, rgba(232,160,32,0.05) 75%, rgba(232,160,32,0.05) 76%, transparent 77%)
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
        <div className="max-w-[760px]">
          {/* Left — Text content */}
          <div className="fade-in">
            {/* Eyebrow */}
            <div className="flex items-center gap-[10px] mb-6">
              <div className="w-[26px] h-[2px] flex-shrink-0" style={{ background: "#E8A020" }} />
              <div
                className="text-[10px] font-bold tracking-[2.5px] uppercase"
                style={{ color: "#E8A020" }}
              >
                Built for school operations in Africa
              </div>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-bold leading-[1.2] mb-6"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.25rem)", color: "#ffffff" }}
            >
              The All-in-One{" "}
              <em className="italic" style={{ color: "#E8A020" }}>
                School Management System
              </em>{" "}
              Built for African Schools
            </h1>

            {/* Sub-headline */}
            <p
              className="font-jakarta font-light leading-[1.8] mb-8"
              style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "520px" }}
            >
              Manage admissions, fees, attendance, exams &amp; parent communication from one
              powerful platform. No more Excel chaos. No more WhatsApp groups for school updates.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-10">
              <a
                href="/waitlist"
                className="inline-flex items-center justify-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-[8px] transition-colors duration-300 no-underline"
                style={{ background: "#E8A020", color: "#061A12" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F5C453")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#E8A020")}
              >
                Join the School Waitlist →
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-[8px] transition-all duration-300 no-underline"
                style={{
                  background: "transparent",
                  color: "#ffffff",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#E8A020";
                  e.currentTarget.style.color = "#E8A020";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "#ffffff";
                }}
              >
                See Pricing
              </a>
            </div>

            {/* Stat badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "Admissions", label: "keep records organised" },
                { value: "Fees", label: "track school payments" },
                { value: "Attendance", label: "stay informed daily" },
              ].map((stat) => (
                <div
                  key={stat.value}
                  className="text-center px-2 sm:px-4 py-3 rounded-[12px]"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(232,160,32,0.2)",
                  }}
                >
                  <strong
                    className="block text-[14px] sm:text-[18px] font-bold"
                    style={{ color: "#E8A020" }}
                  >
                    {stat.value}
                  </strong>
                  <small className="text-[12px]" style={{ color: "#6B9E83" }}>
                    {stat.label}
                  </small>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
