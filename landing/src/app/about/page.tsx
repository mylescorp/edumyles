import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About EduMyles — School Management for African Schools",
  description:
    "Learn about EduMyles — our mission, story, and the team building the leading school management platform for East African schools.",
};

const values = [
  {
    icon: "🌍",
    title: "Africa-First",
    desc: "Built for the realities of East African schools — M-Pesa payments, CBC curriculum, NEMIS integration, and infrastructure constraints. Not an import. Native.",
  },
  {
    icon: "⚡",
    title: "Speed Matters",
    desc: "We obsess over performance. Every second of load time is a second a teacher isn't teaching. EduMyles is built to be fast on any connection.",
  },
  {
    icon: "🔐",
    title: "Trust First",
    desc: "Student data is sensitive. We use enterprise-grade encryption, strict data isolation per school, and role-based access control that never compromises security.",
  },
  {
    icon: "🤝",
    title: "Schools Win",
    desc: "We price fairly, support generously, and don't lock schools into long contracts. If EduMyles doesn't work for you, we refund. Simple.",
  },
  {
    icon: "📈",
    title: "Continuous Improvement",
    desc: "We ship updates every week based on feedback from real schools. Your feature request doesn't go into a black hole — it gets built.",
  },
  {
    icon: "♿",
    title: "Inclusive by Design",
    desc: "Accessible to all staff regardless of tech experience. If a teacher can use a smartphone, they can use EduMyles — no training manual needed.",
  },
];

const milestones = [
  {
    year: "2022",
    title: "Founded in Nairobi",
    desc: "EduMyles was founded after seeing a principal manage a 1,200-student school entirely on WhatsApp groups and paper registers.",
  },
  {
    year: "2023",
    title: "First 10 schools",
    desc: "Launched our beta with 10 schools in Nairobi County. Collected 600+ feedback sessions. Rebuilt 40% of the platform based on what we learned.",
  },
  {
    year: "2024",
    title: "M-Pesa Integration & Regional Expansion",
    desc: "Integrated M-Pesa Daraja for fee collection. Expanded to Uganda and Tanzania. Crossed 5,000 students on the platform.",
  },
  {
    year: "2025",
    title: "50+ Schools, 5 Countries",
    desc: "Reached 50+ schools across Kenya, Uganda, Tanzania, Rwanda, and Zambia. Launched all 11 modules. Processed over KES 120M in school fees.",
  },
  {
    year: "2026",
    title: "Platform Rebuild & Scale",
    desc: "Rebuilt on a real-time architecture. Launched parent portal, teacher portal, and student portal. Now serving 10,000+ students daily.",
  },
];

const stats = [
  { value: "50+", label: "Schools" },
  { value: "10,000+", label: "Students" },
  { value: "5", label: "Countries" },
  { value: "KES 120M+", label: "Fees Processed" },
  { value: "11", label: "Modules" },
  { value: "99.9%", label: "Uptime" },
];

const team = [
  {
    name: "Ayany",
    role: "Founder & CEO",
    bio: "Former school IT coordinator. Frustrated by the gap between what schools needed and what was available. Built EduMyles to fix it.",
    emoji: "👨‍💻",
  },
  {
    name: "Product Team",
    role: "Design & Engineering",
    bio: "A distributed team of engineers and designers across Nairobi and Kampala, obsessed with building software that works for real African schools.",
    emoji: "⚙️",
  },
  {
    name: "Customer Success",
    role: "School Partnerships",
    bio: "Former teachers and school administrators who understand the daily realities of running a school. They're your first call for anything.",
    emoji: "🎓",
  },
];

