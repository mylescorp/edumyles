# Implementation Checklist

Use this checklist when turning a new SaaS idea into a working product using this skill.

## Discovery

- Define product name, domain, target buyer, and main user roles.
- Define tenant/account unit.
- Define top three workflows the product must make easier.
- Define pricing currency and tiers.
- Define integrations and launch region.
- Decide whether mobile is required for v1.

## Repository Setup

- Create or adapt npm workspace packages: `landing`, `frontend`, `shared`, `convex`, and optional `mobile`.
- Configure root scripts through Turbo.
- Configure TypeScript paths and package exports.
- Add app-specific Tailwind, ESLint, Next config, and environment handling.
- Keep shared constants free of UI imports.

## Shared Package

- Add domain roles and permissions.
- Add module catalog.
- Add public module catalog.
- Add pricing plans.
- Add validators for public forms and onboarding.
- Add formatting helpers for currency, dates, and plan labels.
- Add tests for public catalogs and validators.

## Landing App

- Build homepage sections in the blueprint order.
- Add navbar, footer, theme support if desired, progress bar, cookie banner if required, and contact launcher.
- Add waitlist, contact, demo booking, security, privacy, and pricing pages.
- Add public API routes for forms.
- Add attribution/referral capture.
- Add SEO metadata, sitemap, robots, structured data, and OG assets.
- Search for old brand names, currencies, regions, and domain-specific claims.

## Product App

- Add auth provider and protected layouts.
- Add dashboard.
- Add tenant onboarding.
- Add module admin pages.
- Add role portals where needed.
- Add billing/subscription pages.
- Add support tickets.
- Add audit and admin tools.
- Add webhook route handlers.
- Add error, loading, empty, access denied, and not-found states.

## Convex Backend

- Define schema tables.
- Add tenant, organization, users, sessions, modules, billing, notifications, audit, support, and domain tables.
- Add guards for tenant, platform, module, and role access.
- Add module runtime/catalog.
- Add queries/mutations/actions per module.
- Add event bus and event handlers.
- Add emails and notification actions.
- Add cron jobs for reminders, trials, stalled onboarding, or scheduled reports.

## Mobile App

- Include only when it serves a real workflow.
- Add secure session storage.
- Add notification registration.
- Add role-specific screens.
- Add offline-aware states when field capture matters.
- Reuse shared types and validators.

## Verification

- Run type-checks.
- Run lint.
- Run unit tests.
- Build landing and frontend.
- Start dev servers and visually check desktop and mobile.
- Run Playwright smoke tests for public pages and critical product routes.
- Verify webhooks with local or test provider payloads when feasible.
- Verify forms reject invalid input and capture attribution.
- Verify tenant isolation with at least one negative test.

## Launch Readiness

- Replace all placeholder testimonials, sample logos, fake metrics, and demo screenshots.
- Confirm pricing and plan limits.
- Confirm legal pages.
- Confirm environment variables in deployment.
- Confirm analytics and observability.
- Confirm security headers.
- Confirm robots/sitemap/canonical URLs.
- Confirm error reporting and support path.

