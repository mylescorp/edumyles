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
      style={{ background: "var(--color-surface-default)" }}
    >
      <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* LEFT — Text */}
        <div>
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
            style={{ background: "color-mix(in srgb, var(--color-action-primary) 15%, transparent)", color: "var(--color-text-on-primary-subtle)" }}
          >
            Mobile-First
          </span>

          <h2
            className="font-display font-bold leading-[1.2] mb-5"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.75rem)", color: "var(--color-text-default)" }}
          >
            Runs on any device.{" "}
            <em className="italic" style={{ color: "var(--color-text-on-primary-subtle)" }}>
              Works anywhere in Kenya.
            </em>
          </h2>

          <p className="text-base leading-relaxed mb-7" style={{ color: "var(--color-text-muted)" }}>
            EduMyles is fully responsive — works perfectly on any phone, tablet, or computer. No app
            download required. Just open your browser and go.
          </p>

          <ul className="flex flex-col gap-3 mb-8">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <span className="text-[var(--color-text-on-primary-subtle)] font-bold text-sm mt-0.5 flex-shrink-0">✓</span>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-default)" }}
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
                background: "color-mix(in srgb, var(--color-surface-default) 8%, transparent)",
                color: "var(--color-text-muted)",
                border: "1px solid color-mix(in srgb, var(--color-text-on-primary) 12%, transparent)",
              }}
            >
              📱 Native iOS &amp; Android app — Coming Q4 2026
            </span>
          </div>

          <Link
            href="/waitlist"
            className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
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
              filter: "drop-shadow(0 0 40px color-mix(in srgb, var(--color-action-primary) 25%, transparent))",
            }}
          >
            {/* Phone outer */}
            <div
              className="relative mx-auto"
              style={{
                width: "192px",
                height: "384px",
                borderRadius: "2.5rem",
                border: "4px solid var(--color-text-on-primary-subtle)",
                background: "var(--color-action-primary)",
                boxShadow: "0 25px 60px color-mix(in srgb, var(--color-surface-page) 50%, transparent)",
              }}
            >
              {/* Inner screen */}
              <div
                style={{
                  margin: "8px",
                  borderRadius: "2rem",
                  background: "var(--color-surface-default)",
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
                    background: "var(--color-surface-default)",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "6px",
                      borderRadius: "3px",
                      background: "var(--color-surface-default)",
                    }}
                  />
                </div>

                {/* App header */}
                <div
                  style={{
                    background: "var(--color-surface-default)",
                    padding: "6px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      color: "var(--color-text-on-primary-subtle)",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}
                  >
                    EduMyles
                  </span>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "8px" }}>9:41 AM</span>
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
                      background: "var(--color-surface-page)",
                      borderRadius: "8px",
                      padding: "8px",
                      border: "1px solid var(--color-border-default)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "8px",
                        fontWeight: 600,
                        color: "var(--color-text-default)",
                        marginBottom: "4px",
                      }}
                    >
                      Attendance Today
                    </p>
                    <p
                      style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-action-primary)", lineHeight: 1 }}
                    >
                      94%
                    </p>
                    {/* Progress bar */}
                    <div
                      style={{
                        marginTop: "5px",
                        height: "4px",
                        borderRadius: "2px",
                        background: "var(--color-border-default)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: "94%",
                          height: "100%",
                          borderRadius: "2px",
                          background: "var(--color-action-primary)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Fee alerts card */}
                  <div
                    style={{
                      borderRadius: "8px",
                      padding: "8px",
                      border: "1px solid var(--color-status-warning-solid)",
                      background: "var(--color-status-warning-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>🔔</span>
                    <div>
                      <p style={{ fontSize: "8px", fontWeight: 700, color: "var(--color-text-default)" }}>
                        3 fee alerts
                      </p>
                      <p style={{ fontSize: "7px", color: "var(--color-status-warning-on-subtle)" }}>Pending collections</p>
                    </div>
                  </div>

                  {/* Messages card */}
                  <div
                    style={{
                      background: "var(--color-surface-page)",
                      borderRadius: "8px",
                      padding: "8px",
                      border: "1px solid var(--color-border-default)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>💬</span>
                    <div>
                      <p style={{ fontSize: "8px", fontWeight: 700, color: "var(--color-text-default)" }}>
                        2 new messages
                      </p>
                      <p style={{ fontSize: "7px", color: "var(--color-text-disabled)" }}>from parents</p>
                    </div>
                  </div>
                </div>

                {/* Bottom nav hint */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    padding: "8px 4px",
                    borderTop: "1px solid var(--color-border-default)",
                    marginTop: "auto",
                  }}
                >
                  {([Home, BarChart2, User, Settings] as const).map((Icon, i) => (
                    <Icon
                      key={i}
                      style={{
                        width: "14px",
                        height: "14px",
                        color: i === 0 ? "var(--color-action-primary)" : "var(--color-text-muted)",
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
                "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-action-primary) 35%, transparent) 0%, transparent 70%)",
              marginTop: "-4px",
            }}
          />
        </div>
      </div>
    </section>
  );
}
