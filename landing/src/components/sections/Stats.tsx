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
        background: "var(--color-surface-default)",
        borderTop: "3px solid var(--color-action-primary)",
        borderBottom: "1px solid color-mix(in srgb, var(--color-action-primary) 15%, transparent)",
      }}
    >
      {/* ── Header ── */}
      <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-8 text-center">
        <div
          className="inline-flex items-center gap-2 font-jakarta font-semibold text-[12px] mb-5 px-4 py-2 rounded-full"
          style={{
            background: "color-mix(in srgb, var(--color-action-primary) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-action-primary) 30%, transparent)",
            color: "var(--color-text-on-primary-subtle)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-action-primary)",
              display: "inline-block",
            }}
          />
          Trusted by schools across Africa
        </div>
        <h2
          className="font-display font-bold leading-tight mb-2"
          style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "var(--color-text-default)" }}
        >
          The platform African schools{" "}
          <em className="italic" style={{ color: "var(--color-text-on-primary-subtle)" }}>
            run on.
          </em>
        </h2>
        <p
          className="font-jakarta text-[14px]"
          style={{ color: "var(--color-text-muted)", maxWidth: 480, margin: "0 auto" }}
        >
          From Nairobi to Kampala to Lusaka — schools across East Africa choose EduMyles to manage
          their students, fees, and staff.
        </p>
      </div>

      {/* ── Marquee ── */}
      <div
        style={{
          overflow: "hidden",
          borderTop: "1px solid color-mix(in srgb, var(--color-text-on-primary) 6%, transparent)",
          borderBottom: "1px solid color-mix(in srgb, var(--color-text-on-primary) 6%, transparent)",
          padding: "14px 0",
          background: "color-mix(in srgb, var(--color-surface-default) 2%, transparent)",
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
                background: "color-mix(in srgb, var(--color-surface-default) 5%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-surface-default) 10%, transparent)",
                color: "var(--color-text-muted)",
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
                background: "color-mix(in srgb, var(--color-surface-default) 3%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-surface-default) 7%, transparent)",
                borderLeft: "3px solid var(--color-text-on-primary-subtle)",
              }}
            >
              <div
                className="font-display font-bold mb-1"
                style={{
                  fontSize: "clamp(1.6rem,2.5vw,2.25rem)",
                  color: "var(--color-text-on-primary-subtle)",
                  lineHeight: 1.1,
                }}
              >
                {s.value}
              </div>
              <div className="font-jakarta font-semibold text-[14px] text-foreground mb-0.5">
                {s.label}
              </div>
              <div className="font-jakarta text-[11px]" style={{ color: "var(--color-text-muted)" }}>
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
          style={{ color: "var(--color-text-muted)" }}
        >
          Operating in:
        </span>
        {countries.map((c) => (
          <span
            key={c.name}
            className="inline-flex items-center gap-2 font-jakarta font-medium text-[12.5px] px-4 py-2 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--color-status-success-on-subtle) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-status-success-on-subtle) 15%, transparent)",
              color: "var(--color-text-muted)",
            }}
          >
            {c.flag} {c.name}
          </span>
        ))}
      </div>
    </section>
  );
}
