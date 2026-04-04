# EduMyles

Multi-tenant school management platform built for East Africa.

EduMyles gives schools a single system to manage students, staff, finances, communications, and day-to-day operations. Each school gets its own isolated tenant at `{school}.edumyles.com` with role-based access for administrators, teachers, students, and parents.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [opensrc/ — Pinned Dependency Sources](#opensrc--pinned-dependency-sources)
- [School Modules](#school-modules)
- [Platform Admin Modules](#platform-admin-modules)
- [User Roles & Portals](#user-roles--portals)
- [Architecture](#architecture)
- [Payment Integrations](#payment-integrations)
- [Communications](#communications)
- [Mobile App](#mobile-app)
- [Database & Stats](#database--stats)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment](#deployment)
- [License](#license)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router), Tailwind CSS, shadcn/ui | Next.js 16.2.2 |
| Runtime | React | 19.0.0 |
| Backend | Convex (real-time serverless database + functions) | 1.34.1 |
| Auth | WorkOS (magic links, SSO, organizations) | authkit-nextjs 2.15.0 |
| Mobile | React Native (Expo) | Expo 55.0.4 / RN 0.76.5 |
| Payments | M-Pesa (Daraja STK Push), Airtel Money, Stripe, Bank Transfer | Stripe 18.5.0 |
| SMS | Africa's Talking | — |
| Email | Resend | 6.9.3 |
| Schema validation | Zod | 3.25.76 |
| AI features | Vercel AI SDK | 6.0.146 |
| Background jobs | Inngest | 4.1.2 |
| File uploads | UploadThing | 7.7.4 |
| Hosting | Vercel (frontend + landing) | — |
| Monorepo | Turborepo + npm workspaces | — |
| Error monitoring | Sentry (optional) | — |
| Analytics | PostHog (optional) | — |
| Media storage | Cloudinary (optional) | — |

---

## Repository Structure

```
edumyles/
├── frontend/                 # Next.js web app — school + platform portal
│   ├── src/app/
│   │   ├── admin/            # School admin dashboard (students, staff, finance …)
│   │   ├── portal/           # Role portals (student, parent, teacher, alumni …)
│   │   ├── platform/         # Master/super admin — tenant management, billing, audit
│   │   ├── auth/             # Login, callback, logout
│   │   └── api/              # Edge API routes (auth session, webhooks, uploads)
│   ├── src/components/       # UI components (shadcn/ui, forms, charts, layout)
│   ├── src/hooks/            # React hooks (auth, permissions, tenant, real-time)
│   ├── src/lib/              # Utilities, auth helpers, formatters
│   └── src/test/             # Frontend test suite (Jest, Playwright)
│
├── convex/                   # Backend — real-time serverless functions
│   ├── schema.ts             # Database schema (163 tables, full type definitions)
│   ├── modules/              # Domain logic — one folder per school module
│   │   ├── sis/              # Student Information System
│   │   ├── admissions/       # Admissions & enrollment
│   │   ├── finance/          # Fees, invoices, payments, ledger
│   │   ├── academics/        # Gradebook, exams, curricula, assignments
│   │   ├── hr/               # Staff records, leave, payroll
│   │   ├── timetable/        # Scheduling, rooms, conflict detection
│   │   ├── library/          # Book catalog, circulation, overdue
│   │   ├── transport/        # Routes, fleet, GPS tracking
│   │   ├── communications/   # SMS, email, push, in-app notifications
│   │   ├── ewallet/          # Student/staff digital wallet
│   │   ├── ecommerce/        # School supplies marketplace
│   │   ├── marketplace/      # Module marketplace & tier gating
│   │   └── portal/           # Student, parent, teacher, alumni, partner portals
│   ├── platform/             # Master admin — 30+ sub-modules (see below)
│   ├── actions/              # External API integrations (payments, SMS, email)
│   ├── helpers/              # Shared guards (tenant, module, auth, audit)
│   ├── notifications.ts      # Cross-role notification system
│   └── http.ts               # HTTP endpoints (webhooks, M-Pesa callbacks)
│
├── landing/                  # Marketing site — edumyles.com
│   └── src/app/              # Routes: /, /pricing, /features, /about, /contact
│
├── mobile/                   # React Native (Expo) — iOS & Android
│   └── src/
│       ├── screens/          # ProfileScreen, HomeScreen, etc.
│       ├── components/       # Shared mobile components
│       ├── hooks/            # useAuth, useOfflineSync, useCachedQueryValue
│       ├── lib/              # convexApi, storage, theme
│       └── theme.ts          # Design tokens
│
├── shared/                   # Shared TypeScript — used by all packages
│   └── src/
│       ├── types/index.ts    # 41 shared interfaces & types
│       ├── validators/       # 32 Zod schemas (forms, API inputs)
│       ├── constants/        # Roles, tiers, module lists, regions
│       └── lib/              # Billing logic, timetable utilities
│
├── opensrc/                  # Pinned dependency source mirrors (see section below)
│   ├── sources.json          # Package registry with versions & local paths
│   └── repos/github.com/     # Full source trees for 8 key dependencies
│
├── docs/                     # Documentation
│   ├── technical/            # Architecture specs, ADRs
│   ├── setup/                # Production setup guides
│   ├── api/                  # API reference & OpenAPI spec
│   └── user-guides/          # End-user workflow guides
│
├── .github/
│   └── workflows/
│       ├── ci.yml            # Lint, type check, unit tests, E2E, Convex schema, mobile, security audit
│       ├── deploy-preview.yml    # PR preview deployments
│       └── deploy-production.yml # Production deploy to Vercel + Convex
│
├── AGENTS.md                 # AI agent collaboration instructions
├── .env.example              # All environment variables with documentation
└── turbo.json                # Turborepo pipeline configuration
```

---

## opensrc/ — Pinned Dependency Sources

The `opensrc/` directory contains the full source trees of 8 critical third-party dependencies, pinned to the exact versions used in production.

### What's inside

| Package | Version | GitHub Source |
|---|---|---|
| `convex` | 1.34.1 | `get-convex/convex-backend` |
| `@workos-inc/authkit-nextjs` | 2.15.0 | `workos/authkit-nextjs` |
| `stripe` | 18.5.0 | `stripe/stripe-node` |
| `resend` | 6.9.3 | `resend/resend-node` |
| `zod` | 3.25.76 | `colinhacks/zod` |
| `ai` (Vercel AI SDK) | 6.0.146 | `vercel/ai` |
| `inngest` | 4.1.2 | `inngest/inngest-js` |
| `uploadthing` | 7.7.4 | `pingdotgg/uploadthing` |

The index file `opensrc/sources.json` lists each package with its exact version, npm registry name, local path, and fetch timestamp.

### Why this exists

When AI agents and contributors work on EduMyles, they need to make precise decisions about how to use these libraries. Reading the pinned source directly gives exact information about available APIs, internal types, hook signatures, and edge-case behaviours without relying on outdated documentation or assumptions about what a package version supports.

Each package was chosen because it has deep integration points in the codebase:

- **convex** — Every backend function, query, mutation, action, and the real-time subscription system. Knowing the internal `ctx` shape, validator types, and index API prevents subtle bugs.
- **@workos-inc/authkit-nextjs** — Auth flow, session handling, cookie encryption, and organization-aware middleware. The NextJS integration layer is non-trivial to reason about from docs alone.
- **stripe** — Payment Intent creation, webhook signature verification, refund flows, and idempotency key patterns for East Africa–specific use cases.
- **resend** — Email template types, batch send API, domain verification requirements, and the Node.js SDK interface.
- **zod** — Schema composition patterns (`.superRefine`, `.transform`, `.or`), used across 32 shared validators and all Convex function argument validators.
- **ai** (Vercel AI SDK) — Streaming response patterns, tool call types, and the `generateText`/`streamText` API used by the AI assistant features.
- **inngest** — Event-driven background job definition, retry policies, step functions, and the `serve()` handler for Next.js.
- **uploadthing** — File router setup, presigned URL generation, and the React Native upload hook for profile photo and document uploads.

### Advantages

1. **Zero network dependency for internals** — Contributors can inspect real implementation details offline, without scraping docs sites or browsing GitHub.
2. **Version-locked truth** — The source matches exactly what runs in production. No surprises from patch releases changing undocumented behaviour.
3. **Faster, more accurate AI assistance** — AI agents operating on this codebase are instructed (see `AGENTS.md`) to read `opensrc/` before touching any integration code. This eliminates hallucinated API signatures and incorrect option names.
4. **Audit trail** — `sources.json` records when each package was fetched, making it easy to review what changed when upgrading a dependency.
5. **Onboarding acceleration** — New contributors can understand the full integration surface of any library without leaving the repository.

---

## School Modules

Each module can be independently enabled or disabled per school. Module availability is gated by subscription tier.

| Module | Tier | Description |
|---|---|---|
| **Student Information System (SIS)** | Starter+ | Student profiles, enrollment lifecycle, admission numbers, class assignment, status tracking |
| **Admissions & Enrollment** | Starter+ | Application forms, document uploads, acceptance / rejection workflows, waitlists |
| **Finance & Fees** | Starter+ | Fee structures, invoice generation, multi-gateway payments (M-Pesa, Airtel, Stripe, Bank Transfer), ledger, overdue tracking |
| **Timetable & Scheduling** | Standard+ | Class schedules, room allocation, conflict detection, teacher workload |
| **Academics & Gradebook** | Standard+ | Exams, continuous assessment, grade entry, report cards, curriculum management, assignments |
| **HR & Payroll** | Standard+ | Staff records, leave requests & approvals, payroll calculation, performance reviews |
| **Library Management** | Pro+ | Book catalog, borrow / return circulation, overdue reminders, fine tracking |
| **Transport** | Pro+ | Route planning, bus fleet management, student stop assignment, GPS tracking |
| **Communications** | Starter+ | SMS broadcasts, email campaigns, in-app announcements, push notifications, parent alerts |
| **eWallet** | Standard+ | Digital wallet for students and staff — top-up (M-Pesa / card / bank), P2P transfers, canteen spend |
| **School eCommerce** | Pro+ | School supplies shop — product catalog, orders, stock management, wallet checkout |

---

## Platform Admin Modules

The `convex/platform/` directory powers the master admin and super admin dashboards. It contains 30+ sub-modules for managing the SaaS platform itself:

| Sub-module | Description |
|---|---|
| **tenants** | Provision, suspend, activate, and delete school tenants |
| **users** | Platform-level user management across all tenants |
| **billing** | Subscription management, plan upgrades, invoicing |
| **marketplace** | Module registry, tier definitions, module activation |
| **audit** | Immutable audit log of every platform action |
| **analytics** | Cross-tenant usage analytics, engagement metrics |
| **dashboard** | Platform KPI dashboard — MRR, DAU, tenant health |
| **settings** | Platform-wide configuration (feature flags, limits, defaults) |
| **featureFlags** | A/B testing and gradual rollout controls |
| **onboarding** | Tenant onboarding checklists and guided setup flows |
| **support** | Support ticket system and internal triage |
| **health** | Service health monitoring and uptime dashboards |
| **security** | Login anomaly detection, IP allowlists, session audit |
| **impersonation** | Controlled tenant impersonation for support escalation |
| **notifications** | Platform broadcast notifications to tenant admins |
| **communications** | Cross-tenant SMS / email send capabilities |
| **webhooks** | Outbound webhook subscriptions for tenant events |
| **apiKeys** | API key issuance and revocation for tenant integrations |
| **dataExport** | Tenant data export (GDPR / right to erasure) |
| **roleBuilder** | Custom role definition and permission mapping |
| **crm** | Tenant CRM — sales pipeline, account health, notes |
| **tenantSuccess** | Customer success — NPS, health scores, expansion signals |
| **automation** | Workflow automation engine for platform operations |
| **scheduledReports** | Automated periodic report generation and delivery |
| **staffPerformance** | Platform staff KPIs and performance tracking |
| **knowledgeBase** | Internal knowledge base for support agents |
| **sla** | SLA tracking and breach alerting |
| **changelog** | Feature changelog published to tenant dashboards |
| **whiteLabel** | White-label branding configuration per tenant |
| **integration** | Third-party integration management (HMIS, LMS, etc.) |
| **operations** | Ops tooling — database jobs, migrations, bulk actions |

---

## User Roles & Portals

### School-Level Roles

| Role | Portal | Access |
|---|---|---|
| `school_admin` | `/admin` | Full school access — all modules, settings, staff, students |
| `principal` | `/admin` | Academic oversight, reports, approvals, staff management |
| `teacher` | `/portal/teacher` | Gradebook, attendance, timetable, class student records |
| `bursar` | `/admin/finance` | Finance management — fee structures, invoices, payments, reports |
| `hr_manager` | `/admin/hr` | Staff records, leave approvals, payroll, recruitment |
| `librarian` | `/admin/library` | Book catalog, circulation management, overdue tracking |
| `transport_manager` | `/admin/transport` | Routes, fleet, student assignments, tracking |
| `receptionist` | `/admin` | Front-desk — visitor log, student check-in, communications |
| `student` | `/portal/student` | Dashboard, timetable, grades, assignments, wallet, notifications |
| `parent` | `/portal/parent` | Child's grades, attendance, fee statements, announcements |
| `alumni` | `/portal/alumni` | Alumni directory, events, mentorship, giving |
| `partner` | `/portal/partner` | Partner-specific resources and communications |
| `board_member` | `/portal/board` | Board-level read-only access — financials, academic reports |

### Platform-Level Roles

| Role | Access |
|---|---|
| `master_admin` | Full platform access — all tenants, billing, system config |
| `super_admin` | Platform operations — tenant management, support, audit |

---

## Architecture

### Multi-Tenancy

Every database table includes a `tenantId` column. All Convex queries are required to call `requireTenantContext(ctx)` or `requireTenantSession(ctx, args)` before accessing data, which injects a `tenantId` filter automatically. This ensures complete row-level data isolation between schools — a query from School A can never return data belonging to School B.

Platform-level functions (in `convex/platform/`) use `requirePlatformSession(ctx, args)` and `requirePmRole(ctx, args, role)` to enforce that only `master_admin` / `super_admin` users can access cross-tenant operations.

### Module Gating

Schools subscribe to a tier: **Starter → Standard → Pro → Enterprise**. Each tier unlocks a different set of modules. The module marketplace (`convex/modules/marketplace/`) enforces gating at the Convex function level using `requireModuleAccess(ctx, tenantId, moduleName)`. Attempting to call a gated module function without the required tier returns a permission error.

### Real-Time

Convex provides live reactive subscriptions. All `useQuery` calls in the frontend and mobile app automatically re-render when underlying data changes — no polling, no manual cache invalidation. This powers real-time attendance marking, live payment status updates, and instant notification delivery.

### Authentication Flow

```
User visits {school}.edumyles.com/auth/login
         ↓
WorkOS handles magic link / SSO authentication
         ↓
WorkOS calls /auth/callback with signed JWT
         ↓
Next.js API route (/api/auth/session) validates JWT,
resolves tenantId from subdomain, creates Convex session
         ↓
Middleware reads session cookie and enforces:
  • Tenant isolation (correct subdomain only)
  • Role-based route access
  • Module availability for current tier
```

### Session Architecture

Sessions are stored in Convex (not a separate session store). The session token is a signed opaque string that contains user ID, tenant ID, and role. Both the web frontend and mobile app pass `sessionToken` explicitly to every Convex query and mutation — there is no implicit auth context.

### Webhook & External Event Flow

M-Pesa STK Push callbacks, WorkOS organization webhooks, and UploadThing file-ready events all arrive at `convex/http.ts` HTTP endpoints. Each endpoint validates a request signature before processing (`CONVEX_WEBHOOK_SECRET` for internal services, Safaricom IP allowlist for M-Pesa).

---

## Payment Integrations

| Gateway | Region | Method | Implementation |
|---|---|---|---|
| M-Pesa (Daraja STK Push) | Kenya | Mobile money prompt | `convex/actions/mpesa.ts` |
| Airtel Money | Uganda, Tanzania, Rwanda | Mobile money prompt | `convex/actions/airtelMoney.ts` |
| Stripe | All markets | Card / online | `convex/actions/stripe.ts` |
| Bank Transfer | All markets | Manual with ref code | `convex/modules/finance/` |
| Cash / Cheque | On-premises | Manual entry | `convex/modules/finance/` |

Payments flow through the **Finance module**: an invoice is generated → payment initiated → gateway callback received → ledger entry created → invoice status updated → notification sent to parent/student.

The eWallet supports top-up via M-Pesa, card, or bank transfer, and spending is debited atomically in Convex transactions.

---

## Communications

EduMyles supports four delivery channels, all orchestrated through `convex/modules/communications/`:

| Channel | Provider | Use Cases |
|---|---|---|
| SMS | Africa's Talking | Fee reminders, exam results, emergency alerts, OTPs |
| Email | Resend | Report cards, invoices, welcome emails, announcements |
| Push (mobile) | Expo Push Notifications | Immediate alerts for students and parents on mobile |
| In-app | Convex native | Notifications bell, unread count, mark-as-read — all roles |

The cross-role notification system (`convex/notifications.ts`) provides a unified `getNotifications`, `getUnreadCount`, `markAsRead`, and `markAllAsRead` API used by all portals including the mobile app.

Communication templates are stored per tenant with variable interpolation support (student name, amount, due date, etc.). Templates are managed through the Communications admin panel.

---

## Mobile App

The mobile app (`mobile/`) targets iOS and Android via Expo and shares business logic with the web frontend through the `shared/` package.

### Features

- **Student portal**: Profile, timetable, assignments, grades, notifications, eWallet balance
- **Parent portal**: Child overview, fee statements, announcements, attendance history
- **Teacher portal**: Class list, attendance marking, notification feed

### Offline Support

The `useOfflineSync` and `useCachedQueryValue` hooks cache Convex query results to AsyncStorage. When the device is offline, screens render from cache with an "offline" banner rather than showing errors.

### Architecture

- Convex real-time queries via `convex/react`
- Session token stored in SecureStore (Expo)
- Navigation via React Navigation
- Theme system with shared design tokens (`mobile/src/theme.ts`)

---

## Database & Stats

| Metric | Count |
|---|---|
| Convex schema tables | 163 |
| Frontend routes | 215+ |
| Convex module directories | 17 |
| Platform sub-modules | 30+ |
| Shared Zod validators | 32 |
| Shared TypeScript types/interfaces | 41 |
| CI workflow jobs | 7 |
| Payment gateways | 5 |
| Communication channels | 4 |
| User roles | 15 |
| Subscription tiers | 4 |

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- [Convex account](https://convex.dev) (free tier available)
- [WorkOS account](https://workos.com) (for authentication)

### Setup

```bash
# Clone and install
git clone https://github.com/Mylesoft-Technologies/edumyles.git
cd edumyles
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local — see Environment Variables section below

# Start Convex backend (separate terminal)
npx convex dev

# Start all services (frontend + landing)
npm run dev

# Or start individually
npm run dev:frontend   # Frontend only (port 3000)
npm run dev:landing    # Landing page only (port 3001)
npm run dev:mobile     # Expo mobile app
```

---

## Environment Variables

Copy `.env.example` to `.env.local`. The example file is fully documented with descriptions for every variable. Key groups:

### Required for all environments

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `EXPO_PUBLIC_CONVEX_URL` | Convex URL for the mobile app |
| `CONVEX_DEPLOY_KEY` | Deploy key for CI/CD |
| `WORKOS_API_KEY` | WorkOS server-side API key |
| `NEXT_PUBLIC_WORKOS_CLIENT_ID` | WorkOS client ID (public) |
| `WORKOS_REDIRECT_URI` | OAuth callback URL |
| `WORKOS_COOKIE_PASSWORD` | Session cookie encryption secret (min 32 chars) |
| `CONVEX_WEBHOOK_SECRET` | Shared secret for internal webhook validation |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Root domain (`edumyles.com` in production) |

### Payment gateways

| Variable | Gateway |
|---|---|
| `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY` | M-Pesa Daraja |
| `AIRTEL_CLIENT_ID`, `AIRTEL_CLIENT_SECRET` | Airtel Money |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe |

### Communications

| Variable | Service |
|---|---|
| `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID` | Africa's Talking (SMS) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Resend (email) |

### Optional / monitoring

| Variable | Service |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error monitoring |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog product analytics |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary media storage |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging (push) |
| `MASTER_ADMIN_EMAILS` | Comma-separated emails granted `master_admin` on first login |

---

## Development

```bash
# Run all checks
npm run type-check     # TypeScript across all packages
npm run lint           # ESLint
npm run lint:fix       # Auto-fix lint issues
npm run test           # Unit test suite
npm run test:tenant-isolation  # Tenant isolation regression tests
npm run test:e2e:smoke # Playwright smoke suite
npm run format         # Prettier formatting
npm run build          # Production build (all packages)
npm run clean          # Remove build artifacts

# Convex
npx convex dev         # Start local Convex backend with hot reload
npx convex deploy      # Deploy to production Convex cloud
```

---

## CI/CD Pipeline

The CI pipeline (`.github/workflows/ci.yml`) runs on every PR and push to `develop`. It has 7 parallel jobs:

| Job | What it does |
|---|---|
| **Lint & Type Check** | ESLint + `tsc --noEmit` across all workspaces |
| **Unit Tests** | Jest with coverage upload |
| **Tenant Isolation Tests** | Dedicated regression suite ensuring no cross-tenant data leakage |
| **End-to-End Tests** | Playwright smoke suite against a local dev build |
| **Convex Schema & Types** | TypeScript validates all Convex functions against `schema.ts` |
| **Mobile Lint, Types & Tests** | ESLint + TypeScript + Jest for the Expo app |
| **Security Audit** | `npm audit --audit-level=high` + TruffleHog secret scanning |

Production deploys are handled by `deploy-production.yml` (merges to `main`) and preview deploys by `deploy-preview.yml` (PRs).

---

## Deployment

### Frontend & Landing

Both apps are deployed to Vercel:

- **Landing** (`edumyles.com`): root `vercel.json` deploys the `landing/` workspace
- **Frontend** (`{tenant}.edumyles.com`): `frontend/vercel.json` deploys the authenticated app as a separate Vercel project with wildcard subdomain routing

### Backend

```bash
npx convex deploy --yes   # Deploy Convex functions to production cloud
```

Production URL: `https://insightful-alpaca-351.convex.cloud`

### Environment Secrets

Production secrets are managed via:
- **Vercel dashboard** — `NEXT_PUBLIC_*` and server-side Next.js variables
- **Convex dashboard** (Environment Variables tab) — `CONVEX_WEBHOOK_SECRET`, payment keys, API keys used inside Convex functions
- **GitHub Org Secrets** — `CONVEX_DEPLOY_KEY`, `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` for CI/CD

---

## License

Proprietary — Mylesoft Technologies. All rights reserved.
