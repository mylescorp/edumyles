import { Radio, CreditCard, Building2, BookOpen, KeyRound, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Badge =
  | { isEmoji: true;  icon: string;      name: string; subtitle: string }
  | { isEmoji: false; icon: LucideIcon;  name: string; subtitle: string };

const badges: Badge[] = [
  { isEmoji: true,  icon: "🇰🇪", name: "M-Pesa Daraja",     subtitle: "Mobile Money" },
  { isEmoji: true,  icon: "🌍",  name: "Airtel Money",       subtitle: "East Africa" },
  { isEmoji: false, icon: Radio,    name: "Africa's Talking", subtitle: "SMS & USSD" },
  { isEmoji: false, icon: CreditCard, name: "Stripe",         subtitle: "Card Payments" },
  { isEmoji: false, icon: Building2,  name: "NEMIS",          subtitle: "Kenya MoE" },
  { isEmoji: false, icon: BookOpen,   name: "CBC / KICD",     subtitle: "Curriculum" },
  { isEmoji: false, icon: KeyRound,   name: "WorkOS",         subtitle: "SSO & Auth" },
  { isEmoji: false, icon: Zap,        name: "Convex",         subtitle: "Real-Time Sync" },
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
              {badge.isEmoji ? (
                <span className="text-lg leading-none">{badge.icon}</span>
              ) : (
                <badge.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
              )}
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
