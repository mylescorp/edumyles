import { query, mutation, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { logAction } from "../../helpers/auditLog";
import { idGenerator } from "../../helpers/idGenerator";

const PLATFORM_INVITE_EXPIRY_MS = 72 * 60 * 60 * 1000;

type PermissionDefinition = {
  key: string;
  label: string;
  description: string;
};

type RoleSeed = {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  permissions: string[];
};

const PERMISSION_CATALOG: Record<string, PermissionDefinition[]> = {
  "Tenant Management": [
    { key: "tenants.view", label: "View tenants", description: "See tenant list and basic info." },
    { key: "tenants.view_details", label: "View tenant details", description: "See full tenant detail including contacts." },
    { key: "tenants.create", label: "Create tenants", description: "Create new tenant organizations." },
    { key: "tenants.edit", label: "Edit tenants", description: "Edit tenant profile and commercial data." },
    { key: "tenants.suspend", label: "Suspend tenants", description: "Suspend tenant access." },
    { key: "tenants.unsuspend", label: "Unsuspend tenants", description: "Restore suspended tenant access." },
    { key: "tenants.delete", label: "Delete tenants", description: "Permanently delete tenant records." },
    { key: "tenants.impersonate", label: "Impersonate tenant users", description: "Impersonate users within a tenant." },
    { key: "tenants.export", label: "Export tenant data", description: "Export tenant-level data sets." },
    { key: "tenants.view_finance", label: "View tenant finance", description: "View invoices, balances, and collections." },
    { key: "tenants.manage_finance", label: "Manage tenant finance", description: "Create, mark paid, void, and refund invoices." },
    { key: "tenants.manage_subscription", label: "Manage subscriptions", description: "Change plan, trial, pause, or cancel." },
    { key: "tenants.manage_modules", label: "Manage modules", description: "Install and configure tenant modules." },
    { key: "tenants.manage_users", label: "Manage tenant users", description: "View, suspend, and reset tenant users." },
    { key: "tenants.manage_settings", label: "Manage tenant settings", description: "Edit tenant-specific settings." },
    { key: "tenants.manage_pilot_grants", label: "Manage pilot grants", description: "Grant and revoke pilot access." },
    { key: "tenants.grant_permanent_free", label: "Grant permanent free", description: "Grant permanent free access to a tenant." },
    { key: "tenants.set_custom_pricing", label: "Set custom pricing", description: "Override pricing for a specific tenant." },
    { key: "tenants.gdpr_export", label: "Trigger GDPR export", description: "Generate data-subject export packages." },
  ],
  "Platform Users": [
    { key: "platform_users.view", label: "View staff", description: "See platform staff list and invites." },
    { key: "platform_users.invite", label: "Invite staff", description: "Invite platform staff through WorkOS." },
    { key: "platform_users.edit_role", label: "Edit staff roles", description: "Change another user's role." },
    { key: "platform_users.edit_permissions", label: "Edit permission overrides", description: "Add or remove user-level permission overrides." },
    { key: "platform_users.suspend", label: "Suspend staff", description: "Suspend a platform staff account." },
    { key: "platform_users.delete", label: "Delete staff", description: "Delete a platform staff account." },
    { key: "platform_users.view_activity", label: "View staff activity", description: "See staff activity logs." },
  ],
  Marketplace: [
    { key: "marketplace.view", label: "View marketplace", description: "See marketplace dashboard and module list." },
    { key: "marketplace.review_modules", label: "Review modules", description: "Approve, reject, or request changes." },
    { key: "marketplace.suspend_module", label: "Suspend modules", description: "Suspend published modules." },
    { key: "marketplace.ban_module", label: "Ban modules", description: "Permanently ban marketplace modules." },
    { key: "marketplace.feature_module", label: "Feature modules", description: "Mark modules as featured." },
    { key: "marketplace.override_price", label: "Override module price", description: "Set platform price for a module." },
    { key: "marketplace.manage_flags", label: "Manage flags", description: "Investigate and resolve marketplace flags." },
    { key: "marketplace.manage_reviews", label: "Manage reviews", description: "Moderate marketplace reviews." },
    { key: "marketplace.manage_pilot_grants", label: "Manage pilot grants", description: "Create, extend, and revoke pilot grants." },
    { key: "marketplace.bulk_pilot_grants", label: "Bulk pilot grants", description: "Bulk grant pilot access." },
    { key: "marketplace.manage_pricing", label: "Manage pricing", description: "Edit global pricing rules." },
  ],
  Publishers: [
    { key: "publishers.view", label: "View publishers", description: "See publisher list and profiles." },
    { key: "publishers.approve", label: "Approve publishers", description: "Approve publisher applications." },
    { key: "publishers.reject", label: "Reject publishers", description: "Reject publisher applications." },
    { key: "publishers.suspend", label: "Suspend publishers", description: "Suspend publisher access." },
    { key: "publishers.ban", label: "Ban publishers", description: "Permanently ban publishers." },
    { key: "publishers.manage_revenue_share", label: "Manage revenue share", description: "Change publisher revenue share." },
    { key: "publishers.manage_tier", label: "Manage publisher tier", description: "Change publisher tier." },
    { key: "publishers.process_payouts", label: "Process publisher payouts", description: "Process publisher payouts." },
    { key: "publishers.view_payouts", label: "View publisher payouts", description: "View publisher payout history." },
  ],
  Billing: [
    { key: "billing.view_dashboard", label: "View billing dashboard", description: "See billing overview stats." },
    { key: "billing.view_invoices", label: "View invoices", description: "See all invoices." },
    { key: "billing.manage_invoices", label: "Manage invoices", description: "Mark paid, void, refund, and create invoices." },
    { key: "billing.view_subscriptions", label: "View subscriptions", description: "See all subscriptions." },
    { key: "billing.manage_subscriptions", label: "Manage subscriptions", description: "Change, cancel, or pause subscriptions." },
    { key: "billing.view_reports", label: "View billing reports", description: "See revenue reports." },
    { key: "billing.export_reports", label: "Export reports", description: "Download financial exports." },
    { key: "billing.manage_plans", label: "Manage plans", description: "Create and edit subscription plans." },
    { key: "billing.view_publisher_payouts", label: "View publisher payouts", description: "See publisher payout data." },
    { key: "billing.process_payouts", label: "Process payouts", description: "Process publisher and reseller payouts." },
  ],
  CRM: [
    { key: "crm.view", label: "View CRM", description: "See CRM dashboard and leads." },
    { key: "crm.create_lead", label: "Create leads", description: "Add new leads." },
    { key: "crm.edit_lead", label: "Edit leads", description: "Edit lead details and stage." },
    { key: "crm.assign_lead", label: "Assign leads", description: "Assign leads to other managers." },
    { key: "crm.delete_lead", label: "Delete leads", description: "Delete leads." },
    { key: "crm.create_proposal", label: "Create proposals", description: "Create and send proposals." },
    { key: "crm.convert_to_tenant", label: "Convert to tenant", description: "Convert a won deal to a tenant." },
  ],
  Communications: [
    { key: "communications.view", label: "View communications", description: "See broadcast history." },
    { key: "communications.send_broadcast", label: "Send broadcasts", description: "Send broadcasts to tenants." },
    { key: "communications.send_sms", label: "Send SMS broadcasts", description: "Include SMS in broadcasts." },
    { key: "communications.manage_templates", label: "Manage templates", description: "Edit platform communication templates." },
    { key: "communications.view_logs", label: "View delivery logs", description: "See SMS and email delivery logs." },
    { key: "communications.manage_announcements", label: "Manage announcements", description: "Create and publish platform announcements." },
  ],
  "Knowledge Base": [
    { key: "knowledge_base.view", label: "View knowledge base", description: "See all knowledge base articles." },
    { key: "knowledge_base.create", label: "Create articles", description: "Create knowledge base articles." },
    { key: "knowledge_base.edit", label: "Edit articles", description: "Edit knowledge base articles." },
    { key: "knowledge_base.publish", label: "Publish articles", description: "Publish and unpublish knowledge base articles." },
    { key: "knowledge_base.delete", label: "Delete articles", description: "Delete knowledge base articles." },
  ],
  Analytics: [
    { key: "analytics.view_platform", label: "View platform analytics", description: "See usage analytics." },
    { key: "analytics.view_business", label: "View business analytics", description: "See revenue and commercial analytics." },
    { key: "analytics.export", label: "Export analytics", description: "Export analytics and reports." },
    { key: "analytics.manage_reports", label: "Manage scheduled reports", description: "Create and manage scheduled reports." },
  ],
  Security: [
    { key: "security.view_dashboard", label: "View security dashboard", description: "See security dashboard." },
    { key: "security.view_audit_log", label: "View audit log", description: "See the full audit log." },
    { key: "security.export_audit_log", label: "Export audit log", description: "Export audit log entries." },
    { key: "security.manage_api_keys", label: "Manage API keys", description: "Create and revoke platform API keys." },
    { key: "security.manage_webhooks", label: "Manage webhooks", description: "Manage platform webhooks." },
    { key: "security.flag_audit_entries", label: "Flag audit entries", description: "Flag suspicious audit entries." },
  ],
  Settings: [
    { key: "settings.view", label: "View settings", description: "See platform settings." },
    { key: "settings.edit_general", label: "Edit general settings", description: "Edit general, branding, and domain settings." },
    { key: "settings.edit_email", label: "Edit email settings", description: "Edit email configuration." },
    { key: "settings.edit_sms", label: "Edit SMS settings", description: "Edit SMS configuration." },
    { key: "settings.edit_payments", label: "Edit payment settings", description: "Edit payment provider configuration." },
    { key: "settings.edit_security", label: "Edit security settings", description: "Edit platform security settings." },
    { key: "settings.edit_integrations", label: "Edit integrations", description: "Edit third-party integrations." },
    { key: "settings.maintenance_mode", label: "Toggle maintenance mode", description: "Enable or disable maintenance mode." },
    { key: "settings.manage_feature_flags", label: "Manage feature flags", description: "Enable or disable feature flags." },
    { key: "settings.manage_sla", label: "Manage SLA", description: "Configure SLA tiers." },
  ],
  Support: [
    { key: "support.view", label: "View support tickets", description: "See support tickets." },
    { key: "support.assign", label: "Assign support tickets", description: "Assign tickets to staff." },
    { key: "support.reply", label: "Reply to tickets", description: "Reply to support tickets." },
    { key: "support.close", label: "Close tickets", description: "Resolve or close support tickets." },
    { key: "support.escalate", label: "Escalate tickets", description: "Escalate support tickets." },
    { key: "support.view_internal_notes", label: "View internal notes", description: "See internal notes on tickets." },
  ],
  "Waitlist & Onboarding": [
    { key: "waitlist.view", label: "View waitlist", description: "See waitlist entries." },
    { key: "waitlist.invite", label: "Invite from waitlist", description: "Invite prospects from waitlist." },
    { key: "waitlist.reject", label: "Reject waitlist entries", description: "Reject waitlist entries." },
    { key: "onboarding.view", label: "View onboarding", description: "See tenant onboarding status." },
    { key: "onboarding.manage", label: "Manage onboarding", description: "Extend trials and intervene in onboarding." },
  ],
  Resellers: [
    { key: "resellers.view", label: "View resellers", description: "See reseller list and profiles." },
    { key: "resellers.approve", label: "Approve resellers", description: "Approve reseller applications." },
    { key: "resellers.reject", label: "Reject resellers", description: "Reject reseller applications." },
    { key: "resellers.manage_tier", label: "Manage reseller tier", description: "Change reseller tier." },
    { key: "resellers.manage_commission", label: "Manage reseller commission", description: "Change reseller commission percentage." },
    { key: "resellers.suspend", label: "Suspend resellers", description: "Suspend reseller access." },
    { key: "resellers.terminate", label: "Terminate resellers", description: "Terminate reseller relationship." },
    { key: "resellers.process_payouts", label: "Process reseller payouts", description: "Process reseller payouts." },
    { key: "resellers.manage_materials", label: "Manage reseller materials", description: "Upload and archive reseller materials." },
    { key: "resellers.manage_directory", label: "Manage reseller directory", description: "Approve or reject directory listings." },
    { key: "resellers.manage_tiers_config", label: "Manage reseller tiers config", description: "Edit reseller tier configuration." },
  ],
  "Staff Performance": [
    { key: "staff_performance.view", label: "View all staff performance", description: "See all staff performance." },
    { key: "staff_performance.view_own", label: "View own performance", description: "See own performance only." },
    { key: "staff_performance.add_notes", label: "Add performance notes", description: "Add staff evaluation notes." },
  ],
  "Project Management": [
    { key: "pm.view", label: "View PM", description: "See PM workspaces." },
    { key: "pm.create", label: "Create PM items", description: "Create PM workspaces and projects." },
    { key: "pm.manage", label: "Manage PM", description: "Full PM management." },
  ],
};

export const ALL_PLATFORM_PERMISSIONS = Object.values(PERMISSION_CATALOG)
  .flat()
  .map((permission) => permission.key);

export const SYSTEM_ROLE_SEEDS: Record<string, RoleSeed> = {
  master_admin: {
    name: "Master Admin",
    slug: "master_admin",
    description: "Full unrestricted platform control.",
    color: "#D97706",
    icon: "crown",
    permissions: ["*"],
  },
  super_admin: {
    name: "Super Admin",
    slug: "super_admin",
    description: "Platform-wide operations with a few destructive controls withheld.",
    color: "#0F766E",
    icon: "shield-check",
    permissions: [
      "tenants.view", "tenants.view_details", "tenants.create", "tenants.edit",
      "tenants.suspend", "tenants.unsuspend", "tenants.impersonate", "tenants.export",
      "tenants.view_finance", "tenants.manage_finance", "tenants.manage_subscription",
      "tenants.manage_modules", "tenants.manage_users", "tenants.manage_settings",
      "tenants.manage_pilot_grants", "tenants.gdpr_export",
      "platform_users.view", "platform_users.invite", "platform_users.edit_role",
      "platform_users.edit_permissions", "platform_users.suspend", "platform_users.view_activity",
      "marketplace.view", "marketplace.review_modules", "marketplace.suspend_module",
      "marketplace.feature_module", "marketplace.manage_flags", "marketplace.manage_reviews",
      "marketplace.manage_pilot_grants", "marketplace.manage_pricing",
      "billing.view_dashboard", "billing.view_invoices", "billing.manage_invoices",
      "billing.view_subscriptions", "billing.manage_subscriptions",
      "crm.view", "crm.create_lead", "crm.edit_lead", "crm.assign_lead", "crm.delete_lead", "crm.create_proposal", "crm.convert_to_tenant",
      "communications.view", "communications.send_broadcast", "communications.view_logs", "communications.manage_announcements",
      "knowledge_base.view", "knowledge_base.create", "knowledge_base.edit", "knowledge_base.publish",
      "analytics.view_platform", "analytics.view_business", "analytics.export", "analytics.manage_reports",
      "security.view_dashboard", "security.view_audit_log", "security.manage_webhooks",
      "settings.view", "settings.edit_general", "settings.edit_email", "settings.edit_sms", "settings.edit_integrations", "settings.manage_feature_flags", "settings.manage_sla",
      "support.view", "support.assign", "support.reply", "support.close", "support.escalate", "support.view_internal_notes",
      "waitlist.view", "waitlist.invite", "waitlist.reject", "onboarding.view", "onboarding.manage",
      "staff_performance.view", "staff_performance.add_notes",
      "pm.view", "pm.create", "pm.manage",
    ],
  },
  platform_manager: {
    name: "Platform Manager",
    slug: "platform_manager",
    description: "Runs day-to-day platform operations.",
    color: "#2563EB",
    icon: "briefcase",
    permissions: [
      "tenants.view", "tenants.view_details", "tenants.create", "tenants.edit",
      "tenants.suspend", "tenants.unsuspend", "tenants.export",
      "tenants.manage_subscription", "tenants.manage_modules", "tenants.manage_users", "tenants.manage_pilot_grants",
      "platform_users.view",
      "marketplace.view", "marketplace.feature_module", "marketplace.manage_pilot_grants",
      "crm.view", "crm.create_lead", "crm.edit_lead", "crm.assign_lead", "crm.create_proposal", "crm.convert_to_tenant",
      "communications.view", "communications.send_broadcast", "communications.manage_announcements",
      "knowledge_base.view", "knowledge_base.create", "knowledge_base.edit",
      "analytics.view_platform",
      "support.view", "support.assign", "support.reply",
      "waitlist.view", "waitlist.invite", "waitlist.reject", "onboarding.view", "onboarding.manage",
      "staff_performance.view_own",
      "pm.view", "pm.create",
    ],
  },
  support_agent: {
    name: "Support Agent",
    slug: "support_agent",
    description: "Handles operational and customer support work.",
    color: "#059669",
    icon: "life-buoy",
    permissions: [
      "tenants.view", "tenants.view_details", "tenants.manage_users",
      "knowledge_base.view", "knowledge_base.create", "knowledge_base.edit",
      "communications.view", "communications.send_broadcast", "communications.manage_announcements",
      "support.view", "support.assign", "support.reply", "support.close", "support.view_internal_notes",
      "onboarding.view", "staff_performance.view_own", "pm.view",
    ],
  },
  billing_admin: {
    name: "Billing Admin",
    slug: "billing_admin",
    description: "Owns commercial and payout workflows.",
    color: "#7C3AED",
    icon: "credit-card",
    permissions: [
      "tenants.view", "tenants.view_details", "tenants.view_finance", "tenants.manage_finance", "tenants.manage_subscription",
      "billing.view_dashboard", "billing.view_invoices", "billing.manage_invoices", "billing.view_subscriptions", "billing.manage_subscriptions", "billing.view_reports", "billing.export_reports", "billing.view_publisher_payouts", "billing.process_payouts",
      "analytics.view_business", "analytics.export", "staff_performance.view_own",
    ],
  },
  marketplace_reviewer: {
    name: "Marketplace Reviewer",
    slug: "marketplace_reviewer",
    description: "Moderates publisher and module submissions.",
    color: "#EA580C",
    icon: "store",
    permissions: [
      "marketplace.view", "marketplace.review_modules", "marketplace.feature_module", "marketplace.manage_reviews",
      "knowledge_base.view", "staff_performance.view_own", "pm.view",
    ],
  },
  content_moderator: {
    name: "Content Moderator",
    slug: "content_moderator",
    description: "Moderates reviews, flags, and knowledge content.",
    color: "#DC2626",
    icon: "shield-alert",
    permissions: [
      "marketplace.view", "marketplace.manage_flags", "marketplace.manage_reviews",
      "knowledge_base.view", "knowledge_base.create", "knowledge_base.edit", "knowledge_base.publish",
      "staff_performance.view_own",
    ],
  },
  analytics_viewer: {
    name: "Analytics Viewer",
    slug: "analytics_viewer",
    description: "Read-heavy business and usage analytics access.",
    color: "#0891B2",
    icon: "bar-chart-3",
    permissions: ["analytics.view_platform", "analytics.view_business", "analytics.export", "analytics.manage_reports", "tenants.view", "billing.view_dashboard", "staff_performance.view_own"],
  },
};

function slugifyRoleName(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function dedupePermissions(permissions: string[]) {
  return [...new Set(permissions.filter(Boolean))].sort();
}

async function getSessionIdentity(ctx: any, sessionToken?: string) {
  console.log("getSessionIdentity called with:", {
    sessionToken: sessionToken ? "present" : "missing",
    sessionTokenLength: sessionToken?.length
  });

  if (!sessionToken) {
    console.log("No session token provided");
    return null;
  }

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("sessionToken", sessionToken))
    .first();

  console.log("Session lookup result:", session ? "found" : "not found");
  if (session) {
    console.log("Session details:", {
      userId: session.userId,
      email: session.email,
      role: session.role,
      expiresAt: session.expiresAt,
      isExpired: session.expiresAt < Date.now()
    });
  }

  if (!session) throw new Error("UNAUTHENTICATED: Session not found");
  if (session.expiresAt < Date.now()) throw new Error("UNAUTHENTICATED: Session expired");

  const userRow = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q: any) => q.eq("eduMylesUserId", session.userId))
    .first();

  const masterAdminWorkosUserId = process.env.MASTER_ADMIN_WORKOS_USER_ID?.trim();
  const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL?.trim().toLowerCase();
  const isConfiguredMasterAdmin =
    Boolean(masterAdminWorkosUserId && userRow?.workosUserId === masterAdminWorkosUserId) ||
    Boolean(masterAdminEmail && session.email?.toLowerCase() === masterAdminEmail);

  return {
    userId: userRow?.workosUserId ?? session.userId,
    eduMylesUserId: session.userId,
    workosUserId: userRow?.workosUserId,
    email: session.email ?? userRow?.email ?? "",
    sessionRole: isConfiguredMasterAdmin
      ? "master_admin"
      : session.role === "platform_admin"
        ? "super_admin"
        : session.role,
    tenantId: session.tenantId,
  };
}

