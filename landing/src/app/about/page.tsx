import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About EduMyles — School Management for African Schools",
  description:
    "Learn about EduMyles — our mission, story, and the team building the leading school management platform for East African schools.",
};

const values = [
  {
    letter: "M",
    title: "Mastery",
    desc: "Relentless pursuit of excellence, expertise, and continuous improvement — committing to the highest standards in every feature we ship.",
    keywords: ["Excellence", "Expertise", "Growth"],
  },
  {
    letter: "Y",
    title: "Youth Empowerment",
    desc: "A profound belief in Africa's youth. Investing in the next generation through education, mentorship, and technology that unlocks their potential.",
    keywords: ["Education", "Mentorship", "Africa"],
  },
  {
    letter: "L",
    title: "Leadership",
    desc: "Leading with integrity, courage, and responsibility — setting a positive example and holding ourselves accountable to every school we serve.",
    keywords: ["Integrity", "Courage", "Accountability"],
  },
  {
    letter: "E",
    title: "Entrepreneurship",
    desc: "Fostering innovation, ownership, and proactive problem-solving — taking calculated risks and identifying new opportunities to create real value.",
    keywords: ["Innovation", "Ownership", "Growth"],
  },
  {
    letter: "S",
    title: "Service",
    desc: "Purpose-driven commitment to positive societal impact. Our business success is always shared with Africa's people and communities.",
    keywords: ["Impact", "Community", "Purpose"],
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
    name: "Jonathan Myles",
    role: "Founder & CEO",
    bio: "A visionary software engineer and entrepreneur, Jonathan founded Mylesoft Technologies in 2020. He leads strategy, product development, and technology architecture across all 20+ MylesCorp products.",
    photo: "/team/jonathan-myles.jpeg",
  },
  {
    name: "Pauline Moraa",
    role: "Co-Founder & COO",
    bio: "Pauline drives day-to-day operations, sales, marketing, and customer partnerships — ensuring every EduMyles school delivers measurable impact across East Africa.",
    photo: "/team/pauline-moraa.jpeg",
  },
  {
    name: "Engineering & Design",
    role: "Product Team",
    bio: "A distributed team of engineers and designers across Nairobi and Kampala, obsessed with building software that works for real African schools.",
    emoji: "⚙️",
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
                Simplify school administration so educators can{" "}
                <em className="italic" style={{ color: "#E8A020" }}>focus on teaching.</em>
              </h2>
              <p className="font-jakarta text-[16px] leading-[1.8] mb-4" style={{ color: "#5a5a5a" }}>
                EduMyles exists to take the administrative burden off African schools — so that principals can lead, teachers can teach, and parents can stay informed. We believe that operational clarity unlocks academic excellence.
              </p>
              <p className="font-jakarta text-[16px] leading-[1.8] mb-4" style={{ color: "#5a5a5a" }}>
                <strong style={{ color: "#061A12" }}>Our Vision:</strong> To be Africa&apos;s most trusted school management platform, powering institutions of every size — from single-classroom community schools to multi-campus international networks.
              </p>
              <p className="font-jakarta text-[14px] leading-[1.8]" style={{ color: "#6B9E83" }}>
                EduMyles is a product of{" "}
                <a
                  href="https://mylesoft.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0F4C2A", fontWeight: 600, textDecoration: "none" }}
                >
                  MylesCorp Technologies Ltd
                </a>
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
                  className="w-10 h-10 rounded-full flex items-center justify-center font-playfair font-bold text-[12px]"
                  style={{ background: "#E8A020", color: "#061A12" }}
                >
                  JM
                </div>
                <div>
                  <div className="font-jakarta font-bold text-[14px]" style={{ color: "#E8A020" }}>Jonathan Myles</div>
                  <div className="font-jakarta text-[12px]" style={{ color: "#6B9E83" }}>CEO &amp; Founder, EduMyles</div>
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
              Our Core <em className="italic" style={{ color: "#E8A020" }}>Values</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl p-6 flex flex-col items-center text-center"
                style={{ background: "#ffffff", border: "1px solid rgba(38,166,91,0.15)", boxShadow: "0 2px 12px rgba(6,26,18,0.05)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-playfair font-bold text-[18px] mb-3"
                  style={{ background: "#E8A020", color: "#061A12" }}
                >
                  {v.letter}
                </div>
                <h3 className="font-playfair font-bold text-[18px] mb-2" style={{ color: "#061A12" }}>{v.title}</h3>
                <p className="font-jakarta text-[14px] leading-[1.7] mb-3" style={{ color: "#5a5a5a" }}>{v.desc}</p>
                <div className="flex flex-wrap justify-center gap-1 mt-auto">
                  {v.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="font-jakarta font-semibold text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(232,160,32,0.1)", border: "1px solid rgba(232,160,32,0.25)", color: "#9A5D00" }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
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
                className="rounded-2xl overflow-hidden text-center"
                style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
              >
                {/* Photo or emoji avatar */}
                {"photo" in t && t.photo ? (
                  <div className="relative w-full" style={{ height: "220px" }}>
                    <Image
                      src={t.photo as string}
                      alt={t.name}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full flex items-center justify-center text-4xl"
                    style={{ height: "120px", background: "rgba(38,166,91,0.1)" }}
                  >
                    {"emoji" in t ? t.emoji : ""}
                  </div>
                )}
                <div className="p-6">
                  <h3 className="font-playfair font-bold text-[20px] mb-1" style={{ color: "#061A12" }}>{t.name}</h3>
                  <div className="font-jakarta text-[13px] font-medium mb-3" style={{ color: "#E8A020" }}>{t.role}</div>
                  <p className="font-jakarta text-[14px] leading-[1.7]" style={{ color: "#5a5a5a" }}>{t.bio}</p>
                </div>
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
