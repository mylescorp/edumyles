import type { Metadata } from "next";
import Link from "next/link";
import { School, GraduationCap, Globe, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Customers — EduMyles School Management | 50+ Schools Across East Africa",
  description:
    "50+ schools across Kenya, Uganda, Tanzania, Rwanda, and Zambia trust EduMyles to manage students, fees, and staff. See who's using EduMyles today.",
};

const stats = [
  { value: "KES 120M+", label: "Fees Processed" },
  { value: "94%", label: "Avg Attendance Improvement" },
  { value: "15 hrs/week", label: "Saved per Admin" },
  { value: "2 weeks", label: "Average Onboarding" },
];

const schools = [
  { name: "Nairobi Green Academy", initials: "NG", flag: "🇰🇪" },
  { name: "St. Mary's Girls High", initials: "SM", flag: "🇰🇪" },
  { name: "Brookside Prep", initials: "BP", flag: "🇰🇪" },
  { name: "Upperhill School", initials: "US", flag: "🇰🇪" },
  { name: "Strathmore School", initials: "SS", flag: "🇰🇪" },
  { name: "St. Francis Kisumu", initials: "SF", flag: "🇰🇪" },
  { name: "Hillcrest School", initials: "HS", flag: "🇰🇪" },
  { name: "Starehe Girls Centre", initials: "SG", flag: "🇰🇪" },
  { name: "Alliance High School", initials: "AH", flag: "🇰🇪" },
  { name: "Kenya High School", initials: "KH", flag: "🇰🇪" },
  { name: "Aga Khan Academy", initials: "AK", flag: "🇰🇪" },
  { name: "Braeburn School", initials: "BS", flag: "🇰🇪" },
  { name: "Westlands Academy", initials: "WA", flag: "🇰🇪" },
  { name: "Kampala Parents School", initials: "KP", flag: "🇺🇬" },
  { name: "St. Mary's College Kisubi", initials: "MK", flag: "🇺🇬" },
  { name: "Gayaza High School", initials: "GH", flag: "🇺🇬" },
  { name: "International School Dar", initials: "IS", flag: "🇹🇿" },
  { name: "Green Hills Academy", initials: "GHA", flag: "🇷🇼" },
  { name: "Riviera High Lusaka", initials: "RL", flag: "🇿🇲" },
  { name: "Ibex Hill School", initials: "IH", flag: "🇿🇲" },
];

const countryFilters = [
  { flag: "🇰🇪", label: "Kenya", count: 42 },
  { flag: "🇺🇬", label: "Uganda", count: 4 },
  { flag: "🇹🇿", label: "Tanzania", count: 2 },
  { flag: "🇷🇼", label: "Rwanda", count: 1 },
  { flag: "🇿🇲", label: "Zambia", count: 2 },
];

const testimonials = [
  {
    featured: true,
    quote:
      "Before EduMyles, I spent every Monday morning reconciling fee payments by hand. Now the system sends automatic M-Pesa alerts and I have perfect records from day one. It's transformed how we work.",
    name: "Mary Wanjiku Kamau",
    role: "Principal, Nairobi Green Academy",
    initials: "MK",
  },
  {
    featured: false,
    quote:
      "CBC reporting used to mean three teachers working all weekend. Now our gradebook auto-generates every report with the correct competency scores. We went from 3 days to 3 hours.",
    name: "James Oduya",
    role: "Deputy Principal, St. Francis High Kisumu",
    initials: "JO",
  },
  {
    featured: false,
    quote:
      "What impressed us most was the parent portal adoption rate. Within two weeks, 98% of our parents were checking attendance and fees online. That's never happened with any system before.",
    name: "Catherine Njoroge",
    role: "Head of Administration, Brookside Prep",
    initials: "CN",
  },
];

const schoolTypes = [
  {
    Icon: School,
    count: 22,
    type: "Primary Schools",
    features: ["CBC curriculum ready", "Multi-grade attendance"],
  },
  {
    Icon: GraduationCap,
    count: 18,
    type: "Secondary Schools",
    features: ["KCSE gradebook", "NEMIS compliance"],
  },
  {
    Icon: Globe,
    count: 6,
    type: "International",
    features: ["IB & Cambridge support", "Multi-currency fees"],
  },
  {
    Icon: Building2,
    count: 4,
    type: "School Groups",
    features: ["Network-level reporting", "Shared HR & finance"],
  },
];

