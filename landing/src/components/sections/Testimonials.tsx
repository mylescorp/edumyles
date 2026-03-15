"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "EduMyles transformed our admissions process from weeks to days. Parents can now apply online and track their application status in real time. We processed 3x more applications this year.",
    name: "Mary Wanjiku",
    title: "Principal",
    school: "Nairobi Academy",
    county: "Nairobi County",
    initials: "MW",
  },
  {
    quote:
      "M-Pesa integration has been a game-changer. Parents pay fees from their phones and we see it instantly. No more chasing receipts or bank visits. Our fee collection rate jumped from 68% to 89%.",
    name: "David Okello",
    title: "Bursar",
    school: "Kampala International School",
    county: "Nairobi County",
    initials: "DO",
  },
  {
    quote:
      "Everything we need is in one place — timetables, report cards, staff payroll, transport tracking. Our admin team went from overwhelmed to ahead of schedule. EduMyles is genuinely transformative.",
    name: "Amina Hassan",
    title: "School Director",
    school: "Dar Premium School",
    county: "Mombasa County",
    initials: "AH",
  },
  {
    quote:
      "The CBC gradebook is exactly what we needed. Teachers mark on their phones, parents see results the same day, and report cards generate automatically. No more end-of-term printing stress.",
    name: "James Kariuki",
    title: "Academic Director",
    school: "Riverside Academy",
    county: "Kiambu County",
    initials: "JK",
  },
  {
    quote:
      "As a school owner with 3 campuses, managing everything separately was impossible. EduMyles gives me one view across all schools with role-based access. It's exactly what multi-campus schools need.",
    name: "Grace Achieng",
    title: "School Owner",
    school: "Achieng Schools Group",
    county: "Kisumu County",
    initials: "GA",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % testimonials.length),
    []
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length),
    []
  );

  useEffect(() => {
    if (!paused) {
      intervalRef.current = setInterval(next, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, next]);

  const t = testimonials[current] ?? testimonials[0]!;

  return (
    <section
      id="testimonials"
      className="py-20 lg:py-32 bg-navy"
      aria-label="Customer testimonials"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="font-inter font-semibold text-gold uppercase tracking-widest text-sm mb-3">
            Social Proof
          </p>
          <h2 className="font-jakarta font-bold text-4xl lg:text-5xl text-white mb-4">
            Schools thriving with EduMyles
          </h2>
          <p className="font-inter text-lg text-white/70 max-w-2xl mx-auto">
            Real results from real schools across East Africa.
          </p>
        </div>

        <div
          className="max-w-4xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Main card */}
          <div key={current} className="bg-white rounded-2xl p-8 lg:p-12 shadow-2xl relative">
            {/* Gold quote mark */}
            <div className="absolute top-6 right-8 font-jakarta font-bold text-8xl text-gold/10 leading-none select-none">
              &rdquo;
            </div>

            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="text-gold fill-gold" />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="font-inter text-lg lg:text-xl text-dark-grey leading-relaxed italic mb-8">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                <span className="font-jakarta font-bold text-gold text-sm">{t.initials}</span>
              </div>
              <div>
                <div className="font-jakarta font-semibold text-navy">{t.name}</div>
                <div className="font-inter text-sm text-mid-grey">
                  {t.title}, {t.school}
                </div>
                <div className="font-inter text-xs text-gold/80">{t.county}</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={prev}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? "bg-gold w-6" : "bg-white/30 w-2"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
