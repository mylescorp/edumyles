import Link from "next/link";
import { Home, BarChart2, User, Settings } from "lucide-react";

const bullets = [
  "Works on 2G and 3G networks",
  "Offline-capable for attendance marking",
  "Touch-optimised for phone use",
  "SMS alerts work on any phone (no smartphone needed for parents)",
];

export default function MobileTeaser() {
  return (
    <section
      id="mobile"
      className="py-16 px-4 sm:px-8"
      aria-label="Mobile-first experience"
      style={{ background: "var(--card)" }}
    >
      <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* LEFT — Text */}
        <div>
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
            style={{ background: "rgb(var(--primary-rgb) / 15%)", color: "var(--accent-foreground)" }}
          >
            Mobile-First
          </span>

          <h2
            className="font-display font-bold leading-[1.2] mb-5"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.75rem)", color: "var(--foreground)" }}
          >
            Runs on any device.{" "}
            <em className="italic" style={{ color: "var(--accent-foreground)" }}>
              Works anywhere in Kenya.
            </em>
          </h2>

          <p className="text-base leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.75)" }}>
            EduMyles is fully responsive — works perfectly on any phone, tablet, or computer. No app
            download required. Just open your browser and go.
          </p>

          <ul className="flex flex-col gap-3 mb-8">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <span className="text-[var(--accent-foreground)] font-bold text-sm mt-0.5 flex-shrink-0">✓</span>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                >
                  {bullet}
                </span>
              </li>
            ))}
          </ul>

          <div className="mb-8">
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              📱 Native iOS &amp; Android app — Coming Q4 2026
            </span>
          </div>

          <Link
            href="/waitlist"
            className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            Try it on your phone →
          </Link>
        </div>

        {/* RIGHT — Phone Mockup */}
        <div className="flex flex-col items-center justify-center">
          {/* Glow effect */}
          <div
            className="relative"
            style={{
              filter: "drop-shadow(0 0 40px rgb(var(--primary-rgb) / 25%))",
            }}
          >
            {/* Phone outer */}
            <div
              className="relative mx-auto"
              style={{
                width: "192px",
                height: "384px",
                borderRadius: "2.5rem",
                border: "4px solid var(--accent-foreground)",
                background: "var(--primary)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
              }}
            >
              {/* Inner screen */}
              <div
                style={{
                  margin: "8px",
                  borderRadius: "2rem",
                  background: "var(--card)",
                  overflow: "hidden",
                  height: "calc(100% - 16px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Notch */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "6px 0 4px",
                    background: "var(--card)",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "6px",
                      borderRadius: "3px",
                      background: "var(--card)",
                    }}
                  />
                </div>

                {/* App header */}
                <div
                  style={{
                    background: "var(--card)",
                    padding: "6px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      color: "var(--accent-foreground)",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}
                  >
                    EduMyles
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "8px" }}>9:41 AM</span>
                </div>

                {/* Screen content */}
                <div
                  style={{
                    padding: "8px 8px 0",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {/* Attendance card */}
                  <div
                    style={{
                      background: "var(--background)",
                      borderRadius: "8px",
                      padding: "8px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "8px",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        marginBottom: "4px",
                      }}
                    >
                      Attendance Today
                    </p>
                    <p
                      style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}
                    >
                      94%
                    </p>
                    {/* Progress bar */}
                    <div
                      style={{
                        marginTop: "5px",
                        height: "4px",
                        borderRadius: "2px",
                        background: "var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: "94%",
                          height: "100%",
                          borderRadius: "2px",
                          background: "var(--primary)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Fee alerts card */}
                  <div
                    style={{
                      background: "var(--muted)",
                      borderRadius: "8px",
                      padding: "8px",
                      border: "1px solid #fde68a",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>🔔</span>
                    <div>
                      <p style={{ fontSize: "8px", fontWeight: 700, color: "var(--foreground)" }}>
                        3 fee alerts
                      </p>
                      <p style={{ fontSize: "7px", color: "#92400e" }}>Pending collections</p>
                    </div>
                  </div>

                  {/* Messages card */}
                  <div
                    style={{
                      background: "var(--background)",
                      borderRadius: "8px",
                      padding: "8px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>💬</span>
                    <div>
                      <p style={{ fontSize: "8px", fontWeight: 700, color: "var(--foreground)" }}>
                        2 new messages
                      </p>
                      <p style={{ fontSize: "7px", color: "#64748b" }}>from parents</p>
                    </div>
                  </div>
                </div>

                {/* Bottom nav hint */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    padding: "8px 4px",
                    borderTop: "1px solid #f1f5f9",
                    marginTop: "auto",
                  }}
                >
                  {([Home, BarChart2, User, Settings] as const).map((Icon, i) => (
                    <Icon
                      key={i}
                      style={{
                        width: "14px",
                        height: "14px",
                        color: i === 0 ? "var(--primary)" : "#94a3b8",
                      }}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Subtle glow below phone */}
          <div
            style={{
              width: "160px",
              height: "20px",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse at center, rgb(var(--primary-rgb) / 35%) 0%, transparent 70%)",
              marginTop: "-4px",
            }}
          />
        </div>
      </div>
    </section>
  );
}