export default function AboutPage() {
  return (
    <div style={{ color: "#212121" }}>

      {/* ── Hero ─────────────────────────────────────────── */}
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
          <div className="max-w-[700px]">
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}
            >
              Our Story
            </div>
            <h1
              className="font-playfair font-bold leading-[1.15] mb-5"
              style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
            >
              Built for Africa&apos;s schools.{" "}
              <em className="italic" style={{ color: "#E8A020" }}>By people who get it.</em>
            </h1>
            <p
              className="font-jakarta font-light leading-[1.8]"
              style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "580px" }}
            >
              EduMyles started with one observation: schools across East Africa were running on WhatsApp groups, paper registers, and disconnected Excel sheets. We built the platform we wished existed.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="py-14 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {stats.map((s) => (
              <div key={s.label} className="text-center p-5 rounded-2xl" style={{ background: "#ffffff", border: "1px solid #e8f4ec" }}>
                <div
                  className="font-playfair font-bold text-[28px] mb-1"
                  style={{ color: "#E8A020" }}
                >
                  {s.value}
                </div>
                <div className="font-jakarta text-[12px] font-medium uppercase tracking-wider" style={{ color: "#6B9E83" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-5 px-4 py-2 rounded-[50px]"
                style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
              >
                Our Mission
              </div>
              <h2
                className="font-playfair font-bold leading-[1.2] mb-5"
                style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
              >
                Empower every school in Africa with{" "}
                <em className="italic" style={{ color: "#E8A020" }}>world-class tools.</em>
              </h2>
              <p className="font-jakarta text-[16px] leading-[1.8] mb-4" style={{ color: "#5a5a5a" }}>
                We believe that a school in Nakuru deserves the same administrative efficiency as a school in London. Technology should equalise access to quality education infrastructure — not price it out of reach.
              </p>
              <p className="font-jakarta text-[16px] leading-[1.8]" style={{ color: "#5a5a5a" }}>
                EduMyles is priced for African schools, designed for African school staff, and integrated with African payment systems. It&apos;s not an adaptation — it&apos;s the original.
              </p>
            </div>
            <div
              className="rounded-2xl p-8"
              style={{
                background: "linear-gradient(135deg, #061A12 0%, #0F4C2A 100%)",
                boxShadow: "0 20px 60px rgba(6,26,18,0.25)",
              }}
            >
              <blockquote
                className="font-playfair italic text-[22px] leading-[1.6] mb-6"
                style={{ color: "#ffffff" }}
              >
                &ldquo;The best school management system in Africa shouldn&apos;t cost more than a teacher&apos;s salary. It shouldn&apos;t require a dedicated IT team. It should just work.&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-playfair font-bold"
                  style={{ background: "#E8A020", color: "#061A12" }}
                >
                  A
                </div>
                <div>
                  <div className="font-jakarta font-bold text-[14px]" style={{ color: "#E8A020" }}>Ayany</div>
                  <div className="font-jakarta text-[12px]" style={{ color: "#6B9E83" }}>Founder, EduMyles</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Journey ───────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#0C3020" }}>
        <div className="max-w-[860px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.12)", border: "1px solid rgba(232,160,32,0.3)", color: "#E8A020" }}
            >
              Our Journey
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
            >
              From a WhatsApp group{" "}
              <em className="italic" style={{ color: "#E8A020" }}>to 10,000+ students.</em>
            </h2>
          </div>
          <div className="flex flex-col gap-0">
            {milestones.map((m, i) => (
              <div key={m.year} className="flex gap-6">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0"
                    style={{ background: "#E8A020", color: "#061A12" }}
                  >
                    {m.year.slice(2)}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-0.5 flex-1 my-2" style={{ background: "rgba(232,160,32,0.2)", minHeight: "32px" }} />
                  )}
                </div>
                {/* Content */}
                <div className="pb-8">
                  <div className="font-jakarta font-bold text-[12px] mb-1" style={{ color: "#E8A020" }}>{m.year}</div>
                  <h3 className="font-playfair font-bold text-[18px] mb-2" style={{ color: "#ffffff" }}>{m.title}</h3>
                  <p className="font-jakarta text-[14px] leading-[1.7]" style={{ color: "#A8E6C3" }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-4 px-4 py-2 rounded-[50px]"
              style={{ background: "rgba(38,166,91,0.1)", color: "#0F4C2A" }}
            >
              What We Believe
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Our <em className="italic" style={{ color: "#E8A020" }}>values</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl p-6"
                style={{ background: "#ffffff", border: "1px solid rgba(38,166,91,0.15)", boxShadow: "0 2px 12px rgba(6,26,18,0.05)" }}
              >
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-playfair font-bold text-[18px] mb-2" style={{ color: "#061A12" }}>{v.title}</h3>
                <p className="font-jakarta text-[14px] leading-[1.7]" style={{ color: "#5a5a5a" }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              The <em className="italic" style={{ color: "#E8A020" }}>team</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {team.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-7 text-center"
                style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                  style={{ background: "rgba(38,166,91,0.1)" }}
                >
                  {t.emoji}
                </div>
                <h3 className="font-playfair font-bold text-[20px] mb-1" style={{ color: "#061A12" }}>{t.name}</h3>
                <div className="font-jakarta text-[13px] font-medium mb-3" style={{ color: "#E8A020" }}>{t.role}</div>
                <p className="font-jakarta text-[14px] leading-[1.7]" style={{ color: "#5a5a5a" }}>{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#0F4C2A" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-playfair font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3.5vw,3rem)", color: "#ffffff" }}
          >
            Join the schools{" "}
            <em className="italic" style={{ color: "#E8A020" }}>already running better.</em>
          </h2>
          <p className="font-jakarta text-[17px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Start your free 30-day trial or talk to our team. No pressure, no obligation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/auth/signup/api"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial →
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              Talk to Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
