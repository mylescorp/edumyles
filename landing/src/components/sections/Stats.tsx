// Trust Bar — replaces old stats section
// Shows social proof: school logos + key trust metrics

const schools = [
  "Nairobi Green",
  "St. Mary's",
  "Brookside Prep",
  "Upperhill",
  "Accent School",
];

const trustStats = [
  "50+ Schools",
  "10,000+ Students",
  "5 Countries",
  "99.9% Uptime",
];

export default function Stats() {
  return (
    <section
      className="bg-white py-8 px-4 sm:px-8 text-center"
      aria-label="Trusted by schools across Africa"
      style={{
        borderTop: "1px solid #f0f0f0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Trust label */}
        <p className="text-[14px] font-medium mb-6" style={{ color: "#6B9E83" }}>
          Trusted by schools across Africa
        </p>

        {/* School name placeholders */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {schools.map((name) => (
            <div
              key={name}
              className="flex items-center justify-center rounded-[8px] text-[12px] font-medium px-6"
              style={{
                width: "120px",
                height: "60px",
                background: "#f0f0f0",
                color: "#6B9E83",
              }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px my-6" style={{ background: "#f0f0f0" }} />

        {/* Trust metrics */}
        <div className="flex flex-wrap justify-center gap-6 text-[14px] font-semibold" style={{ color: "#061A12" }}>
          {trustStats.map((stat) => (
            <span key={stat}>{stat}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