async function getRoleDefinition(ctx: any, slug: string) {
  const dbRole = await ctx.db
    .query("platform_roles")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .unique();

  if (dbRole) return dbRole;

  const seed = SYSTEM_ROLE_SEEDS[slug];
  if (!seed) return null;

  return {
    _id: undefined,
    ...seed,
    baseRole: undefined,
    isSystem: true,
    isActive: true,
    createdBy: "system",
    createdAt: 0,
    updatedAt: 0,
  };
}

async function getPlatformUserBySubject(ctx: any, subject: string) {
  return await ctx.db
    .query("platform_users")
    .withIndex("by_userId", (q: any) => q.eq("userId", subject))
    .unique();
}

async function getPlatformUserByDocIdOrThrow(ctx: any, docId: any) {
  const platformUser = await ctx.db.get(docId);
  if (!platformUser) throw new Error("Platform user not found");
  return platformUser;
}

async function countActiveRoleUsers(ctx: any, roleSlug: string) {
  const users = await ctx.db
    .query("platform_users")
    .withIndex("by_role", (q: any) => q.eq("role", roleSlug))
    .collect();

  return users.filter((user: any) => user.status === "active").length;
}

async function getDetailedPlatformUser(ctx: any, platformUser: any) {
  const [profileByWorkos, profileByEduMylesId, session] = await Promise.all([
    ctx.db
      .query("users")
      .withIndex("by_workos_user", (q: any) => q.eq("workosUserId", platformUser.userId))
      .first(),
    ctx.db
      .query("users")
      .withIndex("by_user_id", (q: any) => q.eq("eduMylesUserId", platformUser.userId))
      .first(),
    ctx.db
      .query("sessions")
      .withIndex("by_userId", (q: any) => q.eq("userId", platformUser.userId))
      .first(),
  ]);

  const profile = profileByWorkos ?? profileByEduMylesId;
  return {
    ...platformUser,
    id: String(platformUser._id),
    email: profile?.email ?? session?.email ?? platformUser.userId,
    firstName: profile?.firstName,
    lastName: profile?.lastName,
    avatarUrl: profile?.avatarUrl,
  };
}

