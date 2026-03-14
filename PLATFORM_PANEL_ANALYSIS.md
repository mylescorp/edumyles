# Platform (Master Admin) Panel - End-to-End Analysis

## Executive Summary

The EduMyles platform panel is a **Next.js 15 + Convex** multi-tenant admin dashboard accessible to `master_admin` and `super_admin` roles. While the UI scaffolding is extensive (~25 pages), several critical backend implementations are missing — particularly around **password management**, **session security**, and **settings persistence**.

---

## 1. What Has Been Done (Implemented & Working)

### Dashboard (`/platform`)
- KPI grid: Active Tenants, MRR, ARR, Open Tickets, Pipeline Value, System Health, Active Trials, New Tenants
- Analytics charts: MRR Trend, Tenant Growth, Ticket Volume, Revenue by Plan
- Recent Activity Feed with categorized events
- Time range selector (7d, 30d, 90d)
- Quick Actions grid

### Profile (`/platform/profile`)
- Profile overview card with avatar, name, email, role badge
- Profile completeness indicator (5 fields)
- Edit mode for: firstName, lastName, phone, bio, location
- Avatar upload fully working (2-step Convex storage flow)
- Three tabs rendered: Personal, Security, Activity

### Tenant Management (`/platform/tenants`)
- List all tenants with status/plan filters
- Tenant detail page with tabs (Overview, Users, Modules, Billing)
- Tenant creation/provisioning wizard
- Suspend/activate tenant actions

### User Management (`/platform/users`)
- List all platform users with search/filter
- User detail page with permissions and activity
- Invite new platform admin (UI form, email not wired to WorkOS)
- Deactivate/role-change actions
- Bulk operations UI

### Audit Logs (`/platform/audit`)
- Cross-tenant audit log viewing with filters
- Filter by action, tenant, user, date range
- Backend queries: `listAuditLogs`, `getAuditActionTypes`

### Other Implemented Pages
- **CRM** (`/platform/crm`) - Pipeline, leads, proposals
- **Tickets** (`/platform/tickets`) - Support ticket CRUD
- **Billing** (`/platform/billing`) - Subscription list, invoice creation
- **Feature Flags** (`/platform/feature-flags`) - Toggle management
- **Impersonation** (`/platform/impersonation`) - Start/end sessions with audit trail
- **Communications** (`/platform/communications/broadcast`) - Broadcast messages
- **Staff Performance** (`/platform/staff-performance`) - Analytics per staff
- **Marketplace** (`/platform/marketplace`) - Module marketplace
- **Analytics** (`/platform/analytics`) - Advanced analytics

### Authentication & Authorization
- Cookie-based sessions (httpOnly `edumyles_session`)
- Middleware RBAC enforcement on all protected routes
- `RoleGuard` component on platform layout
- `platformGuard.ts` server-side validation for Convex mutations
- `usePermissions` hook with granular permission checks

---

## 2. What Has NOT Been Done (Missing / Placeholder Only)

### CRITICAL: Password Management - Zero Implementation
| Item | Status |
|------|--------|
| Change Password form/modal | Not implemented (button has no onClick handler) |
| Password reset flow | Not implemented |
| Password hashing/storage | Not implemented |
| Password validation rules | Not implemented |
| Password policy enforcement | Not implemented |
| Forgot password endpoint | Not implemented |

**Location of placeholder:** `frontend/src/app/platform/profile/page.tsx:404-407`
```tsx
<Button variant="outline" className="w-full justify-start">
  <Lock className="h-4 w-4 mr-2" />
  Change Password  {/* <-- No onClick handler */}
</Button>
```

### CRITICAL: Logout Does Not Invalidate Server Session
| Item | Status |
|------|--------|
| Cookie clearing | Working |
| Client-side state clearing | Working |
| Convex `deleteSession()` call | **NOT called on logout** |
| Orphaned sessions in DB | Accumulate indefinitely |

**The `deleteSession` mutation exists** (`convex/sessions.ts:51-63`) but is **never invoked** during logout. The logout route (`frontend/src/app/auth/logout/route.ts`) only clears cookies.

**Security Risk:** A stolen session token remains valid even after the user "logs out" until the 30-day expiry.

### CRITICAL: Two-Factor Authentication - Zero Implementation
| Item | Status |
|------|--------|
| 2FA setup UI | Placeholder button only |
| TOTP/Authenticator app support | Not implemented |
| SMS-based 2FA | Not implemented |
| 2FA enforcement toggle | UI exists in settings, not enforced |
| Schema fields for 2FA | Not in user schema |

### Session Management - Incomplete
| Item | Status |
|------|--------|
| View active sessions | Placeholder button, no implementation |
| Terminate other sessions | Not implemented |
| Session timeout enforcement | Not implemented (always 30 days) |
| Device/IP tracking | Not in schema |
| Concurrent session limits | Not implemented |

### Platform Settings - Not Persisted
| Item | Status |
|------|--------|
| General settings (name, timezone) | UI only, local state |
| Security settings (password length, timeout) | UI only, local state |
| Integration settings (payments, SMS) | UI only, local state |
| Operations settings (maintenance mode) | UI only, local state |
| Settings Convex mutations | Not created |
| Settings Convex table/schema | Not defined |

**Explicit note in code:** `frontend/src/app/platform/settings/page.tsx:446`:
> "Settings edits are currently local draft only. Persisted platform settings endpoints are not implemented yet."

### Profile Activity Tab - Mock Data
- Shows hardcoded "Currently logged in" entry
- No real activity history from audit logs
- Link to audit page exists but profile-specific filtering not wired

### Email/Notification System
- Invite admin form exists but WorkOS email integration not configured
- Broadcast messages UI exists but delivery mechanism unclear
- No email templates for password reset, 2FA codes, etc.

