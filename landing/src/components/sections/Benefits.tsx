"use client";

import { useEffect, useRef } from "react";

const roles = [
  {
    title: "For Administrators",
    items: [
      "Generate enrollment reports in seconds",
      "Track fee collection in real-time",
      "Monitor school performance dashboards",
      "Manage staff and permissions",
    ],
  },
  {
    title: "For Teachers",
    items: [
      "Mark attendance with one tap",
      "Enter and view grades instantly",
      "Send messages to parents directly",
      "Access class rosters anytime",
    ],
  },
  {
    title: "For Parents",
    items: [
      "Monitor child's attendance & grades",
      "Receive alerts instantly",
      "Pay fees directly through the app",
      "Communicate with teachers anytime",
    ],
  },
];

export default function Benefits() {
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
    <section id="benefits" className="px-4 sm:px-8 py-16 bg-white" aria-label="Benefits by role">
      <div className="max-w-[1200px] mx-auto">
        {/* Eyebrow */}
        <div className="section-eyebrow mb-2">Built for Everyone</div>

        {/* Heading */}
        <h2
          className="font-display font-bold leading-[1.2] mb-12"
          style={{ fontSize: "clamp(1.75rem, 3vw, 3rem)", color: "#061A12" }}
        >
          Built for{" "}
          <em className="italic" style={{ color: "#E8A020" }}>
            Everyone in Your School
          </em>
        </h2>

        {/* 3 benefit cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, i) => (
            <div
              key={role.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="fade-in rounded-[12px] p-8"
              style={{
                background: "#F3FBF6",
                border: "1px solid #e0e0e0",
                transitionDelay: `${i * 0.1}s`,
              }}
            >
              <h3 className="font-display font-bold text-[22px] mb-4" style={{ color: "#061A12" }}>
                {role.title}
              </h3>
              <ul className="list-none p-0 m-0">
                {role.items.map((item) => (
                  <li
                    key={item}
                    className="text-[14px] leading-relaxed mb-3 pl-6 relative"
                    style={{ color: "#061A12" }}
                  >
                    <span className="absolute left-0 font-bold" style={{ color: "#26A65B" }}>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#demo"
                className="inline-block mt-4 text-[14px] font-semibold no-underline transition-colors duration-300"
                style={{ color: "#1A7A4A" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#26A65B")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#1A7A4A")}
              >
                See how it works →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