export async function getUserPermissions(ctx: any, userId: string): Promise<string[]> {
  const platformUser = await getPlatformUserBySubject(ctx, userId);

  if (!platformUser) return [];
  if (platformUser.status === "suspended") return [];
  if (platformUser.accessExpiresAt && platformUser.accessExpiresAt < Date.now()) return [];

  const role = await getRoleDefinition(ctx, platformUser.role);
  if (!role || !role.isActive) return [];
  if (platformUser.role === "master_admin" || role.permissions.includes("*")) return ["*"];

  return dedupePermissions([
    ...role.permissions,
    ...(platformUser.addedPermissions ?? []),
  ]).filter((permission) => !(platformUser.removedPermissions ?? []).includes(permission));
}

export function hasPermission(permissions: string[], permission: string) {
  return permissions.includes("*") || permissions.includes(permission);
}

export function checkScopeAccess(
  platformUser: { scopeCountries?: string[]; scopeTenantIds?: string[]; scopePlans?: string[] } | null | undefined,
  resource: { countryCode?: string; tenantId?: string; plan?: string }
) {
  if (!platformUser) return false;
  const countries = platformUser.scopeCountries ?? [];
  const tenantIds = platformUser.scopeTenantIds ?? [];
  const plans = platformUser.scopePlans ?? [];

  if (countries.length > 0 && resource.countryCode && !countries.includes(resource.countryCode)) return false;
  if (tenantIds.length > 0 && resource.tenantId && !tenantIds.includes(resource.tenantId)) return false;
  if (plans.length > 0 && resource.plan && !plans.includes(resource.plan)) return false;
  return true;
}

