const coreValues = [
  {
    icon: "🔍",
    title: "Clarity",
    desc: "We build tools that are simple, intuitive, and free of unnecessary complexity. Clear software leads to clear thinking — and better schools.",
  },
  {
    icon: "🚀",
    title: "Empowerment",
    desc: "Every feature we ship exists to give school administrators, teachers, and parents more control, more time, and more confidence.",
  },
  {
    icon: "🤝",
    title: "Integrity",
    desc: "We are honest about what EduMyles can and cannot do. We protect student data, price fairly, and stand behind every promise we make.",
  },
  {
    icon: "💡",
    title: "Innovation",
    desc: "The African education landscape is evolving fast. We stay ahead of it — shipping weekly, listening to schools, and solving real problems.",
  },
  {
    icon: "🌍",
    title: "Community",
    desc: "EduMyles is built with and for the communities it serves. Schools aren't customers — they're partners in building better education.",
  },
];

export default function BrandValues() {
  return (
    <section
      id="brand-values"
      className="px-4 sm:px-8 py-20"
      aria-label="Our mission, vision, and values"
      style={{ background: "#F3FBF6" }}
    >
      <div className="max-w-[1200px] mx-auto">

        {/* Section badge */}
        <div className="text-center mb-4">
          <div
            className="inline-block font-jakarta font-semibold text-[13px] px-5 py-2 rounded-[50px]"
            style={{ background: "rgba(232,160,32,0.12)", border: "1px solid rgba(232,160,32,0.4)", color: "#9A5D00" }}
          >
            Who We Are
          </div>
        </div>

        {/* Tagline */}
        <h2
          className="font-playfair font-bold text-center leading-[1.2] mb-4"
          style={{ fontSize: "clamp(1.75rem, 3vw, 3rem)", color: "#061A12" }}
        >
          Empowering Schools.{" "}
          <em className="italic" style={{ color: "#E8A020" }}>Elevating Learning.</em>
        </h2>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 mt-12 mb-14">
          <div
            className="rounded-2xl p-8"
            style={{ background: "#ffffff", border: "1px solid rgba(38,166,91,0.15)", boxShadow: "0 2px 16px rgba(6,26,18,0.06)" }}
          >
            <div
              className="inline-block font-jakarta font-semibold text-[12px] mb-4 px-3 py-1 rounded-[50px] uppercase tracking-wider"
              style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
            >
              Our Mission
            </div>
            <p className="font-jakarta text-[16px] leading-[1.8]" style={{ color: "#212121" }}>
              To simplify school administration across Africa so that educators can focus on what matters most — teaching and student success.
            </p>
          </div>
          <div
            className="rounded-2xl p-8"
            style={{ background: "#ffffff", border: "1px solid rgba(38,166,91,0.15)", boxShadow: "0 2px 16px rgba(6,26,18,0.06)" }}
          >
            <div
              className="inline-block font-jakarta font-semibold text-[12px] mb-4 px-3 py-1 rounded-[50px] uppercase tracking-wider"
              style={{ background: "rgba(15,76,42,0.08)", color: "#0F4C2A" }}
            >
              Our Vision
            </div>
            <p className="font-jakarta text-[16px] leading-[1.8]" style={{ color: "#212121" }}>
              To be Africa&apos;s most trusted school management platform, powering institutions of every size — from single-classroom community schools to multi-campus international networks.
            </p>
          </div>
        </div>

        {/* Core Values heading */}
        <div className="text-center mb-10">
          <h3
            className="font-playfair font-bold leading-[1.2]"
            style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: "#061A12" }}
          >
            Our Core <em className="italic" style={{ color: "#E8A020" }}>Values</em>
          </h3>
        </div>

        {/* 5 Values grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-16">
          {coreValues.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl p-6 text-center"
              style={{ background: "#ffffff", border: "1px solid rgba(38,166,91,0.15)", boxShadow: "0 2px 12px rgba(6,26,18,0.05)" }}
            >
              <div className="text-3xl mb-3">{v.icon}</div>
              <h4 className="font-playfair font-bold text-[17px] mb-2" style={{ color: "#061A12" }}>{v.title}</h4>
              <p className="font-jakarta text-[13px] leading-[1.7]" style={{ color: "#5a5a5a" }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Founding Story */}
        <div
          className="rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start"
          style={{
            background: "linear-gradient(135deg, #061A12 0%, #0F4C2A 100%)",
            boxShadow: "0 20px 60px rgba(6,26,18,0.2)",
          }}
        >
          <div className="flex-shrink-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-playfair font-bold text-2xl"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              JM
            </div>
          </div>
          <div>
            <div
              className="inline-block font-jakarta font-semibold text-[12px] mb-4 px-3 py-1 rounded-[50px] uppercase tracking-wider"
              style={{ background: "rgba(232,160,32,0.15)", border: "1px solid rgba(232,160,32,0.3)", color: "#E8A020" }}
            >
              Founding Story
            </div>
            <blockquote
              className="font-playfair italic text-[19px] leading-[1.65] mb-5"
              style={{ color: "#ffffff" }}
            >
              &ldquo;I watched a principal manage a 1,200-student school on WhatsApp groups and paper registers. It was brilliant improvisation — but it was costing teachers hours every week that should have been spent in classrooms. EduMyles was built to give that time back.&rdquo;
            </blockquote>
            <div>
              <div className="font-jakarta font-bold text-[15px]" style={{ color: "#E8A020" }}>Jonathan Myles</div>
              <div className="font-jakarta text-[13px]" style={{ color: "#A8E6C3" }}>CEO &amp; Founder — EduMyles · Founded in Nairobi, Kenya</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
