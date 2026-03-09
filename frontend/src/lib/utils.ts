import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind class merger — primary utility */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ================================================================
   EduMyles Design System v3.0 — Utility Functions
   Single source of truth for all colour logic.
   Import from here — never hardcode hex values in components.
   ================================================================ */

// ---------------------------------------------------------------------------
// Role-Based Colour Coding (Section 08)
// Used for badges, avatars, dashboard accents, sidebar header tints.
// ---------------------------------------------------------------------------
export const RoleColors = {
  "super-admin":   { bg: "#1A4731", text: "#FFFFFF", light: "#DCFCE7" },
  "school-admin":  { bg: "#1E3A8A", text: "#FFFFFF", light: "#DBEAFE" },
  "teacher":       { bg: "#16A34A", text: "#FFFFFF", light: "#DCFCE7" },
  "finance-officer":{ bg: "#F59E0B", text: "#1E293B", light: "#FEF9C3" },
  "parent":        { bg: "#0D9488", text: "#FFFFFF", light: "#CCFBF1" },
  "student":       { bg: "#7C3AED", text: "#FFFFFF", light: "#EDE9FE" },
} as const;

export type RoleKey = keyof typeof RoleColors;

/** Returns the colour config for a given user role. */
export function getRoleColor(role: RoleKey) {
  return RoleColors[role] ?? RoleColors["student"];
}

// ---------------------------------------------------------------------------
// Grade / Progress Indicators (Section 17)
// Use for attendance, grades, fee collection rates — any % metric.
// ---------------------------------------------------------------------------
export interface GradeColor {
  bg:    string;
  text:  string;
  label: string;
  grade: "A" | "B" | "C" | "D" | "F";
}

/**
 * Returns background colour, text colour, label, and letter grade
 * for a given numeric score (0-100).
 */
export function getGradeColor(score: number): GradeColor {
  if (score >= 86) return { bg: "#DCFCE7", text: "#16A34A", label: "Excellent",    grade: "A" };
  if (score >= 71) return { bg: "#ECFCCB", text: "#65A30D", label: "Good",         grade: "B" };
  if (score >= 61) return { bg: "#FEF9C3", text: "#F59E0B", label: "Average",      grade: "C" };
  if (score >= 41) return { bg: "#FFEDD5", text: "#EA580C", label: "Below Average",grade: "D" };
  return                  { bg: "#FEE2E2", text: "#DC2626", label: "Failing",       grade: "F" };
}

// ---------------------------------------------------------------------------
// Data Visualisation Palette (Section 15)
// Use in the exact order listed. Never mix categorical + sequential.
// ---------------------------------------------------------------------------
export const chartColors = {
  /** Ordered categorical palette — use for multi-series bar/line/pie */
  categorical: [
    "#16A34A", // 1 — Attendance present / fees paid / pass
    "#1E3A8A", // 2 — Second series / enrolment count
    "#F59E0B", // 3 — Pending / partial / in-progress
    "#7C3AED", // 4 — Student metrics, assignments
    "#0D9488", // 5 — Parent engagement, communication
    "#DC2626", // 6 — Absent / overdue / failed (use last)
  ] as const,

  /** Sequential palette — for heatmaps, attendance grids, performance maps */
  sequential: [
    "#FEE2E2", // Very Low  0–40%
    "#FEF9C3", // Low       41–60%
    "#FDE68A", // Medium    61–70%
    "#DCFCE7", // Good      71–85%
    "#16A34A", // Excellent 86–100%
  ] as const,

  grid:         "#E2E8F0",
  axis:         "#64748B",
  tooltip_bg:   "#1E293B",
  tooltip_text: "#F1F5F9",
} as const;

// ---------------------------------------------------------------------------
// Semantic Alert Config (Section 14)
// ---------------------------------------------------------------------------
export const alertConfig = {
  success: {
    bg:      "bg-success-bg",
    border:  "border-success",
    heading: "text-[#166534]",
    body:    "text-[#14532D]",
  },
  warning: {
    bg:      "bg-warning-bg",
    border:  "border-warning",
    heading: "text-[#92400E]",
    body:    "text-[#78350F]",
  },
  danger: {
    bg:      "bg-danger-bg",
    border:  "border-danger",
    heading: "text-[#991B1B]",
    body:    "text-[#7F1D1D]",
  },
  info: {
    bg:      "bg-info-bg",
    border:  "border-info",
    heading: "text-[#1E40AF]",
    body:    "text-[#1E3A8A]",
  },
} as const;

export type AlertVariant = keyof typeof alertConfig;

// ---------------------------------------------------------------------------
// Payment UI helpers (Section 16)
// ---------------------------------------------------------------------------
export const paymentColors = {
  pageBg:      "#F8FAFC",
  cardBg:      "#FFFFFF",
  payButton:   "#16A34A",
  amount:      "#1E293B",
  successBg:   "#DCFCE7",
  pendingBg:   "#FEF9C3",
  failedBg:    "#FEE2E2",
  secureIcon:  "#16A34A",
  reference:   "#64748B",
} as const;

// ---------------------------------------------------------------------------
// Design Token Reference (CSS custom properties — for use in inline styles)
// ---------------------------------------------------------------------------
export const tokens = {
  primary:        "var(--em-primary)",
  primaryLight:   "var(--em-primary-light)",
  primaryDark:    "var(--em-primary-dark)",
  primaryOverlay: "var(--em-primary-10)",
  accent:         "var(--em-accent)",
  accentLight:    "var(--em-accent-light)",
  accentDark:     "var(--em-accent-dark)",
  info:           "var(--em-info)",
  infoBg:         "var(--em-info-bg)",
  success:        "var(--em-success)",
  successBg:      "var(--em-success-bg)",
  warning:        "var(--em-warning)",
  warningBg:      "var(--em-warning-bg)",
  danger:         "var(--em-danger)",
  dangerBg:       "var(--em-danger-bg)",
  textPrimary:    "var(--em-text-primary)",
  textSecondary:  "var(--em-text-secondary)",
  textDisabled:   "var(--em-text-disabled)",
  textInverse:    "var(--em-text-inverse)",
  bgBase:         "var(--em-bg-base)",
  bgSubtle:       "var(--em-bg-subtle)",
  bgMuted:        "var(--em-bg-muted)",
  border:         "var(--em-border)",
  borderStrong:   "var(--em-border-strong)",
  shadowSm:       "var(--em-shadow-sm)",
  shadowMd:       "var(--em-shadow-md)",
  shadowLg:       "var(--em-shadow-lg)",
  shadowXl:       "var(--em-shadow-xl)",
} as const;
