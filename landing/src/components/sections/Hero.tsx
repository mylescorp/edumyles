"use client";

import { useState, useEffect } from "react";
import { Play, Star, ChevronDown } from "lucide-react";
import DemoModal from "@/components/ui/DemoModal";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const heroModules = [
  {
    label: "Student Information System",
    color: "#1A395B",
    icon: "🎓",
    stats: [
      { label: "Total Students", value: "1,247" },
      { label: "New Enrollments", value: "89" },
      { label: "Attendance Rate", value: "94.2%" },
    ],
    description: "Complete student records, admissions & transfers",
  },
  {
    label: "Fee & Finance + M-Pesa",
    color: "#2EA44F",
    icon: "💳",
    stats: [
      { label: "Fees Collected", value: "KSh 4.2M" },
      { label: "Collection Rate", value: "87%" },
      { label: "Defaulters Alerted", value: "23" },
    ],
    description: "M-Pesa payments, fee statements & receipts",
  },
  {
    label: "Academics & Gradebook",
    color: "#C79639",
    icon: "📊",
    stats: [
      { label: "Avg Score", value: "72.4%" },
      { label: "Reports Generated", value: "847" },
      { label: "CBC Compliant", value: "✓" },
    ],
    description: "Digital marking, CBC/8-4-4 grading & reports",
  },
  {
    label: "Transport Management",
    color: "#7C3AED",
    icon: "🚌",
    stats: [
      { label: "Active Routes", value: "12" },
      { label: "Students Tracked", value: "342" },
      { label: "On-time Rate", value: "98%" },
    ],
    description: "GPS tracking, routes & parent notifications",
  },
];

const audiencePills = [
  { label: "For Principals", href: "#features" },
  { label: "For School Owners", href: "#pricing" },
  { label: "For MoE / CBOs", href: "#modules" },
];

export default function Hero() {
  const [activeModule, setActiveModule] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveModule((prev) => (prev + 1) % heroModules.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const mod = heroModules[activeModule] ?? heroModules[0]!;

  return (
    <>
      <section
        id="hero"
        className="relative min-h-screen flex items-center overflow-hidden bg-off-white"
        aria-label="Hero section"
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(#1A395B 1px, transparent 1px),
              linear-gradient(90deg, #1A395B 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Gradient blobs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-navy/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Content */}
            <div>
              {/* Audience pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {audiencePills.map((pill) => (
                  <a
                    key={pill.label}
                    href={pill.href}
                    className="px-4 py-1.5 bg-white border border-light-grey rounded-full text-sm font-inter font-medium text-navy hover:border-gold hover:text-gold transition-colors shadow-sm"
                  >
                    {pill.label}
                  </a>
                ))}
              </div>

              {/* Headline */}
              <h1 className="font-jakarta font-extrabold text-5xl lg:text-[3.75rem] xl:text-[4.5rem] leading-[1.1] text-navy mb-6">
                The All-in-One School Management System{" "}
                <span className="text-gradient-gold">Built for East Africa</span>
              </h1>

              {/* Sub-headline */}
              <p className="font-inter text-lg lg:text-xl text-mid-grey leading-relaxed mb-8 max-w-xl">
                From student admissions to M-Pesa fee collection — EduMyles replaces 11 separate tools with one powerful platform.{" "}
                <strong className="text-navy font-semibold">500+ schools trust us.</strong>
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-6">
                <a
                  href="#demo"
                  className="bg-gold hover:bg-gold-dark text-white font-inter font-semibold text-base px-8 py-3.5 rounded-lg transition-all duration-200 hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] shadow-md"
                >
                  Book a Free Demo
                </a>
                <a
                  href={`${APP_URL}/auth/signup/api`}
                  className="border-2 border-navy text-navy hover:bg-navy hover:text-white font-inter font-semibold text-base px-8 py-3.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Free Trial
                </a>
              </div>

              {/* Ghost CTAs */}
              <div className="flex flex-wrap gap-4 mb-8">
                <a
                  href="/contact?subject=quote"
                  className="font-inter text-sm font-medium text-mid-grey hover:text-navy underline underline-offset-4 transition-colors"
                >
                  Request a Quote
                </a>
                <span className="text-light-grey">·</span>
                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  className="flex items-center gap-1.5 font-inter text-sm font-medium text-mid-grey hover:text-navy transition-colors"
                >
                  <Play size={14} className="text-gold" />
                  Watch a 2-min Demo
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className="text-gold fill-gold" />
                  ))}
                </div>
                <p className="font-inter text-sm text-mid-grey">
                  <strong className="text-navy font-semibold">Built for growing schools</strong> across East Africa
                </p>
              </div>
            </div>

            {/* Right — Dashboard mockup */}
            <div className="relative">
              <div className="bg-navy rounded-2xl shadow-2xl overflow-hidden border border-navy-light">
                {/* Mockup header */}
                <div className="bg-navy-dark px-4 py-3 flex items-center gap-2 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="font-inter text-xs text-white/50">edumyles.com</span>
                  </div>
                </div>

                {/* Module tabs */}
                <div className="flex border-b border-white/10 overflow-x-auto">
                  {heroModules.map((m, i) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setActiveModule(i)}
                      className={`flex-shrink-0 px-3 py-2 font-inter text-xs font-medium transition-colors ${
                        i === activeModule
                          ? "text-gold border-b-2 border-gold"
                          : "text-white/50 hover:text-white/80"
                      }`}
                    >
                      {m.icon} {m.label.split(" ")[0]}
                    </button>
                  ))}
                </div>

                {/* Module content */}
                <div className="p-5" key={activeModule}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{mod.icon}</span>
                    <div>
                      <h3 className="font-jakarta font-semibold text-sm text-white">{mod.label}</h3>
                      <p className="font-inter text-xs text-white/50">{mod.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {mod.stats.map((stat) => (
                      <div key={stat.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="font-jakarta font-bold text-lg text-white">{stat.value}</div>
                        <div className="font-inter text-xs text-white/50 mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between mb-1.5">
                      <span className="font-inter text-xs text-white/50">Module Performance</span>
                      <span className="font-inter text-xs text-gold font-medium">Excellent</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: "87%", backgroundColor: mod.color }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -left-6 top-1/3 bg-white rounded-xl shadow-lg p-3 border border-light-grey">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">✓</div>
                  <div>
                    <div className="font-jakarta font-semibold text-xs text-navy">Fee Received</div>
                    <div className="font-inter text-xs text-mid-grey">KSh 12,500 via M-Pesa</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 bottom-1/3 bg-white rounded-xl shadow-lg p-3 border border-light-grey">
                <div className="font-jakarta font-bold text-navy text-lg">94.2%</div>
                <div className="font-inter text-xs text-mid-grey">Attendance Today</div>
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="flex justify-center mt-16">
            <a href="#stats" className="flex flex-col items-center gap-2 text-mid-grey hover:text-navy transition-colors animate-bounce">
              <span className="font-inter text-xs">Explore platform</span>
              <ChevronDown size={20} />
            </a>
          </div>
        </div>
      </section>

      <DemoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </>
  );
}
