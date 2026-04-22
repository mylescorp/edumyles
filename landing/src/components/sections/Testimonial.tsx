"use client";

import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    quote:
      "EduMyles transformed how we run our school. Fee collection is up 40%, and I now spend 3 hours instead of 3 days on term reports. I wish we'd found it sooner.",
    name: "Mary K.",
    role: "Principal",
    school: "Nairobi Green Academy",
    initials: "MK",
  },
  {
    quote:
      "The M-Pesa integration alone saved our bursar 8 hours every week. Parents now pay instantly and get receipts automatically. No more chasing fee balances.",
    name: "David O.",
    role: "School Bursar",
    school: "St. Francis High School, Kisumu",
    initials: "DO",
  },
  {
    quote:
      "We went from paper registers and WhatsApp groups to a fully digital school in under two weeks. The onboarding team was with us every step of the way.",
    name: "Grace N.",
    role: "Head Teacher",
    school: "Brookside Preparatory, Nairobi",
    initials: "GN",
  },
];

export default function Testimonial() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const hoverRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, 250);
  };

  const prev = () => {
    const next = (current - 1 + testimonials.length) % testimonials.length;
    goTo(next);
  };

  const next = () => {
    const nextIdx = (current + 1) % testimonials.length;
    goTo(nextIdx);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!hoverRef.current) {
        setCurrent((c) => {
          const nextIdx = (c + 1) % testimonials.length;
          return nextIdx;
        });
      }
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const t = testimonials[current]!;

  return (
    <section
      className="px-4 sm:px-8 py-16 sm:py-20"
      aria-label="Testimonials"
      style={{ background: "#FEF3DC" }}
    >
      {/* Section heading */}
      <div className="text-center mb-10 sm:mb-12">
        <h2
          className="font-display font-bold leading-[1.2] mb-2"
          style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
        >
          What Schools Say
        </h2>
        <p className="font-jakarta text-[15px]" style={{ color: "#5a5a5a" }}>
          Trusted by 50+ schools across East Africa
        </p>
      </div>

      {/* Carousel */}
      <div
        className="max-w-[780px] mx-auto"
        onMouseEnter={() => {
          hoverRef.current = true;
        }}
        onMouseLeave={() => {
          hoverRef.current = false;
        }}
      >
        <div className="flex items-center gap-4">
          {/* Prev button */}
          <button
            onClick={prev}
            aria-label="Previous testimonial"
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
            style={{
              background: "rgba(6,26,18,0.08)",
              border: "1px solid rgba(6,26,18,0.15)",
              color: "#061A12",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#E8A020";
              e.currentTarget.style.color = "#061A12";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(6,26,18,0.08)";
              e.currentTarget.style.color = "#061A12";
            }}
          >
            ←
          </button>

          {/* Card */}
          <div
            className="flex-1 rounded-2xl p-8 sm:p-10 flex flex-col gap-6 text-center"
            style={{
              background: "#ffffff",
              boxShadow: "0 8px 40px rgba(6,26,18,0.08)",
              border: "1px solid rgba(232,160,32,0.2)",
              opacity: fading ? 0 : 1,
              transition: "opacity 0.25s ease-in-out",
            }}
          >
            {/* Open-quote decoration */}
            <div
              className="font-display leading-none select-none"
              style={{ fontSize: "80px", color: "#E8A020", lineHeight: "0.5", marginBottom: "8px" }}
              aria-hidden="true"
            >
              &ldquo;
            </div>

            {/* Quote text */}
            <p
              className="font-display font-normal italic leading-[1.65]"
              style={{ fontSize: "clamp(1rem,2vw,1.35rem)", color: "#061A12" }}
            >
              {t.quote}
            </p>

            {/* Stars */}
            <div className="text-[18px]" aria-label="5 stars" style={{ color: "#E8A020" }}>
              ⭐⭐⭐⭐⭐
            </div>

            {/* Avatar + attribution */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-jakarta font-bold text-[16px] flex-shrink-0"
                style={{ background: "#0F4C2A", color: "#E8A020" }}
                aria-hidden="true"
              >
                {t.initials}
              </div>
              <div>
                <div className="font-jakarta font-bold text-[16px]" style={{ color: "#061A12" }}>
                  {t.name}
                </div>
                <div className="font-jakarta text-[13px]" style={{ color: "#6B9E83" }}>
                  {t.role} · {t.school}
                </div>
              </div>
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={next}
            aria-label="Next testimonial"
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
            style={{
              background: "rgba(6,26,18,0.08)",
              border: "1px solid rgba(6,26,18,0.15)",
              color: "#061A12",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#E8A020";
              e.currentTarget.style.color = "#061A12";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(6,26,18,0.08)";
              e.currentTarget.style.color = "#061A12";
            }}
          >
            →
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? "24px" : "8px",
                height: "8px",
                background: i === current ? "#E8A020" : "rgba(6,26,18,0.2)",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
