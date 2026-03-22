import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Team — EduMyles",
  description:
    "Meet the people building EduMyles — the school management platform transforming education across East Africa.",
};

const team = [
  {
    name: "Brian Myles",
    role: "Founder & CEO",
    bio: "Former secondary school teacher and software engineer. Brian founded EduMyles after spending years watching schools struggle with paper registers and scattered data. He's on a mission to give every African school the tools they deserve.",
    emoji: "👨🏿‍💻",
    linkedin: "https://linkedin.com/company/edumyles",
    location: "Nairobi, Kenya",
  },
  {
    name: "Aisha Kamau",
    role: "Head of Product",
    bio: "Education technology leader with 8 years experience building software for East African schools. Aisha obsesses over every workflow, making sure EduMyles saves time rather than adding to it.",
    emoji: "👩🏿‍💼",
    linkedin: "#",
    location: "Nairobi, Kenya",
  },
  {
    name: "David Ochieng",
    role: "Lead Engineer",
    bio: "Full-stack developer and systems architect. David built EduMyles' real-time data engine and M-Pesa integrations, and has made sure the platform handles thousands of students without breaking a sweat.",
    emoji: "👨🏿‍🔬",
    linkedin: "#",
    location: "Kisumu, Kenya",
  },
  {
    name: "Grace Wanjiku",
    role: "Customer Success Lead",
    bio: "Grace has onboarded over 40 schools onto EduMyles personally. She speaks the language of principals, bursars, and teachers — and makes sure every school goes live smoothly within two weeks.",
    emoji: "👩🏿‍🏫",
    linkedin: "#",
    location: "Nairobi, Kenya",
  },
  {
    name: "Samuel Tarus",
    role: "Sales & Partnerships",
    bio: "Samuel works with county education offices, NGOs, and school networks to expand EduMyles across Kenya, Uganda, and Tanzania. He knows every school type from CBC primary to IGCSE international.",
    emoji: "👨🏿‍💼",
    linkedin: "#",
    location: "Eldoret, Kenya",
  },
  {
    name: "Fatuma Hassan",
    role: "Design Lead",
    bio: "Product designer with a background in educational UX. Fatuma ensures that teachers who are not tech-savvy can still use EduMyles confidently from day one — no training manual required.",
    emoji: "👩🏿‍🎨",
    linkedin: "#",
    location: "Mombasa, Kenya",
  },
];

const values = [
  {
    icon: "🌍",
    title: "Built for Africa",
    desc: "Everything we build is designed for African schools — M-Pesa, CBC, UNEB, low-bandwidth environments, and local school culture.",
  },
  {
    icon: "🤝",
    title: "Schools First",
    desc: "We talk to principals and teachers every week. Product decisions come from real classrooms, not boardrooms.",
  },
  {
    icon: "⚡",
    title: "Speed & Simplicity",
    desc: "If a feature takes more than 3 clicks, we rethink it. Schools are busy. EduMyles should save time, never add to it.",
  },
  {
    icon: "🔒",
    title: "Trust & Reliability",
    desc: "Student data is sensitive. We hold ourselves to the highest standards of data privacy, uptime, and security.",
  },
];

const openRoles = [
  { title: "Senior Backend Engineer", type: "Full-time · Remote", href: "/contact?subject=careers-backend" },
  { title: "School Success Manager (Uganda)", type: "Full-time · Kampala", href: "/contact?subject=careers-uganda" },
  { title: "Marketing & Content Lead", type: "Full-time · Nairobi", href: "/contact?subject=careers-marketing" },
];

