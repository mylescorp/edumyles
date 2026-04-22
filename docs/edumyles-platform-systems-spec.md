# EduMyles Platform Systems
## Complete Technical Specification v1.0
### Platform Users & RBAC | CRM | Project Management
**Date:** April 2026 | **Status:** Definitive

---

# ═══════════════════════════════════════════════════════════
# DOCUMENT 1 — PLATFORM USER INVITE FLOW, RBAC & WORKOS CRUD
# ═══════════════════════════════════════════════════════════

---

# SECTION 1 — ARCHITECTURE OVERVIEW

---

## 1.1 Two User Worlds

EduMyles has two completely separate user authentication domains:

**Tenant Users** — school staff, students, parents. These belong to WorkOS Organizations (one per school). Handled by tenant onboarding spec.

**Platform Users** — EduMyles internal staff (master admins, support agents, billing admins, etc.). These are WorkOS Users that belong to a special **Platform Organization** — a single shared WorkOS org for all EduMyles staff.

```
WorkOS Organizations:
─────────────────────────────────────────────────────────
"EduMyles Platform" (org_platform_xxx) — ONE shared org
  ├── master_admin: ceo@edumyles.co.ke
  ├── super_admin: cto@edumyles.co.ke
  ├── billing_admin: finance@edumyles.co.ke
  ├── support_agent: support1@edumyles.co.ke
  ├── platform_manager: pm1@edumyles.co.ke
  └── ... all internal EduMyles staff

"Nairobi Academy" (org_school_abc)
  ├── school_admin: alice@nairobiacademy.ac.ke
  └── teacher: john@nairobiacademy.ac.ke

"Mombasa High" (org_school_def)
  └── school_admin: principal@mombasa.ac.ke
```

**Convex Separation:**
```
platform_users table  ← EduMyles internal staff
users table           ← School users (per tenant)
```

A platform user who is ALSO a school user (rare — e.g. a master admin who is also a parent) has TWO separate records — one in each table — with two separate WorkOS memberships.

---

## 1.2 Platform Organization in WorkOS

```typescript
// Platform org is seeded once — never recreated
// Stored in platform_settings:
// "auth.workos.platformOrgId" → "org_platform_xxxxxxxxxxxx"

// All platform users are members of this single org
// WorkOS roles within this org: "platform_admin" (for all platform users)
// EduMyles role granularity is managed in Convex, not in WorkOS

// Login flow for platform users:
// 1. Visit platform.edumyles.co.ke/auth/login
// 2. WorkOS AuthKit handles authentication
// 3. On callback: check if user exists in platform_users table
// 4. If yes: grant access to /platform with their EduMyles role permissions
// 5. If no: show "Access denied - you are not a platform user"
```

---

## 1.3 RBAC Architecture

EduMyles platform RBAC has **three layers**:

**Layer 1 — System Roles** (built-in, cannot modify):
```
master_admin → super_admin → platform_manager → support_agent
                          → billing_admin
                          → marketplace_reviewer
                          → content_moderator
                          → analytics_viewer
```

**Layer 2 — Custom Roles** (master_admin creates, stored in Convex):
Extend a system role with added/removed permissions.
Example: "Senior Support Agent" = support_agent + tenants.impersonate + billing.view_dashboard

**Layer 3 — User-Level Overrides** (per user, stored in Convex):
`platform_users.addedPermissions[]` — extra permissions beyond role
`platform_users.removedPermissions[]` — permissions removed from role

**Effective permissions** = RolePermissions + addedPermissions - removedPermissions

**master_admin** = wildcard `["*"]` — bypasses all permission checks

**Scope restrictions** (optional per user):
- `scopeCountries[]` — only see tenants in these countries (empty = all)
- `scopeTenantIds[]` — only see these specific tenants (empty = all)
- `scopePlans[]` — only see tenants on these plans (empty = all)

---

# SECTION 2 — COMPLETE PERMISSION KEY REFERENCE

```typescript
// convex/shared/permissions.ts
// Single source of truth for all permission keys

export const PERMISSIONS = {
  // ═══ TENANT MANAGEMENT ═══════════════════════════════════
  TENANTS_VIEW:                 "tenants.view",
  TENANTS_VIEW_DETAILS:         "tenants.view_details",
  TENANTS_CREATE:               "tenants.create",
  TENANTS_EDIT:                 "tenants.edit",
  TENANTS_SUSPEND:              "tenants.suspend",
  TENANTS_UNSUSPEND:            "tenants.unsuspend",
  TENANTS_DELETE:               "tenants.delete",               // master_admin only
  TENANTS_IMPERSONATE:          "tenants.impersonate",
  TENANTS_EXPORT:               "tenants.export",
  TENANTS_VIEW_FINANCE:         "tenants.view_finance",
  TENANTS_MANAGE_FINANCE:       "tenants.manage_finance",
  TENANTS_MANAGE_SUBSCRIPTION:  "tenants.manage_subscription",
  TENANTS_MANAGE_MODULES:       "tenants.manage_modules",
  TENANTS_MANAGE_USERS:         "tenants.manage_users",
  TENANTS_MANAGE_SETTINGS:      "tenants.manage_settings",
  TENANTS_MANAGE_PILOT_GRANTS:  "tenants.manage_pilot_grants",
  TENANTS_GRANT_PERMANENT_FREE: "tenants.grant_permanent_free", // master_admin only
  TENANTS_SET_CUSTOM_PRICING:   "tenants.set_custom_pricing",   // master_admin only
  TENANTS_GDPR_EXPORT:          "tenants.gdpr_export",

  // ═══ PLATFORM USERS (STAFF) ═══════════════════════════════
  PLATFORM_USERS_VIEW:          "platform_users.view",
  PLATFORM_USERS_INVITE:        "platform_users.invite",
  PLATFORM_USERS_EDIT_ROLE:     "platform_users.edit_role",
  PLATFORM_USERS_EDIT_PERMS:    "platform_users.edit_permissions",
  PLATFORM_USERS_SUSPEND:       "platform_users.suspend",
  PLATFORM_USERS_DELETE:        "platform_users.delete",        // master_admin only
  PLATFORM_USERS_VIEW_ACTIVITY: "platform_users.view_activity",

  // ═══ MARKETPLACE ══════════════════════════════════════════
  MARKETPLACE_VIEW:             "marketplace.view",
  MARKETPLACE_REVIEW_MODULES:   "marketplace.review_modules",
  MARKETPLACE_SUSPEND_MODULE:   "marketplace.suspend_module",
  MARKETPLACE_BAN_MODULE:       "marketplace.ban_module",        // master_admin only
  MARKETPLACE_FEATURE_MODULE:   "marketplace.feature_module",
  MARKETPLACE_OVERRIDE_PRICE:   "marketplace.override_price",    // master_admin only
  MARKETPLACE_MANAGE_FLAGS:     "marketplace.manage_flags",
  MARKETPLACE_MANAGE_REVIEWS:   "marketplace.manage_reviews",
  MARKETPLACE_MANAGE_PILOTS:    "marketplace.manage_pilot_grants",
  MARKETPLACE_BULK_PILOTS:      "marketplace.bulk_pilot_grants", // master_admin only
  MARKETPLACE_MANAGE_PRICING:   "marketplace.manage_pricing",

  // ═══ PUBLISHERS ═══════════════════════════════════════════
  PUBLISHERS_VIEW:              "publishers.view",
  PUBLISHERS_APPROVE:           "publishers.approve",
  PUBLISHERS_REJECT:            "publishers.reject",
  PUBLISHERS_SUSPEND:           "publishers.suspend",
  PUBLISHERS_BAN:               "publishers.ban",                // master_admin only
  PUBLISHERS_MANAGE_REVENUE:    "publishers.manage_revenue_share",// master_admin only
  PUBLISHERS_MANAGE_TIER:       "publishers.manage_tier",
  PUBLISHERS_PROCESS_PAYOUTS:   "publishers.process_payouts",
  PUBLISHERS_VIEW_PAYOUTS:      "publishers.view_payouts",

  // ═══ BILLING & FINANCE ════════════════════════════════════
  BILLING_VIEW_DASHBOARD:       "billing.view_dashboard",
  BILLING_VIEW_INVOICES:        "billing.view_invoices",
  BILLING_MANAGE_INVOICES:      "billing.manage_invoices",
  BILLING_VIEW_SUBSCRIPTIONS:   "billing.view_subscriptions",
  BILLING_MANAGE_SUBSCRIPTIONS: "billing.manage_subscriptions",
  BILLING_VIEW_REPORTS:         "billing.view_reports",
  BILLING_EXPORT_REPORTS:       "billing.export_reports",
  BILLING_MANAGE_PLANS:         "billing.manage_plans",          // master_admin only
  BILLING_VIEW_PUB_PAYOUTS:     "billing.view_publisher_payouts",
  BILLING_PROCESS_PAYOUTS:      "billing.process_payouts",

  // ═══ CRM ══════════════════════════════════════════════════
  CRM_VIEW_OWN:                 "crm.view_own",           // see own leads/deals
  CRM_VIEW_ALL:                 "crm.view_all",           // see everyone's leads/deals
  CRM_VIEW_SHARED:              "crm.view_shared",        // see leads shared with them
  CRM_CREATE_LEAD:              "crm.create_lead",
  CRM_EDIT_OWN_LEAD:            "crm.edit_own_lead",
  CRM_EDIT_ANY_LEAD:            "crm.edit_any_lead",
  CRM_DELETE_OWN_LEAD:          "crm.delete_own_lead",
  CRM_DELETE_ANY_LEAD:          "crm.delete_any_lead",    // master_admin only
  CRM_ASSIGN_LEAD:              "crm.assign_lead",
  CRM_SHARE_LEAD:               "crm.share_lead",
  CRM_CREATE_PROPOSAL:          "crm.create_proposal",
  CRM_CONVERT_TO_TENANT:        "crm.convert_to_tenant",
  CRM_VIEW_REPORTS:             "crm.view_reports",
  CRM_MANAGE_PIPELINE:          "crm.manage_pipeline",    // edit pipeline stages
  CRM_EXPORT:                   "crm.export",

  // ═══ COMMUNICATIONS ═══════════════════════════════════════
  COMMS_VIEW:                   "communications.view",
  COMMS_SEND_BROADCAST:         "communications.send_broadcast",
  COMMS_SEND_SMS:               "communications.send_sms",
  COMMS_MANAGE_TEMPLATES:       "communications.manage_templates",// master_admin only
  COMMS_VIEW_LOGS:              "communications.view_logs",
  COMMS_MANAGE_ANNOUNCEMENTS:   "communications.manage_announcements",

  // ═══ KNOWLEDGE BASE ═══════════════════════════════════════
  KB_VIEW:                      "knowledge_base.view",
  KB_CREATE:                    "knowledge_base.create",
  KB_EDIT:                      "knowledge_base.edit",
  KB_PUBLISH:                   "knowledge_base.publish",
  KB_DELETE:                    "knowledge_base.delete",          // master_admin only

  // ═══ ANALYTICS ════════════════════════════════════════════
  ANALYTICS_VIEW_PLATFORM:      "analytics.view_platform",
  ANALYTICS_VIEW_BUSINESS:      "analytics.view_business",
  ANALYTICS_EXPORT:             "analytics.export",
  ANALYTICS_MANAGE_REPORTS:     "analytics.manage_reports",

  // ═══ SECURITY ═════════════════════════════════════════════
  SECURITY_VIEW_DASHBOARD:      "security.view_dashboard",
  SECURITY_VIEW_AUDIT_LOG:      "security.view_audit_log",
  SECURITY_EXPORT_AUDIT_LOG:    "security.export_audit_log",      // master_admin only
  SECURITY_MANAGE_API_KEYS:     "security.manage_api_keys",
  SECURITY_MANAGE_WEBHOOKS:     "security.manage_webhooks",
  SECURITY_FLAG_AUDIT_ENTRIES:  "security.flag_audit_entries",

  // ═══ SETTINGS ═════════════════════════════════════════════
  SETTINGS_VIEW:                "settings.view",
  SETTINGS_EDIT_GENERAL:        "settings.edit_general",
  SETTINGS_EDIT_EMAIL:          "settings.edit_email",
  SETTINGS_EDIT_SMS:            "settings.edit_sms",
  SETTINGS_EDIT_PAYMENTS:       "settings.edit_payments",         // master_admin only
  SETTINGS_EDIT_SECURITY:       "settings.edit_security",         // master_admin only
  SETTINGS_EDIT_INTEGRATIONS:   "settings.edit_integrations",
  SETTINGS_MAINTENANCE_MODE:    "settings.maintenance_mode",      // master_admin only
  SETTINGS_MANAGE_FLAGS:        "settings.manage_feature_flags",
  SETTINGS_MANAGE_SLA:          "settings.manage_sla",

  // ═══ SUPPORT ══════════════════════════════════════════════
  SUPPORT_VIEW:                 "support.view",
  SUPPORT_ASSIGN:               "support.assign",
  SUPPORT_REPLY:                "support.reply",
  SUPPORT_CLOSE:                "support.close",
  SUPPORT_ESCALATE:             "support.escalate",
  SUPPORT_VIEW_INTERNAL_NOTES:  "support.view_internal_notes",

  // ═══ WAITLIST & ONBOARDING ════════════════════════════════
  WAITLIST_VIEW:                "waitlist.view",
  WAITLIST_INVITE:              "waitlist.invite",
  WAITLIST_REJECT:              "waitlist.reject",
  ONBOARDING_VIEW:              "onboarding.view",
  ONBOARDING_MANAGE:            "onboarding.manage",

  // ═══ RESELLERS ════════════════════════════════════════════
  RESELLERS_VIEW:               "resellers.view",
  RESELLERS_APPROVE:            "resellers.approve",
  RESELLERS_REJECT:             "resellers.reject",
  RESELLERS_MANAGE_TIER:        "resellers.manage_tier",
  RESELLERS_MANAGE_COMMISSION:  "resellers.manage_commission",    // master_admin only
  RESELLERS_SUSPEND:            "resellers.suspend",
  RESELLERS_TERMINATE:          "resellers.terminate",            // master_admin only
  RESELLERS_PROCESS_PAYOUTS:    "resellers.process_payouts",
  RESELLERS_MANAGE_MATERIALS:   "resellers.manage_materials",
  RESELLERS_MANAGE_DIRECTORY:   "resellers.manage_directory",
  RESELLERS_MANAGE_TIERS_CONFIG:"resellers.manage_tiers_config",  // master_admin only

  // ═══ PROJECT MANAGEMENT ═══════════════════════════════════
  PM_VIEW_OWN:                  "pm.view_own",           // see own projects/tasks
  PM_VIEW_ALL:                  "pm.view_all",           // see all projects/tasks
  PM_VIEW_SHARED:               "pm.view_shared",        // see projects shared with them
  PM_CREATE_WORKSPACE:          "pm.create_workspace",
  PM_MANAGE_WORKSPACE:          "pm.manage_workspace",
  PM_CREATE_PROJECT:            "pm.create_project",
  PM_EDIT_OWN_PROJECT:          "pm.edit_own_project",
  PM_EDIT_ANY_PROJECT:          "pm.edit_any_project",
  PM_DELETE_OWN_PROJECT:        "pm.delete_own_project",
  PM_DELETE_ANY_PROJECT:        "pm.delete_any_project", // master_admin only
  PM_MANAGE_MEMBERS:            "pm.manage_members",
  PM_CREATE_TASK:               "pm.create_task",
  PM_EDIT_OWN_TASK:             "pm.edit_own_task",
  PM_EDIT_ANY_TASK:             "pm.edit_any_task",
  PM_DELETE_ANY_TASK:           "pm.delete_any_task",
  PM_MANAGE_SPRINTS:            "pm.manage_sprints",
  PM_VIEW_TIME_LOGS:            "pm.view_time_logs",
  PM_LOG_TIME:                  "pm.log_time",
  PM_MANAGE_INTEGRATIONS:       "pm.manage_integrations",// GitHub integration

  // ═══ STAFF PERFORMANCE ════════════════════════════════════
  STAFF_PERF_VIEW_ALL:          "staff_performance.view",
  STAFF_PERF_VIEW_OWN:          "staff_performance.view_own",
  STAFF_PERF_ADD_NOTES:         "staff_performance.add_notes",
} as const;

// System role permission sets
export const SYSTEM_ROLE_PERMISSIONS: Record<string, string[]> = {
  master_admin: ["*"],  // wildcard = all permissions

  super_admin: [
    // All permissions EXCEPT master_admin exclusives
    "tenants.view","tenants.view_details","tenants.create","tenants.edit",
    "tenants.suspend","tenants.unsuspend","tenants.impersonate","tenants.export",
    "tenants.view_finance","tenants.manage_finance","tenants.manage_subscription",
    "tenants.manage_modules","tenants.manage_users","tenants.manage_settings",
    "tenants.manage_pilot_grants","tenants.gdpr_export",
    "platform_users.view","platform_users.invite","platform_users.edit_role",
    "platform_users.edit_permissions","platform_users.suspend","platform_users.view_activity",
    "marketplace.view","marketplace.review_modules","marketplace.suspend_module",
    "marketplace.feature_module","marketplace.manage_flags","marketplace.manage_reviews",
    "marketplace.manage_pilot_grants","marketplace.manage_pricing",
    "publishers.view","publishers.approve","publishers.reject","publishers.suspend",
    "publishers.manage_tier","publishers.view_payouts",
    "billing.view_dashboard","billing.view_invoices","billing.manage_invoices",
    "billing.view_subscriptions","billing.manage_subscriptions",
    "billing.view_reports","billing.export_reports","billing.view_publisher_payouts",
    "crm.view_own","crm.view_all","crm.view_shared","crm.create_lead",
    "crm.edit_own_lead","crm.edit_any_lead","crm.delete_own_lead","crm.assign_lead",
    "crm.share_lead","crm.create_proposal","crm.convert_to_tenant",
    "crm.view_reports","crm.manage_pipeline","crm.export",
    "communications.view","communications.send_broadcast","communications.view_logs",
    "communications.manage_announcements",
    "knowledge_base.view","knowledge_base.create","knowledge_base.edit","knowledge_base.publish",
    "analytics.view_platform","analytics.view_business","analytics.export","analytics.manage_reports",
    "security.view_dashboard","security.view_audit_log","security.manage_webhooks",
    "settings.view","settings.edit_general","settings.edit_email","settings.edit_sms",
    "settings.edit_integrations","settings.manage_feature_flags","settings.manage_sla",
    "support.view","support.assign","support.reply","support.close",
    "support.escalate","support.view_internal_notes",
    "waitlist.view","waitlist.invite","waitlist.reject","onboarding.view","onboarding.manage",
    "resellers.view","resellers.approve","resellers.reject","resellers.manage_tier",
    "resellers.suspend","resellers.manage_materials","resellers.manage_directory",
    "pm.view_own","pm.view_all","pm.view_shared","pm.create_workspace","pm.manage_workspace",
    "pm.create_project","pm.edit_own_project","pm.edit_any_project","pm.delete_own_project",
    "pm.manage_members","pm.create_task","pm.edit_own_task","pm.edit_any_task",
    "pm.manage_sprints","pm.view_time_logs","pm.log_time","pm.manage_integrations",
    "staff_performance.view","staff_performance.add_notes",
  ],

  platform_manager: [
    "tenants.view","tenants.view_details","tenants.create","tenants.edit",
    "tenants.suspend","tenants.unsuspend","tenants.export","tenants.manage_subscription",
    "tenants.manage_modules","tenants.manage_users","tenants.manage_pilot_grants",
    "platform_users.view",
    "marketplace.view","marketplace.feature_module","marketplace.manage_pilot_grants",
    "publishers.view",
    "crm.view_own","crm.view_shared","crm.create_lead","crm.edit_own_lead",
    "crm.delete_own_lead","crm.assign_lead","crm.share_lead","crm.create_proposal",
    "crm.convert_to_tenant","crm.view_reports","crm.export",
    "communications.view","communications.send_broadcast","communications.manage_announcements",
    "knowledge_base.view","knowledge_base.create","knowledge_base.edit",
    "analytics.view_platform",
    "support.view","support.assign","support.reply",
    "waitlist.view","waitlist.invite","waitlist.reject","onboarding.view","onboarding.manage",
    "resellers.view","resellers.approve","resellers.reject","resellers.manage_directory",
    "pm.view_own","pm.view_shared","pm.create_project","pm.edit_own_project",
    "pm.delete_own_project","pm.manage_members","pm.create_task","pm.edit_own_task",
    "pm.log_time","pm.view_time_logs",
    "staff_performance.view_own",
  ],

  support_agent: [
    "tenants.view","tenants.view_details","tenants.manage_users",
    "knowledge_base.view","knowledge_base.create","knowledge_base.edit",
    "communications.view","communications.send_broadcast","communications.manage_announcements",
    "support.view","support.assign","support.reply","support.close","support.view_internal_notes",
    "onboarding.view",
    "crm.view_own","crm.view_shared","crm.create_lead","crm.edit_own_lead","crm.share_lead",
    "pm.view_own","pm.view_shared","pm.create_task","pm.edit_own_task","pm.log_time",
    "staff_performance.view_own",
  ],

  billing_admin: [
    "tenants.view","tenants.view_details","tenants.view_finance","tenants.manage_finance",
    "tenants.manage_subscription",
    "billing.view_dashboard","billing.view_invoices","billing.manage_invoices",
    "billing.view_subscriptions","billing.manage_subscriptions",
    "billing.view_reports","billing.export_reports",
    "billing.view_publisher_payouts","billing.process_payouts",
    "publishers.view","publishers.view_payouts","publishers.process_payouts",
    "resellers.view","resellers.process_payouts",
    "analytics.view_business","analytics.export",
    "pm.view_own","pm.view_shared","pm.create_task","pm.edit_own_task","pm.log_time",
    "staff_performance.view_own",
  ],

  marketplace_reviewer: [
    "marketplace.view","marketplace.review_modules","marketplace.feature_module",
    "marketplace.manage_reviews",
    "publishers.view","publishers.approve","publishers.reject","publishers.manage_tier",
    "knowledge_base.view",
    "pm.view_own","pm.view_shared","pm.create_task","pm.edit_own_task","pm.log_time",
    "staff_performance.view_own",
  ],

  content_moderator: [
    "marketplace.view","marketplace.manage_flags","marketplace.manage_reviews",
    "knowledge_base.view","knowledge_base.create","knowledge_base.edit","knowledge_base.publish",
    "pm.view_own","pm.view_shared","pm.create_task","pm.edit_own_task","pm.log_time",
    "staff_performance.view_own",
  ],

  analytics_viewer: [
    "analytics.view_platform","analytics.view_business","analytics.export","analytics.manage_reports",
    "tenants.view","billing.view_dashboard",
    "pm.view_own","pm.view_shared",
    "staff_performance.view_own",
  ],
};
```

