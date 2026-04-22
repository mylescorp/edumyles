import type { Metadata } from "next";
import Link from "next/link";
import {
  Globe,
  Monitor,
  TrendingUp,
  Brain,
  Zap,
  Heart,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Careers — EduMyles | Join Our Team",
  description:
    "Join the EduMyles team. We're building Africa's leading school management platform. Remote-first, mission-driven, equity + benefits.",
};

const cultureCards = [
  {
    icon: Globe,
    title: "Real Impact",
    body: "Every line of code helps a teacher save hours and a parent stay informed. Our users feel it every day.",
  },
  {
    icon: Monitor,
    title: "Remote-first",
    body: "Work from anywhere in Africa (or beyond). We judge by output, not office attendance.",
  },
  {
    icon: TrendingUp,
    title: "Equity & Growth",
    body: "Early-stage equity, competitive salaries benchmarked to Nairobi market, and an annual learning budget.",
  },
  {
    icon: Brain,
    title: "Smart Team",
    body: "Work alongside people obsessed with education, product craft, and engineering excellence.",
  },
  {
    icon: Zap,
    title: "Move Fast",
    body: "No bureaucracy. Ship weekly. Your features go live to 10,000+ students in days.",
  },
  {
    icon: Heart,
    title: "Mission-first",
    body: "We turned down VC pressure to keep pricing affordable for African schools. Integrity matters here.",
  },
];

const roles = [
  {
    title: "Full-Stack Engineer (Next.js / Node)",
    dept: "Engineering",
    location: "Remote (East Africa)",
    type: "Full-time",
    desc: "Build and ship features across our Next.js frontend and Node/Prisma backend. Own entire features end-to-end.",
    skills: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "REST APIs"],
    deptColor: "#dcfce7",
    deptText: "#166534",
  },
  {
    title: "Mobile Engineer (React Native)",
    dept: "Engineering",
    location: "Remote",
    type: "Full-time",
    desc: "Build our cross-platform mobile app used by parents and teachers across 5 countries.",
    skills: ["React Native", "Expo", "TypeScript", "Push Notifications"],
    deptColor: "#dcfce7",
    deptText: "#166534",
  },
  {
    title: "Product Designer (UI/UX)",
    dept: "Product",
    location: "Remote",
    type: "Full-time",
    desc: "Own the EduMyles design system. Research, prototype, and ship beautiful, accessible interfaces for African schools.",
    skills: ["Figma", "User Research", "Design Systems", "Prototyping"],
    deptColor: "#dbeafe",
    deptText: "#1e40af",
  },
  {
    title: "Growth Marketing Manager",
    dept: "Growth",
    location: "Nairobi (hybrid)",
    type: "Full-time",
    desc: "Own our inbound funnel — SEO, content, social, and school outreach across East Africa.",
    skills: ["SEO", "Content Marketing", "Social Media", "Analytics"],
    deptColor: "#fef9c3",
    deptText: "#854d0e",
  },
  {
    title: "School Success Manager",
    dept: "Operations",
    location: "Nairobi",
    type: "Full-time",
    desc: "Onboard new schools, drive adoption, and ensure every school gets maximum value from EduMyles.",
    skills: ["Customer Success", "Training", "CRM", "Swahili"],
    deptColor: "#e0f2fe",
    deptText: "#075985",
  },
  {
    title: "DevOps / Platform Engineer",
    dept: "Engineering",
    location: "Remote",
    type: "Contract → Full-time",
    desc: "Own our Vercel/AWS infrastructure, CI/CD pipelines, and observability stack.",
    skills: ["AWS", "Docker", "GitHub Actions", "Monitoring"],
    deptColor: "#dcfce7",
    deptText: "#166534",
  },
];

const steps = [
  {
    num: "01",
    title: "Apply",
    detail: "Send your CV and a short note on why EduMyles. No cover letter essays.",
  },
  {
    num: "02",
    title: "Intro Call",
    detail: "30-minute chat with a team member. We want to know you as a person first.",
  },
  {
    num: "03",
    title: "Paid Task",
    detail: "A small, paid take-home task relevant to the role. Max 3 hours. We respect your time.",
  },
  {
    num: "04",
    title: "Team Interview",
    detail: "Meet 2–3 team members. No whiteboard puzzles — just real conversation.",
  },
];

