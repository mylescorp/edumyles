const focusAreas = [
  {
    title: "Admissions",
    description: "Keep prospective-student information and follow-up work in one place.",
  },
  {
    title: "Fees",
    description: "Give school teams a clearer view of fee records and follow-up activity.",
  },
  {
    title: "Attendance",
    description: "Make daily attendance information easier for the right people to review.",
  },
  {
    title: "Communication",
    description: "Bring school updates and parent communication into a more consistent workflow.",
  },
];

export default function Stats() {
  return (
    <section
      aria-label="School operations supported by EduMyles"
      style={{
        background: "#061A12",
        borderTop: "3px solid #E8A020",
        borderBottom: "1px solid rgba(232,160,32,0.15)",
      }}
    >
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
          A clearer view of school operations
        </div>
        <h2
          className="font-display font-bold leading-tight mb-2"
          style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#ffffff" }}
        >
          Bring everyday school work into <em className="italic" style={{ color: "#E8A020" }}>one place.</em>
        </h2>
        <p
          className="font-jakarta text-[14px]"
          style={{ color: "#6B9E83", maxWidth: 560, margin: "0 auto" }}
        >
          Start with the work your school needs to organise, then decide which workflows matter most.
        </p>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {focusAreas.map((area) => (
            <div
              key={area.title}
              className="rounded-2xl p-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderLeft: "3px solid #E8A020",
              }}
            >
              <h3 className="font-display font-bold text-[20px] mb-2" style={{ color: "#E8A020" }}>
                {area.title}
              </h3>
              <p className="font-jakarta text-[13px] leading-relaxed" style={{ color: "#A8E6C3" }}>
                {area.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
