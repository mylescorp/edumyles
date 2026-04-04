# EduMyles Deployment Verification Checklist

This checklist reflects the current deployment architecture:

- Root `vercel.json` targets the `landing/` marketing app for the `edumyles` Vercel project.
- `frontend/vercel.json` targets the authenticated multi-tenant app for the separate `edumyles-frontend` Vercel project.
- `/api/tenant-handler` is only for validated tenant bootstrap redirects, not a universal rewrite target.

## Required Vercel Project Setup

### Frontend project
- Vercel project: `edumyles-frontend`
- Root directory: `frontend`
- Config file: `frontend/vercel.json`
- Primary app URL: `NEXT_PUBLIC_APP_URL`
- Handles:
  - `/platform`
  - `/admin`
  - `/portal/*`
  - tenant-aware authenticated flows

### Landing project
- Vercel project: `edumyles`
- Root directory: repository root
- Config file: `vercel.json`
- Primary marketing URL: `NEXT_PUBLIC_LANDING_URL`
- Handles:
  - public marketing pages
  - top-level auth entrypoints when configured for cross-domain redirect

## Verification Checklist

### 1. Root domain landing
- Open the landing domain.
- Confirm the marketing site renders from the `landing` deployment.
- Confirm unauthenticated `/` traffic does not enter the frontend dashboard shell.

### 2. App domain
- Open the frontend app domain.
- Confirm `/auth/login`, `/platform`, `/admin`, and `/portal/student` resolve from the `frontend` deployment.
- Confirm the root app domain does not depend on `/api/tenant-handler` rewrites for normal app navigation.

### 3. Tenant subdomain resolution
- Open a known active tenant subdomain.
- Confirm the request resolves to the frontend app with the correct tenant context.
- Confirm the response carries the expected tenant slug behavior for authenticated pages.

### 4. Inactive tenant redirect
- Open a suspended or inactive tenant subdomain.
- Confirm the user is redirected away from the app experience.
- Confirm the redirect includes a tenant-aware error state such as `tenant_inactive`.

### 5. Missing tenant redirect
- Open a non-existent tenant subdomain.
- Confirm the user is redirected to the landing/app recovery flow rather than a broken app shell.
- Confirm the redirect includes a tenant-aware error state such as `tenant_not_found`.

## Expected Routing Rules

- Do not rewrite all traffic to `/api/tenant-handler`.
- Keep `tenant-handler` available only for validated tenant bootstrap redirects.
- Keep root `vercel.json` targeted at the `landing` deployment for `edumyles.vercel.app`.
- Keep `frontend/vercel.json` targeted at the authenticated frontend deployment.
