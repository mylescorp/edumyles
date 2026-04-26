export const DEV_PANEL_ALLOWED_ROLES = [
  "master_admin",
  "super_admin",
  "platform_manager",
  "support_agent",
  "billing_admin",
  "marketplace_reviewer",
  "content_moderator",
  "analytics_viewer",
] as const;

export const DEV_PANEL_PRIVILEGED_ROLES = [
  "master_admin",
  "super_admin",
] as const;

export type DevPanelAllowedRole = (typeof DEV_PANEL_ALLOWED_ROLES)[number];

export function normalizeDevRole(role: string | null | undefined) {
  if (role === "platform_admin") return "super_admin";
  return role ?? null;
}

export function canAccessDevPanel(role: string | null | undefined) {
  const normalizedRole = normalizeDevRole(role);
  return normalizedRole ? DEV_PANEL_ALLOWED_ROLES.includes(normalizedRole as DevPanelAllowedRole) : false;
}

export function canRunPrivilegedDevActions(role: string | null | undefined) {
  const normalizedRole = normalizeDevRole(role);
  return normalizedRole ? DEV_PANEL_PRIVILEGED_ROLES.includes(normalizedRole as (typeof DEV_PANEL_PRIVILEGED_ROLES)[number]) : false;
}
