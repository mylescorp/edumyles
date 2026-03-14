# Platform Panel Implementation Plan

## Phase 1: P0 - Critical Security Fixes

### Task 1.1: Fix Logout to Invalidate Server Sessions
**Files to modify:**
- `frontend/src/app/auth/logout/route.ts` - Extract session token from cookie, call Convex `deleteSession()` before clearing cookies
- `frontend/src/hooks/useAuth.ts` - Pass session token to logout endpoint

**Changes:**
1. In logout route: read `edumyles_session` cookie value, create Convex client, call `api.sessions.deleteSession({ sessionToken })`, then clear cookies
2. Add audit log entry for logout event

### Task 1.2: Implement Password Change
**Files to modify/create:**
- `convex/schema.ts` - Add `passwordHash` field to users table
- `convex/platform/users/mutations.ts` - Add `changePassword` mutation (hash with bcrypt via Convex action)
- `convex/actions/auth/password.ts` (NEW) - Convex action for password hashing/verification (bcrypt needs Node runtime)
- `frontend/src/app/platform/profile/page.tsx` - Add password change modal with current/new/confirm fields, wire onClick handlers

**Changes:**
1. Create password action with `hashPassword` and `verifyPassword` using bcrypt
2. Add `changePassword` mutation: validate current password, hash new, update user, invalidate other sessions, audit log
3. Add `ChangePasswordModal` component inline in profile page with form validation
4. Wire the "Change Password" button onClick to open the modal

### Task 1.3: Implement Password Reset Flow
**Files to create/modify:**
- `convex/schema.ts` - Add `passwordResetTokens` table (token, userId, expiresAt, used)
- `convex/actions/auth/password.ts` - Add `requestPasswordReset` and `resetPassword` actions
- `frontend/src/app/auth/forgot-password/page.tsx` (NEW) - Forgot password form
- `frontend/src/app/auth/reset-password/page.tsx` (NEW) - Reset password form with token
- `frontend/src/app/auth/login/page.tsx` - Add "Forgot password?" link
- `frontend/src/middleware.ts` - Add forgot-password and reset-password to PUBLIC_ROUTES

**Changes:**
1. Create passwordResetTokens schema table
2. Create mutations for generating time-limited tokens and consuming them
3. Create forgot-password page (email input → sends reset link)
4. Create reset-password page (new password form, validates token)
5. Add public route access for these pages

## Phase 2: P1 - High Priority Features

### Task 2.1: Active Session Management
**Files to modify/create:**
- `convex/schema.ts` - Already has `deviceInfo` field on sessions, add `ipAddress`, `userAgent`, `lastActiveAt`
- `convex/sessions.ts` - Add `listUserSessions` query, `deleteAllUserSessions` mutation, `deleteSessionById` mutation
- `frontend/src/app/platform/profile/page.tsx` - Add `ActiveSessionsModal` triggered by "View Active Sessions" button

**Changes:**
1. Add session listing query filtered by userId
2. Add terminate-session and terminate-all mutations
3. Build modal showing active sessions with device info and terminate buttons
4. Wire the "View Active Sessions" button

### Task 2.2: Persist Platform Settings
**Files to modify/create:**
- `convex/schema.ts` - Add `platformSettings` table (key-value or structured)
- `convex/platform/settings/mutations.ts` (NEW) - CRUD mutations for settings
- `convex/platform/settings/queries.ts` (NEW) - Query for current settings
- `frontend/src/app/platform/settings/page.tsx` - Replace local draft state with Convex queries/mutations

**Changes:**
1. Define platformSettings schema with sections (general, security, integrations, operations)
2. Create `getSettings` query and `updateSettings` mutation
3. Replace saveDraft/resetDraft with real Convex mutations
4. Add audit logging for settings changes

### Task 2.3: Two-Factor Authentication (2FA)
**Files to modify/create:**
- `convex/schema.ts` - Add `twoFactorEnabled`, `twoFactorSecret`, `recoveryCodes` to users table
- `convex/actions/auth/twoFactor.ts` (NEW) - TOTP generation/verification using otpauth library
- `convex/platform/users/mutations.ts` - Add 2FA enable/disable/verify mutations
- `frontend/src/app/platform/profile/page.tsx` - Add `TwoFactorSetupModal` with QR code
- `frontend/src/app/auth/login/page.tsx` - Add 2FA verification step in login flow

**Changes:**
1. Create TOTP secret generation and QR code URL generation
2. Create verify-and-enable mutation (user confirms code works before enabling)
3. Generate recovery codes on enable
4. Add 2FA challenge to login flow
5. Wire profile "Manage Two-Factor Authentication" button

### Task 2.4: Profile Activity Tab - Real Data
**Files to modify:**
- `convex/platform/audit/queries.ts` - Add `getUserActivityLog` query
- `frontend/src/app/platform/profile/page.tsx` - Replace mock activity with real audit data

**Changes:**
1. Add query to filter audit logs by current user's userId
2. Display real login history, profile changes, security events in Activity tab

## Phase 3: P2 - Important Enhancements

### Task 3.1: Sidebar Logout Button
**Files to modify:**
- `frontend/src/components/layout/Sidebar.tsx` - Add logout button/icon in user section

### Task 3.2: Account Lockout & Brute Force Protection
**Files to modify/create:**
- `convex/schema.ts` - Add `loginAttempts` table (userId, attempts, lockedUntil)
- `convex/actions/auth/password.ts` - Check/increment attempts on login, enforce lockout
- `frontend/src/app/auth/login/page.tsx` - Show lockout message

### Task 3.3: File/Document Upload System
**Files to create:**
- `convex/platform/files/mutations.ts` (NEW) - Generic upload URL generation, file metadata storage
- `convex/platform/files/queries.ts` (NEW) - List files, get file URL
- `convex/schema.ts` - Add `platformFiles` table
- `frontend/src/components/platform/FileUploader.tsx` (NEW) - Reusable upload component

### Task 3.4: Notification Center
**Files to create:**
- `convex/schema.ts` - Add `notifications` table
- `convex/platform/notifications/mutations.ts` (NEW) - Create/mark-read/dismiss
- `convex/platform/notifications/queries.ts` (NEW) - List unread, list all
- `frontend/src/components/platform/NotificationCenter.tsx` (NEW) - Dropdown/panel UI

### Task 3.5: Maintenance Mode Enforcement
**Files to modify:**
- `frontend/src/middleware.ts` - Check platformSettings for maintenance mode, show maintenance page for non-admins
- `frontend/src/app/maintenance/page.tsx` (NEW) - Maintenance page

## Implementation Order
1. Task 1.1 (logout fix) → 2. Task 1.2 (password change) → 3. Task 1.3 (password reset) → 4. Task 2.1 (sessions) → 5. Task 2.2 (settings persistence) → 6. Task 2.3 (2FA) → 7. Task 2.4 (activity tab) → 8. Task 3.1 (sidebar logout) → 9. Task 3.2 (lockout) → 10. Task 3.3 (file upload) → 11. Task 3.4 (notifications) → 12. Task 3.5 (maintenance mode)
