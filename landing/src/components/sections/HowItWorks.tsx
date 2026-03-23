"use client";

import { useEffect, useRef } from "react";

const steps = [
  {
    number: "1",
    title: "Setup Your School",
    description: "Create your profile and add school details in just 15 minutes.",
  },
  {
    number: "2",
    title: "Import Your Data",
    description: "Upload students, staff, and class lists via Excel or manual entry.",
  },
  {
    number: "3",
    title: "Go Live",
    description: "Your team logs in, parents get access, you're running.",
  },
];

export default function HowItWorks() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      { threshold: 0.1 }
    );
    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      className="px-4 sm:px-8 py-16"
      aria-label="How it works"
      style={{ background: "#061A12" }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Heading */}
        <h2
          className="font-playfair font-bold leading-[1.2] mb-12"
          style={{ fontSize: "clamp(1.75rem, 3vw, 3rem)", color: "#ffffff" }}
        >
          Get Your School Running on EduMyles in{" "}
          <em className="italic" style={{ color: "#E8A020" }}>3 Simple Steps</em>
        </h2>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
          {steps.map((step, i) => (
            <div
              key={step.number}
              ref={(el) => { stepRefs.current[i] = el; }}
              className="fade-in text-center md:text-left relative flex flex-col items-center md:items-start"
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              {/* Arrow between steps (desktop only) */}
              {i < steps.length - 1 && (
                <span
                  className="hidden md:block absolute top-[30px] text-[28px] font-bold"
                  style={{ right: "-2rem", color: "#E8A020", zIndex: 1 }}
                >
                  →
                </span>
              )}
              {/* Connector line for mobile */}
              {i < steps.length - 1 && (
                <div
                  className="md:hidden w-px h-8 mt-4"
                  style={{ background: "rgba(232,160,32,0.3)" }}
                />
              )}

              {/* Step number */}
              <div
                className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-[28px] font-bold mx-auto mb-4"
                style={{ background: "#E8A020", color: "#061A12" }}
              >
                {step.number}
              </div>

              <h3
                className="font-playfair font-bold text-[20px] mb-3 mt-4"
                style={{ color: "#ffffff" }}
              >
                {step.title}
              </h3>
              <p className="text-[14px] leading-[1.6] max-w-[280px] md:max-w-none" style={{ color: "#90CAF9" }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center mt-12 text-[14px]" style={{ color: "#6B9E83" }}>
          Our team supports you at every step. Most schools go live in under 2 weeks.
        </p>
      </div>
    </section>
  );
}
