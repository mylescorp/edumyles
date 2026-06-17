---
name: saas-product-builder
description: "Build or adapt a production SaaS product using the EduMyles-style architecture: npm/Turborepo monorepo, Next.js landing app, Next.js authenticated product app, Convex backend, shared TypeScript package, optional Expo mobile app, WorkOS auth, Stripe/Resend/payment integrations, and a feature-rich SaaS landing page. Use when creating a similar SaaS for a new industry, cloning the landing-page structure and feature set, planning a reusable SaaS starter, or translating EduMyles patterns into another branded product."
---

# SaaS Product Builder

## Overview

Use this skill to create a new SaaS product with the same technical stack, product architecture, landing-page feature set, and production workflow as EduMyles while adapting the brand, domain model, modules, pricing, and copy to a new market.

Prefer creating a full usable product experience, not a marketing-only shell. Preserve the architecture and conversion patterns; replace EduMyles-specific school language with the target SaaS domain.

## Fast Start

1. Identify the new SaaS domain, primary buyer, end users, monetization model, and core modules.
2. Read only the references needed for the task:
   - For repo setup and stack decisions, read [architecture.md](references/architecture.md).
   - For landing-page parity, read [landing-page-blueprint.md](references/landing-page-blueprint.md).
   - For product modules, tenants, roles, billing, and integrations, read [product-model.md](references/product-model.md).
   - For end-to-end implementation and verification, read [implementation-checklist.md](references/implementation-checklist.md).
3. Use [saas-product-brief.template.md](assets/saas-product-brief.template.md) as a reusable intake/output brief when the request is broad or a new product needs to be specified.
4. Inspect the current repository before changing code. Prefer existing patterns over new abstractions.

## Expected Stack

Use this baseline unless the user explicitly asks for a different stack:

- npm workspaces with Turborepo orchestration.
- `landing`: public Next.js App Router app for marketing pages, lead capture, waitlist, SEO, analytics, referrals, and demo booking.
- `frontend`: authenticated Next.js App Router product app for dashboards, admin portals, tenant workflows, billing, support, and module UIs.
- `convex`: Convex backend for schema, queries, mutations, actions, crons, events, emails, module runtime, and tenant guards.
- `shared`: TypeScript package for domain types, constants, validators, public catalogs, pricing plans, roles, modules, and cross-app utilities.
- `mobile`: optional Expo app for field users, notifications, parent/customer portals, or mobile-first workflows.
- WorkOS/AuthKit for authentication and organization-aware access.
- Stripe for subscriptions, invoices, checkout, and webhooks when applicable.
- Resend for transactional email.
- Regional payment integrations when the market requires them.
- Sentry, Vercel Speed Insights, analytics, and Playwright/Vitest verification.

## Workflow

### 1. Adapt The Product

Translate EduMyles into the new category by mapping:

- School/customer institution -> target tenant or account type.
- Student/parent/teacher/admin -> target roles and portal users.
- Modules -> paid product capabilities.
- Attendance/fees/academics/admissions -> domain-specific workflows.
- M-Pesa/Airtel/Stripe -> relevant payment rails.
- Waitlist/demo/contact/reseller/affiliate -> acquisition channels for the new market.

Keep the product multi-tenant by default. If the requested SaaS is single-tenant, still keep tenant boundaries in data and routing unless the user explicitly rejects that.

### 2. Build The Public Landing App

Recreate the EduMyles landing feature set in the new brand:

- Dark first-viewport hero with product promise, two CTAs, trust signal, and live-looking dashboard cards.
- Trust stats section with believable, clearly labeled sample metrics.
- Problem section with three concrete pain points.
- Platform modules grid sourced from shared constants.
- Integrations section using tools the buyer already knows.
- Benefits by role/persona.
- Comparison section against manual process, generic tools, and the new product.
- How-it-works section with three setup steps.
- Brand values or founder story only when it helps credibility.
- ROI calculator tailored to the domain.
- Testimonial or placeholder-safe customer quote.
- Mobile teaser when the product has a mobile workflow.
- Pricing plans backed by shared constants.
- Final CTA, contact form, waitlist, demo booking, referral tracking, and footer.

Do not leave EduMyles names, African-school claims, currency, screenshots, metadata, schema, or legal copy in the new product unless the new SaaS is explicitly EduMyles-related.

### 3. Build The Authenticated Product

Create the real app surface behind the landing page:

- Tenant onboarding and organization provisioning.
- Dashboard entry point for the primary role.
- Admin module pages for each core module.
- Role-specific portals where appropriate.
- Invite flows and account acceptance.
- Billing and subscription state.
- Support tickets or helpdesk.
- Audit trail for sensitive actions.
- Webhook endpoints for auth, billing, email, and payments.
- Shared layout, navigation, empty states, loading states, errors, and access-denied pages.

### 4. Model Backend And Shared Contracts

Keep domain definitions in `shared` first when multiple apps need the same truth. Mirror EduMyles-style catalogs:

- `MODULES`, `TIER_MODULES`, and public module descriptions.
- Public pricing plans with plan keys, limits, descriptions, feature lists, CTA targets, and featured plan.
- Role and permission constants.
- Zod validators for public forms and API inputs.
- Domain types exported from package entry points.

In Convex, use module-oriented files with guards and event subscriptions. Put tenant isolation and authorization checks near every query/mutation boundary.

### 5. Verify

Run focused checks after implementation:

- `npm run type-check`
- `npm run lint`
- `npm run test` or targeted package tests
- Landing build: `npm run build --workspace=landing`
- Product build: `npm run build --workspace=frontend`
- Playwright smoke tests for public pages, auth redirects, onboarding, and core dashboard routes when available.

For frontend work, start the relevant dev server and visually verify desktop and mobile layouts with browser tooling. Check that text does not overlap, CTAs work, sample metrics are labeled as sample where needed, and no old brand copy remains.

## Quality Bar

- Keep the landing page conversion-complete and product-specific.
- Use concrete workflows and buyer pain instead of generic SaaS filler.
- Store repeated public product data in shared constants, not duplicated component arrays.
- Keep cards at modest radii and avoid card-inside-card layouts.
- Use lucide icons for interface symbols.
- Make dashboards dense, calm, and operational rather than decorative.
- Keep SEO metadata, JSON-LD, Open Graph images, sitemap, robots, and canonical URLs aligned with the new brand.
- Protect tenant data by default.
- Leave unrelated files and user changes untouched.