---

# SECTION 3 — DATABASE SCHEMA (PLATFORM USERS & RBAC)

```typescript
// convex/schema.ts additions

platform_roles: defineTable({
  name: v.string(),                     // "Senior Support Agent"
  slug: v.string(),                     // "senior-support-agent" (auto, unique)
  description: v.string(),
  baseRole: v.optional(v.string()),     // system role this extends
  isSystem: v.boolean(),                // true = cannot delete or rename
  isActive: v.boolean(),
  color: v.string(),                    // hex for badge display "#1B4F72"
  icon: v.string(),                     // lucide-react icon name "Shield"
  permissions: v.array(v.string()),     // array of permission keys
  userCount: v.number(),                // denormalized for fast display
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_slug", ["slug"])
  .index("by_isSystem", ["isSystem"])
  .index("by_isActive", ["isActive"]),

platform_users: defineTable({
  userId: v.string(),                   // WorkOS User ID
  workosUserId: v.string(),             // same as userId — explicit for clarity
  email: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  avatarUrl: v.optional(v.string()),
  role: v.string(),                     // role slug (system or custom)
  department: v.optional(v.string()),   // "Engineering", "Support", "Finance"
  jobTitle: v.optional(v.string()),     // "Senior Support Agent"
  phone: v.optional(v.string()),
  addedPermissions: v.array(v.string()),
  removedPermissions: v.array(v.string()),
  scopeCountries: v.array(v.string()),  // empty = all countries
  scopeTenantIds: v.array(v.string()),  // empty = all tenants
  scopePlans: v.array(v.string()),      // empty = all plans
  status: v.union(v.literal("active"), v.literal("suspended"), v.literal("pending")),
  accessExpiresAt: v.optional(v.number()),  // for contractors
  invitedBy: v.optional(v.string()),
  acceptedAt: v.optional(v.number()),
  lastLogin: v.optional(v.number()),
  lastActivityAt: v.optional(v.number()),
  timezone: v.optional(v.string()),
  notes: v.optional(v.string()),        // internal notes — not shown to user
  twoFactorEnabled: v.boolean(),
  sessionCount: v.number(),             // active session count
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_workosUserId", ["workosUserId"])
  .index("by_email", ["email"])
  .index("by_role", ["role"])
  .index("by_status", ["status"])
  .index("by_accessExpiresAt", ["accessExpiresAt"]),

platform_user_invites: defineTable({
  email: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  role: v.string(),
  department: v.optional(v.string()),
  jobTitle: v.optional(v.string()),
  addedPermissions: v.array(v.string()),
  removedPermissions: v.array(v.string()),
  scopeCountries: v.array(v.string()),
  scopeTenantIds: v.array(v.string()),
  scopePlans: v.array(v.string()),
  accessExpiresAt: v.optional(v.number()),
  invitedBy: v.string(),
  token: v.string(),                    // crypto.randomUUID()
  workosInvitationToken: v.optional(v.string()), // from WorkOS sendInvitation
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("expired"),
    v.literal("revoked"),
  ),
  expiresAt: v.number(),                // 72 hours from creation
  acceptedAt: v.optional(v.number()),
  notifyInviter: v.boolean(),
  personalMessage: v.optional(v.string()),
  remindersSent: v.number(),
  lastReminderAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_token", ["token"])
  .index("by_email", ["email"])
  .index("by_status", ["status"])
  .index("by_invitedBy", ["invitedBy"]),

permission_audit_log: defineTable({
  targetUserId: v.string(),             // platform_user who was changed
  changedBy: v.string(),               // platform_user who made change
  changeType: v.union(
    v.literal("role_changed"),
    v.literal("permissions_added"),
    v.literal("permissions_removed"),
    v.literal("scope_changed"),
    v.literal("access_expiry_set"),
    v.literal("account_suspended"),
    v.literal("account_unsuspended"),
    v.literal("account_deleted"),
    v.literal("mfa_enforced"),
    v.literal("sessions_revoked"),
  ),
  previousValue: v.string(),            // JSON snapshot before change
  newValue: v.string(),                 // JSON snapshot after change
  reason: v.string(),                   // required for all changes
  ipAddress: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_targetUserId", ["targetUserId"])
  .index("by_changedBy", ["changedBy"])
  .index("by_createdAt", ["createdAt"]),

platform_sessions: defineTable({
  platformUserId: v.string(),
  workosSessionId: v.string(),
  device: v.optional(v.string()),       // "MacBook Chrome 120", "iPhone Safari"
  ipAddress: v.optional(v.string()),
  countryCode: v.optional(v.string()),
  city: v.optional(v.string()),
  isTrusted: v.boolean(),               // "Remember this device" sessions
  lastActiveAt: v.number(),
  createdAt: v.number(),
})
  .index("by_platformUserId", ["platformUserId"])
  .index("by_workosSessionId", ["workosSessionId"]),
```

---

# SECTION 4 — WORKOS CRUD OPERATIONS

## 4.1 WorkOS Actions for Platform Users

```typescript
// convex/actions/auth/platformWorkos.ts
// All WorkOS API calls for platform user management

import { WorkOS } from "@workos-inc/node";

const getWorkOS = () => new WorkOS(process.env.WORKOS_API_KEY!);
const PLATFORM_ORG_ID = process.env.WORKOS_PLATFORM_ORG_ID!;

// ─── CREATE ─────────────────────────────────────────────────────────────

export const createPlatformUser = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ workosUserId: string }> => {
    const workos = getWorkOS();
    try {
      const user = await workos.userManagement.createUser({
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        password: args.password,
        emailVerified: false,
      });

      // Send email verification
      await workos.userManagement.sendVerificationEmail({ userId: user.id });

      return { workosUserId: user.id };
    } catch (error: any) {
      if (error.code === "email_already_in_use") {
        throw new Error("A user with this email already exists in WorkOS");
      }
      throw new Error(`WorkOS user creation failed: ${error.message}`);
    }
  }
});

export const sendPlatformInvitation = internalAction({
  args: {
    email: v.string(),
    inviterUserId: v.string(),    // WorkOS user ID of inviter
    redirectUri: v.string(),      // Where to redirect after accepting
  },
  handler: async (ctx, args): Promise<{ workosInvitationToken: string }> => {
    const workos = getWorkOS();
    const invitation = await workos.userManagement.sendInvitation({
      email: args.email,
      organizationId: PLATFORM_ORG_ID,
      roleSlug: "member",
      inviterUserId: args.inviterUserId,
      redirectUri: args.redirectUri,
    });
    return { workosInvitationToken: invitation.token };
  }
});

export const addToPlatformOrganization = internalAction({
  args: {
    workosUserId: v.string(),
    roleSlug: v.string(),          // always "member" for platform users (EduMyles manages roles in Convex)
  },
  handler: async (ctx, args): Promise<void> => {
    const workos = getWorkOS();
    await workos.userManagement.createOrganizationMembership({
      userId: args.workosUserId,
      organizationId: PLATFORM_ORG_ID,
      roleSlug: args.roleSlug,
    });
  }
});

// ─── READ ────────────────────────────────────────────────────────────────

export const getWorkOSUser = internalAction({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    const workos = getWorkOS();
    const user = await workos.userManagement.getUser(args.workosUserId);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.profilePictureUrl,
      emailVerified: user.emailVerified,
      twoFactorEnabled: false, // check separately
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
});

export const listPlatformOrgMembers = internalAction({
  args: { limit: v.optional(v.number()), after: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const workos = getWorkOS();
    const memberships = await workos.userManagement.listOrganizationMemberships({
      organizationId: PLATFORM_ORG_ID,
      limit: args.limit ?? 100,
      after: args.after,
    });
    return memberships;
  }
});

export const getPlatformUserSessions = internalAction({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    const workos = getWorkOS();
    // WorkOS doesn't have a direct list sessions API in all versions
    // Return empty array if not available, rely on platform_sessions Convex table
    return [];
  }
});

// ─── UPDATE ─────────────────────────────────────────────────────────────

export const updateWorkOSUser = internalAction({
  args: {
    workosUserId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<void> => {
    const workos = getWorkOS();
    await workos.userManagement.updateUser({
      userId: args.workosUserId,
      firstName: args.firstName,
      lastName: args.lastName,
      emailVerified: args.emailVerified,
    });
  }
});

export const resetWorkOSPassword = internalAction({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const workos = getWorkOS();
    // Send password reset email via WorkOS
    await workos.userManagement.sendPasswordResetEmail({
      email: args.email,
      passwordResetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/platform/auth/reset-password`,
    });
  }
});

export const enforceMFAForUser = internalAction({
  args: { workosUserId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const workos = getWorkOS();
    // WorkOS MFA enforcement is done at organization level
    // Individual user MFA enforcement tracked in Convex
    // This action is a placeholder — actual MFA enforcement via WorkOS org settings
  }
});

// ─── DELETE ─────────────────────────────────────────────────────────────

export const removeFromPlatformOrganization = internalAction({
  args: { workosUserId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const workos = getWorkOS();
    // Find membership
    const memberships = await workos.userManagement.listOrganizationMemberships({
      organizationId: PLATFORM_ORG_ID,
      userId: args.workosUserId,
    });
    for (const membership of memberships.data) {
      await workos.userManagement.deleteOrganizationMembership(membership.id);
    }
  }
});

export const deletePlatformWorkOSUser = internalAction({
  args: { workosUserId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const workos = getWorkOS();
    await workos.userManagement.deleteUser(args.workosUserId);
  }
});

export const revokeAllPlatformUserSessions = internalAction({
  args: { workosUserId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const workos = getWorkOS();
    // Revoke all sessions for this user
    // WorkOS handles session invalidation
    await workos.userManagement.revokeSession({ sessionId: "all", userId: args.workosUserId });
  }
});

export const revokeSingleSession = internalAction({
  args: { sessionId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const workos = getWorkOS();
    await workos.userManagement.revokeSession({ sessionId: args.sessionId });
  }
});
```

---

# SECTION 5 — PLATFORM RBAC CONVEX FUNCTIONS

## 5.1 Core Permission Engine

```typescript
// convex/modules/platform/rbac.ts

// ─── PERMISSION RESOLUTION ──────────────────────────────────────────────

export async function getUserPermissions(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<string[]> {
  const platformUser = await ctx.db
    .query("platform_users")
    .withIndex("by_userId", q => q.eq("userId", userId))
    .unique();

  if (!platformUser) return [];
  if (platformUser.status === "suspended") return [];
  if (platformUser.accessExpiresAt && platformUser.accessExpiresAt < Date.now()) return [];

  // master_admin wildcard
  if (platformUser.role === "master_admin") return ["*"];

  const role = await ctx.db
    .query("platform_roles")
    .withIndex("by_slug", q => q.eq("slug", platformUser.role))
    .unique();

  if (!role || !role.isActive) return [];

  // Start with role permissions
  let permissions = [...role.permissions];

  // Apply user-level additions (deduped)
  const withAdded = new Set([...permissions, ...platformUser.addedPermissions]);

  // Apply user-level removals
  const final = [...withAdded].filter(p => !platformUser.removedPermissions.includes(p));

  return final;
}

export function hasPermission(permissions: string[], permission: string): boolean {
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

export function hasAnyPermission(permissions: string[], required: string[]): boolean {
  return required.some(p => hasPermission(permissions, p));
}

export function hasAllPermissions(permissions: string[], required: string[]): boolean {
  return required.every(p => hasPermission(permissions, p));
}

export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  permission: string
): Promise<{ platformUser: Doc<"platform_users">; permissions: string[]; userId: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Authentication required" });
  }

  const userId = identity.subject;
  const permissions = await getUserPermissions(ctx, userId);

  if (!hasPermission(permissions, permission)) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: `Permission denied: requires '${permission}'`,
      requiredPermission: permission,
    });
  }

  const platformUser = await ctx.db
    .query("platform_users")
    .withIndex("by_userId", q => q.eq("userId", userId))
    .unique();

  return { platformUser: platformUser!, permissions, userId };
}

// ─── SCOPE RESTRICTION CHECK ────────────────────────────────────────────

export function checkScopeAccess(
  platformUser: Doc<"platform_users">,
  resource: {
    countryCode?: string;
    tenantId?: string;
    plan?: string;
  }
): boolean {
  if (platformUser.scopeCountries.length > 0 && resource.countryCode) {
    if (!platformUser.scopeCountries.includes(resource.countryCode)) return false;
  }
  if (platformUser.scopeTenantIds.length > 0 && resource.tenantId) {
    if (!platformUser.scopeTenantIds.includes(resource.tenantId)) return false;
  }
  if (platformUser.scopePlans.length > 0 && resource.plan) {
    if (!platformUser.scopePlans.includes(resource.plan)) return false;
  }
  return true;
}

// ─── ROLE CRUD ──────────────────────────────────────────────────────────

export const getRoles = query({
  args: {
    includeSystem: v.optional(v.boolean()),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "platform_users.view");
    let roles = await ctx.db.query("platform_roles").collect();
    if (!args.includeSystem) roles = roles.filter(r => !r.isSystem);
    if (!args.includeInactive) roles = roles.filter(r => r.isActive);
    return roles.sort((a, b) => {
      // System roles first, then by name
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      return a.name.localeCompare(b.name);
    });
  }
});

export const getRole = query({
  args: { roleId: v.id("platform_roles") },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "platform_users.view");
    return await ctx.db.get(args.roleId);
  }
});

export const createRole = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    baseRole: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "platform_users.invite");

    // Validate permissions are real permission keys
    const validKeys = Object.values(PERMISSIONS) as string[];
    const invalidPerms = args.permissions.filter(p => !validKeys.includes(p));
    if (invalidPerms.length > 0) {
      throw new Error(`Invalid permission keys: ${invalidPerms.join(", ")}`);
    }

    // Generate unique slug
    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existing = await ctx.db
      .query("platform_roles")
      .withIndex("by_slug", q => q.eq("slug", slug))
      .unique();
    if (existing) throw new Error(`A role with slug '${slug}' already exists. Choose a different name.`);

    const roleId = await ctx.db.insert("platform_roles", {
      name: args.name,
      slug,
      description: args.description,
      baseRole: args.baseRole,
      isSystem: false,
      isActive: true,
      color: args.color,
      icon: args.icon,
      permissions: args.permissions,
      userCount: 0,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "platform_role.created",
      entity: roleId,
      after: JSON.stringify({ name: args.name, permissions: args.permissions }),
      performedBy: userId,
      platformContext: true,
    });

    return roleId;
  }
});