export async function requirePermission(ctx: any, permission: string, sessionToken?: string) {
  const identity = await getSessionIdentity(ctx, sessionToken);
  if (!identity) throw new Error("Unauthenticated");

  let platformUser = await getPlatformUserBySubject(ctx, identity.userId);
  if (!platformUser && identity.sessionRole === "master_admin") {
    platformUser = {
      _id: undefined,
      userId: identity.userId,
      role: "master_admin",
      department: "Platform",
      addedPermissions: [],
      removedPermissions: [],
      scopeCountries: [],
      scopeTenantIds: [],
      scopePlans: [],
      status: "active",
      accessExpiresAt: undefined,
      invitedBy: undefined,
      acceptedAt: undefined,
      lastLogin: undefined,
      notes: undefined,
      createdAt: 0,
      updatedAt: 0,
    };
  }

  if (!platformUser) throw new Error("UNAUTHORIZED: Platform access denied");
  if (platformUser.status === "suspended") throw new Error("FORBIDDEN: Platform staff account is suspended");
  if (platformUser.accessExpiresAt && platformUser.accessExpiresAt < Date.now()) {
    throw new Error("FORBIDDEN: Platform staff access has expired");
  }

  const permissions = platformUser.role === "master_admin" ? ["*"] : await getUserPermissions(ctx, identity.userId);
  if (!hasPermission(permissions, permission)) {
    throw new Error(`Permission denied: requires ${permission}`);
  }

  return {
    userId: identity.userId,
    email: identity.email,
    platformUser,
    permissions,
  };
}