export default function CareersPage() {
  return (
    <div style={{ color: "#212121" }}>
      {/* ── Hero ── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "6rem 2rem 5rem",
          minHeight: "480px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full">
          <div className="max-w-[760px]">
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
              style={{
                background: "rgba(232,160,32,0.12)",
                border: "1px solid #E8A020",
                color: "#E8A020",
              }}
            >
              Join Our Team
            </div>
            <h1
              className="font-display font-bold leading-[1.1] mb-5"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)", color: "#ffffff" }}
            >
              Build the future of{" "}
              <em className="italic" style={{ color: "#E8A020" }}>
                African education.
              </em>
            </h1>
            <p
              className="font-jakarta font-light leading-[1.8] mb-8"
              style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "600px" }}
            >
              We&apos;re a small, mission-driven team building software that transforms how schools
              across East Africa operate. If you care about education and love building great
              products, you&apos;ll fit right in.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["Remote-first", "Mission-driven", "Equity + benefits", "Move fast"].map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center font-jakarta font-medium text-[13px] px-4 py-2 rounded-[50px]"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#E8E8E8",
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
            <a
              href="#roles"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-7 py-4 rounded-[50px] no-underline transition-all duration-200"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              View Open Roles
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Why EduMyles ── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              Our Culture
            </div>
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.75rem)", color: "#061A12" }}
            >
              Why work at{" "}
              <em className="italic" style={{ color: "#E8A020" }}>
                EduMyles?
              </em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cultureCards.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl p-7 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e8f4ec",
                  boxShadow: "0 2px 12px rgba(6,26,18,0.05)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-5"
                  style={{
                    background: "rgba(26,122,74,0.08)",
                    border: "1px solid rgba(26,122,74,0.12)",
                  }}
                >
                  <c.icon className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
                </div>
                <h3
                  className="font-display font-bold text-[18px] mb-2"
                  style={{ color: "#061A12" }}
                >
                  {c.title}
                </h3>
                <p
                  className="font-jakarta text-[13.5px] leading-[1.8]"
                  style={{ color: "#5a5a5a" }}
                >
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open Roles ── */}
      <section id="roles" className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              We&apos;re Hiring
            </div>
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.75rem)", color: "#061A12" }}
            >
              Open{" "}
              <em className="italic" style={{ color: "#E8A020" }}>
                Roles
              </em>
            </h2>
            <p className="font-jakarta text-[15px] mt-3" style={{ color: "#5a5a5a" }}>
              All roles are remote-friendly unless stated otherwise.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {roles.map((role) => (
              <div
                key={role.title}
                className="rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e8f4ec",
                  boxShadow: "0 2px 8px rgba(6,26,18,0.04)",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3
                        className="font-display font-bold text-[19px]"
                        style={{ color: "#061A12" }}
                      >
                        {role.title}
                      </h3>
                      <span
                        className="font-jakarta font-semibold text-[11px] px-3 py-1 rounded-full"
                        style={{ background: role.deptColor, color: role.deptText }}
                      >
                        {role.dept}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mb-4">
                      <span
                        className="inline-flex items-center gap-1.5 font-jakarta text-[12.5px]"
                        style={{ color: "#6B9E83" }}
                      >
                        <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {role.location}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 font-jakarta text-[12.5px]"
                        style={{ color: "#6B9E83" }}
                      >
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {role.type}
                      </span>
                    </div>
                    <p
                      className="font-jakarta text-[14px] leading-[1.8] mb-4"
                      style={{ color: "#5a5a5a" }}
                    >
                      {role.desc}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {role.skills.map((s) => (
                        <span
                          key={s}
                          className="font-jakarta text-[11.5px] font-medium px-3 py-1 rounded-full"
                          style={{
                            background: "#F3FBF6",
                            color: "#0F4C2A",
                            border: "1px solid #d4eade",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href="/contact?subject=careers"
                    className="inline-flex items-center gap-2 font-jakarta font-bold text-[13px] px-5 py-3 rounded-[50px] no-underline whitespace-nowrap flex-shrink-0 transition-all duration-200 self-start"
                    style={{
                      background: "#061A12",
                      color: "#ffffff",
                      border: "1.5px solid #061A12",
                    }}
                    onMouseEnter={undefined}
                  >
                    Apply Now
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hiring Process ── */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              Simple Process
            </div>
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.75rem)", color: "#061A12" }}
            >
              Our Hiring{" "}
              <em className="italic" style={{ color: "#E8A020" }}>
                Process
              </em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-2xl p-7 text-center"
                style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-[18px] mx-auto mb-5"
                  style={{ background: "#E8A020", color: "#061A12" }}
                >
                  {step.num}
                </div>
                <h3
                  className="font-display font-bold text-[17px] mb-2"
                  style={{ color: "#061A12" }}
                >
                  {step.title}
                </h3>
                <p className="font-jakarta text-[13px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits strip ── */}
      <section className="py-14 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1000px] mx-auto">
          <h3
            className="font-display font-bold text-center text-[22px] mb-10"
            style={{ color: "#061A12" }}
          >
            Perks &amp; Benefits
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Competitive salary (Nairobi benchmarked)",
              "Early-stage equity options",
              "Annual learning & conference budget",
              "Home office setup allowance",
              "Flexible working hours",
              "Health insurance (for full-time)",
              "30 days annual leave",
              "Paid parental leave",
              "Monthly team virtual socials",
            ].map((b) => (
              <div key={b} className="flex items-start gap-3">
                <CheckCircle2
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  strokeWidth={2}
                  style={{ color: "#1A7A4A" }}
                />
                <span className="font-jakarta text-[13.5px]" style={{ color: "#374151" }}>
                  {b}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4" style={{ background: "#061A12" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-display font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", color: "#ffffff" }}
          >
            Don&apos;t see your role?{" "}
            <em className="italic" style={{ color: "#E8A020" }}>
              We still want to hear from you.
            </em>
          </h2>
          <p className="font-jakarta text-[16px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            We&apos;re always looking for exceptional people. Send us your CV and tell us how
            you&apos;d contribute to EduMyles.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact?subject=open-application"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Send Open Application →
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{
                background: "transparent",
                border: "2px solid rgba(255,255,255,0.3)",
                color: "#ffffff",
              }}
            >
              Learn About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
