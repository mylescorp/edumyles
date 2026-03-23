const badges = [
  { icon: "🇰🇪", name: "M-Pesa Daraja", subtitle: "Mobile Money" },
  { icon: "🌍", name: "Airtel Money", subtitle: "East Africa" },
  { icon: "📡", name: "Africa's Talking", subtitle: "SMS & USSD" },
  { icon: "💳", name: "Stripe", subtitle: "Card Payments" },
  { icon: "🏫", name: "NEMIS", subtitle: "Kenya MoE" },
  { icon: "📚", name: "CBC / KICD", subtitle: "Curriculum" },
  { icon: "🔑", name: "WorkOS", subtitle: "SSO & Auth" },
  { icon: "⚡", name: "Convex", subtitle: "Real-Time Sync" },
];

export default function Integrations() {
  return (
    <section
      id="integrations"
      className="py-10 px-4 sm:px-8 bg-white border-t border-b border-gray-100"
      aria-label="Integrations"
    >
      <div className="max-w-[1200px] mx-auto text-center">
        <p className="text-sm font-medium text-gray-500 mb-6 tracking-wide uppercase">
          Integrates with tools schools already use
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {badges.map((badge) => (
            <div
              key={badge.name}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm"
            >
              <span className="text-lg leading-none">{badge.icon}</span>
              <span className="text-sm font-semibold text-[#061A12]">{badge.name}</span>
              <span className="text-xs text-gray-400">{badge.subtitle}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-gray-500">
          and 12 more integrations — all included, no extra fees
        </p>
      </div>
    </section>
  );
}
