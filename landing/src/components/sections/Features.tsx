"use client";

import { useEffect, useRef } from "react";

const problems = [
  {
    icon: "📋",
    title: "Manual Registers",
    description:
      "Attendance marked on paper, then re-entered into Excel. Hours wasted. Data lost.",
  },
  {
    icon: "📊",
    title: "Scattered Data",
    description:
      "Student records in 5 different spreadsheets. No single source of truth.",
  },
  {
    icon: "💬",
    title: "Communication Chaos",
    description:
      "Parent updates via WhatsApp, SMS, and phone calls. No system. No records.",
  },
];

export default function Features() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );
    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      className="px-4 sm:px-8 py-16"
      aria-label="Problems we solve"
      style={{ background: "#0C3020" }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Eyebrow */}
        <div className="flex items-center gap-[10px] mb-[10px]">
          <div className="w-[26px] h-[2px] flex-shrink-0" style={{ background: "#E8A020" }} />
          <div className="text-[10px] font-bold tracking-[2.5px] uppercase" style={{ color: "#E8A020" }}>The Problem</div>
        </div>

        {/* Heading */}
        <h2
          className="font-playfair font-bold leading-[1.2] mb-12"
          style={{ fontSize: "clamp(1.75rem, 3vw, 3rem)", color: "#ffffff" }}
        >
          Schools are drowning in paperwork.{" "}
          <em className="italic" style={{ color: "#E8A020" }}>
            EduMyles fixes that.
          </em>
        </h2>

        {/* Problem cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, i) => (
            <div
              key={problem.title}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="fade-in rounded-[12px] p-8 transition-all duration-300 cursor-default"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(232,160,32,0.2)",
                transitionDelay: `${i * 0.1}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.borderColor = "rgba(232,160,32,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(232,160,32,0.2)";
              }}
            >
              <div className="text-[40px] mb-4">{problem.icon}</div>
              <h3
                className="font-playfair font-bold text-[20px] mb-3"
                style={{ color: "#ffffff" }}
              >
                {problem.title}
              </h3>
              <p className="text-[14px] leading-[1.6]" style={{ color: "#90CAF9" }}>
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
