import Link from "next/link";

const rows = [
  {
    feature: "Fee Collection",
    manual: "Cash & manual Excel",
    generic: "Basic invoicing",
    edumyles: "M-Pesa STK + auto receipts",
  },
  {
    feature: "Attendance",
    manual: "Paper register",
    generic: "Digital entry",
    edumyles: "One-tap + parent alerts",
  },
  {
    feature: "Report Cards",
    manual: "3 days per teacher",
    generic: "Export to Word",
    edumyles: "Auto-generated in 1 click",
  },
  {
    feature: "Parent Communication",
    manual: "WhatsApp groups",
    generic: "Email only",
    edumyles: "SMS, in-app, WhatsApp",
  },
  {
    feature: "NEMIS / MoE Reporting",
    manual: "Manual re-entry",
    generic: "Not supported",
    edumyles: "One-click export",
  },
  {
    feature: "CBC Gradebook",
    manual: "Custom Excel per teacher",
    generic: "Generic grades",
    edumyles: "Built-in CBC strands",
  },
  {
    feature: "Timetabling",
    manual: "Manual, conflict-prone",
    generic: "Basic scheduler",
    edumyles: "Auto-generated, conflict-free",
  },
  {
    feature: "M-Pesa Integration",
    manual: "Not available",
    generic: "Not available",
    edumyles: "Native integration",
  },
  {
    feature: "Pricing in KES",
    manual: "Free (but costs hours)",
    generic: "USD pricing",
    edumyles: "KES, transparent",
  },
  {
    feature: "Local Support",
    manual: "None",
    generic: "Email-only, international",
    edumyles: "Kenya-based team",
  },
];

export default function Comparison() {
  return (
    <section
      id="comparison"
      className="py-16 px-4 sm:px-8"
      aria-label="EduMyles vs alternatives comparison"
      style={{ background: "#F3FBF6" }}
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-10">
          <h2
            className="font-display font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 3rem)", color: "#061A12" }}
          >
            Why EduMyles?
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            Compare what running a school looks like before and after.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl shadow-sm">
          <table className="w-full min-w-[640px] bg-white text-sm">
            <thead>
              <tr style={{ background: "#061A12" }}>
                <th className="text-left px-5 py-4 text-white font-semibold w-[200px]">Feature</th>
                <th className="text-left px-5 py-4 text-white font-semibold">
                  ❌ Manual (Excel/WhatsApp)
                </th>
                <th className="text-left px-5 py-4 text-white font-semibold">⚠️ Generic SaaS</th>
                <th className="text-left px-5 py-4 text-white font-semibold">✅ EduMyles</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.feature} style={{ background: i % 2 === 0 ? "#ffffff" : "#F9FAFB" }}>
                  <td className="px-5 py-3.5 font-medium text-[#061A12]">{row.feature}</td>
                  <td className="px-5 py-3.5 text-red-500">{row.manual}</td>
                  <td className="px-5 py-3.5 text-amber-500">{row.generic}</td>
                  <td className="px-5 py-3.5 text-green-700 font-semibold">{row.edumyles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-10">
          <p className="text-base font-medium text-[#061A12] mb-4">Ready to make the switch?</p>
          <Link
            href="/waitlist"
            className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-full text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "#061A12" }}
          >
            Start Free Trial →
          </Link>
        </div>
      </div>
    </section>
  );
}