async function writePermissionAuditLog(ctx: any, params: {
  targetUserId: string;
  changedBy: string;
  changeType: "role_changed" | "permission_added" | "permission_removed" | "scope_changed" | "access_expiry_set" | "account_suspended" | "account_unsuspended";
  previousValue: any;
  newValue: any;
  reason: string;
}) {
  await ctx.db.insert("permission_audit_log", {
    targetUserId: params.targetUserId,
    changedBy: params.changedBy,
    changeType: params.changeType,
    previousValue: JSON.stringify(params.previousValue ?? {}),
    newValue: JSON.stringify(params.newValue ?? {}),
    reason: params.reason,
    createdAt: Date.now(),
  });
}

async function createPlatformInviteRecord(
  ctx: any,
  actor: { userId: string; email?: string | null; permissions: string[] },
  args: {
    email: string;
    role: string;
    department?: string;
    addedPermissions?: string[];
    removedPermissions?: string[];
    scopeCountries?: string[];
    scopeTenantIds?: string[];
    scopePlans?: string[];
    accessExpiresAt?: number;
    notifyInviter?: boolean;
    personalMessage?: string;
  }
) {
  const normalizedEmail = args.email.trim().toLowerCase();
  const role = await getRoleDefinition(ctx, args.role);
  if (!role || !role.isActive) throw new Error("Invalid or inactive role");
  if (args.role === "master_admin" && !hasPermission(actor.permissions, "platform_users.delete")) {
    throw new Error("Only master admins can invite other master admins");
  }

  const [existingInvites, existingProfile] = await Promise.all([
    ctx.db
      .query("platform_user_invites")
      .withIndex("by_email", (q: any) => q.eq("email", normalizedEmail))
      .collect(),
    ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q: any) => q.eq("tenantId", "PLATFORM").eq("email", normalizedEmail))
      .first(),
  ]);

  if (existingProfile) throw new Error("A platform user with this email already exists");
  if (existingInvites.some((invite: any) => invite.status === "pending" && invite.expiresAt > Date.now())) {
    throw new Error("A pending invite already exists for this email");
  }

  const inviteId = await ctx.db.insert("platform_user_invites", {
    email: normalizedEmail,
    role: args.role,
    department: args.department?.trim() || undefined,
    addedPermissions: dedupePermissions(args.addedPermissions ?? []),
    removedPermissions: dedupePermissions(args.removedPermissions ?? []),
    scopeCountries: args.scopeCountries ?? [],
    scopeTenantIds: args.scopeTenantIds ?? [],
    scopePlans: args.scopePlans ?? [],
    accessExpiresAt: args.accessExpiresAt,
    invitedBy: actor.userId,
    token: idGenerator("platform_invite"),
    status: "pending",
    expiresAt: Date.now() + PLATFORM_INVITE_EXPIRY_MS,
    acceptedAt: undefined,
    notifyInviter: args.notifyInviter ?? true,
    personalMessage: args.personalMessage?.trim() || undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  await logAction(ctx, {
    tenantId: "PLATFORM",
    actorId: actor.userId,
    actorEmail: actor.email || "unknown@example.com",
    action: "user.invited",
    entityType: "platform_user_invite",
    entityId: String(inviteId),
    after: { email: normalizedEmail, role: args.role, department: args.department },
  });

  return { success: true, inviteId, email: normalizedEmail, roleName: role.name };
}

export const getPermissionCatalog = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "platform_users.view", args.sessionToken);
    return PERMISSION_CATALOG;
  },
});

