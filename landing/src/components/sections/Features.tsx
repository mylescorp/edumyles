"use client";

import { useEffect, useRef } from "react";

const features = [
  {
    icon: "💳",
    title: "M-Pesa Fee Collection",
    benefit:
      "Parents pay fees directly from their phones. Zero bank visits, zero bounced cheques.",
  },
  {
    icon: "📊",
    title: "Real-time Gradebook",
    benefit:
      "Teachers mark digitally. Parents see results instantly. No more lost report books.",
  },
  {
    icon: "🎓",
    title: "Student Info System",
    benefit:
      "Complete student records, admissions, transfers, and certificates — one click.",
  },
  {
    icon: "📱",
    title: "Parent Communication",
    benefit:
      "SMS, in-app, and WhatsApp updates to every parent, in English or Swahili.",
  },
  {
    icon: "🚌",
    title: "Transport Tracking",
    benefit:
      "Live GPS tracking. Parents know exactly where the school bus is.",
  },
  {
    icon: "🤖",
    title: "Myles AI Analytics",
    benefit:
      "Flags at-risk students, fee defaulters, and attendance patterns automatically.",
  },
];

export default function Features() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="py-20 lg:py-32 bg-white" aria-label="Key features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="font-inter font-semibold text-gold uppercase tracking-widest text-sm mb-3">
            Why EduMyles
          </p>
          <h2 className="font-jakarta font-bold text-4xl lg:text-5xl text-navy mb-4">
            Everything your school needs, in one platform
          </h2>
          <p className="font-inter text-lg text-mid-grey max-w-2xl mx-auto">
            Stop juggling spreadsheets, WhatsApp groups, and paper registers. EduMyles brings
            every school operation together.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feat, i) => (
            <div
              key={feat.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="group bg-white border border-light-grey rounded-2xl p-6 hover:shadow-lg hover:border-gold/50 hover:-translate-y-1"
              style={{
                opacity: 0,
                transform: "translateY(30px)",
                transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s, box-shadow 0.3s, border-color 0.3s`,
              }}
            >
              {/* Gold top border accent */}
              <div className="h-1 w-12 bg-gold rounded-full mb-5 group-hover:w-full transition-all duration-500" />
              <div className="text-4xl mb-4">{feat.icon}</div>
              <h3 className="font-jakarta font-semibold text-xl text-navy mb-2">{feat.title}</h3>
              <p className="font-inter text-base text-mid-grey leading-relaxed">{feat.benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
