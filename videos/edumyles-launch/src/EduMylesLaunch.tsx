import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const colors = {
  forest: "#0F4C2A",
  emerald: "#1A7A4A",
  leaf: "#26A65B",
  gold: "#E8A020",
  offWhite: "#F3FBF6",
  ink: "#10231A",
  muted: "#60736A",
  white: "#FFFFFF",
};

const modules = ["Students", "Fees", "Timetables", "Exams", "Staff"];
const schools = ["st-marys.edumyles.com", "uhuru-academy.edumyles.com", "lakeview.edumyles.com"];
const roles = [
  { title: "Parents", detail: "Fee balances, results, announcements" },
  { title: "Teachers", detail: "Classes, marks, attendance" },
  { title: "Admins", detail: "Operations, finance, reports" },
];

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const fit = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const fade = (frame: number, start: number, end: number, outStart?: number, outEnd?: number) => {
  const enter = fit(frame, start, end);
  const exit =
    outStart === undefined || outEnd === undefined ? 0 : fit(frame, outStart, outEnd);
  return enter * (1 - exit);
};

const Background = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drift = interpolate(frame, [0, 45 * fps], [0, 90], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: colors.offWhite, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(120deg, rgba(15,76,42,0.08) 0 1px, transparent 1px), linear-gradient(30deg, rgba(232,160,32,0.12) 0 1px, transparent 1px)",
          backgroundSize: "82px 82px",
          transform: `translate3d(${-drift}px, ${drift * 0.4}px, 0)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -220,
          top: -230,
          width: 640,
          height: 640,
          borderRadius: 320,
          border: `110px solid rgba(38, 166, 91, 0.12)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -120,
          bottom: -180,
          width: 520,
          height: 520,
          borderRadius: 260,
          border: `90px solid rgba(232, 160, 32, 0.14)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Shell = ({ children }: { children: React.ReactNode }) => (
  <AbsoluteFill>
    <Background />
    <div style={{ position: "absolute", inset: 72 }}>{children}</div>
  </AbsoluteFill>
);

const BrowserFrame = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div
    style={{
      borderRadius: 28,
      background: colors.white,
      boxShadow: "0 34px 95px rgba(15,76,42,0.18)",
      border: "1px solid rgba(15,76,42,0.1)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        height: 68,
        background: colors.forest,
        color: colors.offWhite,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 24px",
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      <span style={{ width: 14, height: 14, borderRadius: 7, background: colors.gold }} />
      <span style={{ width: 14, height: 14, borderRadius: 7, background: colors.leaf }} />
      <span style={{ width: 14, height: 14, borderRadius: 7, background: colors.emerald }} />
      <span style={{ marginLeft: 20, opacity: 0.88 }}>{label}</span>
    </div>
    {children}
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      background: colors.offWhite,
      borderRadius: 20,
      padding: 24,
      border: "1px solid rgba(15,76,42,0.08)",
    }}
  >
    <div style={{ fontSize: 42, fontWeight: 900, color: colors.forest }}>{value}</div>
    <div style={{ marginTop: 8, fontSize: 20, color: colors.muted }}>{label}</div>
  </div>
);

const IntroScene = () => {
  const frame = useCurrentFrame();
  const title = fade(frame, 0, 32, 125, 150);
  const card = fit(frame, 20, 70);

  return (
    <Shell>
      <div style={{ display: "flex", height: "100%", alignItems: "center", gap: 80 }}>
        <div style={{ width: 760, opacity: title, transform: `translateY(${(1 - title) * 38}px)` }}>
          <div style={{ color: colors.gold, fontSize: 34, fontWeight: 800, marginBottom: 22 }}>
            Built for Kenyan and East African schools
          </div>
          <div
            style={{
              color: colors.forest,
              fontSize: 104,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: 0,
            }}
          >
            One platform for every school operation.
          </div>
          <div style={{ color: colors.muted, fontSize: 34, lineHeight: 1.35, marginTop: 34 }}>
            Students, fees, timetables, exams, and staff managed in one calm dashboard.
          </div>
        </div>
        <div
          style={{
            flex: 1,
            opacity: card,
            transform: `translateX(${(1 - card) * 80}px) scale(${0.96 + card * 0.04})`,
          }}
        >
          <BrowserFrame label="greenfield.edumyles.com">
            <div style={{ padding: 34 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 22 }}>
                <div
                  style={{
                    background: colors.forest,
                    color: colors.white,
                    borderRadius: 24,
                    padding: 34,
                    minHeight: 250,
                  }}
                >
                  <div style={{ fontSize: 26, opacity: 0.82 }}>Today</div>
                  <div style={{ fontSize: 64, fontWeight: 900, marginTop: 18 }}>1,248 learners</div>
                  <div style={{ fontSize: 24, marginTop: 22, color: "#D8F7E2" }}>
                    Attendance, finance, academics and staff live together.
                  </div>
                </div>
                <div style={{ display: "grid", gap: 18 }}>
                  <Stat value="94%" label="fees reconciled" />
                  <Stat value="32" label="active classes" />
                </div>
              </div>
            </div>
          </BrowserFrame>
        </div>
      </div>
    </Shell>
  );
};

const ModulesScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = fade(frame, 0, 28, 215, 245);

  return (
    <Shell>
      <div style={{ opacity: p, transform: `translateY(${(1 - p) * 34}px)` }}>
        <div style={{ color: colors.forest, fontSize: 74, lineHeight: 1.04, fontWeight: 930 }}>
          Your school operating system
        </div>
        <div style={{ color: colors.muted, fontSize: 30, marginTop: 18 }}>
          Every department works from the same reliable source of truth.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 76,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 22,
        }}
      >
        {modules.map((module, index) => {
          const item = fit(frame, 24 + index * 10, 60 + index * 10);
          const pulse = Math.sin((frame - index * 8) / (fps * 0.9)) * 0.5 + 0.5;
          return (
            <div
              key={module}
              style={{
                height: 520,
                borderRadius: 24,
                background: index % 2 === 0 ? colors.white : colors.forest,
                color: index % 2 === 0 ? colors.forest : colors.white,
                padding: 28,
                boxShadow: "0 30px 80px rgba(15,76,42,0.14)",
                opacity: item * p,
                transform: `translateY(${(1 - item) * 75}px)`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 82,
                  height: 82,
                  borderRadius: 22,
                  background: index % 2 === 0 ? colors.offWhite : "rgba(255,255,255,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.gold,
                  fontSize: 42,
                  fontWeight: 900,
                }}
              >
                {index + 1}
              </div>
              <div style={{ fontSize: 38, fontWeight: 900, marginTop: 42 }}>{module}</div>
              <div
                style={{
                  marginTop: 28,
                  height: 12,
                  borderRadius: 6,
                  background: index % 2 === 0 ? "#DDEFE5" : "rgba(255,255,255,0.25)",
                }}
              />
              <div
                style={{
                  marginTop: 18,
                  width: `${54 + pulse * 34}%`,
                  height: 12,
                  borderRadius: 6,
                  background: colors.gold,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: -64,
                  bottom: -64,
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  border: `32px solid ${index % 2 === 0 ? "rgba(38,166,91,0.12)" : "rgba(232,160,32,0.26)"}`,
                }}
              />
            </div>
          );
        })}
      </div>
    </Shell>
  );
};

const TenantScene = () => {
  const frame = useCurrentFrame();
  const p = fade(frame, 0, 30, 225, 260);

  return (
    <Shell>
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 68, height: "100%" }}>
        <div style={{ alignSelf: "center", opacity: p }}>
          <div style={{ color: colors.gold, fontSize: 30, fontWeight: 850 }}>
            Multi-school architecture
          </div>
          <div style={{ color: colors.forest, fontSize: 82, lineHeight: 1.02, fontWeight: 950 }}>
            Every school gets its own dashboard.
          </div>
          <div style={{ color: colors.muted, fontSize: 30, lineHeight: 1.4, marginTop: 26 }}>
            Dedicated subdomains keep each institution organized, branded, and isolated.
          </div>
        </div>
        <div style={{ alignSelf: "center", display: "grid", gap: 24 }}>
          {schools.map((school, index) => {
            const item = fit(frame, 22 + index * 18, 70 + index * 18);
            return (
              <div
                key={school}
                style={{
                  background: colors.white,
                  borderRadius: 24,
                  padding: "30px 34px",
                  border: "1px solid rgba(15,76,42,0.12)",
                  boxShadow: "0 24px 70px rgba(15,76,42,0.13)",
                  opacity: p * item,
                  transform: `translateX(${(1 - item) * 80}px)`,
                  display: "grid",
                  gridTemplateColumns: "76px 1fr auto",
                  alignItems: "center",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 22,
                    background: index === 1 ? colors.gold : colors.forest,
                    color: colors.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 30,
                    fontWeight: 950,
                  }}
                >
                  {index + 1}
                </div>
                <div>
                  <div style={{ color: colors.forest, fontSize: 34, fontWeight: 900 }}>{school}</div>
                  <div style={{ color: colors.muted, fontSize: 22, marginTop: 7 }}>
                    Own users, students, fees, classes and reports
                  </div>
                </div>
                <div
                  style={{
                    color: colors.leaf,
                    border: `2px solid ${colors.leaf}`,
                    borderRadius: 999,
                    padding: "10px 18px",
                    fontSize: 20,
                    fontWeight: 850,
                  }}
                >
                  Live
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
};

const MpesaScene = () => {
  const frame = useCurrentFrame();
  const p = fade(frame, 0, 30, 215, 250);
  const transfer = fit(frame, 92, 145);

  return (
    <Shell>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 70, height: "100%" }}>
        <div style={{ alignSelf: "center", opacity: p }}>
          <BrowserFrame label="Fees and payments">
            <div style={{ padding: 34 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
                <Stat value="KES 420k" label="collected today" />
                <Stat value="128" label="payments matched" />
              </div>
              <div style={{ marginTop: 26, display: "grid", gap: 16 }}>
                {["Grade 6 - Term 2", "Form 1 Boarding", "Transport route B"].map((item, index) => (
                  <div
                    key={item}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 140px",
                      gap: 18,
                      padding: 22,
                      borderRadius: 18,
                      background: index === 1 ? colors.forest : colors.offWhite,
                      color: index === 1 ? colors.white : colors.ink,
                      fontSize: 24,
                      fontWeight: 800,
                    }}
                  >
                    <span>{item}</span>
                    <span style={{ color: index === 1 ? colors.gold : colors.emerald }}>
                      Reconciled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </BrowserFrame>
        </div>
        <div style={{ alignSelf: "center", opacity: p, position: "relative", height: 650 }}>
          <div
            style={{
              position: "absolute",
              left: 30,
              top: 70,
              width: 270,
              height: 540,
              borderRadius: 42,
              background: colors.ink,
              padding: 18,
              boxShadow: "0 30px 90px rgba(15,76,42,0.25)",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 30,
                background: colors.offWhite,
                padding: 24,
                color: colors.forest,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 950 }}>M-Pesa</div>
              <div style={{ fontSize: 18, color: colors.muted, marginTop: 24 }}>Pay EduMyles</div>
              <div style={{ fontSize: 42, fontWeight: 950, marginTop: 12 }}>KES 18,500</div>
              <div
                style={{
                  marginTop: 42,
                  background: colors.leaf,
                  color: colors.white,
                  borderRadius: 20,
                  padding: "18px 20px",
                  fontSize: 22,
                  fontWeight: 900,
                  textAlign: "center",
                }}
              >
                Confirmed
              </div>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 350 + transfer * 210,
              top: 280,
              width: 110,
              height: 110,
              borderRadius: 55,
              background: colors.gold,
              color: colors.forest,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 950,
              boxShadow: "0 20px 50px rgba(232,160,32,0.4)",
            }}
          >
            KES
          </div>
          <div
            style={{
              position: "absolute",
              right: 20,
              top: 110,
              width: 340,
              height: 430,
              borderRadius: 28,
              background: colors.forest,
              color: colors.white,
              padding: 34,
              boxShadow: "0 30px 90px rgba(15,76,42,0.22)",
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 950 }}>Finance office</div>
            <div style={{ color: "#CDEED8", fontSize: 22, marginTop: 18, lineHeight: 1.35 }}>
              Payments flow into the right student account with clean records for admins and parents.
            </div>
            <div
              style={{
                marginTop: 44,
                height: 120,
                borderRadius: 22,
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.gold,
                fontSize: 34,
                fontWeight: 950,
              }}
            >
              Auto matched
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

const RolesScene = () => {
  const frame = useCurrentFrame();
  const p = fade(frame, 0, 26, 235, 270);

  return (
    <Shell>
      <div style={{ opacity: p, textAlign: "center" }}>
        <div style={{ color: colors.forest, fontSize: 76, fontWeight: 950 }}>
          A better experience for every role
        </div>
        <div style={{ color: colors.muted, fontSize: 30, marginTop: 16 }}>
          Parent, teacher, and admin workflows stay connected without getting in each other's way.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 94,
          right: 94,
          bottom: 105,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 30,
        }}
      >
        {roles.map((role, index) => {
          const item = fit(frame, 42 + index * 17, 86 + index * 17);
          return (
            <div
              key={role.title}
              style={{
                height: 510,
                borderRadius: 30,
                background: index === 2 ? colors.forest : colors.white,
                color: index === 2 ? colors.white : colors.forest,
                padding: 34,
                boxShadow: "0 34px 90px rgba(15,76,42,0.16)",
                opacity: p * item,
                transform: `translateY(${(1 - item) * 72}px)`,
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 28,
                  background: index === 2 ? "rgba(255,255,255,0.13)" : colors.offWhite,
                  color: colors.gold,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48,
                  fontWeight: 950,
                }}
              >
                {role.title.charAt(0)}
              </div>
              <div style={{ fontSize: 48, fontWeight: 950, marginTop: 52 }}>{role.title}</div>
              <div
                style={{
                  color: index === 2 ? "#CDEED8" : colors.muted,
                  fontSize: 28,
                  lineHeight: 1.35,
                  marginTop: 24,
                }}
              >
                {role.detail}
              </div>
              <div style={{ marginTop: 44, display: "grid", gap: 14 }}>
                {[0, 1, 2].map((line) => (
                  <div
                    key={line}
                    style={{
                      width: `${62 + line * 12}%`,
                      height: 14,
                      borderRadius: 7,
                      background: line === 1 ? colors.gold : index === 2 ? "rgba(255,255,255,0.18)" : "#DDEFE5",
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
};

const FinalScene = () => {
  const frame = useCurrentFrame();
  const p = fit(frame, 0, 45);
  const glow = fit(frame, 70, 130);

  return (
    <AbsoluteFill style={{ background: colors.forest, color: colors.white, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(120deg, rgba(255,255,255,0.06) 0 1px, transparent 1px), linear-gradient(30deg, rgba(232,160,32,0.18) 0 1px, transparent 1px)",
          backgroundSize: "86px 86px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 760 + glow * 180,
          height: 760 + glow * 180,
          borderRadius: 520,
          transform: "translate(-50%, -50%)",
          border: `70px solid rgba(38,166,91,${0.12 + glow * 0.08})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: p,
          transform: `scale(${0.94 + p * 0.06})`,
        }}
      >
        <Img src={staticFile("logo-full.svg")} style={{ width: 520, filter: "brightness(0) invert(1)" }} />
        <div style={{ color: colors.gold, fontSize: 46, fontWeight: 900, marginTop: 62 }}>
          School management, built for here.
        </div>
        <div style={{ color: colors.offWhite, fontSize: 38, marginTop: 28 }}>edumyles.com</div>
      </div>
    </AbsoluteFill>
  );
};

export const EduMylesLaunch = () => {
  return (
    <AbsoluteFill style={{ fontFamily: "Inter, Arial, sans-serif", background: colors.offWhite }}>
      <Sequence durationInFrames={150}>
        <IntroScene />
      </Sequence>
      <Sequence from={150} durationInFrames={255}>
        <ModulesScene />
      </Sequence>
      <Sequence from={405} durationInFrames={285}>
        <TenantScene />
      </Sequence>
      <Sequence from={690} durationInFrames={270}>
        <MpesaScene />
      </Sequence>
      <Sequence from={960} durationInFrames={270}>
        <RolesScene />
      </Sequence>
      <Sequence from={1230} durationInFrames={120}>
        <FinalScene />
      </Sequence>
    </AbsoluteFill>
  );
};