export const getRoles = query({
  args: {
    sessionToken: v.string(),
    includeSystem: v.optional(v.boolean()),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    console.log("getRoles called with:", {
      sessionToken: args.sessionToken ? "present" : "missing",
      sessionTokenLength: args.sessionToken?.length,
      includeSystem: args.includeSystem,
      includeInactive: args.includeInactive
    });

    await requirePermission(ctx, "platform_users.view", args.sessionToken);

    const dbRoles = await ctx.db.query("platform_roles").collect();
    const systemRoles = Object.values(SYSTEM_ROLE_SEEDS).map((role) => ({
      ...role,
      _id: undefined,
      baseRole: undefined,
      isSystem: true,
      isActive: true,
      createdBy: "system",
      createdAt: 0,
      updatedAt: 0,
    }));

    const merged: Array<any> = [...systemRoles];
    for (const role of dbRoles) {
      const existingIndex = merged.findIndex((entry) => entry.slug === role.slug);
      if (existingIndex >= 0) merged[existingIndex] = { ...merged[existingIndex], ...role };
      else merged.push(role as any);
    }

    const filtered = merged.filter((role) => {
      if (args.includeSystem === false && role.isSystem) return false;
      if (!args.includeInactive && !role.isActive) return false;
      return true;
    });

    return await Promise.all(
      filtered
        .sort((a, b) => {
          if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .map(async (role) => ({
          ...role,
          id: role._id ? String(role._id) : role.slug,
          userCount: await countActiveRoleUsers(ctx, role.slug),
        }))
    );
  },
});

export const getRole = query({
  args: {
    sessionToken: v.string(),
    roleId: v.optional(v.id("platform_roles")),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "platform_users.view", args.sessionToken);

    const role = args.roleId ? await ctx.db.get(args.roleId) : await getRoleDefinition(ctx, args.slug ?? "");
    if (!role) throw new Error("Role not found");

    const users = await ctx.db
      .query("platform_users")
      .withIndex("by_role", (q: any) => q.eq("role", role.slug))
      .collect();

    return {
      ...role,
      id: role._id ? String(role._id) : role.slug,
      userCount: users.length,
      users: await Promise.all(users.slice(0, 50).map((user: any) => getDetailedPlatformUser(ctx, user))),
      permissionCatalog: PERMISSION_CATALOG,
    };
  },
});

export const createRole = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.string(),
    baseRole: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.invite", args.sessionToken);
    const slug = slugifyRoleName(args.name);
    if (!slug) throw new Error("Role name must produce a valid slug");
    if (SYSTEM_ROLE_SEEDS[slug]) throw new Error("Cannot override a system role");

    const existing = await ctx.db
      .query("platform_roles")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .unique();
    if (existing) throw new Error("A role with this slug already exists");

    const roleId = await ctx.db.insert("platform_roles", {
      name: args.name,
      slug,
      description: args.description,
      baseRole: args.baseRole,
      isSystem: false,
      isActive: true,
      color: args.color,
      icon: args.icon,
      permissions: dedupePermissions(args.permissions),
      createdBy: actor.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "role.created",
      entityType: "platform_role",
      entityId: String(roleId),
      after: { slug, permissions: args.permissions },
    });

    return { roleId };
  },
});

export const updateRole = mutation({
  args: {
    sessionToken: v.string(),
    roleId: v.id("platform_roles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    baseRole: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.invite", args.sessionToken);
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("Cannot edit system roles");

    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.baseRole !== undefined) patch.baseRole = args.baseRole;
    if (args.color !== undefined) patch.color = args.color;
    if (args.icon !== undefined) patch.icon = args.icon;
    if (args.permissions !== undefined) patch.permissions = dedupePermissions(args.permissions);
    if (args.isActive !== undefined) patch.isActive = args.isActive;

    await ctx.db.patch(args.roleId, patch);

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "role.updated",
      entityType: "platform_role",
      entityId: String(args.roleId),
      before: role,
      after: patch,
    });
  },
});

export const deleteRole = mutation({
  args: { sessionToken: v.string(), roleId: v.id("platform_roles") },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.delete", args.sessionToken);
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("Cannot delete system roles");

    const usersWithRole = await ctx.db
      .query("platform_users")
      .withIndex("by_role", (q: any) => q.eq("role", role.slug))
      .collect();
    if (usersWithRole.length > 0) throw new Error(`Cannot delete role — ${usersWithRole.length} users still have it.`);

    await ctx.db.delete(args.roleId);
    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "role.deleted",
      entityType: "platform_role",
      entityId: String(args.roleId),
      before: role,
    });
  },
});

export const duplicateRole = mutation({
  args: {
    sessionToken: v.string(),
    roleId: v.optional(v.id("platform_roles")),
    slug: v.optional(v.string()),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.invite", args.sessionToken);
    const source = args.roleId ? await ctx.db.get(args.roleId) : await getRoleDefinition(ctx, args.slug ?? "");
    if (!source) throw new Error("Source role not found");

    const slug = slugifyRoleName(args.newName);
    const existing = await ctx.db
      .query("platform_roles")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .unique();
    if (existing || SYSTEM_ROLE_SEEDS[slug]) throw new Error("A role with this name already exists");

    const roleId = await ctx.db.insert("platform_roles", {
      name: args.newName,
      slug,
      description: `Copy of ${source.name}`,
      baseRole: source.slug,
      isSystem: false,
      isActive: true,
      color: source.color,
      icon: source.icon,
      permissions: dedupePermissions(source.permissions),
      createdBy: actor.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "role.duplicated",
      entityType: "platform_role",
      entityId: String(roleId),
      after: { source: source.slug, slug },
    });

    return { roleId };
  },
});

export const invitePlatformUser = mutation({
  args: {
    sessionToken: v.string(),
    email: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
    addedPermissions: v.optional(v.array(v.string())),
    removedPermissions: v.optional(v.array(v.string())),
    scopeCountries: v.optional(v.array(v.string())),
    scopeTenantIds: v.optional(v.array(v.string())),
    scopePlans: v.optional(v.array(v.string())),
    accessExpiresAt: v.optional(v.number()),
    notifyInviter: v.optional(v.boolean()),
    personalMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.invite", args.sessionToken);
    return await createPlatformInviteRecord(ctx, actor, args);
  },
});

