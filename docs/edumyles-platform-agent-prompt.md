# EduMyles Platform Systems
## Complete Agent Analysis & Implementation Prompt
### Platform Users/RBAC + CRM + Project Management
**Version 1.0 | April 2026**

---

# PART A — ANALYSIS PROMPT
## Run this FIRST — Before Writing Any Code

---

```
=======================================================================
EDUMYLES PLATFORM SYSTEMS — CODEBASE ANALYSIS PROMPT
=======================================================================

You are analyzing the EduMyles codebase to assess what has been
implemented for three systems:
  1. Platform User Invite Flow with RBAC and WorkOS CRUD
  2. CRM (Customer Relationship Management)
  3. PM (Project Management)

DO NOT write any code during this analysis phase.
Only read, assess, and produce a structured gap report.

=======================================================================
STEP 1 — READ REFERENCE DOCUMENTS FIRST
=======================================================================

Read these documents completely before touching any code file:

1. docs/edumyles-platform-systems-spec.md      — Main spec (Sections 1-19)
2. docs/edumyles-platform-systems-spec-part2.md — Supplement (Sections 20-28)
3. docs/edumyles-tech-spec.md                  — Master platform rules
4. convex/schema.ts                             — Existing tables
5. convex/crons.ts                              — Existing scheduled jobs
6. convex/http.ts                               — Webhook handlers
7. convex/shared/permissions.ts                 — Permission keys (if exists)
8. .agent-skills/                              — ALL skill files

=======================================================================
STEP 2 — SCHEMA ANALYSIS
=======================================================================

Open convex/schema.ts. For each table below, check if it exists and
compare every field against the spec. Report: EXISTS | MISSING FIELDS

PLATFORM RBAC TABLES:
- platform_roles
- platform_users (check for: workosUserId, addedPermissions,
  removedPermissions, scopeCountries, scopeTenantIds, scopePlans,
  accessExpiresAt, twoFactorEnabled, sessionCount)
- platform_user_invites (check for: workosInvitationToken,
  addedPermissions, removedPermissions, scopeCountries)
- permission_audit_log
- platform_sessions
- platform_notifications

CRM TABLES:
- crm_leads (check for: qualificationScore, dealValueKes,
  probability, sourceType, isArchived, isDeleted, tags,
  lastContactedAt, nextFollowUpAt, nextFollowUpNote)
- crm_contacts
- crm_activities (check for: isPrivate, scheduledAt,
  completedAt, metadata, outcome, durationMinutes)
- crm_proposals (check for: trackingToken, viewCount,
  viewedAt, viewerIp, sentAt, acceptedAt, rejectedAt)
- crm_lead_shares (check for: accessLevel, expiresAt, message)
- crm_pipeline_stages (check for: requiresNote, autoFollowUpDays,
  isWon, isLost, probabilityDefault, icon)
- crm_teams
- crm_follow_ups (check for: isOverdue, priority)

PM TABLES:
- pm_workspaces (check for: isPrivate, memberIds)
- pm_projects (check for: visibility, progress,
  totalTasks, completedTasks, githubRepo)
- pm_sprints (check for: velocity, goal)
- pm_tasks (check for: parentTaskId, reviewerId,
  collaboratorIds, githubIssueNumber, githubPrNumber,
  githubBranch, order, actualHours)
- pm_task_comments (check for: isEdited, reactions, mentions)
- pm_time_logs (check for: billable, date)
- pm_project_shares (check for: accessLevel, message, expiresAt)
- pm_github_events
- pm_epics
- pm_task_templates (may not exist — check)

Output: TABLE | EXISTS (yes/no/partial) | MISSING FIELDS (list)

=======================================================================
STEP 3 — PERMISSION SYSTEM ANALYSIS
=======================================================================

3.1 — Check for permissions constant file:
  Look for: convex/shared/permissions.ts OR convex/lib/permissions.ts
  Does it exist? Does it contain PERMISSIONS constant?
  Does it contain SYSTEM_ROLE_PERMISSIONS for all 8 system roles?

3.2 — Check for RBAC core functions:
  File: convex/modules/platform/rbac.ts (or similar)
  Functions to check:
  - getUserPermissions(ctx, userId)
  - hasPermission(permissions, permission)
  - hasAnyPermission(permissions, required[])
  - hasAllPermissions(permissions, required[])
  - requirePermission(ctx, permission)
  - checkScopeAccess(platformUser, resource)

3.3 — Check role CRUD mutations:
  - getRoles (query)
  - getRole (query)
  - createRole (mutation) — validates permissions against PERMISSIONS constant
  - updateRole (mutation) — blocks editing system roles
  - deleteRole (mutation) — checks for users with role before deleting
  - duplicateRole (mutation)

3.4 — Check user CRUD mutations:
  - getPlatformUsers (query, with filters)
  - getPlatformUser (query)
  - updateUserRole (mutation) — checks cannot change master_admin
  - updateUserPermissions (mutation) — cannot grant perms you don't have
  - updateUserScope (mutation)
  - setAccessExpiry (mutation)
  - suspendPlatformUser (mutation) — revokes WorkOS sessions
  - unsuspendPlatformUser (mutation)
  - deletePlatformUser (mutation) — soft delete
  - revokePlatformUserSessions (mutation)
  - getMyPermissions (query — public, no auth)
  - getPermissionAuditLog (query)

3.5 — Check seed data:
  Are all 8 system roles seeded in platform_roles?
  system roles: master_admin, super_admin, platform_manager,
  support_agent, billing_admin, marketplace_reviewer,
  content_moderator, analytics_viewer

  Are 9 default CRM pipeline stages seeded?
  stages: new, contacted, qualified, demo_booked, demo_done,
  proposal_sent, negotiation, won, lost

=======================================================================
STEP 4 — WORKOS ACTIONS ANALYSIS
=======================================================================

Check file: convex/actions/auth/platformWorkos.ts (or similar)

Functions to check:
  createPlatformUser (internalAction)
  sendPlatformInvitation (internalAction)
  addToPlatformOrganization (internalAction)
  getWorkOSUser (internalAction)
  listPlatformOrgMembers (internalAction)
  updateWorkOSUser (internalAction)
  resetWorkOSPassword (internalAction)
  removeFromPlatformOrganization (internalAction)
  deletePlatformWorkOSUser (internalAction)
  revokeAllPlatformUserSessions (internalAction)
  revokeSingleSession (internalAction)

For each: STATUS (implemented | partial | stub | missing)

Check environment variables referenced:
  - WORKOS_API_KEY
  - WORKOS_PLATFORM_ORG_ID
  - WORKOS_CLIENT_ID
  - NEXT_PUBLIC_PLATFORM_URL

Are they declared in convex/.env.local or similar?

=======================================================================
STEP 5 — INVITE FLOW ANALYSIS
=======================================================================

Check file: convex/modules/platform/users.ts (or similar)

Functions to check:
  invitePlatformUser (mutation) — requires platform_users.invite
  bulkInvitePlatformUsers (mutation)
  acceptPlatformInvite (ACTION — not mutation)
  createPlatformUserFromInvite (internalMutation)
  resendPlatformInvite (mutation)
  revokePlatformInvite (mutation)
  expirePlatformInvites (internalMutation — cron handler)
  expireAccessExpiredAccounts (internalMutation — cron handler)
  getInviteByToken (query — PUBLIC, no auth required)

Check invite flow critical points:
  - Does invitePlatformUser call WorkOS sendPlatformInvitation?
  - Does acceptPlatformInvite correctly coordinate WorkOS action +
    Convex internalMutation in a Convex ACTION?
  - Does suspend correctly revoke WorkOS sessions?

=======================================================================
STEP 6 — CRM ANALYSIS
=======================================================================

Check file: convex/modules/platform/crm.ts (or similar)

6.1 — Access control helper:
  Does getLeadsForUser(ctx, userId, permissions) exist?
  Does it correctly handle all three access modes?
  - crm.view_own: ownerId OR assignedToId = currentUser
  - crm.view_shared: via crm_lead_shares sharedWithUserId
  - crm.view_all: no filter
  Does it deduplicate across all access paths?

6.2 — Queries:
  - getLeads (filters + sort + access control)
  - getLead (full detail)
  - getPipelineView (kanban grouped by stage)
  - getCRMStats (dashboard metrics)
  - getCRMReports (analytics data)

6.3 — Mutations:
  - createLead (auto-calculates qualificationScore)
  - updateLead (access control: edit_own vs edit_any)
  - changeLeadStage (requiresNote enforcement)
  - assignLead (requires crm.assign_lead)
  - shareLead (requires crm.share_lead, own leads only unless view_all)
  - logActivity (access control check)
  - deleteLead (soft delete, own vs any)
  - convertLeadToTenant (requires crm.convert_to_tenant)
  - createProposal (price calculation)
  - sendProposal (generates email)
  - trackProposalView (PUBLIC — no auth)

6.4 — Check for each lead mutation:
  Does it log to audit log?
  Does it create activity record?
  Does it notify relevant parties?

=======================================================================
STEP 7 — PM ANALYSIS
=======================================================================

Check files: convex/modules/pm/projects.ts, tasks.ts, timeLogs.ts

7.1 — Access control helper:
  Does getProjectsForUser(ctx, userId, permissions) exist?
  Does it correctly handle:
  - pm.view_own: creator + lead + member + assigned tasks
  - pm.view_shared: via pm_project_shares
  - pm.view_all: no filter
  - all_staff visibility: visible to all platform users

7.2 — Project functions:
  - getProjects (filtered, access controlled)
  - getProject (full detail, access check)
  - createProject (requires pm.create_project)
  - updateProject (own vs any, lead/creator check)
  - deleteProject (soft delete, own vs any)
  - manageProjectMembers (add/remove, leader/creator only)
  - shareProject (non-member sharing)
  - archiveProject

7.3 — Task functions:
  - createTask (must be project member or pm.view_all)
  - updateTask (own vs any task)
  - moveTask (any project member can move)
  - deleteTask (creator or pm.delete_any_task)
  - addComment (any project member)
  - addReaction (any project member)
  - logTime (requires pm.log_time)
  - getTimeLogs (own vs all, access controlled)

7.4 — Sprint functions:
  - createSprint (requires pm.manage_sprints)
  - startSprint (only one active sprint at a time)
  - closeSprint (moves incomplete tasks to backlog)

7.5 — GitHub integration:
  Does convex/http.ts have a GitHub webhook handler?
  Does it verify GitHub webhook signature?
  Does it process PR events and update task status?

=======================================================================
STEP 8 — FRONTEND PAGES ANALYSIS
=======================================================================

Check these files exist and assess implementation status:
IMPLEMENTED | SKELETON | MISSING | HARDCODED DATA

PLATFORM RBAC:
  frontend/src/app/platform/users/page.tsx
  frontend/src/app/platform/users/[userId]/page.tsx
  frontend/src/app/platform/users/roles/page.tsx
  frontend/src/app/platform/users/roles/create/page.tsx
  frontend/src/app/platform/invite/accept/page.tsx
  frontend/src/components/platform/InviteStaffModal.tsx
  frontend/src/components/platform/PermissionMatrix.tsx
  frontend/src/components/platform/PermissionGate.tsx
  frontend/src/hooks/usePlatformPermissions.ts

CRM:
  frontend/src/app/platform/crm/page.tsx
  frontend/src/app/platform/crm/leads/page.tsx
  frontend/src/app/platform/crm/pipeline/page.tsx
  frontend/src/app/platform/crm/leads/create/page.tsx
  frontend/src/app/platform/crm/[leadId]/page.tsx
  frontend/src/app/platform/crm/proposals/page.tsx
  frontend/src/app/platform/crm/reports/page.tsx
  frontend/src/app/platform/crm/settings/page.tsx
  frontend/src/app/proposals/[trackingToken]/page.tsx

PM:
  frontend/src/app/platform/pm/page.tsx
  frontend/src/app/platform/pm/[projectId]/page.tsx
  frontend/src/app/platform/pm/[projectId]/list/page.tsx
  frontend/src/app/platform/pm/[projectId]/backlog/page.tsx
  frontend/src/app/platform/pm/[projectId]/settings/page.tsx
  frontend/src/app/platform/pm/my-tasks/page.tsx
  frontend/src/components/pm/TaskCard.tsx
  frontend/src/components/pm/TaskSlideOut.tsx
  frontend/src/components/pm/KanbanBoard.tsx

SHARED:
  frontend/src/components/platform/NotificationBell.tsx
  frontend/src/app/platform/notifications/page.tsx

For each page that exists, check:
  a) Does it call useQuery for all data? (No hardcoded arrays)
  b) Does it have loading states (skeletons)?
  c) Does it have empty states?
  d) Are action buttons gated with PermissionGate?

=======================================================================
STEP 9 — CRON JOBS ANALYSIS
=======================================================================

Open convex/crons.ts. Check for these jobs:

PLATFORM USERS:
  - expire platform user invites (daily, ~19:00 UTC)
  - suspend expired platform access (daily, ~19:30 UTC)

SECURITY:
  - daily security checks (daily, ~06:00 UTC)

CRM:
  - check overdue follow-ups (daily, ~05:00 UTC)
  - expire CRM lead shares (daily, ~06:00 UTC)
  - weekly CRM pipeline report (Mondays, ~06:00 UTC)

PM:
  - task due today notifications (daily, ~05:00 UTC)
  - check overdue tasks (daily, ~05:30 UTC)
  - sprint ending soon (daily, ~06:00 UTC)
  - weekly PM summary (Mondays, ~06:15 UTC)
  - purge old notifications (monthly, day 1)

For each: EXISTS | CORRECT TIMING | CORRECT HANDLER

=======================================================================
STEP 10 — SECURITY CHECKS
=======================================================================

10.1 — Middleware check:
  Does frontend/src/middleware.ts exist?
  Does it:
  - Block /platform routes for non-platform-org users?
  - Use WorkOS AuthKit withAuth wrapper?
  - Allow public routes through?

10.2 — Server-side access control:
  Run these grep checks:

  # Check for unguarded mutations (no requirePermission call)
  grep -rn "^export const.*= mutation" convex/modules/platform/ \
    | grep -v "test\|seed" \
    | while read line; do
        file=$(echo $line | cut -d: -f1)
        name=$(echo $line | grep -o "const [a-zA-Z]*")
        grep -A 20 "$name" "$file" | grep -q "requirePermission" \
          && echo "✅ $name" || echo "❌ UNGUARDED: $name in $file"
      done

  # Check for hardcoded data in frontend CRM/PM pages
  grep -rn "\[\].*\/\/.*mock\|\[\].*\/\/.*todo\|hardcoded\|placeholder" \
    frontend/src/app/platform/crm/ \
    frontend/src/app/platform/pm/ \
    frontend/src/app/platform/users/ \
    --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules

  # Check view_all filter bypass (critical bug pattern)
  grep -rn "crm_leads.*collect\(\)" convex/modules/platform/crm.ts | head -5
  # Should NOT return all leads without access control check

10.3 — Soft delete check:
  grep -rn "db\.delete.*crm_leads\|db\.delete.*pm_projects\|db\.delete.*pm_tasks" convex/ \
  | grep -v "test\|seed\|_id"
  # Should return ZERO results — all deletions should be soft (isDeleted: true)

10.4 — DOMPurify check:
  grep -rn "DOMPurify\|sanitizeHtml" convex/modules/pm/ | head -10
  # Should appear in task description and comment saving

=======================================================================
STEP 11 — PRODUCE ANALYSIS REPORT
=======================================================================

Output a structured report:

## PLATFORM SYSTEMS ANALYSIS REPORT
Date: [today]

### SUMMARY
- Schema completeness: X/Y tables fully implemented
- Permission system: [implemented/partial/missing]
- WorkOS actions: X/11 implemented
- CRM functions: X/20 implemented
- PM functions: X/25 implemented
- Frontend pages: X/Y implemented
- Security: [all guarded/gaps found]

### CRITICAL BLOCKERS
Items that break everything else if not fixed first.
Example: "requirePermission not implemented — all mutations unguarded"

### SCHEMA GAPS
Table-by-table: missing tables and missing fields.

### PERMISSION SYSTEM GAPS
What's missing from the RBAC core.

### WORKOS GAPS
Which WorkOS actions are missing or broken.

### CRM GAPS
Missing functions, missing access control, missing automations.

### PM GAPS
Missing functions, missing access control, missing GitHub integration.

### FRONTEND GAPS
Missing pages, hardcoded data violations, missing permission gates.

### SECURITY GAPS
Unguarded mutations, missing middleware, soft-delete violations.

### SEEDING GAPS
What seed data is missing.

### WHAT IS FULLY WORKING
List confirmed working pieces that can be relied upon.

### RECOMMENDED IMPLEMENTATION ORDER
Based on gaps found — prioritized by blocking dependencies.
```

