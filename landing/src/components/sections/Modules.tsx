"use client";

import { useEffect, useRef } from "react";
import {
  GraduationCap,
  Wallet,
  CalendarDays,
  FileText,
  Users,
  BookOpen,
  Bus,
  Library,
  MessageSquare,
  ShoppingCart,
  ShieldCheck,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import { PUBLIC_MODULES } from "@edumyles/shared/constants/publicCatalog";
import type { Module } from "@edumyles/shared/types";

const moduleIcons: Record<Module, LucideIcon> = {
  sis: GraduationCap,
  admissions: FileText,
  finance: Wallet,
  timetable: CalendarDays,
  academics: BookOpen,
  hr: Users,
  library: Library,
  transport: Bus,
  communications: MessageSquare,
  users: ShieldCheck,
  tickets: Headphones,
  ewallet: Wallet,
  ecommerce: ShoppingCart,
};

const modules = PUBLIC_MODULES.map((module) => ({
  ...module,
  icon: moduleIcons[module.slug],
}));

export default function Modules() {
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
      id="modules"
      className="px-4 sm:px-8 py-16"
      aria-label="Platform modules"
      style={{ background: "#F3FBF6" }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Eyebrow */}
        <div className="section-eyebrow mb-2">The Platform</div>

        {/* Heading */}
        <h2
          className="font-display font-bold leading-[1.2] mb-12"
          style={{ fontSize: "clamp(1.75rem, 3vw, 3rem)", color: "#061A12" }}
        >
          Everything Your School Needs,{" "}
          <em className="italic" style={{ color: "#E8A020" }}>
            In One Place
          </em>
        </h2>

        {/* 3×2 card grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <div
              key={mod.slug}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="fade-in bg-white rounded-[12px] p-8 text-center transition-all duration-300 cursor-default"
              style={{
                border: "1px solid #e0e0e0",
                transitionDelay: `${i * 0.08}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Icon */}
              <div
                className="w-[70px] h-[70px] rounded-[12px] flex items-center justify-center mx-auto mb-4"
                style={{
                  background: "linear-gradient(135deg, #26A65B, #1A7A4A)",
                }}
              >
                <mod.icon className="w-7 h-7" strokeWidth={1.5} style={{ color: "#ffffff" }} />
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-[20px] mb-1" style={{ color: "#061A12" }}>
                {mod.label}
              </h3>

              {/* Benefit tag */}
              <div className="text-[14px] font-semibold mb-3" style={{ color: "#E8A020" }}>
                Included module
              </div>

              {/* Description */}
              <p className="text-[14px] leading-[1.6] mb-6" style={{ color: "#6B9E83" }}>
                {mod.description}
              </p>

              {/* Link */}
              <a
                href="/features"
                className="text-[14px] font-semibold no-underline transition-colors duration-300"
                style={{ color: "#1A7A4A" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#26A65B")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#1A7A4A")}
              >
                Learn more →
              </a>
            </div>
          ))}
        </div>

        {/* View all link */}
        <div className="text-center mt-8">
          <a
            href="/features"
            className="text-[16px] font-bold no-underline transition-colors duration-300"
            style={{ color: "#1A7A4A" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#26A65B")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#1A7A4A")}
          >
            View all 13 modules →
          </a>
        </div>
      </div>
    </section>
  );
}