export default function TeamPage() {
  return (
    <div style={{ color: "#212121" }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden px-4 sm:px-8 py-20 sm:py-24"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          minHeight: "420px",
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
              The Team
            </div>
            <h1
              className="font-playfair font-bold leading-[1.15] mb-5"
              style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
            >
              People who{" "}
              <em className="italic" style={{ color: "#E8A020" }}>believe in African education.</em>
            </h1>
            <p
              className="font-jakarta font-light leading-[1.8]"
              style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "580px" }}
            >
              We are teachers, engineers, and school operators. We have lived the problem — and we are building the solution.
            </p>
          </div>
        </div>
      </section>

      {/* ── Team Grid ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div
            className="inline-block font-jakarta font-semibold text-[13px] mb-3 px-4 py-1.5 rounded-[50px]"
            style={{ background: "rgba(26,122,74,0.1)", border: "1px solid #1A7A4A", color: "#1A7A4A" }}
          >
            Core Team
          </div>
          <h2
            className="font-playfair font-bold leading-[1.2] mb-10 sm:mb-12"
            style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
          >
            Meet the people{" "}
            <em className="italic" style={{ color: "#E8A020" }}>behind EduMyles</em>
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl overflow-hidden flex flex-col"
                style={{
                  border: "1px solid #e8f4ec",
                  boxShadow: "0 2px 16px rgba(6,26,18,0.06)",
                }}
              >
                {/* Avatar */}
                <div
                  className="flex items-center justify-center text-[64px]"
                  style={{
                    background: "linear-gradient(135deg, #061A12 0%, #0F4C2A 100%)",
                    height: "180px",
                  }}
                >
                  {member.emoji}
                </div>

                <div className="flex flex-col gap-3 p-6 flex-1">
                  <div>
                    <h3 className="font-playfair font-bold text-[20px]" style={{ color: "#061A12" }}>
                      {member.name}
                    </h3>
                    <div className="font-jakarta font-semibold text-[13px] mt-1" style={{ color: "#E8A020" }}>
                      {member.role}
                    </div>
                    <div className="font-jakarta text-[12px] mt-0.5" style={{ color: "#6B9E83" }}>
                      📍 {member.location}
                    </div>
                  </div>

                  <p className="font-jakarta text-[14px] leading-[1.7] flex-1" style={{ color: "#5a5a5a" }}>
                    {member.bio}
                  </p>

                  <div className="pt-4 border-t" style={{ borderColor: "#f0f0f0" }}>
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] no-underline transition-colors duration-200 hover:text-[#E8A020]"
                      style={{ color: "#1A7A4A" }}
                    >
                      <span
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                        style={{ background: "#0A66C2" }}
                      >
                        in
                      </span>
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-3 px-4 py-1.5 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.1)", border: "1px solid #E8A020", color: "#E8A020" }}
            >
              How We Work
            </div>
            <h2
              className="font-playfair font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
            >
              Our <em className="italic" style={{ color: "#E8A020" }}>values</em>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl p-6 flex flex-col gap-4"
                style={{
                  background: "#F3FBF6",
                  border: "1px solid #d4eade",
                }}
              >
                <div className="text-[40px]">{v.icon}</div>
                <h3 className="font-playfair font-bold text-[18px]" style={{ color: "#061A12" }}>
                  {v.title}
                </h3>
                <p className="font-jakarta text-[14px] leading-[1.7]" style={{ color: "#5a5a5a" }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open Roles ────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8" style={{ background: "#061A12" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            <div>
              <div
                className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-4 py-1.5 rounded-[50px]"
                style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}
              >
                Careers
              </div>
              <h2
                className="font-playfair font-bold leading-[1.2] mb-4"
                style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
              >
                Join us in{" "}
                <em className="italic" style={{ color: "#E8A020" }}>transforming schools</em>
              </h2>
              <p className="font-jakarta text-[16px] leading-[1.8] mb-6" style={{ color: "#A8E6C3" }}>
                We are a small, high-impact team that moves fast and cares deeply. We offer competitive pay, remote flexibility, and the chance to build something that genuinely matters.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  "Competitive salary in KES / USD",
                  "Remote-first with optional Nairobi office",
                  "Health insurance",
                  "Learning & development budget",
                  "Work that reaches thousands of students",
                ].map((perk) => (
                  <div key={perk} className="flex items-center gap-3">
                    <span className="font-bold flex-shrink-0" style={{ color: "#26A65B" }}>✓</span>
                    <span className="font-jakarta text-[14px]" style={{ color: "rgba(255,255,255,0.8)" }}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="font-jakarta font-bold text-[16px] mb-2" style={{ color: "#6B9E83" }}>
                OPEN ROLES
              </h3>
              {openRoles.map((role) => (
                <a
                  key={role.title}
                  href={role.href}
                  className="flex items-center justify-between gap-4 p-5 rounded-2xl no-underline group transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(232,160,32,0.2)",
                  }}
                >
                  <div>
                    <div className="font-jakarta font-bold text-[16px] group-hover:text-[#E8A020] transition-colors" style={{ color: "#ffffff" }}>
                      {role.title}
                    </div>
                    <div className="font-jakarta text-[13px] mt-0.5" style={{ color: "#6B9E83" }}>
                      {role.type}
                    </div>
                  </div>
                  <span className="text-[20px] flex-shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: "#E8A020" }}>
                    →
                  </span>
                </a>
              ))}

              <p className="font-jakarta text-[13px] mt-2" style={{ color: "#6B9E83" }}>
                Don&apos;t see your role?{" "}
                <a href="/contact?subject=careers-general" className="underline" style={{ color: "#E8A020" }}>
                  Send us an open application →
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8" style={{ background: "#0F4C2A" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-playfair font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", color: "#ffffff" }}
          >
            Want to know more about{" "}
            <em className="italic" style={{ color: "#E8A020" }}>what we're building?</em>
          </h2>
          <p className="font-jakarta text-[16px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Book a demo, read our blog, or just say hello. We love talking to schools.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <a
              href="https://wa.me/254743993715"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Book a Demo →
            </a>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              Our Story
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
