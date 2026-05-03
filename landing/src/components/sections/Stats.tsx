"use client";

export default function Stats() {
  const schools = [
    "Nairobi Green Academy",
    "St. Mary's Girls High",
    "Brookside Prep",
    "Upperhill School",
    "Strathmore School",
    "St. Francis Kisumu",
    "Hillcrest School",
    "Starehe Girls' Centre",
    "Alliance High School",
    "Kenya High School",
    "Aga Khan Academy",
    "Braeburn School",
  ];
  // Double the array for seamless infinite scroll
  const doubled = [...schools, ...schools];

  const stats = [
    { value: "50+", label: "Schools Active", sub: "Across 5 countries" },
    { value: "Multi-campus", label: "Students Managed", sub: "And growing weekly" },
    { value: "5", label: "Countries", sub: "KE · UG · TZ · RW · ZM" },
    { value: "Automated", label: "Fees Processed", sub: "Fully reconciled" },
  ];

  const countries = [
    { flag: "🇰🇪", name: "Kenya" },
    { flag: "🇺🇬", name: "Uganda" },
    { flag: "🇹🇿", name: "Tanzania" },
    { flag: "🇷🇼", name: "Rwanda" },
    { flag: "🇿🇲", name: "Zambia" },
  ];

  return (
    <section
      aria-label="Trusted by schools across Africa"
      style={{
        background: "#061A12",
        borderTop: "3px solid #E8A020",
        borderBottom: "1px solid rgba(232,160,32,0.15)",
      }}
    >
      {/* ── Header ── */}
      <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-8 text-center">
        <div
          className="inline-flex items-center gap-2 font-jakarta font-semibold text-[12px] mb-5 px-4 py-2 rounded-full"
          style={{
            background: "rgba(232,160,32,0.12)",
            border: "1px solid rgba(232,160,32,0.3)",
            color: "#E8A020",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#E8A020",
              display: "inline-block",
            }}
          />
          Trusted by schools across Africa
        </div>
        <h2
          className="font-display font-bold leading-tight mb-2"
          style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#ffffff" }}
        >
          The platform African schools{" "}
          <em className="italic" style={{ color: "#E8A020" }}>
            run on.
          </em>
        </h2>
        <p
          className="font-jakarta text-[14px]"
          style={{ color: "#6B9E83", maxWidth: 480, margin: "0 auto" }}
        >
          From Nairobi to Kampala to Lusaka — schools across East Africa choose EduMyles to manage
          their students, fees, and staff.
        </p>
      </div>

      {/* ── Marquee ── */}
      <div
        style={{
          overflow: "hidden",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 0",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <style>{`
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-inner {
            display: inline-flex;
            gap: 12px;
            animation: marquee-scroll 30s linear infinite;
            white-space: nowrap;
          }
          .marquee-inner:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="marquee-inner">
          {doubled.map((name, i) => (
            <span
              key={i}
              className="font-jakarta font-medium text-[12.5px] px-5 py-2 rounded-full flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#A8E6C3",
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-6 transition-transform duration-200 hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderLeft: "3px solid #E8A020",
              }}
            >
              <div
                className="font-display font-bold mb-1"
                style={{
                  fontSize: "clamp(1.6rem,2.5vw,2.25rem)",
                  color: "#E8A020",
                  lineHeight: 1.1,
                }}
              >
                {s.value}
              </div>
              <div className="font-jakarta font-semibold text-[14px] text-white mb-0.5">
                {s.label}
              </div>
              <div className="font-jakarta text-[11px]" style={{ color: "#6B9E83" }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Countries ── */}
      <div className="max-w-[1200px] mx-auto px-6 pb-12 flex flex-wrap justify-center items-center gap-3">
        <span
          className="font-jakarta font-semibold text-[11px] uppercase tracking-[2px]"
          style={{ color: "#4a6b58" }}
        >
          Operating in:
        </span>
        {countries.map((c) => (
          <span
            key={c.name}
            className="inline-flex items-center gap-2 font-jakarta font-medium text-[12.5px] px-4 py-2 rounded-full"
            style={{
              background: "rgba(168,230,195,0.08)",
              border: "1px solid rgba(168,230,195,0.15)",
              color: "#A8E6C3",
            }}
          >
            {c.flag} {c.name}
          </span>
        ))}
      </div>
    </section>
  );
}
