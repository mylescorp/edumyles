# Architecture Reference

Use this reference when creating the repo structure, deciding where code belongs, or adapting EduMyles architecture to a new SaaS.

## Monorepo Shape

Use npm workspaces and Turborepo:

```text
product-root/
├── package.json
├── turbo.json
├── vercel.json
├── landing/
├── frontend/
├── convex/
├── shared/
├── mobile/
├── e2e/
└── scripts/
```

`landing` owns public marketing, conversion, SEO, public forms, waitlist, demo booking, referral tracking, and lightweight public APIs.

`frontend` owns authenticated product UI, admin workflows, tenant onboarding, user portals, module pages, billing pages, marketplace/module management, support, and webhook route handlers.

`convex` owns persistent data, multi-tenant authorization, queries, mutations, actions, crons, event bus, emails, module lifecycle hooks, and background work.

`shared` owns TypeScript contracts used by more than one package: roles, modules, pricing, validators, domain types, tier definitions, public catalog data, and formatting utilities.

`mobile` is optional but should remain available when the SaaS has field, parent/customer, staff, offline, notification, or mobile-first flows.

## Package Scripts

Root scripts should orchestrate packages through Turbo:

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "dev:landing": "turbo run dev --filter=landing",
    "dev:frontend": "turbo run dev --filter=frontend",
    "dev:backend": "cd convex && convex dev",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "test:e2e": "playwright test"
  }
}
```

Keep ports predictable:

- Landing: `3001`
- Product app: `3005`
- Convex: local Convex dev process

## Core Dependencies

Use this dependency family unless the target project already standardizes differently:

- Next.js App Router, React 19, TypeScript.
- Tailwind CSS for landing and app styling.
- lucide-react for icons.
- Convex for backend data and functions.
- WorkOS/AuthKit for authentication and organizations.
- Stripe for subscription billing.
- Resend for email.
- Zod for validation.
- Sentry and Vercel Speed Insights for observability.
- Vitest for unit tests and Playwright for E2E/smoke tests.
- Expo, React Native, Expo Secure Store, and Expo Notifications for mobile.

## Environment Variables

Define variables by feature. Do not hardcode production secrets or tenant-specific identifiers.

Authentication:

- `WORKOS_CLIENT_ID`
- `WORKOS_API_KEY`
- `WORKOS_REDIRECT_URI`
- `WORKOS_COOKIE_PASSWORD`
- `NEXT_PUBLIC_WORKOS_CLIENT_ID`

URLs:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ROOT_DOMAIN`
- `NEXT_PUBLIC_CONVEX_URL`

Billing and payments:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- regional payment provider keys and webhook secrets

Email and notifications:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `RESEND_WEBHOOK_SECRET`
- support and notification recipient emails

Observability:

- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- analytics IDs

Platform administration:

- master admin identity
- platform admin secret
- webhook shared secrets

## Routing Strategy

Use separate apps for public and authenticated surfaces:

- `landing/src/app/page.tsx` for the main marketing page.
- `landing/src/app/contact`, `book-demo`, `waitlist`, `privacy`, `security`, `roadmap`, `case-studies`, and partner routes when relevant.
- `landing/src/app/api/*` for public forms, waitlist, chat, attribution, and referral capture.
- `frontend/src/app/dashboard` for the primary user dashboard.
- `frontend/src/app/admin/*` for tenant admin modules.
- `frontend/src/app/portal/*` for role-specific portals.
- `frontend/src/app/api/webhooks/*` for external systems.
- `frontend/src/app/api/tenants/*` for onboarding/provisioning.

## Backend Structure

Use a module-first Convex backend:

```text
convex/
├── schema.ts
├── auth.ts
├── http.ts
├── crons.ts
├── tenants.ts
├── users.ts
├── eventBus.ts
├── helpers/
│   ├── tenantGuard.ts
│   ├── authorize.ts
│   ├── moduleGuard.ts
│   └── auditLog.ts
├── modules/
│   ├── moduleCatalog.ts
│   ├── moduleRuntime.ts
│   └── <module>/
│       ├── index.ts
│       ├── queries.ts
│       ├── mutations.ts
│       ├── actions.ts
│       ├── features.ts
│       ├── configSchema.ts
│       ├── notifications.ts
│       ├── eventHandlers.ts
│       ├── onInstall.ts
│       └── onUninstall.ts
└── emails/
```

Every query and mutation that reads tenant data should validate tenant context, role access, and module availability.

## Deployment

Deploy landing and product as separate Vercel projects or clearly filtered builds from the monorepo. Use `vercel.json` headers for security:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` locked down by default
- `Strict-Transport-Security` on production domains

Use filtered Turbo build commands for each Vercel project, such as `turbo run build --filter=landing`.