export const bulkInvitePlatformUsers = mutation({
  args: {
    sessionToken: v.string(),
    invites: v.array(v.object({
      email: v.string(),
      role: v.string(),
      department: v.optional(v.string()),
      personalMessage: v.optional(v.string()),
    })),
    defaultAddedPermissions: v.optional(v.array(v.string())),
    defaultRemovedPermissions: v.optional(v.array(v.string())),
    defaultScopeCountries: v.optional(v.array(v.string())),
    defaultScopeTenantIds: v.optional(v.array(v.string())),
    defaultScopePlans: v.optional(v.array(v.string())),
    notifyInviter: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.invite", args.sessionToken);
    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const invite of args.invites) {
      try {
        await createPlatformInviteRecord(ctx, actor, {
          email: invite.email,
          role: invite.role,
          department: invite.department,
          personalMessage: invite.personalMessage,
          addedPermissions: args.defaultAddedPermissions,
          removedPermissions: args.defaultRemovedPermissions,
          scopeCountries: args.defaultScopeCountries,
          scopeTenantIds: args.defaultScopeTenantIds,
          scopePlans: args.defaultScopePlans,
          notifyInviter: args.notifyInviter,
        } as any);
        results.push({ email: invite.email, success: true });
      } catch (error) {
        results.push({
          email: invite.email,
          success: false,
          error: error instanceof Error ? error.message : "Failed to invite user",
        });
      }
    }

    return results;
  },
});

export const acceptPlatformInvite = mutation({
  args: {
    token: v.string(),
    workosUserId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("platform_user_invites")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .unique();

    if (!invite) throw new Error("Invalid invitation link");
    if (invite.status !== "pending") throw new Error("This invitation has already been used or revoked");
    if (invite.expiresAt < Date.now()) {
      await ctx.db.patch(invite._id, { status: "expired", updatedAt: Date.now() });
      throw new Error("This invitation has expired. Please request a new one.");
    }

    const existingPlatformUser = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.workosUserId))
      .unique();

    const patch = {
      role: invite.role,
      department: invite.department,
      addedPermissions: invite.addedPermissions ?? [],
      removedPermissions: invite.removedPermissions ?? [],
      scopeCountries: invite.scopeCountries ?? [],
      scopeTenantIds: invite.scopeTenantIds ?? [],
      scopePlans: invite.scopePlans ?? [],
      status: "active" as const,
      accessExpiresAt: invite.accessExpiresAt,
      invitedBy: invite.invitedBy,
      acceptedAt: Date.now(),
      lastLogin: Date.now(),
      updatedAt: Date.now(),
    };

    let platformUserId = existingPlatformUser?._id;
    if (existingPlatformUser) {
      await ctx.db.patch(existingPlatformUser._id, patch);
    } else {
      platformUserId = await ctx.db.insert("platform_users", {
        userId: args.workosUserId,
        ...patch,
        notes: undefined,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: args.workosUserId,
      actorEmail: invite.email,
      action: "user.created",
      entityType: "platform_user",
      entityId: String(platformUserId),
      after: { role: invite.role, source: "platform_invite" },
    });

    return { success: true, platformUserId };
  },
});

export const resendPlatformInvite = mutation({
  args: { sessionToken: v.string(), inviteId: v.id("platform_user_invites") },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.invite", args.sessionToken);
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (!["pending", "expired"].includes(invite.status)) throw new Error("Only pending or expired invites can be resent");

    const patch = {
      token: idGenerator("platform_invite"),
      status: "pending" as const,
      expiresAt: Date.now() + PLATFORM_INVITE_EXPIRY_MS,
      updatedAt: Date.now(),
    };
    await ctx.db.patch(args.inviteId, patch);

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "user.updated",
      entityType: "platform_user_invite",
      entityId: String(args.inviteId),
      before: { status: invite.status, expiresAt: invite.expiresAt },
      after: patch,
    });

    return { success: true, invite: { ...invite, ...patch } };
  },
});

export const revokePlatformInvite = mutation({
  args: {
    sessionToken: v.string(),
    inviteId: v.id("platform_user_invites"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.invite", args.sessionToken);
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");

    await ctx.db.patch(args.inviteId, { status: "revoked", updatedAt: Date.now() });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "user.updated",
      entityType: "platform_user_invite",
      entityId: String(args.inviteId),
      before: { status: invite.status },
      after: { status: "revoked", reason: args.reason ?? null },
    });
  },
});

export const getPermissionAuditLog = query({
  args: {
    sessionToken: v.string(),
    targetUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "platform_users.view_activity", args.sessionToken);
    let entries = await ctx.db.query("permission_audit_log").collect();
    if (args.targetUserId) {
      entries = entries.filter((entry) => entry.targetUserId === args.targetUserId);
    }
    return entries.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const updateUserRole = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.id("platform_users"),
    newRole: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.edit_role", args.sessionToken);
    const target = await getPlatformUserByDocIdOrThrow(ctx, args.targetUserId);
    if (target.userId === actor.userId) throw new Error("Cannot change your own role");

    const role = await getRoleDefinition(ctx, args.newRole);
    if (!role || !role.isActive) throw new Error("Invalid role");
    if (args.newRole === "master_admin" && !hasPermission(actor.permissions, "platform_users.delete")) {
      throw new Error("Only master admins can assign master admin");
    }

    const previous = { role: target.role, addedPermissions: target.addedPermissions, removedPermissions: target.removedPermissions };
    await ctx.db.patch(args.targetUserId, {
      role: args.newRole,
      addedPermissions: [],
      removedPermissions: [],
      updatedAt: Date.now(),
    });

    await writePermissionAuditLog(ctx, {
      targetUserId: target.userId,
      changedBy: actor.userId,
      changeType: "role_changed",
      previousValue: previous,
      newValue: { role: args.newRole },
      reason: args.reason,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "user.updated",
      entityType: "platform_user",
      entityId: String(args.targetUserId),
      before: previous,
      after: { role: args.newRole, reason: args.reason },
    });
  },
});