export default function CustomersPage() {
  return (
    <div style={{ color: "#212121" }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "6rem 2rem 5rem",
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
        <div className="relative max-w-[1200px] mx-auto w-full text-center">
          <div
            className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
            style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}
          >
            Our Customers
          </div>
          <h1
            className="font-playfair font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
          >
            Schools that{" "}
            <em className="italic" style={{ color: "#E8A020" }}>run better</em>
            {" "}with EduMyles.
          </h1>
          <p
            className="font-jakarta font-light leading-[1.8] mx-auto mb-8"
            style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "580px" }}
          >
            50+ schools across East Africa trust EduMyles to manage their students, fees, and staff.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["50+ Active Schools", "5 Countries", "10,000+ Students"].map((pill) => (
              <span
                key={pill}
                className="font-jakarta text-[13px] font-medium px-4 py-2 rounded-full"
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
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────── */}
      <section
        style={{
          background: "rgba(26,122,74,0.06)",
          borderTop: "1px solid rgba(26,122,74,0.12)",
          borderBottom: "1px solid rgba(26,122,74,0.12)",
          padding: "3rem 2rem",
        }}
      >
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="font-playfair font-bold"
                style={{ fontSize: "2.25rem", color: "#E8A020", lineHeight: 1.1 }}
              >
                {s.value}
              </div>
              <div
                className="font-jakarta font-semibold mt-1"
                style={{ fontSize: "14px", color: "#061A12" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Customer Wall ─────────────────────────────────── */}
      <section style={{ background: "#ffffff", padding: "5rem 2rem" }}>
        <div className="max-w-[1200px] mx-auto">
          <h2
            className="font-playfair font-bold text-center mb-8"
            style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
          >
            Schools Using EduMyles Today
          </h2>

          {/* Country filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {countryFilters.map((c) => (
              <span
                key={c.label}
                className="font-jakarta text-[13px] font-medium px-4 py-2 rounded-full cursor-default"
                style={{
                  background: "rgba(6,26,18,0.04)",
                  border: "1px solid rgba(6,26,18,0.1)",
                  color: "#061A12",
                }}
              >
                {c.flag} {c.label} ({c.count})
              </span>
            ))}
          </div>

          {/* Schools grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {schools.map((school) => (
              <div
                key={school.name}
                className="rounded-xl p-4 text-center transition-transform duration-200 hover:-translate-y-0.5"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e8f4ec",
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg font-playfair font-bold flex items-center justify-center mx-auto mb-2"
                  style={{
                    background: "#0F4C2A",
                    color: "#E8A020",
                    fontSize: school.initials.length > 2 ? "11px" : "14px",
                  }}
                >
                  {school.initials}
                </div>
                <div
                  className="font-jakarta font-semibold"
                  style={{ fontSize: "12.5px", color: "#061A12", lineHeight: 1.4 }}
                >
                  {school.name}
                </div>
                <div className="mt-1" style={{ fontSize: "11px", color: "#6B9E83" }}>
                  {school.flag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────── */}
      <section style={{ background: "#F3FBF6", padding: "5rem 2rem" }}>
        <div className="max-w-[1200px] mx-auto">
          <h2
            className="font-playfair font-bold text-center mb-12"
            style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
          >
            What school leaders say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className={`rounded-2xl p-7 flex flex-col${t.featured ? " md:col-span-1" : ""}`}
                style={
                  t.featured
                    ? {
                        background: "#061A12",
                        border: "2px solid rgba(232,160,32,0.4)",
                      }
                    : {
                        background: "#ffffff",
                        border: "1px solid #d1eadc",
                      }
                }
              >
                {/* Decorative quote mark */}
                <div
                  className="font-playfair font-bold leading-none mb-3"
                  style={{
                    fontSize: "4rem",
                    color: t.featured ? "rgba(232,160,32,0.4)" : "rgba(26,122,74,0.2)",
                    lineHeight: 0.8,
                  }}
                >
                  &ldquo;
                </div>
                <p
                  className="font-playfair italic flex-1 mb-5"
                  style={{
                    fontSize: "18px",
                    color: t.featured ? "#E8E8E8" : "#2d4a38",
                    lineHeight: 1.7,
                  }}
                >
                  {t.quote}
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <div
                    className="w-9 h-9 rounded-lg font-playfair font-bold flex items-center justify-center shrink-0"
                    style={{
                      background: t.featured ? "#E8A020" : "#0F4C2A",
                      color: t.featured ? "#061A12" : "#E8A020",
                      fontSize: "12px",
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div
                      className="font-jakarta font-semibold"
                      style={{ fontSize: "13px", color: t.featured ? "#ffffff" : "#061A12" }}
                    >
                      {t.name}
                    </div>
                    <div
                      className="font-jakarta"
                      style={{ fontSize: "12px", color: t.featured ? "#90CAF9" : "#6B9E83" }}
                    >
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── School Types ──────────────────────────────────── */}
      <section style={{ background: "#ffffff", padding: "5rem 2rem" }}>
        <div className="max-w-[1200px] mx-auto">
          <h2
            className="font-playfair font-bold text-center mb-12"
            style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#061A12" }}
          >
            Schools we work with
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {schoolTypes.map(({ Icon, count, type, features }) => (
              <div
                key={type}
                className="rounded-2xl p-6"
                style={{ background: "#F8FDF9", border: "1px solid #d1eadc" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(15,76,42,0.1)" }}
                >
                  <Icon size={22} style={{ color: "#1A7A4A" }} />
                </div>
                <div
                  className="font-playfair font-bold mb-0.5"
                  style={{ fontSize: "2rem", color: "#E8A020" }}
                >
                  {count}
                </div>
                <div
                  className="font-jakarta font-semibold mb-3"
                  style={{ fontSize: "15px", color: "#061A12" }}
                >
                  {type}
                </div>
                <ul className="space-y-1.5">
                  {features.map((f) => (
                    <li
                      key={f}
                      className="font-jakarta flex items-center gap-2"
                      style={{ fontSize: "13px", color: "#4a7a5a" }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: "#1A7A4A" }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#061A12", padding: "5rem 2rem" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[700px] mx-auto text-center">
          <h2
            className="font-playfair font-bold mb-4"
            style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#ffffff" }}
          >
            Join 50+ schools already running better.
          </h2>
          <p
            className="font-jakarta font-light mb-8"
            style={{ fontSize: "17px", color: "#90CAF9" }}
          >
            Get your school set up in under two weeks.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup/api"
              className="font-jakarta font-semibold px-7 py-3.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: "#E8A020", color: "#061A12", fontSize: "15px" }}
            >
              Start Free Trial →
            </Link>
            <Link
              href="/contact?subject=demo"
              className="font-jakarta font-semibold px-7 py-3.5 rounded-xl transition-colors"
              style={{
                background: "transparent",
                border: "1.5px solid rgba(255,255,255,0.25)",
                color: "#ffffff",
                fontSize: "15px",
              }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