export const updateRole = mutation({
  args: {
    roleId: v.id("platform_roles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "platform_users.invite");

    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("System roles cannot be modified");

    const before = { ...role };
    await ctx.db.patch(args.roleId, { ...args, roleId: undefined, updatedAt: Date.now() });

    await logAudit(ctx, {
      action: "platform_role.updated",
      entity: args.roleId,
      before: JSON.stringify(before),
      after: JSON.stringify(args),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const deleteRole = mutation({
  args: { roleId: v.id("platform_roles"), reassignToRole: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "platform_users.delete");

    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("System roles cannot be deleted");

    // Check for users with this role
    const usersWithRole = await ctx.db
      .query("platform_users")
      .withIndex("by_role", q => q.eq("role", role.slug))
      .collect();

    if (usersWithRole.length > 0) {
      if (!args.reassignToRole) {
        throw new Error(`Cannot delete role — ${usersWithRole.length} users have this role. Provide reassignToRole to reassign them.`);
      }
      // Reassign all users to the new role
      for (const user of usersWithRole) {
        await ctx.db.patch(user._id, {
          role: args.reassignToRole,
          addedPermissions: [],
          removedPermissions: [],
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.delete(args.roleId);

    await logAudit(ctx, {
      action: "platform_role.deleted",
      entity: args.roleId,
      after: JSON.stringify({ name: role.name, usersReassigned: usersWithRole.length }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const duplicateRole = mutation({
  args: { roleId: v.id("platform_roles"), newName: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "platform_users.invite");
    const source = await ctx.db.get(args.roleId);
    if (!source) throw new Error("Source role not found");

    const slug = args.newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const newRoleId = await ctx.db.insert("platform_roles", {
      name: args.newName,
      slug,
      description: `Copy of ${source.description}`,
      baseRole: source.isSystem ? source.slug : source.baseRole,
      isSystem: false,
      isActive: true,
      color: source.color,
      icon: source.icon,
      permissions: [...source.permissions],
      userCount: 0,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "platform_role.duplicated",
      entity: newRoleId,
      after: JSON.stringify({ sourceRole: source.slug, newName: args.newName }),
      performedBy: userId,
      platformContext: true,
    });

    return newRoleId;
  }
});

// ─── USER MANAGEMENT CRUD ────────────────────────────────────────────────

export const getPlatformUsers = query({
  args: {
    role: v.optional(v.string()),
    status: v.optional(v.string()),
    department: v.optional(v.string()),
    search: v.optional(v.string()),
    accessType: v.optional(v.union(v.literal("permanent"), v.literal("expiring"), v.literal("expired"))),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "platform_users.view");

    let users = await ctx.db.query("platform_users").collect();

    if (args.role) users = users.filter(u => u.role === args.role);
    if (args.status) users = users.filter(u => u.status === args.status);
    if (args.department) users = users.filter(u => u.department === args.department);
    if (args.search) {
      const s = args.search.toLowerCase();
      users = users.filter(u =>
        u.email.toLowerCase().includes(s) ||
        u.firstName.toLowerCase().includes(s) ||
        u.lastName.toLowerCase().includes(s)
      );
    }
    if (args.accessType === "expiring") {
      const thirtyDaysFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;
      users = users.filter(u => u.accessExpiresAt && u.accessExpiresAt < thirtyDaysFromNow && u.accessExpiresAt > Date.now());
    }
    if (args.accessType === "expired") {
      users = users.filter(u => u.accessExpiresAt && u.accessExpiresAt < Date.now());
    }
    if (args.accessType === "permanent") {
      users = users.filter(u => !u.accessExpiresAt);
    }

    return users.sort((a, b) => b.createdAt - a.createdAt);
  }
});

export const getPlatformUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "platform_users.view");
    return await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .unique();
  }
});

export const updateUserRole = mutation({
  args: {
    targetUserId: v.string(),
    newRole: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, platformUser: actingUser } = await requirePermission(ctx, "platform_users.edit_role");

    if (args.targetUserId === userId) throw new Error("Cannot change your own role");

    const target = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", args.targetUserId))
      .unique();
    if (!target) throw new Error("User not found");

    // Cannot assign master_admin unless you ARE master_admin
    if (args.newRole === "master_admin" && actingUser.role !== "master_admin") {
      throw new Error("Only a master_admin can assign the master_admin role");
    }

    // Cannot modify another master_admin unless you are master_admin
    if (target.role === "master_admin" && actingUser.role !== "master_admin") {
      throw new Error("Only a master_admin can change another master_admin's role");
    }

    const roleRecord = await ctx.db
      .query("platform_roles")
      .withIndex("by_slug", q => q.eq("slug", args.newRole))
      .unique();
    if (!roleRecord || !roleRecord.isActive) throw new Error("Invalid or inactive role");

    const before = { role: target.role, addedPermissions: target.addedPermissions, removedPermissions: target.removedPermissions };

    await ctx.db.patch(target._id, {
      role: args.newRole,
      addedPermissions: [],   // reset overrides on role change
      removedPermissions: [],
      updatedAt: Date.now(),
    });

    // Update role user counts
    await updateRoleUserCount(ctx, target.role, -1);
    await updateRoleUserCount(ctx, args.newRole, 1);

    await ctx.db.insert("permission_audit_log", {
      targetUserId: args.targetUserId,
      changedBy: userId,
      changeType: "role_changed",
      previousValue: JSON.stringify(before),
      newValue: JSON.stringify({ role: args.newRole }),
      reason: args.reason,
      createdAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "platform_user.role_changed",
      entity: args.targetUserId,
      before: JSON.stringify(before),
      after: JSON.stringify({ role: args.newRole }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const updateUserPermissions = mutation({
  args: {
    targetUserId: v.string(),
    addedPermissions: v.array(v.string()),
    removedPermissions: v.array(v.string()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, platformUser: actingUser } = await requirePermission(ctx, "platform_users.edit_permissions");
    if (args.targetUserId === userId) throw new Error("Cannot edit your own permissions");

    const target = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", args.targetUserId))
      .unique();
    if (!target) throw new Error("User not found");

    // Cannot grant permissions you don't have
    const actingPermissions = await getUserPermissions(ctx, userId);
    if (!hasPermission(actingPermissions, "*")) {
      const unauthorized = args.addedPermissions.filter(p => !hasPermission(actingPermissions, p));
      if (unauthorized.length > 0) {
        throw new Error(`Cannot grant permissions you don't have: ${unauthorized.join(", ")}`);
      }
    }

    const before = { addedPermissions: target.addedPermissions, removedPermissions: target.removedPermissions };

    await ctx.db.patch(target._id, {
      addedPermissions: args.addedPermissions,
      removedPermissions: args.removedPermissions,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("permission_audit_log", {
      targetUserId: args.targetUserId,
      changedBy: userId,
      changeType: args.addedPermissions.length > (target.addedPermissions?.length ?? 0)
        ? "permissions_added" : "permissions_removed",
      previousValue: JSON.stringify(before),
      newValue: JSON.stringify({ addedPermissions: args.addedPermissions, removedPermissions: args.removedPermissions }),
      reason: args.reason,
      createdAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "platform_user.permissions_updated",
      entity: args.targetUserId,
      before: JSON.stringify(before),
      after: JSON.stringify({ addedPermissions: args.addedPermissions, removedPermissions: args.removedPermissions }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const updateUserScope = mutation({
  args: {
    targetUserId: v.string(),
    scopeCountries: v.array(v.string()),
    scopeTenantIds: v.array(v.string()),
    scopePlans: v.array(v.string()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "platform_users.edit_permissions");
    const target = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", args.targetUserId))
      .unique();
    if (!target) throw new Error("User not found");

    const before = { scopeCountries: target.scopeCountries, scopeTenantIds: target.scopeTenantIds, scopePlans: target.scopePlans };

    await ctx.db.patch(target._id, {
      scopeCountries: args.scopeCountries,
      scopeTenantIds: args.scopeTenantIds,
      scopePlans: args.scopePlans,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("permission_audit_log", {
      targetUserId: args.targetUserId,
      changedBy: userId,
      changeType: "scope_changed",
      previousValue: JSON.stringify(before),
      newValue: JSON.stringify({ scopeCountries: args.scopeCountries, scopeTenantIds: args.scopeTenantIds, scopePlans: args.scopePlans }),
      reason: args.reason,
      createdAt: Date.now(),
    });
  }
});

export const setAccessExpiry = mutation({
  args: {
    targetUserId: v.string(),
    accessExpiresAt: v.optional(v.number()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "platform_users.edit_permissions");
    const target = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", args.targetUserId))
      .unique();
    if (!target) throw new Error("User not found");

    await ctx.db.patch(target._id, { accessExpiresAt: args.accessExpiresAt, updatedAt: Date.now() });

    await ctx.db.insert("permission_audit_log", {
      targetUserId: args.targetUserId,
      changedBy: userId,
      changeType: "access_expiry_set",
      previousValue: JSON.stringify({ accessExpiresAt: target.accessExpiresAt }),
      newValue: JSON.stringify({ accessExpiresAt: args.accessExpiresAt }),
      reason: args.reason,
      createdAt: Date.now(),
    });
  }
});

export const suspendPlatformUser = mutation({
  args: { targetUserId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const { userId, platformUser: actingUser } = await requirePermission(ctx, "platform_users.suspend");
    if (args.targetUserId === userId) throw new Error("Cannot suspend yourself");

    const target = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", args.targetUserId))
      .unique();
    if (!target) throw new Error("User not found");

    if (target.role === "master_admin" && actingUser.role !== "master_admin") {
      throw new Error("Cannot suspend a master_admin");
    }

    await ctx.db.patch(target._id, { status: "suspended", updatedAt: Date.now() });

    // Revoke all WorkOS sessions
    await ctx.scheduler.runAfter(0, internal.auth.platformWorkos.revokeAllPlatformUserSessions, {
      workosUserId: target.workosUserId,
    });

    await ctx.db.insert("permission_audit_log", {
      targetUserId: args.targetUserId,
      changedBy: userId,
      changeType: "account_suspended",
      previousValue: JSON.stringify({ status: "active" }),
      newValue: JSON.stringify({ status: "suspended", reason: args.reason }),
      reason: args.reason,
      createdAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "platform_user.suspended",
      entity: args.targetUserId,
      after: JSON.stringify({ reason: args.reason }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const unsuspendPlatformUser = mutation({
  args: { targetUserId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "platform_users.suspend");
    const target = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", args.targetUserId))
      .unique();
    if (!target) throw new Error("User not found");

    await ctx.db.patch(target._id, { status: "active", updatedAt: Date.now() });

    await ctx.db.insert("permission_audit_log", {
      targetUserId: args.targetUserId,
      changedBy: userId,
      changeType: "account_unsuspended",
      previousValue: JSON.stringify({ status: "suspended" }),
      newValue: JSON.stringify({ status: "active" }),
      reason: args.reason,
      createdAt: Date.now(),
    });
  }
});

export const deletePlatformUser = mutation({
  args: { targetUserId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const { userId, platformUser: actingUser } = await requirePermission(ctx, "platform_users.delete");
    if (args.targetUserId === userId) throw new Error("Cannot delete your own account");

    const target = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", args.targetUserId))
      .unique();
    if (!target) throw new Error("User not found");

    // Remove from WorkOS platform organization
    await ctx.runAction(internal.auth.platformWorkos.removeFromPlatformOrganization, {
      workosUserId: target.workosUserId,
    });

    // Optionally delete WorkOS user (only if they have no other org memberships)
    // For now: just remove from platform org. User data preserved for audit.

    // Soft-delete: keep audit trail but mark as deleted
    await ctx.db.patch(target._id, {
      status: "suspended",
      email: `deleted_${Date.now()}_${target.email}`, // prevent email collision
      updatedAt: Date.now(),
    });

    await ctx.db.insert("permission_audit_log", {
      targetUserId: args.targetUserId,
      changedBy: userId,
      changeType: "account_deleted",
      previousValue: JSON.stringify({ email: target.email, role: target.role }),
      newValue: JSON.stringify({ status: "deleted", reason: args.reason }),
      reason: args.reason,
      createdAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "platform_user.deleted",
      entity: args.targetUserId,
      after: JSON.stringify({ reason: args.reason }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const revokePlatformUserSessions = mutation({
  args: { targetUserId: v.string(), sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "platform_users.suspend");
    const target = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", args.targetUserId))
      .unique();
    if (!target) throw new Error("User not found");

    if (args.sessionId) {
      // Revoke single session
      await ctx.runAction(internal.auth.platformWorkos.revokeSingleSession, {
        sessionId: args.sessionId,
      });
      // Remove from platform_sessions table
      const session = await ctx.db
        .query("platform_sessions")
        .withIndex("by_workosSessionId", q => q.eq("workosSessionId", args.sessionId!))
        .unique();
      if (session) await ctx.db.delete(session._id);
    } else {
      // Revoke all sessions
      await ctx.runAction(internal.auth.platformWorkos.revokeAllPlatformUserSessions, {
        workosUserId: target.workosUserId,
      });
      // Clear all sessions from Convex
      const sessions = await ctx.db
        .query("platform_sessions")
        .withIndex("by_platformUserId", q => q.eq("platformUserId", target._id))
        .collect();
      for (const session of sessions) await ctx.db.delete(session._id);
    }
  }
});

export const getMyPermissions = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { permissions: [], platformUser: null, isAuthenticated: false };

    const permissions = await getUserPermissions(ctx, identity.subject);
    const platformUser = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", identity.subject))
      .unique();

    return {
      permissions,
      platformUser,
      isAuthenticated: true,
      isMasterAdmin: platformUser?.role === "master_admin",
    };
  }
});

export const getPermissionAuditLog = query({
  args: {
    targetUserId: v.optional(v.string()),
    changedBy: v.optional(v.string()),
    changeType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "platform_users.view_activity");

    let logs = await ctx.db.query("permission_audit_log").order("desc").take(args.limit ?? 50);

    if (args.targetUserId) logs = logs.filter(l => l.targetUserId === args.targetUserId);
    if (args.changedBy) logs = logs.filter(l => l.changedBy === args.changedBy);
    if (args.changeType) logs = logs.filter(l => l.changeType === args.changeType);

    return logs;
  }
});
```

---

# SECTION 6 — INVITE FLOW COMPLETE IMPLEMENTATION

## 6.1 Invite Mutations

```typescript
// convex/modules/platform/users.ts

export const invitePlatformUser = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    addedPermissions: v.array(v.string()),
    removedPermissions: v.array(v.string()),
    scopeCountries: v.array(v.string()),
    scopeTenantIds: v.array(v.string()),
    scopePlans: v.array(v.string()),
    accessExpiresAt: v.optional(v.number()),
    notifyInviter: v.boolean(),
    personalMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, platformUser: inviter } = await requirePermission(ctx, "platform_users.invite");

    // Validate role exists and is active
    const roleRecord = await ctx.db
      .query("platform_roles")
      .withIndex("by_slug", q => q.eq("slug", args.role))
      .unique();
    if (!roleRecord || !roleRecord.isActive) throw new Error("Invalid or inactive role");

    // Cannot invite as master_admin unless you are master_admin
    if (args.role === "master_admin" && inviter.role !== "master_admin") {
      throw new Error("Only a master_admin can invite another master_admin");
    }

    // Cannot grant permissions you don't have (non-master_admin)
    if (inviter.role !== "master_admin" && args.addedPermissions.length > 0) {
      const inviterPermissions = await getUserPermissions(ctx, userId);
      const unauthorized = args.addedPermissions.filter(p => !hasPermission(inviterPermissions, p));
      if (unauthorized.length > 0) {
        throw new Error(`Cannot grant permissions you don't have: ${unauthorized.join(", ")}`);
      }
    }

    // Check no pending invite for this email
    const existingInvite = await ctx.db
      .query("platform_user_invites")
      .withIndex("by_email", q => q.eq("email", args.email))
      .filter(q => q.eq(q.field("status"), "pending"))
      .unique();
    if (existingInvite) throw new Error("A pending invitation already exists for this email");

    // Check not already a platform user
    const existingUser = await ctx.db
      .query("platform_users")
      .withIndex("by_email", q => q.eq("email", args.email))
      .unique();
    if (existingUser) throw new Error("This email already has a platform account");

    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 72 * 60 * 60 * 1000; // 72 hours

    // Get WorkOS invitation token
    const workosResult = await ctx.runAction(
      internal.auth.platformWorkos.sendPlatformInvitation,
      {
        email: args.email,
        inviterUserId: inviter.workosUserId,
        redirectUri: `${process.env.NEXT_PUBLIC_PLATFORM_URL}/platform/invite/accept?token=${token}`,
      }
    );

    const inviteId = await ctx.db.insert("platform_user_invites", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      department: args.department,
      jobTitle: args.jobTitle,
      addedPermissions: args.addedPermissions,
      removedPermissions: args.removedPermissions,
      scopeCountries: args.scopeCountries,
      scopeTenantIds: args.scopeTenantIds,
      scopePlans: args.scopePlans,
      accessExpiresAt: args.accessExpiresAt,
      invitedBy: userId,
      token,
      workosInvitationToken: workosResult.workosInvitationToken,
      status: "pending",
      expiresAt,
      notifyInviter: args.notifyInviter,
      personalMessage: args.personalMessage,
      remindersSent: 0,
      createdAt: Date.now(),
    });

    // Send invite email via Resend
    await ctx.scheduler.runAfter(0, internal.communications.email.sendPlatformInviteEmail, {
      to: args.email,
      firstName: args.firstName,
      roleName: roleRecord.name,
      inviterName: `${inviter.firstName} ${inviter.lastName}`,
      personalMessage: args.personalMessage,
      token,
      expiresAt,
      permissions: roleRecord.permissions
        .filter(p => !args.removedPermissions.includes(p))
        .concat(args.addedPermissions),
    });

    // Schedule reminder emails
    await ctx.scheduler.runAt(
      Date.now() + 24 * 60 * 60 * 1000,  // 24hr
      internal.platform.users.sendInviteReminder,
      { inviteId, reminderNumber: 1 }
    );
    await ctx.scheduler.runAt(
      Date.now() + 48 * 60 * 60 * 1000,  // 48hr
      internal.platform.users.sendInviteReminder,
      { inviteId, reminderNumber: 2 }
    );

    await logAudit(ctx, {
      action: "platform_user.invited",
      entity: inviteId,
      after: JSON.stringify({ email: args.email, role: args.role }),
      performedBy: userId,
      platformContext: true,
    });

    return { inviteId, token };
  }
});

export const bulkInvitePlatformUsers = mutation({
  args: {
    invites: v.array(v.object({
      email: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      role: v.string(),
      department: v.optional(v.string()),
    })),
    defaultPermissions: v.object({
      addedPermissions: v.array(v.string()),
      removedPermissions: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "platform_users.invite");
    const results = [];
    for (const invite of args.invites) {
      try {
        const result = await invitePlatformUser(ctx, {
          ...invite,
          ...args.defaultPermissions,
          scopeCountries: [],
          scopeTenantIds: [],
          scopePlans: [],
          notifyInviter: false,
        });
        results.push({ email: invite.email, success: true, inviteId: result.inviteId });
      } catch (e: any) {
        results.push({ email: invite.email, success: false, error: e.message });
      }
    }
    return results;
  }
});

export const acceptPlatformInvite = action({
  // PUBLIC — no requirePermission
  args: {
    token: v.string(),
    workosUserId: v.optional(v.string()), // if signing in with existing WorkOS account
    password: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate invite
    const invite = await ctx.runQuery(internal.platform.users.getInviteByToken, { token: args.token });
    if (!invite) throw new ConvexError({ code: "INVALID_TOKEN", message: "Invalid invitation link" });
    if (invite.status !== "pending") throw new ConvexError({ code: "TOKEN_USED" });
    if (invite.expiresAt < Date.now()) throw new ConvexError({ code: "TOKEN_EXPIRED" });

    let workosUserId: string;

    if (args.workosUserId) {
      // Existing WorkOS user — just add to platform org
      workosUserId = args.workosUserId;
      await ctx.runAction(internal.auth.platformWorkos.addToPlatformOrganization, {
        workosUserId,
        roleSlug: "member",
      });
    } else if (args.password && args.firstName && args.lastName) {
      // Create new WorkOS user
      const createResult = await ctx.runAction(internal.auth.platformWorkos.createPlatformUser, {
        email: invite.email,
        firstName: args.firstName,
        lastName: args.lastName,
        password: args.password,
      });
      workosUserId = createResult.workosUserId;

      // Add to platform org
      await ctx.runAction(internal.auth.platformWorkos.addToPlatformOrganization, {
        workosUserId,
        roleSlug: "member",
      });
    } else {
      throw new Error("Either workosUserId or password/name must be provided");
    }

    // Create platform_users record
    const platformUserId = await ctx.runMutation(
      internal.platform.users.createPlatformUserFromInvite,
      { inviteToken: args.token, workosUserId }
    );

    // Get auth URL for session creation
    const platformOrgId = process.env.WORKOS_PLATFORM_ORG_ID!;
    const authUrl = await ctx.runAction(internal.auth.platformWorkos.getOrganizationAuthUrl, {
      organizationId: platformOrgId,
      redirectUri: `${process.env.NEXT_PUBLIC_PLATFORM_URL}/platform`,
    });

    return { platformUserId, authUrl };
  }
});

export const createPlatformUserFromInvite = internalMutation({
  args: { inviteToken: v.string(), workosUserId: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("platform_user_invites")
      .withIndex("by_token", q => q.eq("token", args.inviteToken))
      .unique();
    if (!invite) throw new Error("Invite not found");

    // Get WorkOS user data for avatar etc
    const now = Date.now();

    const platformUserId = await ctx.db.insert("platform_users", {
      userId: args.workosUserId,
      workosUserId: args.workosUserId,
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      role: invite.role,
      department: invite.department,
      jobTitle: invite.jobTitle,
      addedPermissions: invite.addedPermissions,
      removedPermissions: invite.removedPermissions,
      scopeCountries: invite.scopeCountries,
      scopeTenantIds: invite.scopeTenantIds,
      scopePlans: invite.scopePlans,
      accessExpiresAt: invite.accessExpiresAt,
      status: "active",
      invitedBy: invite.invitedBy,
      acceptedAt: now,
      twoFactorEnabled: false,
      sessionCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Update invite status
    await ctx.db.patch(invite._id, { status: "accepted", acceptedAt: now });

    // Update role user count
    await updateRoleUserCount(ctx, invite.role, 1);

    // Notify inviter if requested
    if (invite.notifyInviter) {
      await ctx.scheduler.runAfter(0, internal.communications.email.sendInviteAcceptedNotification, {
        inviterId: invite.invitedBy,
        acceptedEmail: invite.email,
        roleName: invite.role,
      });
    }

    await logAudit(ctx, {
      action: "platform_user.invite_accepted",
      entity: platformUserId,
      after: JSON.stringify({ email: invite.email, role: invite.role }),
      performedBy: args.workosUserId,
      platformContext: true,
    });

    return platformUserId;
  }
});

export const resendPlatformInvite = mutation({
  args: { inviteId: v.id("platform_user_invites") },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "platform_users.invite");
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (!["pending", "expired"].includes(invite.status)) {
      throw new Error("Can only resend pending or expired invites");
    }

    const newToken = crypto.randomUUID();
    const newExpiry = Date.now() + 72 * 60 * 60 * 1000;

    await ctx.db.patch(args.inviteId, {
      token: newToken,
      status: "pending",
      expiresAt: newExpiry,
      remindersSent: invite.remindersSent + 1,
      lastReminderAt: Date.now(),
    });

    // Resend invite email
    await ctx.scheduler.runAfter(0, internal.communications.email.sendPlatformInviteEmail, {
      to: invite.email,
      firstName: invite.firstName,
      token: newToken,
      expiresAt: newExpiry,
    });

    await logAudit(ctx, {
      action: "platform_user.invite_resent",
      entity: args.inviteId,
      after: JSON.stringify({ email: invite.email }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const revokePlatformInvite = mutation({
  args: { inviteId: v.id("platform_user_invites"), reason: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "platform_users.invite");
    await ctx.db.patch(args.inviteId, { status: "revoked" });
    await logAudit(ctx, {
      action: "platform_user.invite_revoked",
      entity: args.inviteId,
      after: JSON.stringify({ reason: args.reason }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const expirePlatformInvites = internalMutation({
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("platform_user_invites")
      .withIndex("by_status", q => q.eq("status", "pending"))
      .filter(q => q.lt(q.field("expiresAt"), Date.now()))
      .collect();

    for (const invite of expired) {
      await ctx.db.patch(invite._id, { status: "expired" });
    }
  }
});

export const expireAccessExpiredAccounts = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("platform_users")
      .withIndex("by_accessExpiresAt", q => q.lt("accessExpiresAt", now))
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    for (const user of expired) {
      if (!user.accessExpiresAt || user.accessExpiresAt >= now) continue;
      await ctx.db.patch(user._id, { status: "suspended", updatedAt: now });
      // Revoke sessions
      await ctx.scheduler.runAfter(0, internal.auth.platformWorkos.revokeAllPlatformUserSessions, {
        workosUserId: user.workosUserId,
      });
    }
  }
});
```

---

# SECTION 7 — FRONTEND: PLATFORM USER MANAGEMENT

## 7.1 React Permission Hooks

```typescript
// frontend/src/hooks/usePlatformPermissions.ts

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function usePlatformPermissions() {
  const result = useQuery(api.platform.rbac.getMyPermissions);

  function can(permission: string): boolean {
    if (!result?.permissions) return false;
    if (result.permissions.includes("*")) return true;
    return result.permissions.includes(permission);
  }

  function canAny(perms: string[]): boolean { return perms.some(p => can(p)); }
  function canAll(perms: string[]): boolean { return perms.every(p => can(p)); }

  return {
    permissions: result?.permissions ?? [],
    platformUser: result?.platformUser ?? null,
    isLoaded: result !== undefined,
    isAuthenticated: result?.isAuthenticated ?? false,
    isMasterAdmin: result?.isMasterAdmin ?? false,
    can, canAny, canAll,
  };
}

// PermissionGate component
export function PermissionGate({
  permission,
  children,
  fallback = null,
  showDisabled = false,
  disabledTooltip,
}: {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
  disabledTooltip?: string;
}) {
  const { can, isLoaded } = usePlatformPermissions();
  if (!isLoaded) return null;

  if (!can(permission)) {
    if (showDisabled) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="opacity-50 cursor-not-allowed pointer-events-none">
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>{disabledTooltip ?? `Requires '${permission}' permission`}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }
    return fallback;
  }

  return children;
}
```

## 7.2 Platform Users List Page `/platform/users`

```typescript
// frontend/src/app/platform/users/page.tsx

export default function PlatformUsersPage() {
  const { can } = usePlatformPermissions();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const users = useQuery(api.platform.users.getPlatformUsers, {
    search: search || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    accessType: activeTab === "expiring" ? "expiring" : undefined,
  });
  const invites = useQuery(api.platform.users.getPlatformInvites);
  const roles = useQuery(api.platform.rbac.getRoles, { includeSystem: true });

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Platform Staff</h1>
            <p className="text-muted-foreground">Manage EduMyles internal team access</p>
          </div>
          <div className="flex gap-2">
            <PermissionGate permission="platform_users.invite">
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Staff
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Staff", value: users?.length ?? 0, icon: Users },
            { label: "Active", value: users?.filter(u => u.status === "active").length ?? 0, icon: CheckCircle, color: "green" },
            { label: "Suspended", value: users?.filter(u => u.status === "suspended").length ?? 0, icon: XCircle, color: "red" },
            { label: "Pending Invites", value: invites?.filter(i => i.status === "pending").length ?? 0, icon: Clock, color: "yellow" },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color === "green" ? "bg-green-100" : stat.color === "red" ? "bg-red-100" : stat.color === "yellow" ? "bg-yellow-100" : "bg-muted"}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color === "green" ? "text-green-600" : stat.color === "red" ? "text-red-600" : stat.color === "yellow" ? "text-yellow-600" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Staff</TabsTrigger>
            <TabsTrigger value="by_role">By Role</TabsTrigger>
            <TabsTrigger value="pending_invites">
              Pending Invites
              {(invites?.filter(i => i.status === "pending").length ?? 0) > 0 && (
                <Badge className="ml-1.5" variant="secondary">
                  {invites?.filter(i => i.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suspended">Suspended</TabsTrigger>
            <TabsTrigger value="expiring">Expiring Access</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {/* Search and filters */}
            <div className="flex gap-3 my-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  {roles?.map(role => (
                    <SelectItem key={role.slug} value={role.slug}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users table */}
            {users === undefined ? (
              <UsersTableSkeleton />
            ) : users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No staff found"
                description={search ? "Try a different search term" : "Invite your first team member"}
                action={can("platform_users.invite") ? (
                  <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> Invite Staff
                  </Button>
                ) : undefined}
              />
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Staff Member</th>
                      <th className="text-left p-3 text-sm font-medium">Role</th>
                      <th className="text-left p-3 text-sm font-medium">Department</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Last Login</th>
                      <th className="text-left p-3 text-sm font-medium">Access Expires</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map(user => (
                      <PlatformUserRow key={user._id} user={user} roles={roles ?? []} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="by_role">
            <div className="grid grid-cols-2 gap-4 mt-4">
              {roles?.map(role => {
                const roleUsers = users?.filter(u => u.role === role.slug) ?? [];
                return (
                  <Card key={role.slug} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => { setRoleFilter(role.slug); setActiveTab("all"); }}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: role.color + "20" }}>
                          <DynamicIcon name={role.icon} className="w-4 h-4" style={{ color: role.color }} />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{role.name}</h3>
                          {role.isSystem && <Badge variant="outline" className="text-xs">System</Badge>}
                        </div>
                        <Badge className="ml-auto">{roleUsers.length}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                      <div className="flex -space-x-2 mt-3">
                        {roleUsers.slice(0, 5).map(u => (
                          <Avatar key={u._id} className="w-7 h-7 border-2 border-background">
                            <AvatarImage src={u.avatarUrl} />
                            <AvatarFallback className="text-xs">{u.firstName[0]}{u.lastName[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                        {roleUsers.length > 5 && (
                          <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                            +{roleUsers.length - 5}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="pending_invites">
            <PendingInvitesTab invites={invites?.filter(i => i.status === "pending") ?? []} />
          </TabsContent>

          <TabsContent value="suspended">
            <SuspendedUsersTab users={users?.filter(u => u.status === "suspended") ?? []} />
          </TabsContent>

          <TabsContent value="expiring">
            <ExpiringAccessTab users={users?.filter(u => {
              if (!u.accessExpiresAt) return false;
              const thirtyDays = Date.now() + 30 * 24 * 60 * 60 * 1000;
              return u.accessExpiresAt < thirtyDays && u.accessExpiresAt > Date.now();
            }) ?? []} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Modal */}
      <InviteStaffModal open={showInviteModal} onClose={() => setShowInviteModal(false)} />
    </PlatformLayout>
  );
}
```

## 7.3 Invite Staff Modal

```typescript
// frontend/src/components/platform/InviteStaffModal.tsx

export function InviteStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { can, isMasterAdmin } = usePlatformPermissions();
  const roles = useQuery(api.platform.rbac.getRoles, { includeSystem: true });
  const invite = useMutation(api.platform.users.invitePlatformUser);

  const [selectedRole, setSelectedRole] = useState("");
  const [addedPermissions, setAddedPermissions] = useState<string[]>([]);
  const [removedPermissions, setRemovedPermissions] = useState<string[]>([]);
  const [showPermCustomizer, setShowPermCustomizer] = useState(false);
  const [accessExpiresAt, setAccessExpiresAt] = useState<Date | undefined>();
  const [scopeCountries, setScopeCountries] = useState<string[]>([]);

  const selectedRoleRecord = roles?.find(r => r.slug === selectedRole);

  // Effective permissions preview for selected role
  const effectivePermissions = useMemo(() => {
    if (!selectedRoleRecord) return [];
    const base = new Set(selectedRoleRecord.permissions);
    addedPermissions.forEach(p => base.add(p));
    removedPermissions.forEach(p => base.delete(p));
    return [...base];
  }, [selectedRoleRecord, addedPermissions, removedPermissions]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Staff Member</DialogTitle>
          <DialogDescription>
            They'll receive an email to create their account and access the platform.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">First Name*</label>
              <Input {...register("firstName")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Last Name*</label>
              <Input {...register("lastName")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email Address*</label>
            <Input type="email" {...register("email")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Department</label>
              <Select onValueChange={v => setValue("department", v)}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {["Engineering", "Operations", "Support", "Finance", "Marketing", "Sales", "Other"].map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Job Title</label>
              <Input placeholder="e.g. Senior Support Agent" {...register("jobTitle")} />
            </div>
          </div>

          {/* Role selection — SHOWS PERMISSION PREVIEW */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role*</label>
            <Select onValueChange={setSelectedRole}>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                {roles?.map(role => (
                  <SelectItem key={role.slug} value={role.slug}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                      <span>{role.name}</span>
                      {role.isSystem && <Badge variant="outline" className="text-xs ml-1">System</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Permission preview panel */}
            {selectedRoleRecord && (
              <div className="mt-2 p-3 rounded-lg bg-muted/50 border text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                    What {selectedRoleRecord.name} can do:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPermCustomizer(!showPermCustomizer)}
                    className="text-xs text-primary"
                  >
                    {showPermCustomizer ? "Hide customizer" : "Customize permissions"}
                  </button>
                </div>
                <PermissionPreview permissions={effectivePermissions} />
              </div>
            )}
          </div>

          {/* Permission customizer (expandable) */}
          {showPermCustomizer && selectedRoleRecord && (
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium">Permission Overrides</h4>
              <p className="text-xs text-muted-foreground">
                These apply only to this user, not to the role itself.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Add permissions (not in role) */}
                <div>
                  <p className="text-xs font-medium text-green-700 mb-2">+ Additional Permissions</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {Object.values(PERMISSIONS)
                      .filter(p => !selectedRoleRecord.permissions.includes(p) && (isMasterAdmin || can(p)))
                      .map(p => (
                        <div key={p} className="flex items-center gap-2">
                          <Checkbox
                            checked={addedPermissions.includes(p)}
                            onCheckedChange={checked => {
                              setAddedPermissions(prev => checked ? [...prev, p] : prev.filter(x => x !== p));
                            }}
                          />
                          <label className="text-xs font-mono">{p}</label>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Remove permissions (in role) */}
                <div>
                  <p className="text-xs font-medium text-red-700 mb-2">- Remove Permissions</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {selectedRoleRecord.permissions.map(p => (
                      <div key={p} className="flex items-center gap-2">
                        <Checkbox
                          checked={removedPermissions.includes(p)}
                          onCheckedChange={checked => {
                            setRemovedPermissions(prev => checked ? [...prev, p] : prev.filter(x => x !== p));
                          }}
                        />
                        <label className="text-xs font-mono">{p}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scope restrictions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Scope Restrictions</label>
              <Tooltip>
                <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>Limit which tenants this user can manage. Leave empty for all.</TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Countries only</label>
                <CountryMultiSelect value={scopeCountries} onChange={setScopeCountries} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Plans only</label>
                <MultiSelect
                  options={["free", "starter", "pro", "enterprise"].map(p => ({ value: p, label: p }))}
                  placeholder="All plans"
                />
              </div>
            </div>
          </div>

          {/* Access expiry */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={!!accessExpiresAt}
                onCheckedChange={c => setAccessExpiresAt(c ? addMonths(new Date(), 3) : undefined)}
              />
              <label className="text-sm">Set access expiry (for contractors)</label>
            </div>
            {accessExpiresAt && (
              <DatePicker
                value={accessExpiresAt}
                onChange={setAccessExpiresAt}
                min={new Date()}
              />
            )}
          </div>

          {/* Personal message */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Personal Message (optional)</label>
            <Textarea
              placeholder="Add a personal note to the invite email..."
              rows={3}
              {...register("personalMessage")}
            />
          </div>

          {/* Notify me toggle */}
          <div className="flex items-center gap-2">
            <Checkbox {...register("notifyInviter")} defaultChecked />
            <label className="text-sm">Notify me when they accept</label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!selectedRole || isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Invitation →"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## 7.4 Platform User Detail Page `/platform/users/[userId]`

```typescript
// Full user detail with tabs:
// Profile | Permissions | Sessions | Activity

// Permissions tab shows:
// 1. Current role with description
// 2. Effective permissions matrix (grouped by category)
//    - GREEN: from role
//    - BLUE badge: ADDED beyond role
//    - RED strikethrough: REMOVED from role
// 3. Scope restrictions (countries, tenants, plans)
// 4. [Edit Role] button → dropdown + confirmation dialog
// 5. [Edit Permissions] button → opens customizer modal
// 6. [Edit Scope] button → scope restriction form
// 7. [Set Access Expiry] button → date picker
// 8. [Suspend] button (with reason)
// 9. [Revoke All Sessions] button
// 10. [Delete Account] button (master_admin only)

// Sessions tab shows:
// List of active sessions from platform_sessions
// Each: device, IP, location, last active
// [Kill Session] button per session
// [Kill All Sessions] button

// Activity tab shows:
// Last 50 actions by this user (from auditLogs)
// Filter by action type
// Permission changes (from permission_audit_log)
```

---

# SECTION 8 — INVITE ACCEPT PAGES

## 8.1 Accept Page `/platform/invite/accept`

```typescript
// frontend/src/app/platform/invite/accept/page.tsx
// Public page — no auth required

export default function AcceptPlatformInvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const invite = useQuery(api.platform.users.getInviteByToken, token ? { token } : "skip");
  const acceptInvite = useAction(api.platform.users.acceptPlatformInvite);

  // States: loading | invalid | expired | used | create_account | sign_in_instead | success
  if (invite === undefined) return <LoadingSpinner />;
  if (!invite) return <InvalidInviteMessage />;
  if (invite.status === "expired") return <ExpiredInviteMessage />;
  if (invite.status !== "pending") return <UsedInviteMessage />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/edumyles-logo.svg" alt="EduMyles" className="h-10 mx-auto mb-4" />
          <CardTitle>You've been invited to EduMyles</CardTitle>
          <CardDescription>
            <span className="font-medium">{invite.inviterName}</span> has invited you as
            a <span className="font-medium">{invite.roleName}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invite.personalMessage && (
            <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-primary text-sm italic">
              "{invite.personalMessage}"
            </div>
          )}

          {/* Permission preview */}
          <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
            <p className="font-medium">As {invite.roleName}, you'll be able to:</p>
            <PermissionPreviewMini permissions={invite.permissions} />
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">First Name*</label>
                <Input defaultValue={invite.firstName} {...register("firstName")} />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name*</label>
                <Input defaultValue={invite.lastName} {...register("lastName")} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={invite.email} disabled className="bg-muted" />
            </div>
            <div>
              <label className="text-sm font-medium">Password*</label>
              <PasswordInput {...register("password")} />
              <PasswordStrengthIndicator password={watch("password")} />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm Password*</label>
              <PasswordInput {...register("confirmPassword")} />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox {...register("acceptTerms")} />
              <label className="text-xs text-muted-foreground">
                I agree to the <a href="/terms" className="text-primary">Terms of Service</a> and{" "}
                <a href="/privacy" className="text-primary">Privacy Policy</a>
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create Account & Accept Invitation →"}
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>

          <Button variant="outline" className="w-full" onClick={handleSignInInstead}>
            Sign in with existing account
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            This invitation expires on {formatDate(invite.expiresAt)}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

# SECTION 9 — ROLE MANAGEMENT PAGES

## 9.1 `/platform/users/roles` — Role Management

Full page with:

**Left sidebar: All roles list**
- System roles (locked with 🔒 icon): master_admin, super_admin, etc.
- Custom roles: listed below with edit/delete options
- User count badge per role
- "Create Custom Role" button at bottom

**Right panel: Selected role detail**
- Role name, description, color, icon
- "Duplicate" button (creates editable copy)
- For system roles: "View Only" label
- For custom roles: "Edit" and "Deactivate" buttons
- Permission matrix (organized by category with checkmarks)
- Users with this role (avatar stack + "View all" link)

## 9.2 Create/Edit Role Page

5-step form:
1. **Identity**: name, description, base role (inherit from), color, icon
2. **Permissions**: grouped by category, inherited shown differently, toggles
3. **Scope defaults**: recommended scope restrictions for this role type
4. **Preview**: permission summary + page access list + affected user count
5. **Confirm**: review all settings + create button

**Permission Matrix UI (Step 2):**
```
TENANT MANAGEMENT                          [Collapse ▲]
  ✅ tenants.view              View tenant list
  ✅ tenants.view_details      Full tenant detail
  ❌ tenants.create            Create tenants
  ❌ tenants.delete            Delete tenants [🔒 master_admin only]
  ...
```

---

# ═══════════════════════════════════════════════════════════
# DOCUMENT 2 — CRM SYSTEM
# ═══════════════════════════════════════════════════════════

---

# SECTION 10 — CRM OVERVIEW & ACCESS MODEL

---

## 10.1 CRM Purpose

The CRM tracks the full lifecycle of schools from first contact to paying customers. It manages leads, deals, proposals, contacts, and conversion to tenants. Platform managers own their leads; master admins see everything.

## 10.2 CRM Access Model (Critical)

```
PERMISSION: crm.view_own
  → User sees ONLY leads/deals they created OR are assigned to

PERMISSION: crm.view_shared
  → User sees leads/deals explicitly shared with them

PERMISSION: crm.view_all  [super_admin and above]
  → User sees ALL leads/deals with ability to filter by owner

master_admin has ["*"] = sees everything

Data rule for view_own:
  crm_leads WHERE ownerId = currentUserId
    OR assignedTo = currentUserId
    
Data rule for view_shared (additional):
  crm_leads WHERE _id IN (
    SELECT leadId FROM crm_lead_shares WHERE sharedWithUserId = currentUserId
  )
  
Data rule for view_all:
  crm_leads (no filter — all leads)
```

---

# SECTION 11 — CRM DATABASE SCHEMA

```typescript
// convex/schema.ts additions for CRM

crm_leads: defineTable({
  // Core info
  companyName: v.string(),               // School name
  contactName: v.string(),               // Primary contact
  contactEmail: v.string(),
  contactPhone: v.optional(v.string()),
  contactTitle: v.optional(v.string()),  // "Principal", "CEO", "Director"
  country: v.string(),
  county: v.optional(v.string()),
  address: v.optional(v.string()),
  website: v.optional(v.string()),

  // School details
  schoolType: v.optional(v.string()),    // "secondary", "primary", etc.
  studentCount: v.optional(v.number()),
  staffCount: v.optional(v.number()),
  currentSystem: v.optional(v.string()), // what they use now
  painPoints: v.array(v.string()),       // ["manual_attendance", "fee_collection"]
  interestedModules: v.array(v.string()),// modules they want

  // Pipeline
  stage: v.union(
    v.literal("new"),
    v.literal("contacted"),
    v.literal("qualified"),
    v.literal("demo_booked"),
    v.literal("demo_done"),
    v.literal("proposal_sent"),
    v.literal("negotiation"),
    v.literal("won"),
    v.literal("lost"),
    v.literal("disqualified"),
  ),
  qualificationScore: v.number(),        // 0-100
  dealValueKes: v.optional(v.number()),  // expected annual MRR
  expectedCloseDate: v.optional(v.number()),
  probability: v.optional(v.number()),   // 0-100%

  // Ownership & assignment
  ownerId: v.string(),                   // platform_user who created/owns this lead
  assignedToId: v.optional(v.string()),  // platform_user currently assigned
  teamId: v.optional(v.string()),        // crm_team if using team selling

  // Relationships
  sourceType: v.union(
    v.literal("waitlist"),
    v.literal("demo_form"),
    v.literal("referral"),
    v.literal("reseller"),
    v.literal("event"),
    v.literal("social_media"),
    v.literal("cold_outreach"),
    v.literal("inbound_call"),
    v.literal("other"),
  ),
  referralCode: v.optional(v.string()),
  resellerId: v.optional(v.string()),
  waitlistId: v.optional(v.id("waitlist")),
  tenantId: v.optional(v.string()),      // set on conversion to paying customer

  // Status & tracking
  isArchived: v.boolean(),
  isDeleted: v.boolean(),                // soft delete
  lostReason: v.optional(v.string()),
  disqualificationReason: v.optional(v.string()),
  tags: v.array(v.string()),

  // Metadata
  lastContactedAt: v.optional(v.number()),
  nextFollowUpAt: v.optional(v.number()),
  nextFollowUpNote: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_stage", ["stage"])
  .index("by_ownerId", ["ownerId"])
  .index("by_assignedToId", ["assignedToId"])
  .index("by_country", ["country"])
  .index("by_tenantId", ["tenantId"])
  .index("by_isDeleted", ["isDeleted"])
  .index("by_nextFollowUpAt", ["nextFollowUpAt"])
  .index("by_createdAt", ["createdAt"]),

crm_contacts: defineTable({
  // A lead can have multiple contacts
  leadId: v.id("crm_leads"),
  firstName: v.string(),
  lastName: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  title: v.optional(v.string()),
  department: v.optional(v.string()),
  isPrimary: v.boolean(),
  linkedinUrl: v.optional(v.string()),
  whatsappNumber: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_leadId", ["leadId"])
  .index("by_email", ["email"]),

crm_activities: defineTable({
  leadId: v.id("crm_leads"),
  type: v.union(
    v.literal("note"),
    v.literal("email_sent"),
    v.literal("email_received"),
    v.literal("call"),
    v.literal("whatsapp"),
    v.literal("meeting"),
    v.literal("demo"),
    v.literal("proposal"),
    v.literal("follow_up"),
    v.literal("stage_change"),
    v.literal("assignment_change"),
    v.literal("system"),           // auto-created by system (waitlist, invite, etc.)
  ),
  subject: v.optional(v.string()),
  body: v.optional(v.string()),
  outcome: v.optional(v.string()),  // for calls/meetings: what happened
  durationMinutes: v.optional(v.number()),
  isPrivate: v.boolean(),           // private notes visible only to creator
  scheduledAt: v.optional(v.number()), // for future activities
  completedAt: v.optional(v.number()),
  createdBy: v.string(),            // platform_user
  createdAt: v.number(),
  metadata: v.optional(v.string()), // JSON: email thread ID, call recording URL, etc.
})
  .index("by_leadId", ["leadId"])
  .index("by_createdBy", ["createdBy"])
  .index("by_type", ["type"])
  .index("by_scheduledAt", ["scheduledAt"]),

crm_proposals: defineTable({
  leadId: v.id("crm_leads"),
  title: v.string(),
  status: v.union(
    v.literal("draft"),
    v.literal("sent"),
    v.literal("viewed"),
    v.literal("accepted"),
    v.literal("rejected"),
    v.literal("expired"),
  ),
  // Pricing details
  recommendedPlan: v.string(),
  billingPeriod: v.string(),
  studentCount: v.number(),
  planPriceKes: v.number(),
  modulesIncluded: v.array(v.string()),
  additionalModules: v.array(v.object({
    slug: v.string(),
    name: v.string(),
    priceKes: v.number(),
  })),
  discountPct: v.optional(v.number()),
  discountReason: v.optional(v.string()),
  totalMonthlyKes: v.number(),
  totalAnnualKes: v.number(),
  validUntil: v.number(),
  customNotes: v.optional(v.string()),
  pdfUrl: v.optional(v.string()),
  trackingToken: v.string(),             // for view tracking
  viewedAt: v.optional(v.number()),
  viewCount: v.number(),
  viewerIp: v.optional(v.string()),
  sentAt: v.optional(v.number()),
  acceptedAt: v.optional(v.number()),
  rejectedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_leadId", ["leadId"])
  .index("by_trackingToken", ["trackingToken"])
  .index("by_status", ["status"])
  .index("by_createdBy", ["createdBy"]),

crm_lead_shares: defineTable({
  leadId: v.id("crm_leads"),
  sharedByUserId: v.string(),
  sharedWithUserId: v.string(),
  accessLevel: v.union(v.literal("view"), v.literal("edit")),
  message: v.optional(v.string()),    // why it was shared
  sharedAt: v.number(),
  expiresAt: v.optional(v.number()),  // optional share expiry
})
  .index("by_leadId", ["leadId"])
  .index("by_sharedWithUserId", ["sharedWithUserId"])
  .index("by_sharedByUserId", ["sharedByUserId"]),

crm_pipeline_stages: defineTable({
  // Configurable pipeline stages (platform manager can customize)
  name: v.string(),
  slug: v.string(),
  order: v.number(),
  color: v.string(),
  icon: v.string(),
  description: v.optional(v.string()),
  probabilityDefault: v.number(),      // default win probability for this stage
  isActive: v.boolean(),
  requiresNote: v.boolean(),           // require note when moving to this stage
  autoFollowUpDays: v.optional(v.number()), // auto-set follow-up when entering stage
  isWon: v.boolean(),                  // this stage = won deal
  isLost: v.boolean(),                 // this stage = lost deal
  createdAt: v.number(),
})
  .index("by_order", ["order"])
  .index("by_slug", ["slug"]),

crm_teams: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  leaderId: v.string(),               // platform_user
  memberIds: v.array(v.string()),     // platform_users
  territories: v.array(v.string()),   // countries this team covers
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index("by_leaderId", ["leaderId"]),

crm_follow_ups: defineTable({
  leadId: v.id("crm_leads"),
  assignedToId: v.string(),
  title: v.string(),
  notes: v.optional(v.string()),
  dueAt: v.number(),
  completedAt: v.optional(v.number()),
  isOverdue: v.boolean(),             // computed + stored for querying
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  createdBy: v.string(),
  createdAt: v.number(),
})
  .index("by_leadId", ["leadId"])
  .index("by_assignedToId", ["assignedToId"])
  .index("by_dueAt", ["dueAt"])
  .index("by_isOverdue", ["isOverdue"]),
```

---

# SECTION 12 — CRM CONVEX FUNCTIONS

## 12.1 Lead CRUD with Access Control

```typescript
// convex/modules/platform/crm.ts

// ─── QUERY HELPERS ────────────────────────────────────────────────────────

async function getLeadsForUser(
  ctx: QueryCtx,
  userId: string,
  permissions: string[]
): Promise<Doc<"crm_leads">[]> {
  const canViewAll = hasPermission(permissions, "crm.view_all");
  const canViewOwn = hasPermission(permissions, "crm.view_own");
  const canViewShared = hasPermission(permissions, "crm.view_shared");

  if (canViewAll) {
    // Return all non-deleted leads
    return await ctx.db
      .query("crm_leads")
      .withIndex("by_isDeleted", q => q.eq("isDeleted", false))
      .collect();
  }

  const ownLeads = canViewOwn ? await ctx.db
    .query("crm_leads")
    .withIndex("by_ownerId", q => q.eq("ownerId", userId))
    .filter(q => q.eq(q.field("isDeleted"), false))
    .collect() : [];

  const assignedLeads = canViewOwn ? await ctx.db
    .query("crm_leads")
    .withIndex("by_assignedToId", q => q.eq("assignedToId", userId))
    .filter(q => q.eq(q.field("isDeleted"), false))
    .collect() : [];

  const sharedLeadIds = canViewShared ? (await ctx.db
    .query("crm_lead_shares")
    .withIndex("by_sharedWithUserId", q => q.eq("sharedWithUserId", userId))
    .collect()).map(s => s.leadId) : [];

  const sharedLeads = await Promise.all(
    sharedLeadIds.map(id => ctx.db.get(id))
  );
  const validSharedLeads = sharedLeads.filter(l => l && !l.isDeleted) as Doc<"crm_leads">[];

  // Deduplicate by ID
  const allLeads = new Map<string, Doc<"crm_leads">>();
  [...ownLeads, ...assignedLeads, ...validSharedLeads].forEach(l => allLeads.set(l._id, l));

  return [...allLeads.values()];
}

// ─── QUERIES ──────────────────────────────────────────────────────────────

export const getLeads = query({
  args: {
    stage: v.optional(v.string()),
    ownerId: v.optional(v.string()),
    assignedToId: v.optional(v.string()),
    country: v.optional(v.string()),
    search: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    minStudents: v.optional(v.number()),
    maxStudents: v.optional(v.number()),
    sourceType: v.optional(v.string()),
    hasFollowUpDue: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    sortBy: v.optional(v.string()),   // "created_desc", "value_desc", "follow_up_asc"
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "crm.view_own");

    let leads = await getLeadsForUser(ctx, userId, permissions);

    // Apply filters
    if (args.stage) leads = leads.filter(l => l.stage === args.stage);
    if (args.country) leads = leads.filter(l => l.country === args.country);
    if (args.sourceType) leads = leads.filter(l => l.sourceType === args.sourceType);
    if (args.isArchived !== undefined) leads = leads.filter(l => l.isArchived === args.isArchived);
    else leads = leads.filter(l => !l.isArchived); // default: exclude archived
    if (args.minStudents) leads = leads.filter(l => (l.studentCount ?? 0) >= args.minStudents!);
    if (args.maxStudents) leads = leads.filter(l => (l.studentCount ?? 0) <= args.maxStudents!);
    if (args.tags?.length) leads = leads.filter(l => args.tags!.some(t => l.tags.includes(t)));
    if (args.hasFollowUpDue) {
      const now = Date.now();
      leads = leads.filter(l => l.nextFollowUpAt && l.nextFollowUpAt <= now);
    }

    // Owner filter — only for users with crm.view_all
    if (args.ownerId && hasPermission(permissions, "crm.view_all")) {
      leads = leads.filter(l => l.ownerId === args.ownerId);
    }
    if (args.assignedToId && hasPermission(permissions, "crm.view_all")) {
      leads = leads.filter(l => l.assignedToId === args.assignedToId);
    }

    // Search
    if (args.search) {
      const s = args.search.toLowerCase();
      leads = leads.filter(l =>
        l.companyName.toLowerCase().includes(s) ||
        l.contactName.toLowerCase().includes(s) ||
        l.contactEmail.toLowerCase().includes(s)
      );
    }

    // Sort
    const sortBy = args.sortBy ?? "created_desc";
    leads.sort((a, b) => {
      switch (sortBy) {
        case "value_desc": return (b.dealValueKes ?? 0) - (a.dealValueKes ?? 0);
        case "follow_up_asc": return (a.nextFollowUpAt ?? 0) - (b.nextFollowUpAt ?? 0);
        case "updated_desc": return b.updatedAt - a.updatedAt;
        default: return b.createdAt - a.createdAt; // created_desc
      }
    });

    // Enrich with owner/assignee names
    const userIds = new Set([...leads.map(l => l.ownerId), ...leads.map(l => l.assignedToId).filter(Boolean)]);
    const users = await Promise.all([...userIds].map(id => ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", id as string))
      .unique()
    ));
    const userMap = new Map(users.filter(Boolean).map(u => [u!.userId, `${u!.firstName} ${u!.lastName}`]));

    return leads.map(l => ({
      ...l,
      ownerName: userMap.get(l.ownerId) ?? "Unknown",
      assignedToName: l.assignedToId ? (userMap.get(l.assignedToId) ?? "Unknown") : null,
    }));
  }
});

export const getLead = query({
  args: { leadId: v.id("crm_leads") },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "crm.view_own");

    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.isDeleted) throw new ConvexError({ code: "NOT_FOUND" });

    // Check access
    const canViewAll = hasPermission(permissions, "crm.view_all");
    const isOwner = lead.ownerId === userId || lead.assignedToId === userId;
    const isShared = !canViewAll && !isOwner && await ctx.db
      .query("crm_lead_shares")
      .withIndex("by_leadId", q => q.eq("leadId", args.leadId))
      .filter(q => q.eq(q.field("sharedWithUserId"), userId))
      .first();

    if (!canViewAll && !isOwner && !isShared) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "You don't have access to this lead" });
    }

    // Get contacts, activities, proposals, follow-ups
    const [contacts, activities, proposals, followUps, shares] = await Promise.all([
      ctx.db.query("crm_contacts").withIndex("by_leadId", q => q.eq("leadId", args.leadId)).collect(),
      ctx.db.query("crm_activities").withIndex("by_leadId", q => q.eq("leadId", args.leadId)).order("desc").take(50),
      ctx.db.query("crm_proposals").withIndex("by_leadId", q => q.eq("leadId", args.leadId)).collect(),
      ctx.db.query("crm_follow_ups").withIndex("by_leadId", q => q.eq("leadId", args.leadId)).collect(),
      canViewAll ? ctx.db.query("crm_lead_shares").withIndex("by_leadId", q => q.eq("leadId", args.leadId)).collect() : [],
    ]);

    const canEdit = canViewAll ||
      (isOwner && hasPermission(permissions, "crm.edit_own_lead")) ||
      (!!isShared && (isShared as any).accessLevel === "edit");

    return { lead, contacts, activities, proposals, followUps, shares, canEdit };
  }
});

export const getPipelineView = query({
  args: {
    ownerId: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "crm.view_own");

    const stages = await ctx.db.query("crm_pipeline_stages")
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();
    stages.sort((a, b) => a.order - b.order);

    let leads = await getLeadsForUser(ctx, userId, permissions);
    leads = leads.filter(l => !l.isArchived && !l.isDeleted);

    // Apply owner filter (only for crm.view_all users)
    if (args.ownerId && hasPermission(permissions, "crm.view_all")) {
      leads = leads.filter(l => l.ownerId === args.ownerId);
    }
    if (args.country) leads = leads.filter(l => l.country === args.country);

    // Group by stage
    const pipeline = stages.map(stage => ({
      stage,
      leads: leads.filter(l => l.stage === stage.slug),
      totalValueKes: leads
        .filter(l => l.stage === stage.slug)
        .reduce((sum, l) => sum + (l.dealValueKes ?? 0), 0),
    }));

    const totals = {
      totalLeads: leads.length,
      totalValueKes: leads.reduce((sum, l) => sum + (l.dealValueKes ?? 0), 0),
      wonValueKes: leads.filter(l => l.stage === "won").reduce((sum, l) => sum + (l.dealValueKes ?? 0), 0),
      conversionRate: leads.length > 0
        ? (leads.filter(l => l.stage === "won").length / leads.length) * 100 : 0,
    };

    return { pipeline, totals };
  }
});

// ─── MUTATIONS ────────────────────────────────────────────────────────────

export const createLead = mutation({
  args: {
    companyName: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    contactTitle: v.optional(v.string()),
    country: v.string(),
    county: v.optional(v.string()),
    website: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    studentCount: v.optional(v.number()),
    currentSystem: v.optional(v.string()),
    painPoints: v.array(v.string()),
    interestedModules: v.array(v.string()),
    sourceType: v.string(),
    referralCode: v.optional(v.string()),
    waitlistId: v.optional(v.id("waitlist")),
    dealValueKes: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    assignedToId: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "crm.create_lead");

    const qualScore = calculateQualificationScore({
      studentCount: args.studentCount,
      country: args.country,
      currentSystem: args.currentSystem,
      painPoints: args.painPoints,
      sourceType: args.sourceType,
    });

    const leadId = await ctx.db.insert("crm_leads", {
      ...args,
      stage: "new",
      qualificationScore: qualScore,
      ownerId: userId,
      isArchived: false,
      isDeleted: false,
      viewCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Auto-log creation activity
    await ctx.db.insert("crm_activities", {
      leadId,
      type: "system",
      body: "Lead created",
      isPrivate: false,
      createdBy: userId,
      createdAt: Date.now(),
    });

    // Auto-set follow-up based on stage
    await ctx.scheduler.runAfter(0, internal.platform.crm.setAutoFollowUp, {
      leadId, stage: "new", userId,
    });

    await logAudit(ctx, {
      action: "crm_lead.created",
      entity: leadId,
      after: JSON.stringify({ company: args.companyName, stage: "new" }),
      performedBy: userId,
      platformContext: true,
    });

    return leadId;
  }
});

export const updateLead = mutation({
  args: {
    leadId: v.id("crm_leads"),
    // All fields optional for partial update
    companyName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactTitle: v.optional(v.string()),
    country: v.optional(v.string()),
    county: v.optional(v.string()),
    website: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    studentCount: v.optional(v.number()),
    currentSystem: v.optional(v.string()),
    painPoints: v.optional(v.array(v.string())),
    interestedModules: v.optional(v.array(v.string())),
    dealValueKes: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    probability: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    nextFollowUpAt: v.optional(v.number()),
    nextFollowUpNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "crm.edit_own_lead");

    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.isDeleted) throw new Error("Lead not found");

    // Access check
    const canEditAny = hasPermission(permissions, "crm.edit_any_lead");
    const isOwner = lead.ownerId === userId || lead.assignedToId === userId;

    if (!canEditAny && !isOwner) {
      // Check if shared with edit access
      const share = await ctx.db
        .query("crm_lead_shares")
        .withIndex("by_leadId", q => q.eq("leadId", args.leadId))
        .filter(q =>
          q.and(
            q.eq(q.field("sharedWithUserId"), userId),
            q.eq(q.field("accessLevel"), "edit"),
          )
        )
        .first();
      if (!share) throw new ConvexError({ code: "UNAUTHORIZED", message: "You don't have edit access to this lead" });
    }

    const { leadId, ...updates } = args;
    await ctx.db.patch(leadId, { ...updates, updatedAt: Date.now() });

    await logAudit(ctx, {
      action: "crm_lead.updated",
      entity: leadId,
      after: JSON.stringify(updates),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const changeLeadStage = mutation({
  args: {
    leadId: v.id("crm_leads"),
    newStage: v.string(),
    note: v.optional(v.string()),
    lostReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "crm.edit_own_lead");

    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.isDeleted) throw new Error("Lead not found");

    const canEditAny = hasPermission(permissions, "crm.edit_any_lead");
    const isOwner = lead.ownerId === userId || lead.assignedToId === userId;
    if (!canEditAny && !isOwner) throw new Error("No edit access");

    const stageRecord = await ctx.db
      .query("crm_pipeline_stages")
      .withIndex("by_slug", q => q.eq("slug", args.newStage))
      .unique();

    if (stageRecord?.requiresNote && !args.note) {
      throw new Error(`A note is required when moving to ${stageRecord.name}`);
    }

    const oldStage = lead.stage;

    await ctx.db.patch(args.leadId, {
      stage: args.newStage as any,
      lostReason: args.newStage === "lost" ? args.lostReason : undefined,
      updatedAt: Date.now(),
    });

    // Log stage change activity
    await ctx.db.insert("crm_activities", {
      leadId: args.leadId,
      type: "stage_change",
      subject: `Stage changed: ${oldStage} → ${args.newStage}`,
      body: args.note,
      isPrivate: false,
      createdBy: userId,
      createdAt: Date.now(),
    });

    // Auto-set follow-up for new stage
    if (stageRecord?.autoFollowUpDays) {
      await ctx.db.patch(args.leadId, {
        nextFollowUpAt: Date.now() + stageRecord.autoFollowUpDays * 24 * 60 * 60 * 1000,
        nextFollowUpNote: `Follow up after moving to ${stageRecord.name}`,
      });
    }

    // If marked as won: trigger tenant conversion flow
    if (args.newStage === "won") {
      await ctx.scheduler.runAfter(0, internal.platform.crm.onLeadWon, { leadId: args.leadId });
    }

    await logAudit(ctx, {
      action: "crm_lead.stage_changed",
      entity: args.leadId,
      before: JSON.stringify({ stage: oldStage }),
      after: JSON.stringify({ stage: args.newStage }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const assignLead = mutation({
  args: {
    leadId: v.id("crm_leads"),
    assignedToId: v.optional(v.string()),  // null = unassign
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "crm.assign_lead");

    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.isDeleted) throw new Error("Lead not found");

    const previousAssignee = lead.assignedToId;

    await ctx.db.patch(args.leadId, {
      assignedToId: args.assignedToId,
      updatedAt: Date.now(),
    });

    // Notify new assignee
    if (args.assignedToId && args.assignedToId !== userId) {
      await createNotification(ctx, {
        targetPlatformUserId: args.assignedToId,
        title: `Lead assigned to you: ${lead.companyName}`,
        body: args.note ?? `You have been assigned this lead.`,
        actionUrl: `/platform/crm/${args.leadId}`,
        type: "lead_assigned",
      });
    }

    await ctx.db.insert("crm_activities", {
      leadId: args.leadId,
      type: "assignment_change",
      subject: args.assignedToId
        ? `Assigned to new owner`
        : `Unassigned`,
      body: args.note,
      isPrivate: false,
      createdBy: userId,
      createdAt: Date.now(),
      metadata: JSON.stringify({ previousAssignee, newAssignee: args.assignedToId }),
    });

    await logAudit(ctx, {
      action: "crm_lead.assigned",
      entity: args.leadId,
      after: JSON.stringify({ assignedToId: args.assignedToId }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const shareLead = mutation({
  args: {
    leadId: v.id("crm_leads"),
    sharedWithUserId: v.string(),
    accessLevel: v.union(v.literal("view"), v.literal("edit")),
    message: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "crm.share_lead");

    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.isDeleted) throw new Error("Lead not found");

    // Can only share leads you own (or have view_all)
    const canShareAny = hasPermission(permissions, "crm.view_all");
    if (!canShareAny && lead.ownerId !== userId && lead.assignedToId !== userId) {
      throw new Error("You can only share leads you own or are assigned to");
    }

    // Check not already shared with this user
    const existing = await ctx.db
      .query("crm_lead_shares")
      .withIndex("by_leadId", q => q.eq("leadId", args.leadId))
      .filter(q => q.eq(q.field("sharedWithUserId"), args.sharedWithUserId))
      .unique();

    if (existing) {
      // Update access level
      await ctx.db.patch(existing._id, { accessLevel: args.accessLevel, expiresAt: args.expiresAt });
    } else {
      await ctx.db.insert("crm_lead_shares", {
        leadId: args.leadId,
        sharedByUserId: userId,
        sharedWithUserId: args.sharedWithUserId,
        accessLevel: args.accessLevel,
        message: args.message,
        sharedAt: Date.now(),
        expiresAt: args.expiresAt,
      });
    }

    // Notify the user
    await createNotification(ctx, {
      targetPlatformUserId: args.sharedWithUserId,
      title: `Lead shared with you: ${lead.companyName}`,
      body: args.message ?? `You now have ${args.accessLevel} access to this lead.`,
      actionUrl: `/platform/crm/${args.leadId}`,
      type: "lead_shared",
    });

    await logAudit(ctx, {
      action: "crm_lead.shared",
      entity: args.leadId,
      after: JSON.stringify({ sharedWith: args.sharedWithUserId, accessLevel: args.accessLevel }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const logActivity = mutation({
  args: {
    leadId: v.id("crm_leads"),
    type: v.string(),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    outcome: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    isPrivate: v.boolean(),
    scheduledAt: v.optional(v.number()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "crm.view_own");

    // Verify access to this lead
    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.isDeleted) throw new Error("Lead not found");

    const canViewAll = hasPermission(permissions, "crm.view_all");
    const isOwner = lead.ownerId === userId || lead.assignedToId === userId;
    if (!canViewAll && !isOwner) throw new Error("No access to this lead");

    const activityId = await ctx.db.insert("crm_activities", {
      leadId: args.leadId,
      type: args.type as any,
      subject: args.subject,
      body: args.body,
      outcome: args.outcome,
      durationMinutes: args.durationMinutes,
      isPrivate: args.isPrivate,
      scheduledAt: args.scheduledAt,
      createdBy: userId,
      createdAt: Date.now(),
      metadata: args.metadata,
    });

    // Update lastContactedAt on lead
    await ctx.db.patch(args.leadId, {
      lastContactedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return activityId;
  }
});

export const deleteLead = mutation({
  args: { leadId: v.id("crm_leads"), reason: v.string() },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "crm.delete_own_lead");

    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.isDeleted) throw new Error("Lead not found");

    const canDeleteAny = hasPermission(permissions, "crm.delete_any_lead");
    const isOwner = lead.ownerId === userId;

    if (!canDeleteAny && !isOwner) throw new Error("You can only delete your own leads");

    // Soft delete
    await ctx.db.patch(args.leadId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "crm_lead.deleted",
      entity: args.leadId,
      after: JSON.stringify({ reason: args.reason, company: lead.companyName }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const convertLeadToTenant = mutation({
  args: {
    leadId: v.id("crm_leads"),
    suggestedPlan: v.string(),
    suggestedModules: v.array(v.string()),
    personalMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "crm.convert_to_tenant");

    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.isDeleted) throw new Error("Lead not found");

    // Send tenant invite
    const inviteResult = await ctx.runMutation(internal.platform.tenants.sendTenantInvite, {
      email: lead.contactEmail,
      firstName: lead.contactName.split(" ")[0],
      lastName: lead.contactName.split(" ").slice(1).join(" ") || "",
      schoolName: lead.companyName,
      country: lead.country,
      county: lead.county,
      phone: lead.contactPhone,
      studentCountEstimate: lead.studentCount,
      suggestedPlan: args.suggestedPlan,
      suggestedModules: args.suggestedModules,
      personalMessage: args.personalMessage,
      crmLeadId: args.leadId,
    });

    // Update lead stage to "won"
    await ctx.db.patch(args.leadId, {
      stage: "won",
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("crm_activities", {
      leadId: args.leadId,
      type: "system",
      subject: "Tenant invitation sent",
      body: `Invitation sent to ${lead.contactEmail}. They have 7 days to create their account.`,
      isPrivate: false,
      createdBy: userId,
      createdAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "crm_lead.converted_to_tenant",
      entity: args.leadId,
      after: JSON.stringify({ email: lead.contactEmail, plan: args.suggestedPlan }),
      performedBy: userId,
      platformContext: true,
    });

    return { inviteId: inviteResult.inviteId };
  }
});
```

## 12.2 Proposal System

```typescript
// convex/modules/platform/crm.ts continued

export const createProposal = mutation({
  args: {
    leadId: v.id("crm_leads"),
    recommendedPlan: v.string(),
    billingPeriod: v.string(),
    studentCount: v.number(),
    additionalModules: v.array(v.object({
      slug: v.string(), name: v.string(), priceKes: v.number()
    })),
    discountPct: v.optional(v.number()),
    discountReason: v.optional(v.string()),
    validDays: v.number(),
    customNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "crm.create_proposal");

    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.isDeleted) throw new Error("Lead not found");

    // Get plan pricing
    const plan = await ctx.db
      .query("subscription_plans")
      .withIndex("by_name", q => q.eq("name", args.recommendedPlan))
      .unique();
    if (!plan) throw new Error("Plan not found");

    const planPrice = args.billingPeriod === "annual" ? plan.priceAnnualKes : plan.priceMonthlyKes;
    const additionalTotal = args.additionalModules.reduce((sum, m) => sum + m.priceKes * args.studentCount, 0);
    const subtotal = planPrice + additionalTotal;
    const discount = args.discountPct ? subtotal * (args.discountPct / 100) : 0;
    const totalMonthlyKes = subtotal - discount;
    const totalAnnualKes = totalMonthlyKes * 12 * (args.billingPeriod === "annual" ? 0.82 : 1);

    const trackingToken = crypto.randomUUID();

    const proposalId = await ctx.db.insert("crm_proposals", {
      leadId: args.leadId,
      title: `Proposal for ${lead.companyName} — ${args.recommendedPlan} Plan`,
      status: "draft",
      recommendedPlan: args.recommendedPlan,
      billingPeriod: args.billingPeriod,
      studentCount: args.studentCount,
      planPriceKes: planPrice,
      modulesIncluded: [],
      additionalModules: args.additionalModules,
      discountPct: args.discountPct,
      discountReason: args.discountReason,
      totalMonthlyKes,
      totalAnnualKes,
      validUntil: Date.now() + args.validDays * 24 * 60 * 60 * 1000,
      customNotes: args.customNotes,
      trackingToken,
      viewCount: 0,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Generate PDF
    await ctx.scheduler.runAfter(0, internal.platform.crm.generateProposalPdf, {
      proposalId,
    });

    return { proposalId, trackingToken };
  }
});

export const sendProposal = mutation({
  args: { proposalId: v.id("crm_proposals") },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "crm.create_proposal");

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) throw new Error("Proposal not found");
    if (proposal.status !== "draft") throw new Error("Proposal already sent");

    const lead = await ctx.db.get(proposal.leadId);
    if (!lead) throw new Error("Lead not found");

    await ctx.db.patch(args.proposalId, {
      status: "sent",
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Send proposal email to lead contact
    const proposalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proposals/${proposal.trackingToken}`;
    await ctx.scheduler.runAfter(0, internal.communications.email.sendProposalEmail, {
      to: lead.contactEmail,
      contactName: lead.contactName,
      schoolName: lead.companyName,
      proposalUrl,
      validUntil: proposal.validUntil,
      plan: proposal.recommendedPlan,
      totalMonthlyKes: proposal.totalMonthlyKes,
    });

    // Log activity
    await ctx.db.insert("crm_activities", {
      leadId: proposal.leadId,
      type: "proposal",
      subject: "Proposal sent",
      body: `Proposal for ${proposal.recommendedPlan} plan (KES ${proposal.totalMonthlyKes}/month) sent to ${lead.contactEmail}`,
      isPrivate: false,
      createdBy: userId,
      createdAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "crm_proposal.sent",
      entity: args.proposalId,
      after: JSON.stringify({ email: lead.contactEmail }),
      performedBy: userId,
      platformContext: true,
    });
  }
});

// Public endpoint — proposal viewed (no auth)
export const trackProposalView = mutation({
  args: { trackingToken: v.string(), viewerIp: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query("crm_proposals")
      .withIndex("by_trackingToken", q => q.eq("trackingToken", args.trackingToken))
      .unique();
    if (!proposal) return;

    await ctx.db.patch(proposal._id, {
      viewCount: proposal.viewCount + 1,
      viewedAt: proposal.viewedAt ?? Date.now(),
      viewerIp: args.viewerIp,
      status: proposal.status === "sent" ? "viewed" : proposal.status,
      updatedAt: Date.now(),
    });

    // Notify lead owner
    const lead = await ctx.db.get(proposal.leadId);
    if (lead) {
      await createNotification(ctx, {
        targetPlatformUserId: lead.ownerId,
        title: `${lead.companyName} viewed your proposal!`,
        body: `They've viewed it ${proposal.viewCount + 1} time(s). Follow up now while it's fresh.`,
        actionUrl: `/platform/crm/${proposal.leadId}`,
        type: "proposal_viewed",
      });
    }
  }
});
```

---

# SECTION 13 — CRM FRONTEND

## 13.1 CRM Pages

```
/platform/crm                    — CRM dashboard
/platform/crm/leads              — Lead list view
/platform/crm/pipeline           — Kanban pipeline view
/platform/crm/leads/create       — Create lead form
/platform/crm/leads/[leadId]     — Lead detail
/platform/crm/proposals          — All proposals
/platform/crm/proposals/[id]     — Proposal detail
/platform/crm/reports            — CRM analytics
/platform/crm/settings           — Pipeline stages config
```

## 13.2 CRM Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│  CRM Dashboard              [My Leads ▾] ← filter: own/all/team     │
│                                                                      │
│  STATS (real-time, from Convex)                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────┐│
│  │ 47      │ │ 12      │ │ KES 2.4M│ │ 68%     │ │ 8 overdue     ││
│  │ Leads   │ │ In Demo │ │ Pipeline│ │ Conv.   │ │ Follow-ups    ││
│  │ Active  │ │ Stage   │ │ Value   │ │ Rate    │ │ this week     ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────────────┘│
│                                                                      │
│  PIPELINE OVERVIEW (mini kanban with counts only)                   │
│  New(8) → Contacted(12) → Qualified(9) → Demo(7) → Proposal(5) →  │
│  Negotiation(3) → Won(3)                                            │
│                                                                      │
│  MY FOLLOW-UPS DUE TODAY (only shown to current user)               │
│  Riverside Academy    Call back CEO    Due: 2hrs ago  [Done] [Snooze]│
│  Mombasa High         Send proposal    Due: Today     [Done] [Snooze]│
│                                                                      │
│  RECENT ACTIVITY (lead activities across all my leads)              │
│  ● Westlands School moved to "Demo Done" by James — 1hr ago         │
│  ● Karen Academy proposal viewed (3 times) — 2hrs ago               │
│  ● New lead: St. Mary's School from waitlist — 3hrs ago             │
│                                                                      │
│  CONVERSION FUNNEL (recharts FunnelChart)                           │
│  [Visual funnel showing lead counts per stage]                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 13.3 Pipeline Kanban View

```
Owner filter: [Everyone ▾]  ← only shows for users with crm.view_all
Country: [All ▾]   Source: [All ▾]   [+ Add Lead]

NEW (8)              CONTACTED (12)        QUALIFIED (9)
KES 0                KES 345,000          KES 890,000
─────────────────    ─────────────────    ─────────────────
[Lead Card]          [Lead Card]          [Lead Card]
School: Westlands    School: Nairobi High  School: St Marys
Contact: John M.     Contact: Alice K.     Contact: Peter O.
Students: 450        Students: 1,200       Students: 890
Score: 72           Score: 85             Score: 91
Value: —             Value: KES 120K       Value: KES 180K
Owner: JM [avatar]   Owner: AK [avatar]    Owner: PO [avatar]
Follow-up: Today ⚠️  Follow-up: 3 days    No follow-up
[Activity: 3]       [Activity: 7]         [Activity: 12]
                                          [Proposal: sent ✉️]

Drag cards between columns to change stage
On drag drop: if stage requires note → show inline note input
```

## 13.4 Lead Detail Page

```
Tabs: Overview | Activities | Contacts | Proposals | Share

HEADER:
[School logo placeholder]  Westlands Academy
                           Primary school, Nairobi, Kenya
                           Contact: John Mwangi (Principal)
                           john@westlands.ac.ke | +254 722 xxx xxx
                           Stage: [Demo Done ▾] ← click to change stage
                           Owner: James Mwangi
                           Assigned: Alice Wanjiru [Change]
                           [Edit] [Share] [Archive] [Delete]

RIGHT SIDEBAR:
Score: 72/100 ████████░░
Value: KES 120,000/year
Students: 450
Expected close: 30 May 2026
Probability: 65%
Source: Waitlist
Tags: [primary] [nairobi] [high-value]
[+ Add tag]

Next follow-up: Tomorrow, 10:00 AM
"Call to confirm demo feedback"
[Edit follow-up]

OVERVIEW tab:
- School details (editable inline)
- Pain points: Fee collection, Attendance tracking
- Interested modules: Finance, Attendance, Parent Portal
- Current system: Excel

ACTIVITIES tab:
Timeline of all activities (notes, calls, emails, stage changes)
Private notes (only visible to creator)
[+ Log Activity] button (note, call, email, meeting, whatsapp)
Filter: All | Notes | Calls | Emails | System

Quick log form (inline at top):
[📝 Note] [📞 Call] [📧 Email] [🤝 Meeting] [💬 WhatsApp]

CONTACTS tab:
Primary: John Mwangi (Principal) ← from lead
Additional contacts:
  Mary Njeri — Finance Director — mary@westlands.ac.ke
  [+ Add Contact]

PROPOSALS tab:
List of proposals: title, status badge, value, sent date, viewed
[+ Create Proposal] button
Proposal builder form

SHARE tab:
Current shares:
  Alice Wanjiru — Edit access — Shared 3 days ago — [Revoke]
  [+ Share with team member]
  Access level: View / Edit
  Optional expiry date
  Personal message
```

## 13.5 CRM Reports Page

```
/platform/crm/reports

FILTERS: Date range | Owner | Country | Plan | Source
All filters respect current user's permissions (own vs all)

CHARTS:
- Leads by stage over time (recharts AreaChart, stacked)
- Conversion rate by source (recharts BarChart)
- Revenue pipeline: expected value × probability (KES)
- Deal velocity: avg days per stage (recharts BarChart)
- Owner performance: leads won by user (only for crm.view_all)
- Country breakdown (recharts PieChart)

TABLES:
- Top converting sources
- Stalled leads (no activity > 14 days)
- Overdue follow-ups
- Won deals this month

EXPORT: CSV and PDF for all tables
```

---

# ═══════════════════════════════════════════════════════════
# DOCUMENT 3 — PROJECT MANAGEMENT SYSTEM
# ═══════════════════════════════════════════════════════════

---

# SECTION 14 — PM OVERVIEW & ACCESS MODEL

---

## 14.1 PM Purpose

Internal project management for the EduMyles team. Tracks product development, customer success initiatives, support escalations, marketing campaigns, and any team work.

## 14.2 PM Access Model

```
PERMISSION: pm.view_own
  → User sees projects they are:
    - creator, lead, or member of
    - assigned tasks in (even if not project member)

PERMISSION: pm.view_shared
  → User sees projects explicitly shared with them

PERMISSION: pm.view_all [super_admin+]
  → User sees ALL projects and tasks

master_admin: sees everything, can do everything

Data rules:
  view_own: projects WHERE creatorId = userId
              OR leadId = userId
              OR members CONTAINS userId
            + projects WHERE tasks.assigneeId = userId

  view_shared: projects WHERE
    _id IN (SELECT projectId FROM pm_project_shares WHERE sharedWithUserId = userId)

  view_all: no filter
```

---

# SECTION 15 — PM DATABASE SCHEMA

```typescript
// convex/schema.ts additions for PM

pm_workspaces: defineTable({
  name: v.string(),                    // "Product", "Engineering", "Operations"
  slug: v.string(),
  description: v.optional(v.string()),
  icon: v.string(),                    // emoji or lucide icon name
  color: v.string(),                   // hex color
  creatorId: v.string(),
  memberIds: v.array(v.string()),      // platform_users who can see this workspace
  isPrivate: v.boolean(),              // if true: only members can see
  isArchived: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_creatorId", ["creatorId"])
  .index("by_isArchived", ["isArchived"]),

pm_projects: defineTable({
  workspaceId: v.id("pm_workspaces"),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  status: v.union(
    v.literal("planning"),
    v.literal("active"),
    v.literal("on_hold"),
    v.literal("completed"),
    v.literal("cancelled"),
  ),
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
  visibility: v.union(
    v.literal("private"),    // only members
    v.literal("workspace"),  // all workspace members
    v.literal("all_staff"),  // all platform users
  ),
  creatorId: v.string(),
  leadId: v.string(),                  // project lead (PM)
  memberIds: v.array(v.string()),      // all project members
  // Timeline
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  // Metrics
  totalTasks: v.number(),              // denormalized
  completedTasks: v.number(),
  progress: v.number(),                // 0-100
  // External
  githubRepo: v.optional(v.string()),  // "Mylesoft-Technologies/edumyles"
  // Metadata
  tags: v.array(v.string()),
  isArchived: v.boolean(),
  isDeleted: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspaceId", ["workspaceId"])
  .index("by_creatorId", ["creatorId"])
  .index("by_leadId", ["leadId"])
  .index("by_status", ["status"])
  .index("by_isDeleted", ["isDeleted"]),

pm_sprints: defineTable({
  projectId: v.id("pm_projects"),
  name: v.string(),                    // "Sprint 1", "Q2 2026"
  goal: v.optional(v.string()),
  status: v.union(v.literal("planning"), v.literal("active"), v.literal("completed")),
  startDate: v.number(),
  endDate: v.number(),
  velocity: v.optional(v.number()),    // story points completed
  createdBy: v.string(),
  createdAt: v.number(),
})
  .index("by_projectId", ["projectId"])
  .index("by_status", ["status"]),

pm_tasks: defineTable({
  projectId: v.id("pm_projects"),
  sprintId: v.optional(v.id("pm_sprints")),
  parentTaskId: v.optional(v.id("pm_tasks")), // for subtasks
  title: v.string(),
  description: v.optional(v.string()),  // rich text
  type: v.union(
    v.literal("task"),
    v.literal("bug"),
    v.literal("feature"),
    v.literal("story"),
    v.literal("epic"),
    v.literal("improvement"),
    v.literal("documentation"),
  ),
  status: v.union(
    v.literal("backlog"),
    v.literal("todo"),
    v.literal("in_progress"),
    v.literal("in_review"),
    v.literal("blocked"),
    v.literal("done"),
    v.literal("cancelled"),
  ),
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
  // Assignment
  creatorId: v.string(),
  assigneeId: v.optional(v.string()),  // primary assignee
  reviewerId: v.optional(v.string()),  // for code review tasks
  collaboratorIds: v.array(v.string()), // additional collaborators
  // Dates
  dueDate: v.optional(v.number()),
  startDate: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  // Estimation
  estimateHours: v.optional(v.number()),
  storyPoints: v.optional(v.number()),
  actualHours: v.optional(v.number()),  // from time logs
  // Github integration
  githubIssueNumber: v.optional(v.number()),
  githubPrNumber: v.optional(v.number()),
  githubBranch: v.optional(v.string()),
  // Metadata
  tags: v.array(v.string()),
  attachments: v.array(v.string()),   // UploadThing URLs
  isDeleted: v.boolean(),
  order: v.number(),                   // for drag-drop ordering within status
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_projectId", ["projectId"])
  .index("by_assigneeId", ["assigneeId"])
  .index("by_sprintId", ["sprintId"])
  .index("by_parentTaskId", ["parentTaskId"])
  .index("by_status", ["status"])
  .index("by_creatorId", ["creatorId"])
  .index("by_isDeleted", ["isDeleted"])
  .index("by_dueDate", ["dueDate"]),

pm_task_comments: defineTable({
  taskId: v.id("pm_tasks"),
  authorId: v.string(),
  body: v.string(),                    // rich text HTML (sanitized)
  isEdited: v.boolean(),
  editedAt: v.optional(v.number()),
  mentions: v.array(v.string()),       // mentioned user IDs
  reactions: v.array(v.object({
    emoji: v.string(),
    userIds: v.array(v.string()),
  })),
  createdAt: v.number(),
})
  .index("by_taskId", ["taskId"])
  .index("by_authorId", ["authorId"]),

pm_time_logs: defineTable({
  taskId: v.id("pm_tasks"),
  projectId: v.id("pm_projects"),
  userId: v.string(),
  durationMinutes: v.number(),
  description: v.optional(v.string()),
  date: v.string(),                    // "YYYY-MM-DD"
  billable: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_taskId", ["taskId"])
  .index("by_projectId", ["projectId"])
  .index("by_userId", ["userId"])
  .index("by_date", ["date"]),

pm_project_shares: defineTable({
  projectId: v.id("pm_projects"),
  sharedByUserId: v.string(),
  sharedWithUserId: v.string(),
  accessLevel: v.union(v.literal("view"), v.literal("comment"), v.literal("edit")),
  message: v.optional(v.string()),
  sharedAt: v.number(),
  expiresAt: v.optional(v.number()),
})
  .index("by_projectId", ["projectId"])
  .index("by_sharedWithUserId", ["sharedWithUserId"]),

pm_github_events: defineTable({
  projectId: v.id("pm_projects"),
  taskId: v.optional(v.id("pm_tasks")),
  eventType: v.string(),               // "push", "pull_request", "issue", "deployment"
  githubData: v.string(),              // JSON from GitHub webhook
  processedAt: v.number(),
})
  .index("by_projectId", ["projectId"])
  .index("by_taskId", ["taskId"]),

pm_epics: defineTable({
  projectId: v.id("pm_projects"),
  title: v.string(),
  description: v.optional(v.string()),
  status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("closed")),
  color: v.string(),
  taskIds: v.array(v.string()),        // tasks in this epic
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  createdBy: v.string(),
  createdAt: v.number(),
})
  .index("by_projectId", ["projectId"]),
```

---

# SECTION 16 — PM CONVEX FUNCTIONS

## 16.1 Project CRUD with Access Control

```typescript
// convex/modules/pm/projects.ts

async function getProjectsForUser(
  ctx: QueryCtx,
  userId: string,
  permissions: string[]
): Promise<Doc<"pm_projects">[]> {
  const canViewAll = hasPermission(permissions, "pm.view_all");

  if (canViewAll) {
    return ctx.db.query("pm_projects")
      .filter(q => q.eq(q.field("isDeleted"), false))
      .collect();
  }

  // Projects where user is creator, lead, or member
  const allProjects = await ctx.db.query("pm_projects")
    .filter(q => q.eq(q.field("isDeleted"), false))
    .collect();

  const ownProjects = allProjects.filter(p =>
    p.creatorId === userId ||
    p.leadId === userId ||
    p.memberIds.includes(userId)
  );

  // Projects where user has tasks assigned (even if not a member)
  const assignedTasks = await ctx.db.query("pm_tasks")
    .withIndex("by_assigneeId", q => q.eq("assigneeId", userId))
    .filter(q => q.eq(q.field("isDeleted"), false))
    .collect();
  const projectIdsFromTasks = new Set(assignedTasks.map(t => t.projectId));
  const assignedProjects = allProjects.filter(p => projectIdsFromTasks.has(p._id));

  // Shared projects
  const sharedProjectIds = await ctx.db
    .query("pm_project_shares")
    .withIndex("by_sharedWithUserId", q => q.eq("sharedWithUserId", userId))
    .collect();
  const sharedProjects = (await Promise.all(
    sharedProjectIds.map(s => ctx.db.get(s.projectId))
  )).filter(p => p && !p.isDeleted) as Doc<"pm_projects">[];

  // Workspace-visible projects
  const workspaceVisibleProjects = allProjects.filter(p => p.visibility === "all_staff");

  // Deduplicate
  const projectMap = new Map<string, Doc<"pm_projects">>();
  [...ownProjects, ...assignedProjects, ...sharedProjects, ...workspaceVisibleProjects]
    .forEach(p => projectMap.set(p._id, p));

  return [...projectMap.values()];
}

export const getProjects = query({
  args: {
    workspaceId: v.optional(v.id("pm_workspaces")),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    leadId: v.optional(v.string()),
    search: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isArchived: v.optional(v.boolean()),
    showOwn: v.optional(v.boolean()),   // filter to only own projects
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.view_own");

    let projects = await getProjectsForUser(ctx, userId, permissions);

    if (args.workspaceId) projects = projects.filter(p => p.workspaceId === args.workspaceId);
    if (args.status) projects = projects.filter(p => p.status === args.status);
    if (args.priority) projects = projects.filter(p => p.priority === args.priority);
    if (args.isArchived !== undefined) projects = projects.filter(p => p.isArchived === args.isArchived);
    else projects = projects.filter(p => !p.isArchived);
    if (args.tags?.length) projects = projects.filter(p => args.tags!.some(t => p.tags.includes(t)));
    if (args.showOwn) {
      projects = projects.filter(p =>
        p.creatorId === userId || p.leadId === userId || p.memberIds.includes(userId)
      );
    }
    if (args.leadId && hasPermission(permissions, "pm.view_all")) {
      projects = projects.filter(p => p.leadId === args.leadId);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      projects = projects.filter(p => p.name.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s));
    }

    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  }
});

export const getProject = query({
  args: { projectId: v.id("pm_projects") },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.view_own");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.isDeleted) throw new ConvexError({ code: "NOT_FOUND" });

    // Check access
    const canViewAll = hasPermission(permissions, "pm.view_all");
    const isOwn = project.creatorId === userId || project.leadId === userId || project.memberIds.includes(userId);
    const isShared = !canViewAll && !isOwn && await ctx.db
      .query("pm_project_shares")
      .withIndex("by_projectId", q => q.eq("projectId", args.projectId))
      .filter(q => q.eq(q.field("sharedWithUserId"), userId))
      .first();
    const isAllStaff = project.visibility === "all_staff";

    if (!canViewAll && !isOwn && !isShared && !isAllStaff) {
      throw new ConvexError({ code: "UNAUTHORIZED" });
    }

    // Get tasks, sprints, epics
    const [tasks, sprints, epics, members, shares] = await Promise.all([
      ctx.db.query("pm_tasks")
        .withIndex("by_projectId", q => q.eq("projectId", args.projectId))
        .filter(q => q.eq(q.field("isDeleted"), false))
        .collect(),
      ctx.db.query("pm_sprints")
        .withIndex("by_projectId", q => q.eq("projectId", args.projectId))
        .collect(),
      ctx.db.query("pm_epics")
        .withIndex("by_projectId", q => q.eq("projectId", args.projectId))
        .collect(),
      // Get member details
      Promise.all(project.memberIds.map(id =>
        ctx.db.query("platform_users").withIndex("by_userId", q => q.eq("userId", id)).unique()
      )),
      canViewAll ? ctx.db.query("pm_project_shares")
        .withIndex("by_projectId", q => q.eq("projectId", args.projectId))
        .collect() : [],
    ]);

    const userAccess = canViewAll ? "edit" :
      (project.leadId === userId || project.creatorId === userId) ? "edit" :
      project.memberIds.includes(userId) ? "edit" :
      isShared ? (isShared as any).accessLevel : "view";

    return { project, tasks, sprints, epics, members, shares, userAccess };
  }
});

export const createProject = mutation({
  args: {
    workspaceId: v.id("pm_workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    priority: v.string(),
    visibility: v.string(),
    leadId: v.string(),
    memberIds: v.array(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    tags: v.array(v.string()),
    githubRepo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "pm.create_project");

    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const projectId = await ctx.db.insert("pm_projects", {
      workspaceId: args.workspaceId,
      name: args.name,
      slug,
      description: args.description,
      status: "planning",
      priority: args.priority as any,
      visibility: args.visibility as any,
      creatorId: userId,
      leadId: args.leadId,
      memberIds: [...new Set([userId, args.leadId, ...args.memberIds])],
      startDate: args.startDate,
      endDate: args.endDate,
      totalTasks: 0,
      completedTasks: 0,
      progress: 0,
      githubRepo: args.githubRepo,
      tags: args.tags,
      isArchived: false,
      isDeleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Notify members
    for (const memberId of args.memberIds) {
      if (memberId === userId) continue;
      await createNotification(ctx, {
        targetPlatformUserId: memberId,
        title: `You've been added to project: ${args.name}`,
        actionUrl: `/platform/pm/${projectId}`,
        type: "project_member_added",
      });
    }

    await logAudit(ctx, {
      action: "pm_project.created",
      entity: projectId,
      after: JSON.stringify({ name: args.name }),
      performedBy: userId,
      platformContext: true,
    });

    return projectId;
  }
});

export const updateProject = mutation({
  args: {
    projectId: v.id("pm_projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    visibility: v.optional(v.string()),
    leadId: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    githubRepo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.edit_own_project");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.isDeleted) throw new Error("Project not found");

    const canEditAny = hasPermission(permissions, "pm.edit_any_project");
    const canEdit = canEditAny || project.creatorId === userId || project.leadId === userId;
    if (!canEdit) throw new ConvexError({ code: "UNAUTHORIZED" });

    const { projectId, ...updates } = args;
    await ctx.db.patch(projectId, { ...updates, updatedAt: Date.now() });

    await logAudit(ctx, {
      action: "pm_project.updated",
      entity: projectId,
      after: JSON.stringify(updates),
      performedBy: userId,
      platformContext: true,
    });
  }
});

export const manageProjectMembers = mutation({
  args: {
    projectId: v.id("pm_projects"),
    action: v.union(v.literal("add"), v.literal("remove")),
    memberIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.manage_members");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const canManageAny = hasPermission(permissions, "pm.edit_any_project");
    const canManage = canManageAny || project.leadId === userId || project.creatorId === userId;
    if (!canManage) throw new ConvexError({ code: "UNAUTHORIZED" });

    let newMembers = [...project.memberIds];
    if (args.action === "add") {
      newMembers = [...new Set([...newMembers, ...args.memberIds])];
      // Notify new members
      for (const memberId of args.memberIds) {
        await createNotification(ctx, {
          targetPlatformUserId: memberId,
          title: `Added to project: ${project.name}`,
          actionUrl: `/platform/pm/${args.projectId}`,
          type: "project_member_added",
        });
      }
    } else {
      newMembers = newMembers.filter(id => !args.memberIds.includes(id));
    }

    await ctx.db.patch(args.projectId, { memberIds: newMembers, updatedAt: Date.now() });
  }
});

export const shareProject = mutation({
  args: {
    projectId: v.id("pm_projects"),
    sharedWithUserId: v.string(),
    accessLevel: v.union(v.literal("view"), v.literal("comment"), v.literal("edit")),
    message: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.view_own");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const canShareAny = hasPermission(permissions, "pm.view_all");
    const isOwner = project.creatorId === userId || project.leadId === userId;
    if (!canShareAny && !isOwner) throw new ConvexError({ code: "UNAUTHORIZED" });

    const existing = await ctx.db
      .query("pm_project_shares")
      .withIndex("by_projectId", q => q.eq("projectId", args.projectId))
      .filter(q => q.eq(q.field("sharedWithUserId"), args.sharedWithUserId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { accessLevel: args.accessLevel });
    } else {
      await ctx.db.insert("pm_project_shares", {
        projectId: args.projectId,
        sharedByUserId: userId,
        sharedWithUserId: args.sharedWithUserId,
        accessLevel: args.accessLevel,
        message: args.message,
        sharedAt: Date.now(),
        expiresAt: args.expiresAt,
      });
    }

    await createNotification(ctx, {
      targetPlatformUserId: args.sharedWithUserId,
      title: `Project shared: ${project.name}`,
      body: args.message ?? `You now have ${args.accessLevel} access.`,
      actionUrl: `/platform/pm/${args.projectId}`,
      type: "project_shared",
    });
  }
});

export const deleteProject = mutation({
  args: { projectId: v.id("pm_projects"), reason: v.string() },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.delete_own_project");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const canDeleteAny = hasPermission(permissions, "pm.delete_any_project");
    const isOwner = project.creatorId === userId;
    if (!canDeleteAny && !isOwner) throw new ConvexError({ code: "UNAUTHORIZED" });

    await ctx.db.patch(args.projectId, { isDeleted: true, updatedAt: Date.now() });

    await logAudit(ctx, {
      action: "pm_project.deleted",
      entity: args.projectId,
      after: JSON.stringify({ name: project.name, reason: args.reason }),
      performedBy: userId,
      platformContext: true,
    });
  }
});
```

## 16.2 Task CRUD

```typescript
// convex/modules/pm/tasks.ts

export const createTask = mutation({
  args: {
    projectId: v.id("pm_projects"),
    sprintId: v.optional(v.id("pm_sprints")),
    parentTaskId: v.optional(v.id("pm_tasks")),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    priority: v.string(),
    status: v.optional(v.string()),
    assigneeId: v.optional(v.string()),
    reviewerId: v.optional(v.string()),
    collaboratorIds: v.array(v.string()),
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    estimateHours: v.optional(v.number()),
    storyPoints: v.optional(v.number()),
    tags: v.array(v.string()),
    githubIssueNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.create_task");

    // Check project access
    const project = await ctx.db.get(args.projectId);
    if (!project || project.isDeleted) throw new Error("Project not found");

    const canViewAll = hasPermission(permissions, "pm.view_all");
    const isMember = project.memberIds.includes(userId) || project.leadId === userId;
    if (!canViewAll && !isMember) throw new ConvexError({ code: "UNAUTHORIZED" });

    // Sanitize description
    const sanitizedDesc = args.description ? sanitizeHtml(args.description) : undefined;

    // Get max order for this status
    const existingTasks = await ctx.db.query("pm_tasks")
      .withIndex("by_projectId", q => q.eq("projectId", args.projectId))
      .filter(q => q.eq(q.field("status"), args.status ?? "todo"))
      .collect();
    const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.order), 0);

    const taskId = await ctx.db.insert("pm_tasks", {
      projectId: args.projectId,
      sprintId: args.sprintId,
      parentTaskId: args.parentTaskId,
      title: args.title,
      description: sanitizedDesc,
      type: args.type as any,
      status: (args.status ?? "todo") as any,
      priority: args.priority as any,
      creatorId: userId,
      assigneeId: args.assigneeId,
      reviewerId: args.reviewerId,
      collaboratorIds: args.collaboratorIds,
      dueDate: args.dueDate,
      startDate: args.startDate,
      estimateHours: args.estimateHours,
      storyPoints: args.storyPoints,
      actualHours: 0,
      githubIssueNumber: args.githubIssueNumber,
      tags: args.tags,
      attachments: [],
      isDeleted: false,
      order: maxOrder + 1000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update project task count
    await ctx.db.patch(args.projectId, {
      totalTasks: project.totalTasks + 1,
      updatedAt: Date.now(),
    });

    // Notify assignee
    if (args.assigneeId && args.assigneeId !== userId) {
      await createNotification(ctx, {
        targetPlatformUserId: args.assigneeId,
        title: `Task assigned: ${args.title}`,
        body: args.dueDate ? `Due: ${formatDate(args.dueDate)}` : undefined,
        actionUrl: `/platform/pm/${args.projectId}?task=${taskId}`,
        type: "task_assigned",
      });
    }

    // Create GitHub issue if GitHub integration enabled
    if (project.githubRepo) {
      await ctx.scheduler.runAfter(0, internal.pm.github.createGithubIssue, {
        taskId, projectId: args.projectId, title: args.title, description: sanitizedDesc,
        labels: args.tags, assignee: undefined, // GitHub username not stored yet
      });
    }

    await logAudit(ctx, {
      action: "pm_task.created",
      entity: taskId,
      after: JSON.stringify({ title: args.title, project: project.name }),
      performedBy: userId,
      platformContext: true,
    });

    return taskId;
  }
});

export const updateTask = mutation({
  args: {
    taskId: v.id("pm_tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assigneeId: v.optional(v.string()),
    reviewerId: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    estimateHours: v.optional(v.number()),
    storyPoints: v.optional(v.number()),
    sprintId: v.optional(v.id("pm_sprints")),
    tags: v.optional(v.array(v.string())),
    githubPrNumber: v.optional(v.number()),
    githubBranch: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.edit_own_task");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.isDeleted) throw new Error("Task not found");

    const canEditAny = hasPermission(permissions, "pm.edit_any_task");
    const isOwner = task.creatorId === userId || task.assigneeId === userId;
    if (!canEditAny && !isOwner) throw new ConvexError({ code: "UNAUTHORIZED" });

    const sanitizedDesc = args.description ? sanitizeHtml(args.description) : args.description;
    const { taskId, ...updates } = { ...args, description: sanitizedDesc };

    // Track status change for project progress
    const oldStatus = task.status;
    await ctx.db.patch(taskId, { ...updates, updatedAt: Date.now() });

    if (args.status && args.status !== oldStatus) {
      const project = await ctx.db.get(task.projectId);
      if (project) {
        const allTasks = await ctx.db.query("pm_tasks")
          .withIndex("by_projectId", q => q.eq("projectId", task.projectId))
          .filter(q => q.eq(q.field("isDeleted"), false))
          .collect();
        const completedCount = allTasks.filter(t => t.status === "done").length;
        const progress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

        await ctx.db.patch(task.projectId, {
          completedTasks: completedCount,
          progress,
          updatedAt: Date.now(),
        });
      }

      // Auto-set completedAt
      if (args.status === "done") {
        await ctx.db.patch(taskId, { completedAt: Date.now() });
      } else {
        await ctx.db.patch(taskId, { completedAt: undefined });
      }
    }

    // Notify new assignee
    if (args.assigneeId && args.assigneeId !== task.assigneeId && args.assigneeId !== userId) {
      await createNotification(ctx, {
        targetPlatformUserId: args.assigneeId,
        title: `Task reassigned to you: ${task.title}`,
        actionUrl: `/platform/pm/${task.projectId}?task=${taskId}`,
        type: "task_assigned",
      });
    }
  }
});

export const moveTask = mutation({
  args: {
    taskId: v.id("pm_tasks"),
    newStatus: v.string(),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.edit_own_task");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.isDeleted) throw new Error("Task not found");

    const canEditAny = hasPermission(permissions, "pm.edit_any_task");
    const isOwner = task.creatorId === userId || task.assigneeId === userId;

    // Allow any project member to move tasks (not just owner)
    const project = await ctx.db.get(task.projectId);
    const isMember = project?.memberIds.includes(userId) || project?.leadId === userId;
    if (!canEditAny && !isOwner && !isMember) throw new ConvexError({ code: "UNAUTHORIZED" });

    await ctx.db.patch(args.taskId, {
      status: args.newStatus as any,
      order: args.newOrder,
      updatedAt: Date.now(),
      completedAt: args.newStatus === "done" ? Date.now() : undefined,
    });
  }
});

export const addComment = mutation({
  args: {
    taskId: v.id("pm_tasks"),
    body: v.string(),
    mentions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.view_own");

    // Sanitize rich text
    const sanitized = sanitizeHtml(args.body);

    const commentId = await ctx.db.insert("pm_task_comments", {
      taskId: args.taskId,
      authorId: userId,
      body: sanitized,
      isEdited: false,
      mentions: args.mentions,
      reactions: [],
      createdAt: Date.now(),
    });

    // Notify mentioned users
    for (const mentionedId of args.mentions) {
      if (mentionedId === userId) continue;
      const task = await ctx.db.get(args.taskId);
      await createNotification(ctx, {
        targetPlatformUserId: mentionedId,
        title: `You were mentioned in a comment`,
        body: `In task: ${task?.title}`,
        actionUrl: `/platform/pm/${task?.projectId}?task=${args.taskId}`,
        type: "task_mention",
      });
    }

    return commentId;
  }
});

export const logTime = mutation({
  args: {
    taskId: v.id("pm_tasks"),
    durationMinutes: v.number(),
    description: v.optional(v.string()),
    date: v.string(),
    billable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "pm.log_time");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.isDeleted) throw new Error("Task not found");

    const timeLogId = await ctx.db.insert("pm_time_logs", {
      taskId: args.taskId,
      projectId: task.projectId,
      userId,
      durationMinutes: args.durationMinutes,
      description: args.description,
      date: args.date,
      billable: args.billable,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update task actual hours
    const allLogs = await ctx.db.query("pm_time_logs")
      .withIndex("by_taskId", q => q.eq("taskId", args.taskId))
      .collect();
    const totalMinutes = allLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    await ctx.db.patch(args.taskId, { actualHours: totalMinutes / 60, updatedAt: Date.now() });

    return timeLogId;
  }
});

export const getTimeLogs = query({
  args: {
    projectId: v.optional(v.id("pm_projects")),
    userId: v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId: currentUserId, permissions } = await requirePermission(ctx, "pm.view_time_logs");

    const canViewAll = hasPermission(permissions, "pm.view_all");

    let logs = args.projectId
      ? await ctx.db.query("pm_time_logs")
          .withIndex("by_projectId", q => q.eq("projectId", args.projectId!))
          .collect()
      : await ctx.db.query("pm_time_logs")
          .withIndex("by_userId", q => q.eq("userId", canViewAll && args.userId ? args.userId : currentUserId))
          .collect();

    // Non-admin: only see own time logs
    if (!canViewAll) {
      logs = logs.filter(l => l.userId === currentUserId);
    }

    if (args.dateFrom) logs = logs.filter(l => l.date >= args.dateFrom!);
    if (args.dateTo) logs = logs.filter(l => l.date <= args.dateTo!);

    return logs;
  }
});
```

---

# SECTION 17 — PM FRONTEND

## 17.1 PM Pages

```
/platform/pm                     — PM dashboard (my tasks, my projects)
/platform/pm/workspaces          — All workspaces
/platform/pm/workspaces/[id]     — Workspace with project list
/platform/pm/[projectId]         — Project detail (kanban view)
/platform/pm/[projectId]/board   — Kanban board
/platform/pm/[projectId]/list    — Task list view
/platform/pm/[projectId]/gantt   — Gantt chart view
/platform/pm/[projectId]/backlog — Sprint backlog
/platform/pm/[projectId]/sprints — Sprint management
/platform/pm/[projectId]/settings— Project settings, members, share
/platform/pm/my-tasks            — All tasks assigned to me (across projects)
/platform/pm/reports             — Team time logs, velocity, etc.
```

## 17.2 PM Dashboard

```
/platform/pm — Personal dashboard (scoped to current user's projects/tasks)

HEADER:
  Welcome back, James! Here's what's on your plate.
  [Owner filter: Only shown to users with pm.view_all]
  [My Work ▾] ← dropdown: My Work | All Projects | By Workspace

MY TASKS DUE THIS WEEK:
  Priority  Task              Project      Due Date
  🔴 HIGH   Fix Stripe bug    EduMyles     Today
  🟡 MED    Write onboarding  Docs         Tomorrow
  🟢 LOW    Review PR #234    EduMyles     Thu
  [See all my tasks →]

MY PROJECTS:
  [Project Card] EduMyles Core
  Status: Active | 78% complete
  12 tasks: 8 done, 3 in progress, 1 blocked
  Lead: James M | Members: 4
  [Board View] [List View]

  [Project Card] Customer Success
  Status: Active | 45% complete
  8 tasks: 3 done, 5 to do
  Lead: Alice K | Members: 2
  [Board View] [List View]

  [+ Create Project]

TEAM OVERVIEW (only for pm.view_all users):
  Overloaded: Sarah (8 tasks), Mike (7 tasks)
  Free capacity: John (1 task)

MY RECENT ACTIVITY:
  ✅ Closed task "Set up WorkOS actions" — 1hr ago
  💬 Commented on "CRM lead sharing" — 2hrs ago
  🔄 Moved "Module billing cron" to In Review — 3hrs ago
```

## 17.3 Project Board View (Kanban)

```
/platform/pm/[projectId] — Main project view

HEADER:
  EduMyles Core — Active                              [James M] [4 members]
  Progress: ██████████████████████░░  78%            Sprint: Sprint 2026-Q2
  
  [Board ▾] [List] [Gantt] [Backlog]   [Filter: Assignee ▾] [+ Add Task]

BOARD (5 columns, horizontal scroll if needed):

BACKLOG (3)    TODO (5)         IN PROGRESS (4)  IN REVIEW (2)  DONE (12)
─────────────  ───────────────  ───────────────  ─────────────  ─────────────
[Task Card]    [Task Card]      [Task Card]      [Task Card]    [Task Card]
─────────────  ───────────────  ───────────────  ─────────────  ...
[+ Add task]   [+ Add task]     [+ Add task]     [+ Add task]

TASK CARD (compact):
┌───────────────────────────────────────┐
│ 🔴 [bug] Fix Stripe webhook          │
│ EduMyles Core                        │
│ Due: Today ⚠️                        │
│ Est: 4h | PR #234 🔗                 │
│ [JM avatar]  [💬 3] [📎 1]           │
└───────────────────────────────────────┘

Drag-drop tasks between columns → updateTask mutation
Click task → slide-out panel with full detail

TASK SLIDE-OUT:
  [Fix Stripe checkout reconciliation]           [Close ×]
  Status: [In Review ▾]  Priority: [Critical ▾]
  Type: [Bug ▾]  Sprint: [Sprint Q2 2026 ▾]
  
  Assignee: [James M ▾]   Due: [22 Apr 2026 📅]
  Reviewer: [Alice K ▾]   Est: [4h] Actual: [2.5h]
  Story Points: [5]
  
  GitHub: PR #234 [View] | Branch: fix/stripe-webhook | Issue #189 [View]
  
  Description: [Rich text editor — DOMPurify on save]
  
  Subtasks: (2)
  ✅ Write test for checkout.session.completed
  ⬜ Handle payment_intent.succeeded idempotency
  [+ Add subtask]
  
  Tags: [stripe] [billing] [critical] [+ Add tag]
  
  Attachments: [+ Attach file]
  
  TIME LOG: [+ Log Time]
  Today: 1h30m by James M
  Total: 2h30m
  
  Comments:
  [JM] Fixed the checkoutSessionId persistence. Testing now.
  [AK] LGTM — just make sure the idempotency check is there.
  [JM] @AK Added idempotency check in commit abc123
  [Add comment...]
  
  Activity:
  JM moved to In Review — 1hr ago
  JM assigned PR #234 — 2hrs ago
  Task created by JM — 3hrs ago
```

## 17.4 Backlog View with Sprint Management

```
/platform/pm/[projectId]/backlog

SPRINT: Sprint 2026-Q2  [Apr 1 - Apr 30]   Progress: 67%   [Close Sprint]
  Target: 40 story points | Completed: 27 | Remaining: 13

Backlog items (all unassigned to sprint):
  [Epic: Authentication ████████] 
  ├── [Task] Implement WorkOS magic auth     8 pts  ○
  ├── [Task] Platform invite flow            5 pts  ○
  └── [Task] Biometric login mobile         3 pts  ○

  [Epic: CRM ████░░░░]
  ├── [Task] Lead sharing with edit access  5 pts  ○
  └── [Task] Proposal tracking token       3 pts  ○

Drag tasks into sprint or [Add to Sprint] button per task

Sprint velocity chart (last 5 sprints - recharts BarChart)
```

## 17.5 PM Settings Page (Project Level)

```
/platform/pm/[projectId]/settings

Tabs: General | Members | Integrations | Danger Zone

General tab:
  Project name, description
  Status: Active/Planning/On Hold/Completed
  Priority: Low/Medium/High/Critical
  Visibility: Private / Workspace / All Staff
  Tags
  Timeline: start date, end date
  GitHub repo (optional)

Members tab:
  Project Lead: [Change lead - only lead/creator can do this]
  Members list: avatar, name, role (lead/member), [Remove]
  [+ Add Member] → search platform users → add
  [Share with non-member] → share modal (view/comment/edit access)
  
  Shares list (for project lead/creator to manage):
  Alice K — View access — Shared 3 days ago — [Change Access] [Revoke]

Integrations tab:
  GitHub:
  [Connect GitHub] / [Connected: Mylesoft-Technologies/edumyles]
  Settings:
  - Auto-create GitHub issues for new tasks: ✅
  - Auto-update task status when PR merged: ✅
  - Sync PR status to task: ✅
  - Branch naming: [feature/{taskId}-{title}]

Danger Zone:
  [Archive Project] — keeps data but removes from active list
  [Delete Project] — requires typing project name — master_admin only
```

---

# SECTION 18 — GITHUB INTEGRATION

```typescript
// convex/modules/pm/github.ts

// Webhook handler for GitHub events
export const processGithubWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("x-hub-signature-256");
  const body = await request.text();

  // Verify webhook signature
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;
  const expected = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  if (signature !== expected) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  const data = JSON.parse(body);

  // Find project linked to this repo
  const repoFullName = data.repository?.full_name;
  if (!repoFullName) return new Response("OK");

  const projects = await ctx.runQuery(internal.pm.projects.getProjectsByGithubRepo, { repo: repoFullName });

  for (const project of projects) {
    await ctx.runMutation(internal.pm.github.recordGithubEvent, {
      projectId: project._id,
      eventType: event ?? "unknown",
      githubData: body,
    });

    // Process specific events
    if (event === "pull_request") {
      await ctx.runMutation(internal.pm.github.processPullRequest, {
        projectId: project._id,
        prNumber: data.pull_request.number,
        prTitle: data.pull_request.title,
        action: data.action,
        branchName: data.pull_request.head.ref,
        mergedAt: data.pull_request.merged_at,
      });
    }

    if (event === "issues") {
      await ctx.runMutation(internal.pm.github.processIssueEvent, {
        projectId: project._id,
        issueNumber: data.issue.number,
        action: data.action,
        labels: data.issue.labels.map((l: any) => l.name),
      });
    }
  }

  return new Response("OK");
});

export const processPullRequest = internalMutation({
  args: {
    projectId: v.id("pm_projects"),
    prNumber: v.number(),
    prTitle: v.string(),
    action: v.string(),
    branchName: v.string(),
    mergedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find task linked to this PR or branch
    const task = await ctx.db.query("pm_tasks")
      .withIndex("by_projectId", q => q.eq("projectId", args.projectId))
      .filter(q =>
        q.or(
          q.eq(q.field("githubPrNumber"), args.prNumber),
          q.eq(q.field("githubBranch"), args.branchName),
        )
      )
      .first();

    if (!task) return;

    if (args.action === "opened") {
      await ctx.db.patch(task._id, {
        githubPrNumber: args.prNumber,
        status: "in_review",
        updatedAt: Date.now(),
      });
    } else if (args.action === "closed" && args.mergedAt) {
      await ctx.db.patch(task._id, {
        status: "done",
        completedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Add comment on task
    const systemUserId = "system";
    await ctx.db.insert("pm_task_comments", {
      taskId: task._id,
      authorId: systemUserId,
      body: `GitHub PR #${args.prNumber} ${args.action}: "${args.prTitle}"`,
      isEdited: false,
      mentions: [],
      reactions: [],
      createdAt: Date.now(),
    });
  }
});
```

---

# SECTION 19 — COMPLETE IMPLEMENTATION AGENT PROMPT

```
=======================================================================
EDUMYLES — PLATFORM USERS/RBAC + CRM + PM IMPLEMENTATION PROMPT
Version 1.0 | April 2026
=======================================================================

You are implementing three interconnected systems:
1. Platform User Invite Flow with RBAC and WorkOS CRUD
2. CRM (Customer Relationship Management)
3. PM (Project Management)

=======================================================================
STEP 0 — READ EVERYTHING FIRST
=======================================================================

Read these completely before writing any code:

1. docs/edumyles-platform-systems-spec.md  — this specification
2. docs/edumyles-tech-spec.md              — platform rules
3. convex/schema.ts                         — existing tables
4. convex/helpers/                          — all existing guards
5. convex/modules/platform/                 — any existing platform code
6. opensrc/workos-authkit-nextjs/           — WorkOS integration
7. .agent-skills/                           — ALL skill files

=======================================================================
ABSOLUTE RULES
=======================================================================

Same as all EduMyles work — all 24 rules apply.
Additional rules for this spec:

25. Access control enforced SERVER-SIDE in EVERY query and mutation
    - view_own: filter by ownerId/assignedToId/memberIds/creatorId
    - view_all: no filter (but only granted to super_admin+)
    - Never trust client-side claims about permissions

26. SOFT DELETE everywhere — isDeleted flag, never hard delete
    Exception: permission_audit_log is append-only (never delete)

27. All rich text fields: DOMPurify.sanitize() before storage
    Fields: pm_tasks.description, pm_task_comments.body,
            crm_activities.body, crm_proposals.customNotes

28. WorkOS operations are Convex ACTIONS (not mutations)
    — they call external APIs

29. Audit log every sensitive operation:
    - All role changes, permission changes, scope changes
    - All lead creates, stage changes, deletes
    - All project creates, member changes, deletes

30. master_admin always bypasses access checks (["*"] wildcard)
    implement this check at the TOP of every access check

=======================================================================
PHASE 1 — SCHEMA
=======================================================================

Add/update in convex/schema.ts:

Platform RBAC tables (if not present):
  platform_roles, platform_users (updated), platform_user_invites,
  permission_audit_log, platform_sessions

CRM tables:
  crm_leads, crm_contacts, crm_activities, crm_proposals,
  crm_lead_shares, crm_pipeline_stages, crm_teams,
  crm_follow_ups

PM tables:
  pm_workspaces, pm_projects, pm_sprints, pm_tasks,
  pm_task_comments, pm_time_logs, pm_project_shares,
  pm_github_events, pm_epics

Seed in convex/dev/seed.ts:
  - All 8 system roles with correct permission arrays
  - Default CRM pipeline stages (9 stages from spec)
  - Default PM workspace: "EduMyles Platform"

VERIFY: npx convex dev — zero errors

=======================================================================
PHASE 2 — WORKOS PLATFORM ACTIONS
=======================================================================

Create convex/actions/auth/platformWorkos.ts with ALL actions:
  createPlatformUser, sendPlatformInvitation, addToPlatformOrganization,
  getWorkOSUser, listPlatformOrgMembers, getPlatformUserSessions,
  updateWorkOSUser, resetWorkOSPassword, removeFromPlatformOrganization,
  deletePlatformWorkOSUser, revokeAllPlatformUserSessions, revokeSingleSession

Environment variables required:
  WORKOS_API_KEY, WORKOS_PLATFORM_ORG_ID, WORKOS_CLIENT_ID
  NEXT_PUBLIC_PLATFORM_URL

Each action: try/catch with meaningful error messages

VERIFY:
- [ ] createPlatformUser creates user in WorkOS dashboard
- [ ] sendPlatformInvitation creates invitation in WorkOS
- [ ] revokeAllPlatformUserSessions works without error

=======================================================================
PHASE 3 — PLATFORM RBAC CORE
=======================================================================

Create convex/modules/platform/rbac.ts:

Permission engine:
  getUserPermissions(ctx, userId) → string[]
  hasPermission(permissions, permission) → boolean
  hasAnyPermission(permissions, required[]) → boolean
  hasAllPermissions(permissions, required[]) → boolean
  requirePermission(ctx, permission) → { platformUser, permissions, userId }
  checkScopeAccess(platformUser, resource) → boolean

Role CRUD (all with correct permission checks):
  getRoles, getRole, createRole, updateRole, deleteRole, duplicateRole
  
  deleteRole: cannot delete if users have role (unless reassignToRole provided)
  updateRole: cannot edit system roles (isSystem: true)
  createRole: validate all permission keys against PERMISSIONS constant

User management CRUD:
  getPlatformUsers, getPlatformUser — queries
  updateUserRole — requires platform_users.edit_role
    Cannot change own role
    Cannot set master_admin unless you ARE master_admin
    Cannot modify master_admin unless you ARE master_admin
    Resets addedPermissions and removedPermissions on role change
    Updates role.userCount for old and new role
  updateUserPermissions — requires platform_users.edit_permissions
    Cannot grant permissions you don't have (unless master_admin)
  updateUserScope — requires platform_users.edit_permissions
  setAccessExpiry — requires platform_users.edit_permissions
  suspendPlatformUser — requires platform_users.suspend
    Cannot suspend yourself
    Cannot suspend master_admin (unless you ARE master_admin)
    Revokes all WorkOS sessions on suspension
  unsuspendPlatformUser — requires platform_users.suspend
  deletePlatformUser — requires platform_users.delete
    Soft delete (set isDeleted flag and scramble email)
    Remove from WorkOS platform org
  revokePlatformUserSessions — requires platform_users.suspend
  getMyPermissions — public query (no permission required)
  getPermissionAuditLog — requires platform_users.view_activity

Create frontend hook:
  usePlatformPermissions.ts — with can(), canAny(), canAll()
  PermissionGate component — with showDisabled prop

=======================================================================
PHASE 4 — PLATFORM USER INVITE FLOW
=======================================================================

Create convex/modules/platform/users.ts:

invitePlatformUser — mutation, requires platform_users.invite
  All validation from spec Section 6.1
  Send WorkOS invitation via sendPlatformInvitation action
  Send branded email via Resend
  Schedule reminder at 24hr and 48hr

bulkInvitePlatformUsers — mutation, loops invitePlatformUser

acceptPlatformInvite — ACTION (not mutation, calls WorkOS)
  Validates token
  Creates WorkOS user OR adds existing user to platform org
  Calls createPlatformUserFromInvite internalMutation
  Returns authUrl for session creation

createPlatformUserFromInvite — internalMutation
  Creates platform_users record
  Marks invite as accepted
  Updates role.userCount
  Notifies inviter if requested

resendPlatformInvite — mutation, requires platform_users.invite
revokePlatformInvite — mutation, requires platform_users.invite
expirePlatformInvites — internalMutation (daily cron)
expireAccessExpiredAccounts — internalMutation (daily cron)

getInviteByToken — query (PUBLIC, no auth)
  Returns: email, firstName, expiresAt, status, roleName, permissions
  Used by accept page

Create frontend pages:
  /platform/users — full users list page (spec Section 7.2)
  /platform/users/[userId] — user detail (Profile|Permissions|Sessions|Activity tabs)
  /platform/users/roles — role management page
  /platform/users/roles/create — create role form
  /platform/users/roles/[roleId]/edit — edit role form
  /platform/users/invite — invite form (or use modal in users list page)
  /platform/invite/accept — accept page (PUBLIC, spec Section 8.1)

Invite modal (InviteStaffModal.tsx):
  - Role selector with permission preview panel
  - Expandable permission customizer
  - Scope restrictions section
  - Access expiry toggle
  - Personal message
  - Notify me toggle

Permission matrix display (PermissionMatrix.tsx):
  - Group permissions by category
  - GREEN: from role
  - BLUE: added beyond role
  - RED strikethrough: removed from role
  - Show system-role-only permissions as disabled with 🔒

Add to crons.ts:
  - expirePlatformInvites: daily 22:00 UTC
  - expireAccessExpiredAccounts: daily 22:30 UTC

VERIFY:
- [ ] Invite user: workos invitation sent, email received
- [ ] Accept invite (new account): WorkOS user created, platform_users record created
- [ ] Accept invite (existing WorkOS account): org membership added, platform_users created
- [ ] Role change: permission audit log created, role.userCount updated
- [ ] Suspend: WorkOS sessions revoked
- [ ] Expired invite: shows correct error on accept page
- [ ] Access expiry cron: suspends expired accounts

=======================================================================
PHASE 5 — CRM SYSTEM
=======================================================================

Create convex/modules/platform/crm.ts:

Access helper: getLeadsForUser(ctx, userId, permissions)
  Handles view_own / view_shared / view_all logic
  Deduplicates across all access paths

Queries:
  getLeads — filters + sort, with access control
    Only view_all users can filter by ownerId/assignedToId
  getLead — full detail with contacts/activities/proposals
  getPipelineView — kanban view grouped by stage
  getCRMStats — dashboard metrics
  getCRMReports — analytics data for charts
  getActivitiesForLead — timeline data
  getProposalByToken — PUBLIC (for proposal view tracking)

Mutations:
  createLead, updateLead, deleteLead (soft), changeLeadStage
  assignLead, shareLead, revokeLedShare
  logActivity, addContact, updateContact
  createProposal, updateProposal, sendProposal, acceptProposal, rejectProposal
  convertLeadToTenant — calls sendTenantInvite from onboarding module
  createFollowUp, completeFollowUp, snoozeFollowUp
  trackProposalView — PUBLIC (called when proposal link opened)

Actions:
  generateProposalPdf — generates PDF via server-side rendering, stores in UploadThing

Seed CRM pipeline stages:
  new, contacted, qualified, demo_booked, demo_done,
  proposal_sent, negotiation, won, lost
  Each with: name, color, description, probability, autoFollowUpDays

Add to crons.ts:
  - checkOverdueFollowUps: daily 6:00 UTC (marks isOverdue, notifies owner)
  - expireCRMShares: daily 22:00 UTC (revoke expired shares)

Create frontend pages:
  /platform/crm — dashboard (spec Section 13.2)
  /platform/crm/leads — list view with search/filter
  /platform/crm/pipeline — kanban view (spec Section 13.3)
  /platform/crm/leads/create — create lead form
  /platform/crm/[leadId] — lead detail (spec Section 13.4)
  /platform/crm/proposals — proposals list
  /platform/crm/reports — analytics (spec Section 13.5)
  /platform/crm/settings — pipeline stages config (pm.manage_pipeline required)

Public pages:
  /proposals/[trackingToken] — proposal view page (branded, no auth)
    Calls trackProposalView mutation on load
    Shows proposal details, pricing, accept/decline CTAs
    Accept → sends notification to owner, updates proposal status

CRITICAL ACCESS CONTROL IN UI:
  All lead list queries: passes current userId to getLeads
  Owner filter (My Leads vs All Leads): only shown when user has crm.view_all
  Master admin: always sees all leads with full owner filter

VERIFY:
- [ ] platform_manager creates lead → sees it in their list
- [ ] support_agent creates lead → sees it in their list
- [ ] platform_manager does NOT see support_agent's lead
- [ ] super_admin sees ALL leads (has crm.view_all)
- [ ] master_admin sees ALL leads (["*"] wildcard)
- [ ] Share lead with edit access → shared user can edit
- [ ] Share lead with view access → shared user cannot edit
- [ ] Stage change to "won" → tenant invite modal opens
- [ ] Proposal sent → tracking email opens → proposal status → "viewed"
- [ ] Owner filter: only appears for crm.view_all users
- [ ] Qualification score calculated correctly on create

=======================================================================
PHASE 6 — PM SYSTEM
=======================================================================

Create convex/modules/pm/projects.ts, tasks.ts, timeLogs.ts:

Access helper: getProjectsForUser(ctx, userId, permissions)
  Handles view_own / view_shared / view_all logic
  Includes projects where user has assigned tasks (even if not a member)
  Includes all_staff visibility projects

Project CRUD:
  getProjects — filtered query with access control
  getProject — full detail with tasks/sprints/epics/members
  createProject — requires pm.create_project
  updateProject — requires pm.edit_own_project (or pm.edit_any_project)
  deleteProject — soft delete, requires pm.delete_own_project
  manageProjectMembers — requires pm.manage_members
  shareProject — requires ownership or pm.view_all
  archiveProject — requires pm.edit_own_project

Task CRUD:
  getTasks — filtered by project, assignee, status
  getTask — with comments, time logs, subtasks
  createTask — requires pm.create_task (must be project member or pm.view_all)
  updateTask — requires pm.edit_own_task (or pm.edit_any_task)
  moveTask — drag-drop: any project member can move tasks
  deleteTask — requires pm.delete_any_task or task creator
  addComment — requires project membership (any level)
  editComment — own comments only
  addReaction — any project member
  logTime — requires pm.log_time
  getTimeLogs — filtered, respects view_all vs own

Sprint management:
  createSprint — requires pm.manage_sprints
  updateSprint — requires pm.manage_sprints
  startSprint — requires pm.manage_sprints
  closeSprint — moves incomplete tasks to backlog, requires pm.manage_sprints

Workspace management:
  getWorkspaces — filtered by access
  createWorkspace — requires pm.create_workspace
  updateWorkspace — requires pm.manage_workspace

GitHub integration:
  Create convex/http.ts webhook handler for GitHub events
  Process PR opened → task status: "in_review"
  Process PR merged → task status: "done"
  Sync issue labels to task tags
  Create GitHub issue from task (via action calling GitHub API)

Create frontend pages:
  /platform/pm — dashboard (spec Section 17.2)
  /platform/pm/[projectId] — project board view (spec Section 17.3)
  /platform/pm/[projectId]/list — list view
  /platform/pm/[projectId]/backlog — backlog with sprint management (spec Section 17.4)
  /platform/pm/[projectId]/settings — project settings (spec Section 17.5)
  /platform/pm/my-tasks — all tasks assigned to current user across all projects

Components:
  TaskCard.tsx — kanban card with all info
  TaskSlideOut.tsx — task detail panel (slide from right)
  KanbanBoard.tsx — drag-drop board (use @dnd-kit/core — check if installed)
  SprintCard.tsx — sprint info card
  TimeLogForm.tsx — log time form
  CommentThread.tsx — comments with reactions and mentions
  ProjectMemberList.tsx — members with remove/add actions
  ProjectShareModal.tsx — share with non-member modal
  GanttChart.tsx — Gantt view (use recharts or simple CSS grid)
  BacklogView.tsx — sprint backlog with drag to sprint

CRITICAL ACCESS CONTROL IN UI:
  Show "All Projects" toggle only for pm.view_all users
  Project settings tab: show only to project lead/creator (or pm.view_all)
  Delete project: only to project creator or pm.delete_any_project
  "Transfer ownership": only to project lead
  Assign tasks to any member: any member can do this
  Edit any task: only assignee/creator, or pm.edit_any_task

VERIFY:
- [ ] Creator of project sees it in their list
- [ ] Platform manager NOT a project member: doesn't see private project
- [ ] All-staff project: all platform users can see (but not edit if not member)
- [ ] Project member drag-tasks: status updated correctly
- [ ] Non-member tries to create task: permission denied
- [ ] Time log: only own time visible to non-admin
- [ ] master_admin: sees all projects and tasks with no filtering
- [ ] Sprint close: incomplete tasks moved to backlog
- [ ] GitHub webhook: PR merged → task status "done"
- [ ] Share project: non-member gets notification, can view but not edit (view share)

=======================================================================
PHASE 7 — PLATFORM SIDEBAR INTEGRATION
=======================================================================

Update frontend/src/app/platform/layout.tsx:

All sidebar items filtered by permissions using usePlatformPermissions:

PLATFORM ADMIN sidebar (with permission gates):
  Dashboard       → always visible
  Tenants         → tenants.view
  Platform Users  → platform_users.view
    ├── All Staff   → platform_users.view
    ├── Roles       → platform_users.view
    └── Invites     → platform_users.invite
  CRM             → crm.view_own OR crm.view_all
    ├── Dashboard   → crm.view_own
    ├── Pipeline    → crm.view_own
    ├── All Leads   → crm.view_own
    └── Reports     → crm.view_reports
  PM              → pm.view_own OR pm.view_all
    ├── Dashboard   → pm.view_own
    ├── My Tasks    → pm.view_own
    ├── All Projects → pm.view_all (hidden if not granted)
    └── Reports     → pm.view_time_logs
  Marketplace     → marketplace.view
  Billing         → billing.view_dashboard
  Resellers       → resellers.view
  Settings        → settings.view
  Security        → security.view_dashboard

Items without permission: show DISABLED with 🔒 icon and tooltip
(do NOT hide — confusing UX to have items disappear based on role)
Exception: items exclusive to master_admin (delete, ban) → hide completely

=======================================================================
PHASE 8 — FINAL VERIFICATION
=======================================================================

RBAC verification:
- [ ] support_agent: sees crm.view_own — own leads only
- [ ] support_agent: pm.view_own — own projects/tasks only
- [ ] platform_manager: crm.view_own — own leads + shared
- [ ] super_admin: crm.view_all — all leads with owner filter
- [ ] master_admin: everything, no restrictions
- [ ] Non-admin user cannot call updateUserRole on master_admin
- [ ] Permission customization: cannot grant perms you don't have
- [ ] Access expiry: account suspended automatically when expired
- [ ] Scope restriction: user with scopeCountries=["KE"] doesn't see Uganda tenants

WorkOS verification:
- [ ] Invite sends WorkOS invitation email
- [ ] Accept creates WorkOS user in correct organization
- [ ] Suspend revokes all WorkOS sessions immediately
- [ ] Delete removes from WorkOS organization

CRM verification:
- [ ] Create lead: appears in My Leads, not in others' lists
- [ ] Share with view access: shared user sees but cannot edit
- [ ] Stage change to won: invite modal shown
- [ ] Proposal sent: email received with tracking link
- [ ] Proposal viewed: owner notified
- [ ] Convert to tenant: tenant invite sent, CRM lead stage → won
- [ ] Delete: soft delete — lead not visible but data preserved in DB

PM verification:
- [ ] Create private project: non-members cannot see it
- [ ] Create all_staff project: all platform users can see
- [ ] Task assignee change: old assignee loses edit rights, new gains
- [ ] Drag task between columns: status updated
- [ ] Log time: non-admin only sees own time logs
- [ ] Sprint close: unfinished tasks → backlog
- [ ] GitHub PR merged: linked task → done

Security verification:
- [ ] All mutations check permissions (no mutation accessible without permission)
- [ ] Access control enforced in Convex (not just frontend)
- [ ] Soft delete: deleted records not returned in any list query
- [ ] Audit log created for every permission change
- [ ] All rich text DOMPurify sanitized before storage

Performance:
- [ ] Lead list with 100+ leads loads < 2 seconds
- [ ] Project board with 50+ tasks loads < 2 seconds
- [ ] Sidebar loads permissions < 200ms (cached with useQuery)

Final:
- [ ] Zero hardcoded data anywhere (all from Convex)
- [ ] Zero TypeScript errors
- [ ] Zero build errors
- [ ] All pages have loading skeletons
- [ ] All pages have empty states

=======================================================================
END OF IMPLEMENTATION PROMPT
=======================================================================
```
