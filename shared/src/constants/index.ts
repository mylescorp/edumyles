// ============================================================
// EduMyles — Shared Constants
// ============================================================
import type { LegacyUserRoleAlias, Module, UserRole, TenantTier } from "../types/index.js";

// ----------------------------------------------------------
// Roles — canonical names match convex/helpers/authorize.ts
// ----------------------------------------------------------
export const USER_ROLES: Record<UserRole, { label: string; level: number }> = {
  master_admin: { label: "Master Admin", level: 100 },
  super_admin: { label: "Super Admin", level: 95 },
  school_admin: { label: "School Admin", level: 90 },
  principal: { label: "Principal", level: 80 },
  bursar: { label: "Finance Officer", level: 60 },
  hr_manager: { label: "HR Manager", level: 60 },
  board_member: { label: "Board Member", level: 55 },
  librarian: { label: "Librarian", level: 50 },
  transport_manager: { label: "Transport Manager", level: 50 },
  teacher: { label: "Teacher", level: 40 },
  receptionist: { label: "Receptionist", level: 30 },
  partner: { label: "Partner", level: 25 },
  parent: { label: "Parent", level: 20 },
  alumni: { label: "Alumni", level: 15 },
  student: { label: "Student", level: 10 },
};

export const LEGACY_ROLE_ALIASES: Record<LegacyUserRoleAlias, UserRole> = {
  platform_admin: "super_admin",
};

export const CANONICAL_PLATFORM_ROLES: UserRole[] = ["master_admin", "super_admin"];

export function normalizeUserRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  if (role in LEGACY_ROLE_ALIASES) {
    return LEGACY_ROLE_ALIASES[role as LegacyUserRoleAlias];
  }
  return role in USER_ROLES ? (role as UserRole) : null;
}

// ----------------------------------------------------------
// Modules
// ----------------------------------------------------------
export const MODULES: Record<Module, { label: string; icon: string; description: string }> = {
  sis: {
    label: "Student Information",
    icon: "👨‍🎓",
    description: "Student profiles, classes, streams",
  },
  admissions: {
    label: "Admissions",
    icon: "📋",
    description: "Applications, enrollment, waitlists",
  },
  finance: {
    label: "Finance & Fees",
    icon: "💰",
    description: "Fee collection, invoices, receipts",
  },
  timetable: {
    label: "Timetable",
    icon: "📅",
    description: "Scheduling, substitutions, room bookings",
  },
  academics: {
    label: "Academics",
    icon: "📚",
    description: "Gradebook, assessments, report cards",
  },
  hr: { label: "HR & Payroll", icon: "👥", description: "Staff records, attendance, payroll" },
  library: { label: "Library", icon: "📖", description: "Book catalog, borrowing, fines" },
  transport: { label: "Transport", icon: "🚌", description: "Routes, vehicles, student tracking" },
  communications: {
    label: "Communications",
    icon: "💬",
    description: "SMS, email, in-app messaging",
  },
  ewallet: { label: "eWallet", icon: "👛", description: "Digital wallet for students & parents" },
  ecommerce: { label: "School Shop", icon: "🛒", description: "Uniform, books, supplies store" },
};

// ----------------------------------------------------------
// Tiers & Feature Gates — canonical names match Convex billing
// ----------------------------------------------------------
export const TIER_MODULES: Record<TenantTier, Module[]> = {
  starter: ["sis", "admissions", "finance", "communications"],
  standard: [
    "sis",
    "admissions",
    "finance",
    "timetable",
    "academics",
    "hr",
    "library",
    "transport",
    "communications",
  ],
  pro: [
    "sis",
    "admissions",
    "finance",
    "timetable",
    "academics",
    "hr",
    "library",
    "transport",
    "communications",
    "ewallet",
  ],
  enterprise: [
    "sis",
    "admissions",
    "finance",
    "timetable",
    "academics",
    "hr",
    "library",
    "transport",
    "communications",
    "ewallet",
    "ecommerce",
  ],
};

// ----------------------------------------------------------
// East Africa Curriculum Codes
// ----------------------------------------------------------
export const CURRICULUM_CODES = {
  KE_CBC: "KE-CBC", // Kenya — Competency Based Curriculum
  KE_8_4_4: "KE-8-4-4", // Kenya — 8-4-4 (phasing out)
  UG_UNEB: "UG-UNEB", // Uganda — UNEB
  TZ_NECTA: "TZ-NECTA", // Tanzania — NECTA
  RW_REB: "RW-REB", // Rwanda — REB
  ET_MOE: "ET-MOE", // Ethiopia — MoE
  GH_WAEC: "GH-WAEC", // Ghana — WAEC
} as const;

export type CurriculumCode = (typeof CURRICULUM_CODES)[keyof typeof CURRICULUM_CODES];

// ----------------------------------------------------------
// Supported Countries & Currencies
// ----------------------------------------------------------
export const SUPPORTED_COUNTRIES = [
  {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    symbol: "KSh",
    callingCode: "+254",
    dialPrefix: "254",
    flag: "🇰🇪",
  },
  {
    code: "UG",
    name: "Uganda",
    currency: "UGX",
    symbol: "USh",
    callingCode: "+256",
    dialPrefix: "256",
    flag: "🇺🇬",
  },
  {
    code: "TZ",
    name: "Tanzania",
    currency: "TZS",
    symbol: "TSh",
    callingCode: "+255",
    dialPrefix: "255",
    flag: "🇹🇿",
  },
  {
    code: "RW",
    name: "Rwanda",
    currency: "RWF",
    symbol: "RF",
    callingCode: "+250",
    dialPrefix: "250",
    flag: "🇷🇼",
  },
  {
    code: "ET",
    name: "Ethiopia",
    currency: "ETB",
    symbol: "Br",
    callingCode: "+251",
    dialPrefix: "251",
    flag: "🇪🇹",
  },
  {
    code: "GH",
    name: "Ghana",
    currency: "GHS",
    symbol: "GH₵",
    callingCode: "+233",
    dialPrefix: "233",
    flag: "🇬🇭",
  },
] as const;

/**
 * Look up currency info by country code ("KE") or full country name ("Kenya").
 * Falls back to KES if the country is unrecognised.
 */
export function getCurrencyForCountry(country: string): {
  currency: string;
  symbol: string;
  dialPrefix: string;
} {
  const upper = country.toUpperCase();
  const match =
    SUPPORTED_COUNTRIES.find((c) => c.code === upper) ||
    SUPPORTED_COUNTRIES.find((c) => c.name.toUpperCase() === upper);
  return match
    ? { currency: match.currency, symbol: match.symbol, dialPrefix: match.dialPrefix }
    : { currency: "KES", symbol: "KSh", dialPrefix: "254" };
}

// ----------------------------------------------------------
// Pagination
// ----------------------------------------------------------
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// ----------------------------------------------------------
// Date / Time
// ----------------------------------------------------------
export const DATE_FORMAT = "DD/MM/YYYY";
export const DATETIME_FORMAT = "DD/MM/YYYY HH:mm";
export const TIME_FORMAT = "HH:mm";
