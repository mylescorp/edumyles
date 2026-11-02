import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Handshake, Zap, ShieldCheck, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Team — EduMyles",
  description:
    "Meet the people building EduMyles — the school management platform transforming education across East Africa.",
};

const founders = [
  {
    name: "Jonathan Myles",
    role: "Founder & Chief Executive Officer",
    bio: "A visionary software engineer and entrepreneur, Jonathan founded Mylesoft Technologies in 2020 with a mission to build AI-powered solutions addressing East Africa's most critical challenges. He leads the company's overall strategy, product development, and technology architecture across all 20+ MylesCorp products.",
    photo: "/team/jonathan-myles.jpeg",
    linkedin: "https://linkedin.com/in/mylesoft",
    location: "Nairobi, Kenya",
  },
  {
    name: "Pauline Moraa",
    role: "Co-Founder & Chief Operating Officer",
    bio: "Pauline brings operational excellence and business development expertise to MylesCorp. As COO, she drives the company's day-to-day operations, sales, marketing, and customer partnerships — ensuring every EduMyles school delivers measurable impact across East Africa.",
    photo: "/team/pauline-moraa.jpeg",
    linkedin: "#",
    location: "Nairobi, Kenya",
  },
];

const team = [
  {
    name: "Aisha Kamau",
    role: "Head of Product",
    bio: "Education technology leader with 8 years experience building software for East African schools. Aisha obsesses over every workflow, making sure EduMyles saves time rather than adding to it.",
    linkedin: "#",
    location: "Nairobi, Kenya",
  },
  {
    name: "David Ochieng",
    role: "Lead Engineer",
    bio: "Full-stack developer and systems architect. David built EduMyles' real-time data engine and M-Pesa integrations, and has made sure the platform handles thousands of students without breaking a sweat.",
    linkedin: "#",
    location: "Kisumu, Kenya",
  },
  {
    name: "Grace Wanjiku",
    role: "Customer Success Lead",
    bio: "Grace has onboarded over 40 schools onto EduMyles personally. She speaks the language of principals, bursars, and teachers — and makes sure every school goes live smoothly within two weeks.",
    linkedin: "#",
    location: "Nairobi, Kenya",
  },
  {
    name: "Samuel Tarus",
    role: "Sales & Partnerships",
    bio: "Samuel works with county education offices, NGOs, and school networks to expand EduMyles across Kenya, Uganda, and Tanzania. He knows every school type from CBC primary to IGCSE international.",
    linkedin: "#",
    location: "Eldoret, Kenya",
  },
  {
    name: "Fatuma Hassan",
    role: "Design Lead",
    bio: "Product designer with a background in educational UX. Fatuma ensures that teachers who are not tech-savvy can still use EduMyles confidently from day one — no training manual required.",
    linkedin: "#",
    location: "Mombasa, Kenya",
  },
];

const values: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Globe,
    title: "Built for Africa",
    desc: "Everything we build is designed for African schools — M-Pesa, CBC, UNEB, low-bandwidth environments, and local school culture.",
  },
  {
    icon: Handshake,
    title: "Schools First",
    desc: "We talk to principals and teachers every week. Product decisions come from real classrooms, not boardrooms.",
  },
  {
    icon: Zap,
    title: "Speed & Simplicity",
    desc: "If a feature takes more than 3 clicks, we rethink it. Schools are busy. EduMyles should save time, never add to it.",
  },
  {
    icon: ShieldCheck,
    title: "Trust & Reliability",
    desc: "Student data is sensitive. We hold ourselves to the highest standards of data privacy, uptime, and security.",
  },
];

