"use client";

import { useEffect, useRef } from "react";
import { ClipboardList, BarChart2, MessageCircle, type LucideIcon } from "lucide-react";

const problems: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ClipboardList,
    title: "Manual Registers",
    description: "Attendance on paper, fees in notebooks and results in spreadsheets. Hours of admin every week and no single source of truth.",
  },
  {
    icon: BarChart2,
    title: "Scattered Data",
    description: "Student, fee and staff records live in different files and different heads, so nothing matches and reports take days.",
  },
  {
    icon: MessageCircle,
    title: "Communication Chaos",
    description: "WhatsApp groups, phone calls and printed notices. Parents miss updates and staff repeat the same message ten times.",
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
      className="handoff-problem-section"
      aria-label="Problems we solve"
    >
      <div className="handoff-problem-band">
        {/* Eyebrow */}
        <div className="flex items-center gap-[10px] mb-[10px]">
          <div className="w-[26px] h-[2px] flex-shrink-0" style={{ background: "var(--primary)" }} />
          <div
            className="text-[10px] font-bold tracking-[2.5px] uppercase"
            style={{ color: "#B9CBD6" }}
          >
            The Problem
          </div>
        </div>

        {/* Heading */}
        <h2
          className="font-display font-bold leading-[1.2] mb-12"
          style={{ fontSize: "clamp(1.75rem, 3vw, 3rem)", color: "#ffffff" }}
        >
          Schools are drowning in paperwork.{" "}
          <em className="italic" style={{ color: "#B9CBD6" }}>
            EduMyles fixes that.
          </em>
        </h2>

        {/* Problem cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, i) => (
            <div
              key={problem.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="fade-in handoff-problem-card"
              style={{
                border: "1px solid rgb(var(--primary-rgb) / 20%)",
                transitionDelay: `${i * 0.1}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.borderColor = "rgb(var(--primary-rgb) / 45%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgb(var(--primary-rgb) / 20%)";
              }}
            >
              <div className="mb-4" style={{ color: "#B9CBD6" }}>
                <problem.icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[20px] mb-3" style={{ color: "#ffffff" }}>
                {problem.title}
              </h3>
              <p className="text-[14px] leading-[1.6]" style={{ color: "#C4D4D0" }}>
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
