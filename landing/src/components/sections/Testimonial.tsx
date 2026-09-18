const roles = [
  {
    title: "School leaders",
    description: "Keep the operational picture visible without relying on scattered records.",
  },
  {
    title: "Finance teams",
    description: "Follow fee activity and the work that needs attention with greater clarity.",
  },
  {
    title: "Teaching teams",
    description: "Spend less time moving information between tools and more time supporting learners.",
  },
];

export default function Testimonial() {
  return (
    <section
      className="px-4 sm:px-8 py-16 sm:py-20"
      aria-label="School teams supported by EduMyles"
      style={{ background: "#FEF3DC" }}
    >
      <div className="max-w-[960px] mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2
            className="font-display font-bold leading-[1.2] mb-2"
            style={{ fontSize: "clamp(1.75rem,3vw,2.75rem)", color: "#061A12" }}
          >
            Designed around school teams
          </h2>
          <p className="font-jakarta text-[15px]" style={{ color: "#5a5a5a" }}>
            See how one operating system can support the people responsible for daily school work.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {roles.map((role) => (
            <article
              key={role.title}
              className="rounded-2xl p-7"
              style={{
                background: "#ffffff",
                boxShadow: "0 8px 40px rgba(6,26,18,0.08)",
                border: "1px solid rgba(232,160,32,0.2)",
              }}
            >
              <h3 className="font-display font-bold text-[21px] mb-3" style={{ color: "#061A12" }}>
                {role.title}
              </h3>
              <p className="font-jakarta text-[15px] leading-relaxed" style={{ color: "#5a5a5a" }}>
                {role.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