export default function TeamPage() {
  return (
    <div style={{ color: "var(--foreground)" }}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden px-4 sm:px-8 py-20 sm:py-24"
        style={{
          background: "var(--card)",
          borderTop: "3px solid var(--primary)",
          minHeight: "420px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgb(var(--primary-rgb) / 4%) 25%,rgb(var(--primary-rgb) / 4%) 26%,transparent 27%,transparent 74%,rgb(var(--primary-rgb) / 4%) 75%,rgb(var(--primary-rgb) / 4%) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgb(var(--primary-rgb) / 4%) 25%,rgb(var(--primary-rgb) / 4%) 26%,transparent 27%,transparent 74%,rgb(var(--primary-rgb) / 4%) 75%,rgb(var(--primary-rgb) / 4%) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full">
          <div className="max-w-[700px]">
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
              style={{
                background: "rgb(var(--primary-rgb) / 12%)",
                border: "1px solid var(--accent-foreground)",
                color: "var(--accent-foreground)",
              }}
            >
              The Team
            </div>
            <h1
              className="font-display font-bold leading-[1.15] mb-5"
              style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "var(--foreground)" }}
            >
              People who{" "}
              <em className="italic" style={{ color: "var(--accent-foreground)" }}>
                believe in African education.
              </em>
            </h1>
            <p
              className="font-jakarta font-light leading-[1.8]"
              style={{ fontSize: "18px", color: "var(--muted-foreground)", maxWidth: "580px" }}
            >
              We are teachers, engineers, and school operators. We have lived the problem — and we
              are building the solution.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/book-demo" className="rounded-full bg-[var(--primary)] px-6 py-3 font-semibold text-[var(--primary-foreground)]">Book a Demo</Link>
              <Link href="/about" className="rounded-full border border-[var(--border)] bg-[var(--card)] px-6 py-3 font-semibold text-[var(--ink)]">Our Story</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Founders Featured ─────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8" style={{ background: "var(--card)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div
            className="inline-block font-jakarta font-semibold text-[13px] mb-3 px-4 py-1.5 rounded-[50px]"
            style={{
              background: "rgb(var(--primary-rgb) / 10%)",
              border: "1px solid var(--accent-foreground)",
              color: "var(--accent-foreground)",
            }}
          >
            Leadership
          </div>
          <h2
            className="font-display font-bold leading-[1.2] mb-10 sm:mb-12"
            style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "var(--foreground)" }}
          >
            The{" "}
            <em className="italic" style={{ color: "var(--accent-foreground)" }}>
              co-founders
            </em>
          </h2>

          <div className="grid sm:grid-cols-2 gap-8">
            {founders.map((founder) => (
              <div
                key={founder.name}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{
                  border: "1.5px solid var(--accent-foreground)",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                {/* Photo */}
                <div
                  className="flex items-center justify-center"
                  style={{ height: "160px", background: "var(--deep)" }}
                  aria-hidden="true"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full text-xl font-bold text-[var(--ondeephi)]" style={{ background: "rgba(255,255,255,.12)" }}>
                    {founder.name.split(" ").map((part) => part[0]).join("")}
                  </span>
                </div>

                <div className="flex flex-col gap-3 p-6 flex-1" style={{ background: "var(--card)" }}>
                  <div>
                    <h3 className="font-display font-bold text-[22px]" style={{ color: "var(--foreground)" }}>
                      {founder.name}
                    </h3>
                    <div
                      className="font-jakarta text-[12px] mt-0.5 flex items-center gap-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <MapPin className="w-3.5 h-3.5 inline" strokeWidth={1.5} />
                      {founder.location}
                    </div>
                  </div>
                  <p
                    className="font-jakarta text-[14px] leading-[1.75] flex-1"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {founder.bio}
                  </p>
                  <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                    <a
                      href={founder.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] no-underline transition-colors duration-200 hover:text-[var(--accent-foreground)]"
                      style={{ color: "var(--primary)" }}
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

      {/* ── Team Grid ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8" style={{ background: "var(--background)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div
            className="inline-block font-jakarta font-semibold text-[13px] mb-3 px-4 py-1.5 rounded-[50px]"
            style={{
              background: "rgb(var(--primary-rgb) / 10%)",
              border: "1px solid var(--primary)",
              color: "var(--primary)",
            }}
          >
            Core Team
          </div>
          <h2
            className="font-display font-bold leading-[1.2] mb-10 sm:mb-12"
            style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "var(--foreground)" }}
          >
            Meet the people{" "}
            <em className="italic" style={{ color: "var(--accent-foreground)" }}>
              behind EduMyles
            </em>
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-card rounded-2xl overflow-hidden flex flex-col"
                style={{
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                {/* Avatar */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, var(--platform-chrome) 0%, var(--primary) 100%)",
                    height: "180px",
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), var(--primary))",
                      color: "var(--accent-foreground)",
                    }}
                  >
                    {member.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-6 flex-1">
                  <div>
                    <h3 className="font-display font-bold text-[20px]" style={{ color: "var(--foreground)" }}>
                      {member.name}
                    </h3>
                    <div
                      className="font-jakarta font-semibold text-[13px] mt-1"
                      style={{ color: "var(--accent-foreground)" }}
                    >
                      {member.role}
                    </div>
                    <div
                      className="font-jakarta text-[12px] mt-0.5 flex items-center gap-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <MapPin className="w-3.5 h-3.5 inline" strokeWidth={1.5} />
                      {member.location}
                    </div>
                  </div>

                  <p
                    className="font-jakarta text-[14px] leading-[1.7] flex-1"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {member.bio}
                  </p>

                  <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] no-underline transition-colors duration-200 hover:text-[var(--accent-foreground)]"
                      style={{ color: "var(--primary)" }}
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
      <section className="py-16 sm:py-20 px-4 sm:px-8" style={{ background: "var(--card)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-3 px-4 py-1.5 rounded-[50px]"
              style={{
                background: "rgb(var(--primary-rgb) / 10%)",
                border: "1px solid var(--accent-foreground)",
                color: "var(--accent-foreground)",
              }}
            >
              How We Work
            </div>
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "var(--foreground)" }}
            >
              Our{" "}
              <em className="italic" style={{ color: "var(--accent-foreground)" }}>
                values
              </em>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl p-6 flex flex-col gap-4"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                }}
              >
                <v.icon className="w-10 h-10" strokeWidth={1.5} style={{ color: "var(--primary)" }} />
                <h3 className="font-display font-bold text-[18px]" style={{ color: "var(--foreground)" }}>
                  {v.title}
                </h3>
                <p className="font-jakarta text-[14px] leading-[1.7]" style={{ color: "var(--muted-foreground)" }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8" style={{ background: "var(--primary)" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-display font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", color: "var(--primary-foreground)" }}
          >
            Want to know more about{" "}
            <em className="italic" style={{ color: "var(--primary-foreground)" }}>
              what we&apos;re building?
            </em>
          </h2>
          <p className="font-jakarta text-[16px] leading-[1.7] mb-8" style={{ color: "var(--primary-foreground)", opacity: 0.84 }}>
            Book a demo, read our blog, or just say hello. We love talking to schools.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <a
              href="/book-demo"
              className="inline-flex items-center justify-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "var(--primary-foreground)", color: "var(--primary)" }}
            >
              Book a Demo →
            </a>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{
                background: "transparent",
                border: "2px solid rgb(var(--primary-foreground-rgb) / 45%)",
                color: "var(--primary-foreground)",
              }}
            >
              Our Story
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
