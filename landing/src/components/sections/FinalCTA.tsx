"use client";

import { useEffect, useRef } from "react";

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);

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
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="demo"
      className="px-4 sm:px-8 py-16 text-center"
      aria-label="Final call to action"
      style={{ background: "var(--primary)" }}
    >
      <div ref={ref} className="fade-in max-w-[800px] mx-auto">
        <h2
          className="font-display font-bold leading-[1.2] mb-3"
          style={{ fontSize: "clamp(1.75rem, 3vw, 2.625rem)", color: "var(--primary-foreground)" }}
        >
          Ready to{" "}
          <em className="italic" style={{ color: "var(--primary-foreground)" }}>
            Transform
          </em>{" "}
          Your School?
        </h2>

        <p className="text-[18px] mb-8 leading-relaxed" style={{ color: "var(--primary-foreground)", opacity: 0.82 }}>
          Join schools already running on EduMyles. Setup is free. Support is local.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center mb-4">
          <a
            href="/waitlist"
            className="inline-flex items-center justify-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-[8px] transition-colors duration-300 no-underline"
            style={{ background: "var(--primary-foreground)", color: "var(--primary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--primary-foreground)")}
          >
            Join the School Waitlist →
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-[8px] transition-all duration-300 no-underline"
            style={{
              background: "transparent",
              color: "var(--primary-foreground)",
              border: "1.5px solid rgb(var(--primary-foreground-rgb) / 30%)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.color = "var(--primary-foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgb(var(--primary-foreground-rgb) / 30%)";
              e.currentTarget.style.color = "var(--primary-foreground)";
            }}
          >
            See Pricing
          </a>
        </div>

        <p className="text-[13px]" style={{ color: "var(--primary-foreground)", opacity: 0.82 }}>
          No commitment required · Free onboarding included · Cancel anytime
        </p>
      </div>
    </section>
  );
}
