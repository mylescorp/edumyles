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
  "super-admin":    { bg: "var(--platform-chrome)", text: "var(--primary-foreground)", light: "var(--muted)" },
  "school-admin":   { bg: "var(--primary)", text: "var(--primary-foreground)", light: "var(--accent)" },
  teacher:          { bg: "var(--success)", text: "var(--success-foreground)", light: "var(--success-muted)" },
  "finance-officer":{ bg: "var(--warning)", text: "var(--warning-foreground)", light: "var(--warning-muted)" },
  parent:           { bg: "var(--info)", text: "var(--info-foreground)", light: "var(--info-muted)" },
  student:          { bg: "var(--accent-foreground)", text: "var(--primary-foreground)", light: "var(--accent)" },
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
  if (score >= 90) return { bg: "var(--success)", text: "var(--success-foreground)", label: "Excellent", grade: "A" };
  if (score >= 80) return { bg: "var(--success-muted)", text: "var(--success-muted-foreground)", label: "Good", grade: "B" };
  if (score >= 70) return { bg: "var(--warning-muted)", text: "var(--warning-muted-foreground)", label: "Average", grade: "C" };
  if (score >= 60) return { bg: "var(--warning)", text: "var(--warning-foreground)", label: "Below Average", grade: "D" };
  return { bg: "var(--danger)", text: "var(--danger-foreground)", label: "Poor", grade: "F" };
}

// ---------------------------------------------------------------------------
// Currency and Date Formatting Utilities
// ---------------------------------------------------------------------------
export function formatCurrency(amount: number, currency: string = "KES"): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return "Just now";
}

// ---------------------------------------------------------------------------
// Data Visualisation Palette (Section 15)
// Use in the exact order listed. Never mix categorical + sequential.
// ---------------------------------------------------------------------------
export const chartColors = {
  /** Ordered categorical palette — use for multi-series bar/line/pie */
  categorical: [
    "var(--success)",
    "var(--primary)",
    "var(--warning)",
    "var(--info)",
    "var(--accent-foreground)",
    "var(--danger)",
  ] as const,

  /** Sequential palette — for heatmaps, attendance grids, performance maps */
  sequential: [
    "var(--danger-muted)",
    "var(--warning-muted)",
    "var(--warning-muted-foreground)",
    "var(--success-muted)",
    "var(--success)",
  ] as const,

  grid:         "var(--border)",
  axis:         "var(--muted-foreground)",
  tooltip_bg:   "var(--popover)",
  tooltip_text: "var(--popover-foreground)",
} as const;

// ---------------------------------------------------------------------------
// Semantic Alert Config (Section 14)
// ---------------------------------------------------------------------------
export const alertConfig = {
  success: {
    bg:      "bg-success-muted",
    border:  "border-success",
    heading: "text-success-muted-foreground",
    body:    "text-success-muted-foreground",
  },
  warning: {
    bg:      "bg-warning-muted",
    border:  "border-warning",
    heading: "text-warning-muted-foreground",
    body:    "text-warning-muted-foreground",
  },
  danger: {
    bg:      "bg-danger-muted",
    border:  "border-danger",
    heading: "text-danger-muted-foreground",
    body:    "text-danger-muted-foreground",
  },
  info: {
    bg:      "bg-info-muted",
    border:  "border-info",
    heading: "text-info-muted-foreground",
    body:    "text-info-muted-foreground",
  },
} as const;

export type AlertVariant = keyof typeof alertConfig;

// ---------------------------------------------------------------------------
// Payment UI helpers (Section 16)
// ---------------------------------------------------------------------------
export const paymentColors = {
  pageBg:      "var(--background)",
  cardBg:      "var(--card)",
  payButton:   "var(--success)",
  amount:      "var(--foreground)",
  successBg:   "var(--success-muted)",
  pendingBg:   "var(--warning-muted)",
  failedBg:    "var(--danger-muted)",
  secureIcon:  "var(--success)",
  reference:   "var(--muted-foreground)",
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