---

# PART B — IMPLEMENTATION PROMPT

---

```
=======================================================================
EDUMYLES PLATFORM SYSTEMS — IMPLEMENTATION PROMPT
Platform Users/RBAC + CRM + Project Management
Version 1.0 | April 2026
=======================================================================

You have completed the analysis. Now implement everything that is
missing or incomplete. Work through all 10 phases in strict order.
Every phase must have zero TypeScript errors before moving forward.

=======================================================================
PRE-FLIGHT — READ BEFORE WRITING A SINGLE LINE
=======================================================================

Read these COMPLETELY before beginning:

1. docs/edumyles-platform-systems-spec.md       — Sections 1–19
2. docs/edumyles-platform-systems-spec-part2.md — Sections 20–28
3. docs/edumyles-tech-spec.md                   — Absolute rules
4. convex/schema.ts                             — Existing tables
5. convex/helpers/tenantGuard.ts                — requireTenantContext
6. convex/helpers/auditLog.ts                   — logAudit implementation
7. opensrc/workos-authkit-nextjs/               — WorkOS SDK internals
8. opensrc/resend/                              — Resend email internals
9. .agent-skills/                              — ALL skill files

After reading, write a 2-paragraph summary of:
  (1) What's already implemented that you can rely on
  (2) What you need to build from scratch

Then begin Phase 1.

=======================================================================
ABSOLUTE IMPLEMENTATION RULES — ALL PHASES
=======================================================================

Apply every rule to every file you create or modify:

1.  All data from Convex — zero hardcoded arrays or mock objects
2.  All reads: useQuery() — All writes: useMutation() / useAction()
3.  requirePermission(ctx, "permission.key") at start of every
    mutation and query that touches protected data
4.  Access control enforced SERVER-SIDE in Convex — UI gating is
    cosmetic only; the real check is in the query/mutation
5.  Loading skeletons everywhere useQuery returns undefined
6.  Empty states everywhere query returns empty array
7.  Error states when things fail — show what happened and how to fix
8.  DOMPurify.sanitize() on: pm_tasks.description,
    pm_task_comments.body, crm_activities.body, crm_proposals.customNotes
9.  SOFT DELETE everywhere — isDeleted flag, never db.delete() on
    crm_leads, pm_projects, pm_tasks
10. Audit log (logAudit) on every create, update, delete, share, assign
11. All prices in KES stored in Convex — never computed in React
12. master_admin role has permissions["*"] — wildcard bypasses all checks
    Implement: if (permissions.includes("*")) return true
13. Permission audit log written for every role/permission change
14. WorkOS operations are Convex ACTIONS — mutations cannot call HTTP APIs
15. No new npm dependencies — use what is already installed
16. npx convex dev — zero errors after every phase
17. npm run type-check — zero errors after every phase
18. Tailwind only for styling
19. recharts only for charts
20. All crons in convex/crons.ts

=======================================================================
PHASE 1 — SCHEMA & SEED DATA
=======================================================================

Objective: All tables exist with all fields. Seed data ready.
Nothing else works without this.

1.1 — Schema audit and fix (convex/schema.ts):

For every table in the spec (Sections 3, 11, 15), compare field-by-field.
ADD missing fields — DO NOT remove existing fields.
ADD missing indexes — CHECK existing indexes first.

Platform tables to audit/create:
  platform_roles — all fields including icon, color, userCount
  platform_users — all fields especially: addedPermissions[],
    removedPermissions[], scopeCountries[], scopeTenantIds[],
    scopePlans[], accessExpiresAt, twoFactorEnabled, sessionCount
  platform_user_invites — all fields especially: workosInvitationToken,
    addedPermissions[], removedPermissions[], scopeCountries[],
    scopeTenantIds[], scopePlans[], accessExpiresAt
  permission_audit_log — all fields
  platform_sessions — all fields
  platform_notifications — all fields and all type literals

CRM tables to audit/create:
  crm_leads — all fields especially: qualificationScore, dealValueKes,
    probability, isArchived, isDeleted, tags, sourceType enum,
    lastContactedAt, nextFollowUpAt, nextFollowUpNote
  crm_contacts — all fields
  crm_activities — all fields especially: isPrivate, scheduledAt,
    completedAt, durationMinutes, outcome, metadata
  crm_proposals — all fields especially: trackingToken,
    viewCount, viewedAt, viewerIp, sentAt, acceptedAt,
    rejectedAt, rejectionReason
  crm_lead_shares — all fields especially: accessLevel enum,
    message, expiresAt
  crm_pipeline_stages — all fields especially: requiresNote,
    autoFollowUpDays, isWon, isLost, probabilityDefault, icon
  crm_teams — all fields
  crm_follow_ups — all fields especially: isOverdue, priority enum

PM tables to audit/create:
  pm_workspaces — all fields especially: isPrivate, memberIds[]
  pm_projects — all fields especially: visibility enum,
    progress, totalTasks, completedTasks, githubRepo
  pm_sprints — all fields especially: velocity, goal
  pm_tasks — all fields especially: parentTaskId, reviewerId,
    collaboratorIds[], githubIssueNumber, githubPrNumber,
    githubBranch, order, actualHours
  pm_task_comments — all fields especially: isEdited, editedAt,
    mentions[], reactions[] (array of {emoji, userIds[]})
  pm_time_logs — all fields especially: billable, date (string YYYY-MM-DD)
  pm_project_shares — all fields especially: accessLevel enum,
    message, expiresAt
  pm_github_events — all fields
  pm_epics — all fields

1.2 — Create permissions constant file:
  Create: convex/shared/permissions.ts
  Export: PERMISSIONS object (all keys from spec Section 2)
  Export: SYSTEM_ROLE_PERMISSIONS (all 8 roles with correct arrays)

1.3 — Seed data (convex/dev/seed.ts or convex/dev/seedPlatform.ts):

Seed platform_roles — all 8 system roles:
  For each: name, slug, isSystem: true, isActive: true,
  permissions (from SYSTEM_ROLE_PERMISSIONS), userCount: 0
  Colors and icons for each role:
    master_admin: color "#dc2626", icon "Crown"
    super_admin: color "#7c3aed", icon "Shield"
    platform_manager: color "#0070F3", icon "Briefcase"
    support_agent: color "#059669", icon "Headphones"
    billing_admin: color "#d97706", icon "CreditCard"
    marketplace_reviewer: color "#ec4899", icon "ShoppingBag"
    content_moderator: color "#6366f1", icon "FileSearch"
    analytics_viewer: color "#06b6d4", icon "BarChart2"

Seed crm_pipeline_stages — all 9 stages from spec Section 23.1:
  new, contacted, qualified, demo_booked, demo_done,
  proposal_sent, negotiation, won, lost
  Each with: correct order, color, icon, probabilityDefault,
  requiresNote, autoFollowUpDays, isWon, isLost

Seed pm_workspaces — one default workspace:
  name: "EduMyles Platform", slug: "edumyles-platform",
  icon: "🏢", color: "#0070F3",
  isPrivate: false, isArchived: false

VERIFY:
  npx convex dev — zero errors
  Check all tables exist in Convex dashboard
  Check seed data present in all tables

=======================================================================
PHASE 2 — WORKOS PLATFORM ACTIONS
=======================================================================

Objective: All WorkOS API calls work correctly.
No other WorkOS-dependent feature can work without this.

Create: convex/actions/auth/platformWorkos.ts

Implement all 11 actions from spec Section 4.1:

createPlatformUser(email, firstName, lastName, password?)
  → calls workos.userManagement.createUser()
  → calls workos.userManagement.sendVerificationEmail()
  → returns { workosUserId: string }
  → try/catch: translate "email_already_in_use" to clear error

sendPlatformInvitation(email, inviterUserId, redirectUri)
  → calls workos.userManagement.sendInvitation()
  → organizationId = WORKOS_PLATFORM_ORG_ID
  → returns { workosInvitationToken: string }

addToPlatformOrganization(workosUserId, roleSlug)
  → calls workos.userManagement.createOrganizationMembership()
  → organizationId = WORKOS_PLATFORM_ORG_ID

getWorkOSUser(workosUserId)
  → calls workos.userManagement.getUser()
  → returns normalized user object

listPlatformOrgMembers(limit?, after?)
  → calls workos.userManagement.listOrganizationMemberships()
  → filter by organizationId = WORKOS_PLATFORM_ORG_ID

updateWorkOSUser(workosUserId, firstName?, lastName?, emailVerified?)
  → calls workos.userManagement.updateUser()

resetWorkOSPassword(email)
  → calls workos.userManagement.sendPasswordResetEmail()
  → redirectUrl = NEXT_PUBLIC_PLATFORM_URL + /platform/auth/reset-password

removeFromPlatformOrganization(workosUserId)
  → lists memberships filtered by user + org
  → calls deleteOrganizationMembership for each

deletePlatformWorkOSUser(workosUserId)
  → calls workos.userManagement.deleteUser()
  → use only for hard deletion scenarios (master_admin only)

revokeAllPlatformUserSessions(workosUserId)
  → revoke all sessions for this user

revokeSingleSession(sessionId)
  → revoke one specific session

Environment variables — verify these exist in .env.local:
  WORKOS_API_KEY=sk_...
  WORKOS_PLATFORM_ORG_ID=org_...
  WORKOS_CLIENT_ID=client_...
  NEXT_PUBLIC_PLATFORM_URL=https://platform.edumyles.co.ke

VERIFY:
  Create a test internalQuery that calls getWorkOSUser with a known ID
  Verify it returns data without errors
  Each action must have proper try/catch with meaningful error messages

=======================================================================
PHASE 3 — RBAC CORE ENGINE
=======================================================================

Objective: Permission system fully functional.
This is a prerequisite for literally every other feature.

Create: convex/modules/platform/rbac.ts

3.1 — Permission resolution functions:

getUserPermissions(ctx, userId): Promise<string[]>
  1. Query platform_users by userId
  2. If not found: return []
  3. If status === "suspended": return []
  4. If accessExpiresAt < now: return []
  5. If role === "master_admin": return ["*"]
  6. Query platform_roles by user.role slug
  7. If role not found or !role.isActive: return []
  8. Start with role.permissions
  9. Add user.addedPermissions (dedup with Set)
  10. Remove user.removedPermissions
  11. Return final array

hasPermission(permissions: string[], permission: string): boolean
  if (permissions.includes("*")) return true
  return permissions.includes(permission)

hasAnyPermission(permissions, required[]): boolean
hasAllPermissions(permissions, required[]): boolean

requirePermission(ctx, permission): Promise<{ platformUser, permissions, userId }>
  1. ctx.auth.getUserIdentity() — if null: throw UNAUTHENTICATED
  2. getUserPermissions(ctx, identity.subject)
  3. hasPermission check — if fails: throw UNAUTHORIZED with message
  4. return { platformUser, permissions, userId: identity.subject }

checkScopeAccess(platformUser, { countryCode?, tenantId?, plan? }): boolean
  Check each scope restriction — empty array means no restriction

3.2 — Role CRUD mutations:

getRoles(query) — requirePermission: platform_users.view
  Filter by includeSystem and includeInactive params
  Sort: system roles first, then alphabetical

getRole(query) — requirePermission: platform_users.view

createRole(mutation) — requirePermission: platform_users.invite
  Validate: all permission keys exist in PERMISSIONS constant
  Generate unique slug from name
  Check slug not already taken
  Cannot include ["*"] in permissions (master_admin exclusive)
  logAudit

updateRole(mutation) — requirePermission: platform_users.invite
  Block: isSystem roles cannot be modified
  logAudit

deleteRole(mutation) — requirePermission: platform_users.delete
  Block: isSystem roles cannot be deleted
  Check usersWithRole count
  If count > 0 and no reassignToRole: throw error with user count
  If reassignToRole provided: patch all users to new role first
  Then delete role
  logAudit

duplicateRole(mutation) — requirePermission: platform_users.invite
  Creates new role with all same permissions
  isSystem: false on the copy
  logAudit

3.3 — User CRUD:

getPlatformUsers(query) — requirePermission: platform_users.view
  Filters: role, status, department, search, accessType
  accessType "expiring": expiresAt within next 30 days
  accessType "expired": expiresAt < now
  Never return deleted users (status scrambled on delete)

getPlatformUser(query) — requirePermission: platform_users.view

updateUserRole(mutation) — requirePermission: platform_users.edit_role
  Guard 1: Cannot change own role
  Guard 2: Cannot assign master_admin unless YOU are master_admin
  Guard 3: Cannot modify a master_admin unless YOU are master_admin
  Verify new role exists and isActive
  Reset addedPermissions and removedPermissions on role change
  updateRoleUserCount for old role (-1) and new role (+1)
  Write permission_audit_log entry
  logAudit

updateUserPermissions(mutation) — requirePermission: platform_users.edit_permissions
  Guard: Cannot grant permissions you don't have
    (compare addedPermissions against actingUser's effective permissions)
    Exception: master_admin can grant anything
  Write permission_audit_log entry
  logAudit

updateUserScope(mutation) — requirePermission: platform_users.edit_permissions
  Write permission_audit_log entry

setAccessExpiry(mutation) — requirePermission: platform_users.edit_permissions
  Write permission_audit_log entry

suspendPlatformUser(mutation) — requirePermission: platform_users.suspend
  Guard: Cannot suspend self
  Guard: Cannot suspend master_admin unless YOU are master_admin
  Set status: "suspended"
  Schedule revokeAllPlatformUserSessions action
  Write permission_audit_log entry
  logAudit

unsuspendPlatformUser(mutation) — requirePermission: platform_users.suspend
  Set status: "active"
  Write permission_audit_log entry

deletePlatformUser(mutation) — requirePermission: platform_users.delete
  Guard: Cannot delete self
  Soft delete: scramble email, set status: "suspended"
  removeFromPlatformOrganization action
  Write permission_audit_log entry
  logAudit

revokePlatformUserSessions(mutation) — requirePermission: platform_users.suspend
  If sessionId provided: revoke one session + delete from platform_sessions
  If no sessionId: revoke all sessions + delete all from platform_sessions

getMyPermissions(query) — NO permission required (public for authenticated users)
  Returns: { permissions, platformUser, isAuthenticated, isMasterAdmin }

getPermissionAuditLog(query) — requirePermission: platform_users.view_activity

3.4 — Frontend permission hook:

Create: frontend/src/hooks/usePlatformPermissions.ts
  useQuery(api.platform.rbac.getMyPermissions)
  Expose: can(permission), canAny(perms[]), canAll(perms[])
  Expose: permissions[], platformUser, isLoaded, isAuthenticated, isMasterAdmin

Create: frontend/src/components/platform/PermissionGate.tsx
  Props: permission, children, fallback?, showDisabled?, disabledTooltip?
  If showDisabled: wrap children in div with opacity + cursor-not-allowed + tooltip
  If not showDisabled: render fallback or null

VERIFY:
  Create a test query that calls requirePermission("tenants.view")
  Verify it throws for unauthenticated request
  Verify it throws for user without the permission
  Verify it passes for user with the permission
  Verify master_admin with ["*"] passes every check

=======================================================================
PHASE 4 — PLATFORM USER INVITE FLOW
=======================================================================

Objective: Complete invite → accept → access flow works end-to-end.

4.1 — Convex functions (convex/modules/platform/users.ts):

invitePlatformUser(mutation) — requirePermission: platform_users.invite
  Implementation from spec Section 6.1
  Key guards:
  - Cannot invite as master_admin unless YOU are master_admin
  - Cannot grant permissions you don't have
  - No pending invite for this email
  - Not already a platform user
  Token: crypto.randomUUID()
  Expiry: 72 hours from now
  Call sendPlatformInvitation action → get workosInvitationToken
  Insert platform_user_invites record
  Send branded invite email via Resend
  Schedule reminder at 24hr (if not accepted)
  Schedule reminder at 48hr (if not accepted)
  logAudit

bulkInvitePlatformUsers(mutation)
  Loop through invites array, call invitePlatformUser for each
  Collect results (success/failure per email)
  Return summary

acceptPlatformInvite(ACTION — not mutation)
  Pattern from spec Section 6.1:
  1. runQuery: validate invite by token
  2. If new account: runAction createPlatformUser
  3. runAction addToPlatformOrganization
  4. runMutation createPlatformUserFromInvite
  5. runAction getOrganizationAuthUrl → return authUrl

createPlatformUserFromInvite(internalMutation)
  Create platform_users record from invite data
  Update invite status: "accepted", acceptedAt
  Update role.userCount +1
  If notifyInviter: schedule inviteAccepted email
  logAudit

resendPlatformInvite(mutation)
  Generate new token, reset expiry to 72hr
  Update invite record
  Resend email

revokePlatformInvite(mutation, reason required)
  Set status: "revoked"
  logAudit

getInviteByToken(query — PUBLIC, NO auth required)
  Returns: { email, firstName, expiresAt, status, roleName, permissions[] }
  Used by accept page to pre-fill form and validate token

expirePlatformInvites(internalMutation — cron handler)
  Find all pending invites with expiresAt < now
  Set status: "expired"

expireAccessExpiredAccounts(internalMutation — cron handler)
  Find all active users with accessExpiresAt < now
  Set status: "suspended"
  Schedule revokeAllPlatformUserSessions

sendInviteReminder(internalMutation — scheduler handler)
  Check if invite still pending (not accepted/revoked/expired)
  Send reminder email
  Update lastReminderAt, remindersSent++

4.2 — Frontend pages:

/platform/invite/accept (PUBLIC page):
  Full implementation from spec Section 8.1
  On load: call getInviteByToken → validate → show form or error
  States: loading | invalid | expired | used | create_account
  Form: firstName (pre-filled), lastName (pre-filled), email (locked),
        password with strength indicator, confirm password, ToS checkbox
  "Sign In Instead" option → WorkOS AuthKit login
  Submit → acceptPlatformInvite action → redirect to authUrl

/platform/users (authenticated):
  Full page from spec Section 7.2
  5 tabs: All Staff | By Role | Pending Invites | Suspended | Expiring
  Stats row: Total, Active, Suspended, Pending Invites (all from Convex)
  Search + role filter + status filter
  Users table with sortable columns
  Per-row: avatar, name, role badge, department, status, last login,
           expiry date (if set), actions menu
  Actions menu: View Profile | Edit Role | Edit Permissions | Suspend |
                Revoke Sessions | Delete (master_admin only)
  [Invite Staff] button → InviteStaffModal.tsx

InviteStaffModal.tsx:
  Full implementation from spec Section 7.3
  Role selector → shows permission preview panel
  Expandable permission customizer (add/remove individual perms)
  Scope restrictions: countries, plans
  Access expiry toggle with date picker
  Personal message textarea
  "Notify me" toggle
  Submit → invitePlatformUser mutation

/platform/users/[userId] (authenticated):
  4 tabs: Profile | Permissions | Sessions | Activity
  Profile tab: name, email, phone, department, job title, status badge
               last login, member since
  Permissions tab:
    Current role card with description
    Effective permissions matrix (grouped by category)
    Color coding: green=from role, blue=added, red-strike=removed
    [Edit Role] → dropdown + reason modal
    [Edit Permissions] → customizer modal (same as invite modal)
    [Edit Scope] → scope form
    [Set Expiry] → date picker
    [Suspend] → reason required
    [Revoke All Sessions] → confirmation
    [Delete] → type name to confirm (master_admin only)
  Sessions tab:
    List from platform_sessions (device, IP, location, last active)
    [Kill Session] per row
    [Kill All Sessions] button
  Activity tab:
    Last 50 audit log entries by this user
    Permission audit log entries for this user

/platform/users/roles (authenticated):
  Left sidebar: role list (system roles + custom roles)
  Right panel: selected role detail
  For system roles: show permissions read-only with "View Only" label
  For custom roles: [Edit] and [Deactivate] buttons
  [Create Custom Role] button → create page
  Each role: name, badge, description, user count, permission count
  Permission preview: grouped by category with checkmarks

/platform/users/roles/create (authenticated):
  5-section form from spec Section 9.2:
  1. Identity: name, description, base role (inherit from), color, icon
  2. Permissions: grouped by category, toggles, inherited marked
  3. Scope defaults: recommended scope restrictions
  4. Preview: permission summary + page access list
  5. Confirm + Create

VERIFY:
  Full flow: invite → accept page → create account → redirect to /platform
  Invite email received with correct content
  72hr expiry: expired token shows correct error
  Role change: permission audit log written
  Suspend: user cannot log in, sessions revoked

=======================================================================
PHASE 5 — CRM CORE
=======================================================================

Objective: Full CRM with correct access control, audit trail.

5.1 — Access control helper:

getLeadsForUser(ctx, userId, permissions): Promise<Doc<"crm_leads">[]>
  From spec Section 12.1
  crm.view_all → return all non-deleted leads
  crm.view_own → leads where ownerId = userId OR assignedToId = userId
  crm.view_shared → leads where crm_lead_shares.sharedWithUserId = userId
  Deduplicate with Map<leadId, lead>
  Always filter isDeleted: false

5.2 — Queries:

getLeads(stage?, ownerId?, country?, search?, tags?, hasFollowUpDue?,
         isArchived?, sortBy?)
  requirePermission: crm.view_own
  Use getLeadsForUser helper
  Apply all filters after access control
  ownerId filter: only apply if crm.view_all (cannot filter by owner without it)
  Sort options: created_desc, value_desc, follow_up_asc, updated_desc
  Enrich with ownerName and assignedToName
  Default: exclude archived leads

getLead(leadId)
  requirePermission: crm.view_own
  Full access check (view_all OR isOwner OR isShared)
  Load: contacts, activities (last 50 desc), proposals, follow-ups, shares
  Return canEdit flag based on access level

getPipelineView(ownerId?, country?)
  requirePermission: crm.view_own
  Load stages sorted by order
  Group leads by stage
  Calculate totalValueKes per stage
  Apply owner filter only for crm.view_all users

getCRMStats()
  requirePermission: crm.view_own
  Stats scoped to user's accessible leads (use getLeadsForUser)
  Calculate: total leads, in demo stage, pipeline value, conversion rate,
             overdue follow-ups

getCRMReports(dateFrom?, dateTo?, ownerId?, country?)
  requirePermission: crm.view_reports
  Data for all charts in spec Section 13.5
  Respect access scope (own vs all)

5.3 — Lead mutations:

createLead(companyName, contactName, contactEmail, ...)
  requirePermission: crm.create_lead
  calculateQualificationScore from args
  Insert lead with ownerId = current userId
  Log "system" activity: "Lead created"
  Schedule autoFollowUp based on stage autoFollowUpDays
  logAudit

updateLead(leadId, ...fields)
  requirePermission: crm.edit_own_lead
  Access check: crm.edit_any_lead OR isOwner OR (isShared with edit access)
  Partial update: only update provided fields
  logAudit

changeLeadStage(leadId, newStage, note?, lostReason?)
  requirePermission: crm.edit_own_lead
  Access check: crm.edit_any_lead OR isOwner
  If stage.requiresNote and !note → throw error with stage name
  Log "stage_change" activity
  If new stage has autoFollowUpDays → set nextFollowUpAt
  If newStage === "won" → schedule onLeadWon internal
  logAudit

assignLead(leadId, assignedToId?, note?)
  requirePermission: crm.assign_lead
  Notify new assignee (if different from current user)
  Log "assignment_change" activity
  logAudit

shareLead(leadId, sharedWithUserId, accessLevel, message?, expiresAt?)
  requirePermission: crm.share_lead
  Guard: can only share own leads (or crm.view_all)
  Upsert share record (update if already shared)
  Notify sharedWithUserId
  logAudit

revokeLedShare(shareId)
  requirePermission: crm.share_lead
  Delete share record
  logAudit

logActivity(leadId, type, subject?, body?, ...)
  requirePermission: crm.view_own
  Access check (view_all OR isOwner)
  Sanitize body with DOMPurify
  Insert crm_activities record
  Update lead.lastContactedAt

deleteLead(leadId, reason)
  requirePermission: crm.delete_own_lead
  Guard: crm.delete_any_lead OR isOwner
  Soft delete: isDeleted: true
  logAudit

convertLeadToTenant(leadId, suggestedPlan, suggestedModules, personalMessage?)
  requirePermission: crm.convert_to_tenant
  runMutation sendTenantInvite from onboarding module
  Update lead stage to "won"
  Log "system" activity
  logAudit

5.4 — Contacts:

addContact(leadId, firstName, lastName, email?, phone?, title?, isPrimary?)
  requirePermission: crm.edit_own_lead + access check
  If isPrimary: set all other contacts isPrimary: false first

updateContact(contactId, ...fields)
  requirePermission: crm.edit_own_lead + access check

deleteContact(contactId)
  requirePermission: crm.edit_own_lead + access check
  Hard delete acceptable for contacts (not a primary record)

5.5 — Proposals:

createProposal(leadId, recommendedPlan, billingPeriod, studentCount, ...)
  requirePermission: crm.create_proposal
  Calculate totalMonthlyKes and totalAnnualKes server-side
  Generate unique trackingToken (crypto.randomUUID())
  Schedule generateProposalPdf action (generates PDF, uploads to UploadThing)
  Insert crm_proposals record (status: "draft")
  logAudit

sendProposal(proposalId)
  requirePermission: crm.create_proposal + access check
  Set status: "sent", sentAt
  Send email via Resend with proposal URL
  Log "proposal" activity on lead

trackProposalView(trackingToken, viewerIp?) — PUBLIC (no auth)
  Find proposal by trackingToken
  Increment viewCount, set viewedAt (first view only)
  Update status: "sent" → "viewed"
  Notify lead owner with in-app notification

acceptProposal(trackingToken) — PUBLIC
  Set status: "accepted", acceptedAt
  Notify lead owner

rejectProposal(trackingToken, reason?) — PUBLIC
  Set status: "rejected", rejectedAt, rejectionReason
  Notify lead owner

5.6 — Follow-ups:

createFollowUp(leadId, title, dueAt, notes?, priority?)
  requirePermission: crm.view_own + access check
  Insert crm_follow_ups record
  Update lead.nextFollowUpAt and lead.nextFollowUpNote

completeFollowUp(followUpId)
  Set completedAt
  Update lead: clear nextFollowUpAt if no other pending follow-ups

snoozeFollowUp(followUpId, newDueAt)
  Update dueAt, reset isOverdue: false

expireCRMShares(internalMutation — cron)
  Find shares with expiresAt < now
  Hard delete expired shares

5.7 — Pipeline configuration:

updatePipelineStage, reorderPipelineStages, createPipelineStage
  All require crm.manage_pipeline
  From spec Section 23.2

5.8 — CRM Crons:

checkOverdueFollowUps (daily 05:00 UTC) — from spec Section 21.2
sendWeeklyPipelineReport (Monday 06:00 UTC) — from spec Section 27.5

5.9 — Frontend pages:

/platform/crm — Dashboard
  Stats row (all from Convex, scoped to accessible leads)
  My follow-ups due today (only current user's)
  Recent activity across all my leads
  Pipeline overview (mini counts per stage)
  [Only for crm.view_all: "My Leads / All Leads" toggle]

/platform/crm/pipeline — Kanban
  Owner filter: [Only for crm.view_all users — shows platform user dropdown]
  Country filter
  Drag-drop columns (if stage requires note: show inline note input)
  Lead cards with all info from spec Section 13.3

/platform/crm/leads — List view
  Table with columns: company, contact, country, stage, value, score, owner, follow-up, actions
  Filters: stage, owner (crm.view_all only), country, source, score range
  Sort by any column
  Bulk actions: assign, archive, change stage

/platform/crm/leads/create — Create form
  All fields from spec
  After submit: redirect to lead detail

/platform/crm/[leadId] — Lead detail
  5 tabs: Overview | Activities | Contacts | Proposals | Share
  Overview: school details (inline editable), pain points, pipeline info
  Activities: timeline with filter, quick log form at top
  Contacts: primary + additional contacts, add form
  Proposals: list + create button + proposal builder
  Share: current shares + add share form
  Right sidebar: score, value, follow-up, tags

/platform/crm/reports — Analytics
  All charts from spec Section 13.5
  All data from Convex, respecting user's access scope

/platform/crm/settings — Pipeline config
  requirePermission: crm.manage_pipeline (show locked state if denied)
  Draggable stage list
  Per-stage inline editing
  Add/archive stages

/proposals/[trackingToken] — PUBLIC proposal view
  Branded (school or EduMyles branding)
  Shows proposal details, pricing breakdown
  Accept / Decline CTAs
  Calls trackProposalView on load

VERIFY:
  platformManager creates lead → sees it in list
  supportAgent creates lead → sees it, platformManager does NOT
  superAdmin sees all leads + owner filter dropdown
  masterAdmin sees all leads + owner filter dropdown
  Share lead → shared user sees it
  Proposal sent → email received → view tracked → owner notified
  Stage "won" → lead.stage updated, activity logged
  convertLeadToTenant → tenant invite sent

=======================================================================
PHASE 6 — PM CORE
=======================================================================

Objective: Full PM system with access control.

6.1 — Access control helper:

getProjectsForUser(ctx, userId, permissions): Promise<Doc<"pm_projects">[]>
  canViewAll → return all non-deleted, non-archived projects
  Otherwise: union of:
    - projects where creatorId = userId
    - projects where leadId = userId
    - projects where memberIds includes userId
    - projects where ANY task has assigneeId = userId
    - projects shared via pm_project_shares.sharedWithUserId = userId
    - projects with visibility = "all_staff"
  Deduplicate with Map

6.2 — Project functions:

getProjects(workspaceId?, status?, priority?, search?, showOwn?)
  requirePermission: pm.view_own
  Use getProjectsForUser helper
  showOwn flag: filter to only creator/lead/member projects
  leadId filter: only for pm.view_all users

getProject(projectId)
  requirePermission: pm.view_own
  Access check (view_all OR isOwn OR isShared OR all_staff)
  Load: tasks, sprints, epics, members (enriched), shares
  Return userAccess: "edit" | "comment" | "view"

createProject(workspaceId, name, description, priority, visibility,
              leadId, memberIds[], startDate?, endDate?, tags[], githubRepo?)
  requirePermission: pm.create_project
  Generate slug
  Ensure creator always in memberIds
  Notify all new members
  logAudit

updateProject(projectId, ...fields)
  requirePermission: pm.edit_own_project
  Guard: pm.edit_any_project OR (leadId = userId OR creatorId = userId)
  logAudit

deleteProject(projectId, reason)
  requirePermission: pm.delete_own_project
  Guard: pm.delete_any_project OR creatorId = userId
  Soft delete: isDeleted: true
  logAudit

archiveProject(projectId)
  Same guards as updateProject
  Set isArchived: true

manageProjectMembers(projectId, action, memberIds[])
  requirePermission: pm.manage_members
  Guard: pm.edit_any_project OR leadId = userId OR creatorId = userId
  For "add": notify new members
  Update memberIds array

shareProject(projectId, sharedWithUserId, accessLevel, message?, expiresAt?)
  requirePermission: pm.view_own
  Guard: pm.view_all OR leadId = userId OR creatorId = userId
  Upsert pm_project_shares
  Notify sharedWithUserId

6.3 — Task functions:

getTasks(projectId?, status?, assigneeId?, sprintId?, search?)
  requirePermission: pm.view_own
  If projectId: verify user has access to project
  If no projectId: return all tasks across accessible projects (for my-tasks view)
  assigneeId filter: own tasks always, others' tasks only for pm.view_all

getTask(taskId)
  requirePermission: pm.view_own
  Verify access to parent project
  Load: subtasks, comments, timeLogs

createTask(projectId, title, type, priority, ...)
  requirePermission: pm.create_task
  Guard: user must be project member OR pm.view_all
  Sanitize description with DOMPurify
  Get max order in status column (+1000)
  Update project.totalTasks
  Notify assignee if different from creator
  Optionally create GitHub issue (if project.githubRepo set)
  logAudit

updateTask(taskId, ...fields)
  requirePermission: pm.edit_own_task
  Guard: pm.edit_any_task OR assigneeId = userId OR creatorId = userId
  Sanitize description if provided
  If status changed: recalculate project progress
  If status → "done": set completedAt
  Notify new assignee if changed
  logAudit

moveTask(taskId, newStatus, newOrder)
  requirePermission: pm.edit_own_task
  Guard: pm.edit_any_task OR isOwner OR isMember (any member can move)
  Update status + order
  Recalculate project progress

deleteTask(taskId, reason)
  requirePermission: pm.view_own
  Guard: pm.delete_any_task OR creatorId = userId
  Soft delete: isDeleted: true
  Update project.totalTasks
  logAudit

addComment(taskId, body, mentions[])
  requirePermission: pm.view_own
  Verify project membership (any level)
  Sanitize body with DOMPurify
  Insert pm_task_comments
  Notify mentioned users

editComment(commentId, body)
  Verify authorId = currentUser (own comments only)
  Sanitize body
  Set isEdited: true, editedAt

addReaction(commentId, emoji)
  Verify project membership
  Toggle: if user already reacted with this emoji, remove; else add

logTime(taskId, durationMinutes, description?, date, billable)
  requirePermission: pm.log_time
  Verify project membership
  Insert pm_time_logs
  Update task.actualHours (total from all logs for this task)

getTimeLogs(projectId?, userId?, dateFrom?, dateTo?)
  requirePermission: pm.view_time_logs
  Non-admin: only own time logs
  pm.view_all: can filter by any userId

6.4 — Sprint functions:

createSprint(projectId, name, goal?, startDate, endDate)
  requirePermission: pm.manage_sprints
  Guard: project lead/creator OR pm.edit_any_project

startSprint(sprintId)
  requirePermission: pm.manage_sprints
  Check: no other active sprint in this project
  Set status: "active"

closeSprint(sprintId, moveIncompleteToSprintId?)
  requirePermission: pm.manage_sprints
  Move all incomplete tasks to: moveIncompleteToSprintId or backlog (sprintId: null)
  Calculate velocity (sum of completed task storyPoints)
  Set status: "completed"

6.5 — GitHub integration:

Register webhook in convex/http.ts:
  http.route("POST", "/webhooks/github", processGithubWebhook)

processGithubWebhook (httpAction):
  Verify x-hub-signature-256 header
  Parse event type and payload
  Find project(s) by repository.full_name
  For each project: record event, process based on type

processPullRequest (internalMutation):
  PR opened → find task by githubPrNumber or branch → status: "in_review"
  PR merged → task status: "done", completedAt
  Add system comment to task

processIssueEvent (internalMutation):
  Issue closed → linked task status: "done"
  Issue reopened → linked task status: "todo"

createGithubIssue (internalAction):
  Call GitHub API: POST /repos/{owner}/{repo}/issues
  Create issue with task title, description, labels
  Update task.githubIssueNumber with response

6.6 — Workspace functions:

getWorkspaces(includeArchived?) — requirePermission: pm.view_own
  Non-admin: filter out private workspaces where user not member
  Enrich with projectCount

createWorkspace(name, description?, icon, color, isPrivate, memberIds[])
  requirePermission: pm.create_workspace

updateWorkspace(workspaceId, ...fields)
  requirePermission: pm.manage_workspace
  Guard: pm.edit_any_project OR creatorId = userId

6.7 — PM Crons:

sendTaskDueNotifications (daily 05:00 UTC) — from spec Section 21.2
markOverdueTasks (daily 05:30 UTC):
  Find tasks with dueDate < now, status not done/cancelled
  Notify assignee (once per task)
notifySprintEndingSoon (daily 06:00 UTC):
  Find sprints with endDate < now + 2 days, status: "active"
  Notify project lead
sendWeeklyProjectSummary (Monday 06:15 UTC) — from spec Section 27.6

6.8 — Frontend pages:

/platform/pm — Dashboard
  "Welcome, [Name]!" header
  My Tasks Due This Week: table with priority, task, project, due
  My Active Projects: project cards (2-3 columns)
  [For pm.view_all only: "All Projects" toggle + team overview]
  Recent Activity: timeline from own projects

/platform/pm/my-tasks — All tasks assigned to me
  Filter: status, priority, project, date range
  Group by: project (default), status, due date
  Table: priority badge, title, project, status, due date, est hours
  Bulk actions: change status, reassign

/platform/pm/workspaces — Workspace list
  Grid of workspace cards
  Each: icon, name, color, project count, member count
  Click → workspace detail with project list
  [Create Workspace] button (pm.create_workspace)

/platform/pm/[projectId] — Project board (Kanban)
  Full implementation from spec Section 17.3
  Columns: Backlog | Todo | In Progress | In Review | Done
  Each column: task count, [+ Add Task]
  Drag-drop between columns → moveTask mutation
  Task cards: priority badge, title, type badge, assignee avatar,
              due date (red if overdue), GitHub link, comment/attachment count
  Click card → TaskSlideOut panel from right

/platform/pm/[projectId]/list — List view
  Table: priority, title, type, assignee, status, due, sprint, story pts, est hours
  Filter by: assignee, status, sprint, epic, type, priority
  Sort by any column
  Inline editing: status, assignee, due date (click to edit cell)

/platform/pm/[projectId]/backlog — Sprint backlog
  Active sprint info + progress bar
  Sprint task list (draggable to reorder)
  Backlog task list (unassigned to sprint)
  "Add to Sprint" button per task
  Epic grouping (expandable)
  Velocity chart (last 5 sprints, recharts BarChart)
  [Create Sprint] and [Close Sprint] buttons

/platform/pm/[projectId]/settings — Project settings
  4 tabs: General | Members | Integrations | Danger Zone
  From spec Section 17.5

TaskCard.tsx component:
  All info compactly: priority color bar, type badge, title (truncated),
  due date badge (red if overdue), assignee avatar, GitHub link icon,
  comment count badge, attachment count badge

TaskSlideOut.tsx component:
  Slide from right, ~500px wide
  Sections: title (editable inline), status/priority/type dropdowns,
            assignee, reviewer, due date, sprint, estimate, story points,
            GitHub links, description (rich text), subtasks list,
            time log section, tags, attachments, comments thread
  Close button always visible
  All edits: immediate mutation (optimistic updates)

KanbanBoard.tsx component:
  5 columns, horizontal scroll on mobile
  Drag using @dnd-kit/core (check if installed, use if available)
  On drop: moveTask mutation
  If dropped on stage with requiresNote: show inline note input
  Column headers: stage name, task count, total story points

VERIFY:
  Creator sees their private project
  Non-member cannot see private project (verify in Convex query)
  all_staff project: every platform user can view
  Drag task: status updates, project progress recalculates
  Sprint close: unfinished tasks moved to backlog
  GitHub webhook: PR merged → task done (test with ngrok or similar)
  Time log: non-admin sees only own time
  "My Tasks" page shows tasks across multiple projects

=======================================================================
PHASE 7 — NOTIFICATIONS SYSTEM
=======================================================================

Objective: Real-time notification bell with all notification types.

7.1 — Convex notifications (convex/modules/platform/notifications.ts):

createPlatformNotification(ctx, params) — internal helper
  From spec Section 21.2
  Used by: invite flow, CRM, PM, security, crons

getMyNotifications(unreadOnly?, limit?, type?) — query, authenticated
  Filter to current user's notifications only
  Return { notifications, unreadCount }
  unreadCount from index query (fast)

markNotificationRead(notificationId) — mutation
  Verify notification belongs to current user
  Set isRead: true, readAt

markAllNotificationsRead — mutation
  Mark all unread notifications for current user as read

deleteNotification(notificationId) — mutation
  Hard delete (notifications are not audited)

purgeOldNotifications — internalMutation (monthly cron)
  Delete all notifications older than 90 days

7.2 — Notification bell (frontend/src/components/platform/NotificationBell.tsx):
  Full implementation from spec Section 21.3
  Popover with notification list (last 10)
  Unread count badge on bell icon
  "Mark all read" link
  Per-notification: type icon, title, body, relative time, unread dot
  Click → navigate to actionUrl, mark as read
  "View all" link → /platform/notifications

/platform/notifications — Full notifications page:
  Filter: type, unread only
  Grouped by date: Today | Yesterday | This Week | Older
  Bulk: mark all read

7.3 — Cron notifications:

sendTaskDueNotifications (already in Phase 6)
checkOverdueFollowUps (already in Phase 5)
sendWeeklyPipelineReport (already in Phase 5)
sendWeeklyProjectSummary (already in Phase 6)

VERIFY:
  Assign task → assignee gets notification
  Share lead → shared user gets notification
  Proposal viewed → owner gets notification
  Task overdue cron → assignee gets notification
  NotificationBell shows unread count
  Mark all read → count goes to 0
  Notifications page paginates correctly

=======================================================================
PHASE 8 — SECURITY HARDENING
=======================================================================

Objective: All security requirements implemented.

8.1 — Middleware (frontend/src/middleware.ts):
  Full implementation from spec Section 22.1
  Use WorkOS withAuth wrapper
  Block /platform routes for non-platform-org users
  Allow all public routes through
  Redirect unauthenticated requests to /auth/login

8.2 — Session tracking (convex/modules/platform/auth.ts):
  recordPlatformLogin — called from auth callback
    Track session in platform_sessions
    Update lastLogin, lastActivityAt
    Alert if login from different country than last session
  recordPlatformActivity — called periodically
    Update lastActiveAt on session

8.3 — Security cron:
  runDailySecurityChecks (daily 06:00 UTC):
    Find inactive users (90+ days no activity)
    Notify master_admins
    Find users with access expiring in 7 days
    Notify those users

8.4 — Suspicious login alert:
  alertSuspiciousLogin — internalMutation
    Notify all master_admins
    Slack alert
    Audit log

8.5 — Add to crons.ts (all platform system crons):
  From spec Section 25

VERIFY:
  Visiting /platform without auth → redirected to login
  Visiting /platform with tenant (school) auth → access denied
  Login from new country → master_admin notified
  Suspended user tries login → access denied
  Inactive user (90 days) → master_admin notified

=======================================================================
PHASE 9 — PLATFORM SIDEBAR INTEGRATION
=======================================================================

Objective: Sidebar reflects permissions. No hardcoded nav items.

Update: frontend/src/app/platform/layout.tsx

9.1 — Sidebar nav items with permission gates:
  From spec Section 17 (sidebar reference)
  Items that require permissions: show disabled with 🔒 tooltip
  Items exclusive to master_admin: hide completely if not master_admin
  Use usePlatformPermissions hook throughout

9.2 — Layout structure:
  Top: EduMyles Platform logo
  Nav: All items with permission gates
  Bottom: Current user avatar, name, role badge, notification bell
  Notification bell: useQuery for unread count

9.3 — Active state:
  Highlight current route in sidebar
  Use Next.js usePathname()

9.4 — Mobile responsive:
  Hamburger menu for mobile
  Slide-out drawer for nav on mobile

VERIFY:
  support_agent: sees CRM nav (crm.view_own) but not billing nav
  platform_manager: sees tenants, CRM, PM, marketplace
  analytics_viewer: sees analytics only + PM (view_own)
  master_admin: sees everything
  Changing role: sidebar updates on next page load

=======================================================================
PHASE 10 — FINAL INTEGRATION & VERIFICATION
=======================================================================

10.1 — Run integration flows:

FLOW 1: Platform staff invite lifecycle
  1. master_admin logs in to /platform
  2. Invites a new support_agent via InviteStaffModal
  3. Invite email received
  4. Accept invite → create account → redirect to /platform
  5. New user has correct permissions (crm.view_own but not crm.view_all)
  6. Suspend the new user → sessions revoked
  7. Unsuspend → user can log in again
  8. Change role to billing_admin → permissions update

FLOW 2: CRM lead to tenant
  1. platform_manager creates new lead from waitlist entry
  2. Lead appears in manager's pipeline (not in other user's)
  3. Share lead with another platform_manager (edit access)
  4. Second manager edits lead → activity logged
  5. Manager changes stage to "demo_done" (note required)
  6. Create proposal → send → school views → owner notified
  7. Convert to tenant → tenant invite sent → CRM stage → "won"

FLOW 3: PM project collaboration
  1. super_admin creates project in default workspace
  2. Sets visibility: "private", adds 2 members
  3. Non-member: cannot see project
  4. Member: creates task, assigns to self
  5. Drags task from Todo → In Progress → done
  6. Project progress updates to reflect completion
  7. Another member logs time on task
  8. super_admin (pm.view_all): sees project and all time logs
  9. Non-admin member: can only see own time logs
  10. Create sprint, add tasks, close sprint → incomplete go to backlog

FLOW 4: CRM access control
  1. Create 3 leads: one by platformManager1, one by platformManager2
     one by supportAgent
  2. platformManager1: sees only own lead
  3. Share lead from platformManager1 to supportAgent (view only)
  4. supportAgent: sees own lead + shared lead
  5. supportAgent tries to edit the shared lead → denied (view only)
  6. super_admin: sees ALL leads, owner filter dropdown visible
  7. super_admin filters by owner: platformManager1 → correct subset shown

10.2 — Security verification:

Run all checks from spec Section 28.2:
  - All mutations checked: no unguarded mutations
  - Soft delete: grep for hard deletes (should be zero)
  - DOMPurify: grep for sanitize calls on rich text fields
  - Audit log: verify every sensitive action creates an entry
  - Permission audit log: verify every role/permission change logged

10.3 — Performance check:
  - CRM lead list (100+ leads): loads < 2 seconds
  - PM project board (50+ tasks): loads < 2 seconds
  - Sidebar permission check: < 200ms (cached via useQuery)
  - Notification bell count: < 100ms

10.4 — Build verification:
  npx convex dev → ZERO errors
  npm run type-check → ZERO errors
  npm run build → ZERO errors
  No "any" types in permission-critical code paths

10.5 — Final checklist:

PLATFORM USERS & RBAC:
  ✅ All 8 system roles seeded with correct permissions
  ✅ PERMISSIONS constant has all keys
  ✅ getUserPermissions works for all scenarios
  ✅ master_admin ["*"] bypasses all checks
  ✅ Invite flow: WorkOS org membership created
  ✅ Role change: permission_audit_log written
  ✅ Cannot change own role
  ✅ Cannot suspend/delete master_admin (unless master_admin)
  ✅ Access expiry: auto-suspend cron works
  ✅ Suspicious login: master_admins alerted
  ✅ All pages: permission gates on action buttons

CRM:
  ✅ view_own: user A cannot see user B's leads
  ✅ view_shared: shared lead visible with correct access level
  ✅ view_all: super_admin sees all, owner filter shown
  ✅ Proposal tracking: view count + owner notification
  ✅ Convert to tenant: invite sent from CRM
  ✅ Follow-up overdue: assignee notified
  ✅ Activity logged for every significant action
  ✅ Soft delete: deleted leads not in any list

PM:
  ✅ Private project: non-members cannot see
  ✅ all_staff project: all can see, only members can edit
  ✅ Task drag: progress updates on project
  ✅ Sprint close: incomplete → backlog
  ✅ GitHub webhook: signature verified
  ✅ Time logs: own vs all access correct
  ✅ Mentions in comments: mentioned users notified
  ✅ Soft delete: deleted tasks not in any list

NOTIFICATIONS:
  ✅ Bell shows unread count (real-time via useQuery)
  ✅ All 20+ notification types send correctly
  ✅ Old notifications purged monthly

SECURITY:
  ✅ Middleware blocks non-platform users from /platform
  ✅ No unguarded mutations
  ✅ Audit log: all sensitive actions logged
  ✅ DOMPurify: all rich text sanitized

FINAL:
  ✅ Zero hardcoded data in any frontend file
  ✅ Zero TypeScript errors
  ✅ Zero build errors
  ✅ All pages have loading skeletons
  ✅ All pages have empty states
  ✅ All crons in convex/crons.ts

=======================================================================
END OF IMPLEMENTATION PROMPT
=======================================================================
```