---

## 3. Proposals - What Should Be Added

### P0 - Critical Security Fixes

#### 3.1 Fix Logout to Invalidate Server Sessions
```
- Call `deleteSession()` in the logout API route
- Extract session token from cookie before clearing
- Add audit log entry for logout events
- Clear ALL sessions for user on "Sign out everywhere"
```

#### 3.2 Implement Password Change
```
- Add password change modal in Profile > Security tab
- Backend mutation: validate current password, hash new password
- Enforce minimum length, complexity from platform settings
- Audit log entry on password change
- Force re-login after password change (invalidate all sessions)
```

#### 3.3 Implement Password Reset Flow
```
- "Forgot password" link on login page
- Email-based reset token generation (time-limited, single-use)
- Reset password page with token validation
- Audit log entry on password reset
```

### P1 - High Priority Features

#### 3.4 Two-Factor Authentication
```
- TOTP setup with QR code generation (e.g., speakeasy library)
- Recovery codes generation and secure storage
- 2FA verification step in login flow
- 2FA management page (enable/disable/regenerate codes)
- Schema: add twoFactorEnabled, twoFactorSecret, recoveryCodes to users
```

#### 3.5 Active Session Management
```
- List all active sessions for current user (device, IP, last active)
- Terminate individual sessions
- "Sign out all other devices" action
- Schema: add deviceInfo, ipAddress, userAgent to sessions table
```

#### 3.6 Persist Platform Settings
```
- Create `platformSettings` table in Convex schema
- Create CRUD mutations for settings
- Enforce settings at relevant checkpoints (login, session creation)
- Add settings change audit logging
```

#### 3.7 Profile Activity Integration
```
- Wire Activity tab to real audit log data filtered by current user
- Show login history, profile changes, security events
- Paginated timeline view
```

### P2 - Important Enhancements

#### 3.8 Document/File Upload System
```
- Generic file upload service beyond just avatars
- Support for tenant logos, documents, reports
- File type validation and size limits
- Storage quota management per tenant
```

#### 3.9 Notification Center
```
- In-app notification system for platform admins
- Real-time notifications via Convex subscriptions
- Notification preferences (email, in-app, SMS)
- Notification history/archive
```

#### 3.10 Sidebar Logout Button
```
- Add logout option to sidebar user section (currently only in header dropdown)
- Consistent logout access from multiple UI locations
```

#### 3.11 Account Lockout & Brute Force Protection
```
- Track failed login attempts per user
- Lock account after N failed attempts (configurable in settings)
- Admin unlock capability
- IP-based rate limiting
```

#### 3.12 Maintenance Mode Enforcement
```
- Wire maintenance mode toggle to actual middleware check
- Show maintenance page to non-admin users
- Allow platform admins to bypass maintenance mode
```

### P3 - Nice to Have

#### 3.13 Admin Activity Dashboard
```
- Who's online now (platform admins)
- Recent admin actions feed
- Login frequency analytics
```

#### 3.14 Data Export & Reporting
```
- Export user lists, tenant data, audit logs to CSV/PDF
- Scheduled reports via email
- Custom report builder
```

#### 3.15 Role & Permission Editor
```
- UI to customize role permissions beyond hardcoded defaults
- Create custom roles with specific permission sets
- Permission audit view
```

#### 3.16 API Key Management
```
- Generate/revoke API keys for integrations
- Key usage tracking and rate limiting
- Scoped permissions per API key
```

---

## 4. Summary Scorecard

| Area | UI Done | Backend Done | Secure | Priority |
|------|---------|-------------|--------|----------|
| Dashboard & KPIs | Yes | Yes | Yes | - |
| Profile Edit | Yes | Yes | Yes | - |
| Avatar Upload | Yes | Yes | Yes | - |
| Tenant Management | Yes | Partial | Yes | - |
| User Management | Yes | Yes | Yes | - |
| Audit Logs | Yes | Yes | Yes | - |
| **Password Change** | **Placeholder** | **No** | **No** | **P0** |
| **Password Reset** | **No** | **No** | **No** | **P0** |
| **Logout Session Invalidation** | **Yes** | **No** | **No** | **P0** |
| **2FA** | **Placeholder** | **No** | **No** | **P1** |
| **Session Management** | **Placeholder** | **No** | **No** | **P1** |
| **Settings Persistence** | **UI Only** | **No** | **N/A** | **P1** |
| Profile Activity | Placeholder | No | N/A | P1 |
| File/Doc Upload | No | No | N/A | P2 |
| Notification Center | No | No | N/A | P2 |
| Maintenance Mode | UI Only | No | N/A | P2 |
| Account Lockout | No | No | N/A | P2 |

---

## 5. Files Reference

### Frontend Key Files
- `frontend/src/app/platform/layout.tsx` - Platform layout with RoleGuard
- `frontend/src/app/platform/page.tsx` - Dashboard
- `frontend/src/app/platform/profile/page.tsx` - Profile (Security tab placeholders)
- `frontend/src/app/platform/settings/page.tsx` - Settings (not persisted)
- `frontend/src/app/auth/logout/route.ts` - Logout (missing session invalidation)
- `frontend/src/hooks/useAuth.ts` - Auth hook with logout
- `frontend/src/middleware.ts` - RBAC middleware
- `frontend/src/components/layout/Header.tsx` - Header with logout button
- `frontend/src/components/layout/Sidebar.tsx` - Sidebar (no logout button)

### Backend Key Files
- `convex/sessions.ts` - Session CRUD (deleteSession exists but unused)
- `convex/platform/users/mutations.ts` - User mutations
- `convex/platform/dashboard/queries.ts` - Dashboard data
- `convex/helpers/platformGuard.ts` - Auth guard
- `convex/schema.ts` - Database schema
