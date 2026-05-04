import { AFFILIATE_COMMISSION_RATE, MODULES, RESELLER_COMMISSION_RATES } from "./index";
import { SCHOOL_CURRICULA } from "./curricula";
import type { Module } from "../types";

export type PublicPricingPlan = {
  key: "starter" | "professional" | "enterprise";
  name: string;
  tagline: string;
  monthlyPriceKes: number | null;
  annualMonthlyPriceKes: number | null;
  studentLimitLabel: string;
  campusLabel: string;
  description: string;
  features: string[];
  notIncluded?: string[];
  cta: string;
  href: string;
  featured: boolean;
  highlight?: string;
};

export const PUBLIC_PRICING_PLANS: readonly PublicPricingPlan[] = [
  {
    key: "starter",
    name: "Starter",
    tagline: "Up to 500 students",
    monthlyPriceKes: 12900,
    annualMonthlyPriceKes: 10320,
    studentLimitLabel: "Up to 500 students",
    campusLabel: "1 campus",
    description: "For schools digitising core records, fee tracking, attendance, and communication.",
    features: [
      "Student information system",
      "Admissions and student profiles",
      "Basic fee tracking",
      "Attendance management",
      "Parent communication by SMS",
      "1 campus",
      "Email support",
    ],
    notIncluded: ["Multi-campus networks", "eWallet", "School shop", "API access"],
    cta: "Start Free Trial",
    href: "/waitlist",
    featured: false,
  },
  {
    key: "professional",
    name: "Professional",
    tagline: "501-2,000 students",
    monthlyPriceKes: 38900,
    annualMonthlyPriceKes: 31120,
    studentLimitLabel: "501-2,000 students",
    campusLabel: "Multi-campus",
    description: "For growing schools and school groups using the full EduMyles operating system.",
    features: [
      "All 13 production modules",
      "Multi-campus networks and campus switching",
      "CBC, ACE, IGCSE, and 8-4-4 curricula",
      "M-Pesa and Airtel Money",
      "Parent, teacher, student, and admin portals",
      "Advanced analytics",
      "Unlimited admin users",
      "Priority support and training",
    ],
    cta: "Start Free Trial",
    href: "/waitlist",
    featured: true,
    highlight: "Most Popular",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    tagline: "2,000+ students",
    monthlyPriceKes: null,
    annualMonthlyPriceKes: null,
    studentLimitLabel: "2,000+ students",
    campusLabel: "Custom network",
    description: "For large institutions, counties, and multi-school networks with custom controls.",
    features: [
      "Everything in Professional",
      "Custom SLA agreement",
      "Dedicated customer success manager",
      "API access and custom integrations",
      "SSO with WorkOS",
      "County and ministry reporting exports",
      "White-label options",
      "On-site setup and training",
    ],
    cta: "Contact Sales",
    href: "/contact?subject=enterprise",
    featured: false,
  },
] as const;

export const PUBLIC_MODULES: ReadonlyArray<{
  slug: Module;
  label: string;
  description: string;
}> = (Object.entries(MODULES) as Array<[Module, (typeof MODULES)[Module]]>).map(
  ([slug, module]) => ({
    slug,
    label: module.label,
    description: module.description,
  })
);

export const PUBLIC_CURRICULA = SCHOOL_CURRICULA.filter((curriculum) => curriculum.isActive).map(
  ({ code, label, shortLabel, educationModel, defaultAcademicStructure }) => ({
    code,
    label,
    shortLabel,
    educationModel,
    defaultAcademicStructure,
  })
);

export const PARTNER_PROGRAM_RULES = {
  affiliate: {
    commissionRatePct: AFFILIATE_COMMISSION_RATE,
    cookieDays: 30,
    portalPath: "/portal/affiliate",
  },
  reseller: {
    commissionRatesPct: RESELLER_COMMISSION_RATES,
    holdDays: 7,
    minPayoutKes: 500,
    portalPath: "/portal/reseller",
  },
  developer: {
    portalPath: "/portal/developer",
    applicationTable: "publisherApplications",
    publicRoute: "/apply/developer",
  },
} as const;

export function formatPublicKes(value: number) {
  return `KES ${value.toLocaleString("en-KE")}`;
}
