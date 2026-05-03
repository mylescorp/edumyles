import { ALL_MODULES, CORE_MODULE_IDS } from "./moduleDefinitions";

const LEGACY_TO_CANONICAL_SLUG: Record<string, string> = {
  sis: "core_sis",
  users: "core_users",
  notifications: "core_notifications",
  communications: "core_notifications",
  admissions: "mod_admissions",
  academics: "mod_academics",
  attendance: "mod_attendance",
  finance: "mod_finance",
  timetable: "mod_timetable",
  library: "mod_library",
  transport: "mod_transport",
  hr: "mod_hr",
  ewallet: "mod_ewallet",
  ecommerce: "mod_ecommerce",
  reports: "mod_reports",
  analytics: "mod_advanced_analytics",
  advanced_analytics: "mod_advanced_analytics",
  parent_portal: "mod_parent_portal",
  portal_parent: "mod_parent_portal",
  alumni: "mod_alumni",
  portal_alumni: "mod_alumni",
  partner: "mod_partner",
  portal_partner: "mod_partner",
  social: "mod_social",
  tickets: "mod_tickets",
};

const CANONICAL_SLUG_TO_LEGACY_ID: Record<string, string> = {
  core_sis: "sis",
  core_users: "users",
  core_notifications: "communications",
  mod_admissions: "admissions",
  mod_academics: "academics",
  mod_attendance: "attendance",
  mod_finance: "finance",
  mod_timetable: "timetable",
  mod_library: "library",
  mod_transport: "transport",
  mod_hr: "hr",
  mod_ewallet: "ewallet",
  mod_ecommerce: "ecommerce",
  mod_reports: "reports",
  mod_advanced_analytics: "advanced_analytics",
  mod_parent_portal: "parent_portal",
  mod_alumni: "alumni",
  mod_partner: "partner",
  mod_social: "social",
  mod_tickets: "tickets",
};

for (const slug of Object.keys(CANONICAL_SLUG_TO_LEGACY_ID)) {
  LEGACY_TO_CANONICAL_SLUG[slug] = slug;
}

export function normalizeModuleSlug(moduleSlugOrId: string) {
  return LEGACY_TO_CANONICAL_SLUG[moduleSlugOrId] ?? moduleSlugOrId;
}

export function toLegacyModuleId(moduleSlugOrId: string) {
  return CANONICAL_SLUG_TO_LEGACY_ID[moduleSlugOrId] ?? moduleSlugOrId;
}

export function isCoreModuleSlug(moduleSlugOrId: string) {
  return normalizeModuleSlug(moduleSlugOrId).startsWith("core_");
}

export function getBuiltinDefinition(moduleSlugOrId: string) {
  const legacyId = toLegacyModuleId(normalizeModuleSlug(moduleSlugOrId));
  return ALL_MODULES.find((moduleDefinition) => moduleDefinition.moduleId === legacyId) ?? null;
}

export function getBuiltinDefinitionBySlug(moduleSlug: string) {
  return getBuiltinDefinition(moduleSlug);
}

export function getCanonicalDependencies(moduleSlugOrId: string) {
  const definition = getBuiltinDefinition(moduleSlugOrId);
  return (definition?.dependencies ?? []).map(normalizeModuleSlug);
}

export function getCanonicalTierModules(tierModuleIds: string[]) {
  return tierModuleIds.map(normalizeModuleSlug);
}

export function getCoreModuleSlugs() {
  return CORE_MODULE_IDS.map(normalizeModuleSlug);
}

export function getAllBuiltinModuleSlugs() {
  return ALL_MODULES.map((moduleDefinition) => normalizeModuleSlug(moduleDefinition.moduleId));
}
