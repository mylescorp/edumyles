/**
 * Single source of truth for which modules are available per subscription tier.
 * Imported by queries.ts and mutations.ts — never duplicate this mapping.
 */
export const TIER_MODULES: Record<string, string[]> = {
  free: ["sis", "communications"],
  starter: ["sis", "admissions", "finance", "communications"],
  standard: [
    "sis",
    "admissions",
    "finance",
    "timetable",
    "academics",
    "communications",
  ],
  growth: [
    "sis",
    "admissions",
    "finance",
    "timetable",
    "academics",
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
