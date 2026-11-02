"use client";

import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    quote:
      "Our M-Pesa integration alone saved our bursar six hours every week. Parents now pay instantly and get receipts automatically, and we have stopped chasing late balances.",
    name: "[Name]",
    role: "Bursar",
    school: "[School name]",
    initials: "—",
  },
  {
    quote:
      "The demo was incredibly helpful. They understood our challenges immediately and showed us exactly how EduMyles would solve them.",
    name: "Grace Njeri",
    role: "Finance Officer",
    school: "Nairobi Green Academy",
    initials: "GN",
  },
  {
    quote:
      "[Customer quote about report cards or parent communication]",
    name: "[Name]",
    role: "[Role]",
    school: "[School name]",
    initials: "—",
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
      style={{ background: "var(--muted)" }}
    >
      {/* Section heading */}
      <div className="text-center mb-10 sm:mb-12">
        <h2
          className="font-display font-bold leading-[1.2] mb-2"
          style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "var(--foreground)" }}
        >
          What Schools Say
        </h2>
        <p className="font-jakarta text-[15px]" style={{ color: "var(--muted-foreground)" }}>
          Trusted by schools across East Africa
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
              color: "var(--foreground)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--primary)";
              e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(6,26,18,0.08)";
              e.currentTarget.style.color = "var(--foreground)";
            }}
          >
            ←
          </button>

          {/* Card */}
          <div
            className="flex-1 rounded-2xl p-8 sm:p-10 flex flex-col gap-6 text-center"
            style={{
              background: "var(--card)",
              boxShadow: "0 8px 40px rgba(6,26,18,0.08)",
              border: "1px solid rgb(var(--primary-rgb) / 20%)",
              opacity: fading ? 0 : 1,
              transition: "opacity 0.25s ease-in-out",
            }}
          >
            {/* Open-quote decoration */}
            <div
              className="font-display leading-none select-none"
              style={{ fontSize: "80px", color: "var(--accent-foreground)", lineHeight: "0.5", marginBottom: "8px" }}
              aria-hidden="true"
            >
              &ldquo;
            </div>

            {/* Quote text */}
            <p
              className="font-display font-normal italic leading-[1.65]"
              style={{ fontSize: "clamp(1rem,2vw,1.35rem)", color: "var(--foreground)" }}
            >
              {t.quote}
            </p>

            {/* Stars */}
            <div className="text-[18px]" aria-label="5 stars" style={{ color: "var(--accent-foreground)" }}>
              ⭐⭐⭐⭐⭐
            </div>

            {/* Avatar + attribution */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-jakarta font-bold text-[16px] flex-shrink-0"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                aria-hidden="true"
              >
                {t.initials}
              </div>
              <div>
                <div className="font-jakarta font-bold text-[16px]" style={{ color: "var(--foreground)" }}>
                  {t.name}
                </div>
                <div className="font-jakarta text-[13px]" style={{ color: "var(--muted-foreground)" }}>
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
              color: "var(--foreground)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--primary)";
              e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(6,26,18,0.08)";
              e.currentTarget.style.color = "var(--foreground)";
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
                background: i === current ? "var(--primary)" : "rgba(6,26,18,0.2)",
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
