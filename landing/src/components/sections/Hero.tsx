"use client";

import { useEffect, useRef } from "react";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

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
      className="relative flex items-center overflow-hidden"
      aria-label="Hero section"
      style={{
        background: "#061A12",
        minHeight: "90vh",
        borderTop: "3px solid #E8A020",
        padding: "5rem 2rem",
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
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — Text content */}
          <div className="fade-in">
            {/* Badge */}
            <div
              className="inline-block font-jakarta font-semibold text-[14px] mb-6 px-6 py-3 rounded-[50px]"
              style={{
                background: "rgba(232,160,32,0.1)",
                border: "1px solid #E8A020",
                color: "#E8A020",
              }}
            >
              🏫 Trusted by 50+ Schools Across Africa
            </div>

            {/* Headline */}
            <h1
              className="font-playfair font-bold leading-[1.2] mb-6"
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
              Manage admissions, fees, attendance, exams &amp; parent communication from one powerful
              platform. No more Excel chaos. No more WhatsApp groups for school updates.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-10">
              <a
                href="#demo"
                className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-[50px] transition-colors duration-300 no-underline"
                style={{ background: "#E8A020", color: "#061A12" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F5C453")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#E8A020")}
              >
                Book a Free Demo →
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-[50px] transition-all duration-300 no-underline"
                style={{ background: "transparent", color: "#ffffff", border: "2px solid #ffffff" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.color = "#061A12";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#ffffff";
                }}
              >
                See Pricing
              </a>
            </div>

            {/* Stat badges */}
            <div className="flex flex-wrap gap-4">
              {[
                { value: "15 hrs/week", label: "saved per school" },
                { value: "50+ Schools", label: "trust us" },
                { value: "10,000+", label: "students managed" },
              ].map((stat) => (
                <div
                  key={stat.value}
                  className="flex-1 min-w-[100px] text-center px-4 py-3 rounded-[12px]"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(232,160,32,0.2)",
                  }}
                >
                  <strong className="block text-[18px] font-bold" style={{ color: "#E8A020" }}>
                    {stat.value}
                  </strong>
                  <small className="text-[12px]" style={{ color: "#6B9E83" }}>
                    {stat.label}
                  </small>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Floating dashboard mockup */}
          <div className="relative hidden lg:block" style={{ height: "400px" }}>
            {/* Card 1 — Total Students */}
            <div
              className="absolute rounded-[12px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-float"
              style={{
                top: 0,
                left: 0,
                width: "220px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(232,160,32,0.3)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-[12px] mb-2" style={{ color: "#6B9E83" }}>Total Students</div>
              <div className="font-mono-brand font-bold text-[22px]" style={{ color: "#E8A020" }}>1,250</div>
              <div className="text-[11px] mt-1" style={{ color: "#A8E6C3" }}>+42 this term</div>
            </div>

            {/* Card 2 — Fees Collected */}
            <div
              className="absolute rounded-[12px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-float-delay"
              style={{
                top: "150px",
                right: 0,
                width: "210px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(232,160,32,0.3)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-[12px] mb-2" style={{ color: "#6B9E83" }}>Fees Collected</div>
              <div className="font-mono-brand font-bold text-[22px]" style={{ color: "#E8A020" }}>Ksh 2.4M</div>
              <div className="text-[11px] mt-1" style={{ color: "#A8E6C3" }}>87% collection rate</div>
            </div>

            {/* Card 3 — Attendance */}
            <div
              className="absolute rounded-[12px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-float-slow"
              style={{
                bottom: 0,
                left: "50px",
                width: "250px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(232,160,32,0.3)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-[12px] mb-2" style={{ color: "#6B9E83" }}>Attendance Rate</div>
              <div className="font-mono-brand font-bold text-[22px]" style={{ color: "#E8A020" }}>94%</div>
              <div className="mt-2 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: "94%", background: "linear-gradient(90deg, #1A7A4A, #E8A020)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