export const updateUserPermissions = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.id("platform_users"),
    addedPermissions: v.array(v.string()),
    removedPermissions: v.array(v.string()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.edit_permissions", args.sessionToken);
    const target = await getPlatformUserByDocIdOrThrow(ctx, args.targetUserId);
    if (target.userId === actor.userId) throw new Error("Cannot edit your own permissions");

    const previous = {
      addedPermissions: target.addedPermissions ?? [],
      removedPermissions: target.removedPermissions ?? [],
    };

    await ctx.db.patch(args.targetUserId, {
      addedPermissions: dedupePermissions(args.addedPermissions),
      removedPermissions: dedupePermissions(args.removedPermissions),
      updatedAt: Date.now(),
    });

    await writePermissionAuditLog(ctx, {
      targetUserId: target.userId,
      changedBy: actor.userId,
      changeType: args.addedPermissions.length > 0 ? "permission_added" : "permission_removed",
      previousValue: previous,
      newValue: { addedPermissions: args.addedPermissions, removedPermissions: args.removedPermissions },
      reason: args.reason,
    });
  },
});

export const updateUserScope = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.id("platform_users"),
    scopeCountries: v.array(v.string()),
    scopeTenantIds: v.array(v.string()),
    scopePlans: v.array(v.string()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.edit_permissions", args.sessionToken);
    const target = await getPlatformUserByDocIdOrThrow(ctx, args.targetUserId);
    const previous = {
      scopeCountries: target.scopeCountries ?? [],
      scopeTenantIds: target.scopeTenantIds ?? [],
      scopePlans: target.scopePlans ?? [],
    };

    await ctx.db.patch(args.targetUserId, {
      scopeCountries: args.scopeCountries,
      scopeTenantIds: args.scopeTenantIds,
      scopePlans: args.scopePlans,
      updatedAt: Date.now(),
    });

    await writePermissionAuditLog(ctx, {
      targetUserId: target.userId,
      changedBy: actor.userId,
      changeType: "scope_changed",
      previousValue: previous,
      newValue: { scopeCountries: args.scopeCountries, scopeTenantIds: args.scopeTenantIds, scopePlans: args.scopePlans },
      reason: args.reason,
    });
  },
});

export const suspendPlatformUser = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.id("platform_users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.suspend", args.sessionToken);
    const target = await getPlatformUserByDocIdOrThrow(ctx, args.targetUserId);
    if (target.userId === actor.userId) throw new Error("Cannot suspend yourself");

    await ctx.db.patch(args.targetUserId, { status: "suspended", updatedAt: Date.now() });
    await writePermissionAuditLog(ctx, {
      targetUserId: target.userId,
      changedBy: actor.userId,
      changeType: "account_suspended",
      previousValue: { status: target.status },
      newValue: { status: "suspended" },
      reason: args.reason,
    });
  },
});

export const activatePlatformUser = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.id("platform_users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.suspend", args.sessionToken);
    const target = await getPlatformUserByDocIdOrThrow(ctx, args.targetUserId);
    await ctx.db.patch(args.targetUserId, { status: "active", updatedAt: Date.now() });
    await writePermissionAuditLog(ctx, {
      targetUserId: target.userId,
      changedBy: actor.userId,
      changeType: "account_unsuspended",
      previousValue: { status: target.status },
      newValue: { status: "active" },
      reason: args.reason ?? "Unsuspended",
    });
  },
});

export const deletePlatformUser = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.id("platform_users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.delete", args.sessionToken);
    const target = await getPlatformUserByDocIdOrThrow(ctx, args.targetUserId);
    if (target.userId === actor.userId) throw new Error("Cannot delete your own account");
    await ctx.db.delete(args.targetUserId);
    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "user.deleted",
      entityType: "platform_user",
      entityId: String(args.targetUserId),
      before: { ...target, reason: args.reason },
    });
  },
});

export const setUserAccessExpiry = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.id("platform_users"),
    accessExpiresAt: v.optional(v.number()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "platform_users.edit_permissions", args.sessionToken);
    const target = await getPlatformUserByDocIdOrThrow(ctx, args.targetUserId);
    await ctx.db.patch(args.targetUserId, { accessExpiresAt: args.accessExpiresAt, updatedAt: Date.now() });
    await writePermissionAuditLog(ctx, {
      targetUserId: target.userId,
      changedBy: actor.userId,
      changeType: "access_expiry_set",
      previousValue: { accessExpiresAt: target.accessExpiresAt },
      newValue: { accessExpiresAt: args.accessExpiresAt },
      reason: args.reason,
    });
  },
});

export const getMyPermissions = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const identity = await getSessionIdentity(ctx, args.sessionToken);
    if (!identity) return { permissions: [], platformUser: null };

    let platformUser = await getPlatformUserBySubject(ctx, identity.userId);
    if (!platformUser && identity.sessionRole === "master_admin") {
      platformUser = {
        _id: undefined,
        userId: identity.userId,
        role: "master_admin",
        department: "Platform",
        addedPermissions: [],
        removedPermissions: [],
        scopeCountries: [],
        scopeTenantIds: [],
        scopePlans: [],
        status: "active",
        accessExpiresAt: undefined,
        invitedBy: undefined,
        acceptedAt: undefined,
        lastLogin: undefined,
        notes: undefined,
        createdAt: 0,
        updatedAt: 0,
      };
    }

    if (!platformUser) return { permissions: [], platformUser: null };

    return {
      permissions: platformUser.role === "master_admin" ? ["*"] : await getUserPermissions(ctx, identity.userId),
      platformUser: {
        ...platformUser,
        id: platformUser._id ? String(platformUser._id) : platformUser.userId,
      },
    };
  },
});

export const seedSystemRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;
    for (const seed of Object.values(SYSTEM_ROLE_SEEDS)) {
      const existing = await ctx.db
        .query("platform_roles")
        .withIndex("by_slug", (q: any) => q.eq("slug", seed.slug))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: seed.name,
          description: seed.description,
          isSystem: true,
          isActive: true,
          color: seed.color,
          icon: seed.icon,
          permissions: dedupePermissions(seed.permissions),
          updatedAt: Date.now(),
        });
        continue;
      }

      await ctx.db.insert("platform_roles", {
        name: seed.name,
        slug: seed.slug,
        description: seed.description,
        baseRole: undefined,
        isSystem: true,
        isActive: true,
        color: seed.color,
        icon: seed.icon,
        permissions: dedupePermissions(seed.permissions),
        createdBy: "system",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      created += 1;
    }

    return { created };
  },
});
