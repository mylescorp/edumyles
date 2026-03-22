"use client";

import { useEffect, useRef } from "react";

export default function Testimonial() {
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
      className="px-4 sm:px-8 py-16"
      aria-label="Testimonial"
      style={{ background: "#FEF3DC" }}
    >
      <div
        ref={ref}
        className="fade-in max-w-[900px] mx-auto text-center"
      >
        {/* Big quote mark */}
        <div
          className="font-playfair leading-none mb-4 select-none"
          style={{ fontSize: "80px", color: "#E8A020", lineHeight: "0.5" }}
          aria-hidden="true"
        >
          &ldquo;
        </div>

        {/* Quote text */}
        <p
          className="font-playfair font-normal italic leading-[1.6] mb-6"
          style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.75rem)", color: "#061A12" }}
        >
          EduMyles transformed how we run our school. Fee collection is up 40%, and I now spend
          3 hours instead of 3 days on term reports. I wish we&apos;d found it sooner.
        </p>

        {/* Attribution */}
        <div
          className="text-[16px] font-semibold mb-2"
          style={{ color: "#0C3020" }}
        >
          — Mary K., Principal, Nairobi Green Academy
        </div>

        {/* Stars */}
        <div className="text-[18px]" aria-label="5 stars" style={{ color: "#E8A020" }}>
          ⭐⭐⭐⭐⭐
        </div>
      </div>
    </section>
  );
}
