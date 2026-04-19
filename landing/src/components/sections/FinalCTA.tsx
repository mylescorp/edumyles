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
      style={{ background: "#0F4C2A" }}
    >
      <div ref={ref} className="fade-in max-w-[800px] mx-auto">
        <h2
          className="font-playfair font-bold leading-[1.2] mb-3"
          style={{ fontSize: "clamp(1.75rem, 3vw, 2.625rem)", color: "#ffffff" }}
        >
          Ready to{" "}
          <em className="italic" style={{ color: "#E8A020" }}>Transform</em>{" "}
          Your School?
        </h2>

        <p
          className="text-[18px] mb-8 leading-relaxed"
          style={{ color: "#90CAF9" }}
        >
          Join 50+ schools already running on EduMyles. Setup is free. Support is local.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center mb-4">
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
            style={{ background: "transparent", color: "#ffffff", border: "1.5px solid rgba(255,255,255,0.2)" }}
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

        <p className="text-[13px]" style={{ color: "#6B9E83" }}>
          No commitment required · Free onboarding included · Cancel anytime
        </p>
      </div>
    </section>
  );
}
