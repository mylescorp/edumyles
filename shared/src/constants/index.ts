// ============================================================
// EduMyles — Shared Constants
// ============================================================
import type { Module, UserRole, TenantTier } from "../types/index.js";

// ----------------------------------------------------------
// Roles
// ----------------------------------------------------------
export const USER_ROLES: Record<UserRole, { label: string; level: number }> = {
  platform_admin:   { label: "Platform Admin",   level: 100 },
  school_admin:     { label: "School Admin",      level: 90 },
  principal:        { label: "Principal",          level: 80 },
  finance_officer:  { label: "Finance Officer",   level: 60 },
  hr_officer:       { label: "HR Officer",        level: 60 },
  librarian:        { label: "Librarian",          level: 50 },
  transport_officer:{ label: "Transport Officer", level: 50 },
  teacher:          { label: "Teacher",            level: 40 },
  receptionist:     { label: "Receptionist",      level: 30 },
  parent:           { label: "Parent",             level: 20 },
  alumni:           { label: "Alumni",             level: 15 },
  student:          { label: "Student",            level: 10 },
  partner:          { label: "Partner",            level: 25 },
};

// ----------------------------------------------------------
// Modules
// ----------------------------------------------------------
export const MODULES: Record<Module, { label: string; icon: string; description: string }> = {
  sis:            { label: "Student Information",  icon: "👨‍🎓", description: "Student profiles, classes, streams" },
  admissions:     { label: "Admissions",           icon: "📋", description: "Applications, enrollment, waitlists" },
  finance:        { label: "Finance & Fees",       icon: "💰", description: "Fee collection, invoices, receipts" },
  timetable:      { label: "Timetable",            icon: "📅", description: "Scheduling, substitutions, room bookings" },
  academics:      { label: "Academics",            icon: "📚", description: "Gradebook, assessments, report cards" },
  hr:             { label: "HR & Payroll",         icon: "👥", description: "Staff records, attendance, payroll" },
  library:        { label: "Library",              icon: "📖", description: "Book catalog, borrowing, fines" },
  transport:      { label: "Transport",            icon: "🚌", description: "Routes, vehicles, student tracking" },
  communications: { label: "Communications",       icon: "💬", description: "SMS, email, in-app messaging" },
  ewallet:        { label: "eWallet",              icon: "👛", description: "Digital wallet for students & parents" },
  ecommerce:      { label: "School Shop",          icon: "🛒", description: "Uniform, books, supplies store" },
};

// ----------------------------------------------------------
// Tiers & Feature Gates
// ----------------------------------------------------------
export const TIER_MODULES: Record<TenantTier, Module[]> = {
  starter:    ["sis", "admissions", "finance", "communications"],
  standard:   ["sis", "admissions", "finance", "timetable", "academics", "communications"],
  pro:        ["sis", "admissions", "finance", "timetable", "academics", "hr", "library", "transport", "communications"],
  enterprise: ["sis", "admissions", "finance", "timetable", "academics", "hr", "library", "transport", "communications", "ewallet", "ecommerce"],
};

// ----------------------------------------------------------
// East Africa Curriculum Codes
// ----------------------------------------------------------
export const CURRICULUM_CODES = {
  KE_CBC:   "KE-CBC",   // Kenya — Competency Based Curriculum
  KE_8_4_4: "KE-8-4-4", // Kenya — 8-4-4 (phasing out)
  UG_UNEB:  "UG-UNEB",  // Uganda — UNEB
  TZ_NECTA: "TZ-NECTA", // Tanzania — NECTA
  RW_REB:   "RW-REB",   // Rwanda — REB
  ET_MOE:   "ET-MOE",   // Ethiopia — MoE
  GH_WAEC:  "GH-WAEC",  // Ghana — WAEC
} as const;

export type CurriculumCode = (typeof CURRICULUM_CODES)[keyof typeof CURRICULUM_CODES];

// ----------------------------------------------------------
// Supported Countries & Currencies
// ----------------------------------------------------------
export const SUPPORTED_COUNTRIES = [
  { code: "KE", name: "Kenya",        currency: "KES", callingCode: "+254", flag: "🇰🇪" },
  { code: "UG", name: "Uganda",       currency: "UGX", callingCode: "+256", flag: "🇺🇬" },
  { code: "TZ", name: "Tanzania",     currency: "TZS", callingCode: "+255", flag: "🇹🇿" },
  { code: "RW", name: "Rwanda",       currency: "RWF", callingCode: "+250", flag: "🇷🇼" },
  { code: "ET", name: "Ethiopia",     currency: "ETB", callingCode: "+251", flag: "🇪🇹" },
  { code: "GH", name: "Ghana",        currency: "GHS", callingCode: "+233", flag: "🇬🇭" },
] as const;

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
