const MODULE_ALIAS_MAP: Record<string, string[]> = {
  core_sis: ["sis"],
  core_users: ["users"],
  core_notifications: ["communications", "notifications"],
  mod_academics: ["academics"],
  mod_attendance: ["attendance"],
  mod_admissions: ["admissions"],
  mod_finance: ["finance"],
  mod_timetable: ["timetable"],
  mod_library: ["library"],
  mod_transport: ["transport"],
  mod_hr: ["hr"],
  mod_communications: ["communications"],
  mod_ewallet: ["ewallet"],
  mod_ecommerce: ["ecommerce"],
  mod_reports: ["reports"],
  mod_advanced_analytics: ["advanced_analytics", "analytics"],
  mod_parent_portal: ["parent_portal"],
  mod_alumni: ["alumni"],
  mod_partner: ["partner"],
  mod_social: ["social"],
  mod_tickets: ["tickets"],
};

const LEGACY_TO_SPEC_MAP = Object.entries(MODULE_ALIAS_MAP).reduce<Record<string, string>>(
  (accumulator, [canonicalSlug, aliases]) => {
    accumulator[canonicalSlug] = canonicalSlug;
    for (const alias of aliases) {
      accumulator[alias] = canonicalSlug;
    }
    return accumulator;
  },
  {}
);

export const CORE_MODULE_SLUGS = ["core_sis", "core_users", "core_notifications"] as const;
export const CORE_MODULE_ALIASES = ["sis", "users", "communications", "notifications"] as const;

export function normalizeModuleSlug(moduleSlug?: string | null) {
  if (!moduleSlug) {
    return null;
  }

  return LEGACY_TO_SPEC_MAP[moduleSlug] ?? moduleSlug;
}

export function getModuleAliases(moduleSlug?: string | null) {
  const canonicalSlug = normalizeModuleSlug(moduleSlug);
  if (!canonicalSlug) {
    return [];
  }

  return [canonicalSlug, ...(MODULE_ALIAS_MAP[canonicalSlug] ?? [])];
}

export function isCoreModuleSlug(moduleSlug?: string | null) {
  const canonicalSlug = normalizeModuleSlug(moduleSlug);
  return canonicalSlug ? CORE_MODULE_SLUGS.includes(canonicalSlug as (typeof CORE_MODULE_SLUGS)[number]) : false;
}
