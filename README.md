# EduMyles

Multi-tenant school management platform built for East Africa.

EduMyles gives schools a single system to manage students, staff, finances, communications, and day-to-day operations. Each school gets its own isolated tenant at `{school}.edumyles.com` with role-based access for administrators, teachers, students, and parents.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS, shadcn/ui |
| Backend | Convex (real-time serverless database + functions) |
| Auth | WorkOS (magic links, SSO, organizations) |
| Mobile | React Native (Expo) |
| Payments | M-Pesa (Daraja), Airtel Money, Stripe |
| SMS | Africa's Talking |
| Email | Resend |
| Hosting | Vercel |
| Monorepo | Turborepo + npm workspaces |

## Repository Structure

```
edumyles/
├── frontend/           # Next.js web app — school portal ({slug}.edumyles.com)
│   ├── src/app/        # Routes: /admin, /platform, /auth, /portal (student)
│   ├── src/components/ # UI components (shadcn/ui, forms, charts, layout)
│   ├── src/hooks/      # React hooks (auth, permissions, tenant, real-time)
│   ├── src/lib/        # Utilities, auth helpers, formatters
│   └── src/test/       # Frontend test suite
│
├── convex/             # Backend — real-time serverless functions
│   ├── modules/        # Domain logic (one folder per module)
│   │   ├── sis/        # Student Information System
│   │   ├── admissions/ # Admissions & enrollment
│   │   ├── finance/    # Fees, invoices, payments
│   │   ├── academics/  # Gradebook, exams, curricula
│   │   ├── hr/         # Staff management, payroll, leave
│   │   ├── timetable/  # Scheduling & resource allocation
│   │   ├── library/    # Book catalog & circulation
│   │   ├── transport/  # Routes, fleet, tracking
│   │   ├── communications/ # SMS, email, in-app messaging
│   │   ├── ewallet/    # Digital wallet for students & staff
│   │   ├── ecommerce/  # School supplies marketplace
│   │   ├── marketplace/# Module marketplace & tier gating
│   │   └── portal/     # Student, parent, alumni, partner portals
│   ├── platform/       # Master admin: tenants, billing, audit, users
│   ├── actions/        # External API integrations (payments, SMS, email)
│   ├── helpers/        # Shared guards (tenant, module, auth, audit)
│   └── schema.ts       # Database schema definition
│
├── landing/            # Marketing site — edumyles.com
│   └── src/app/        # Routes: /, /pricing, /features, /about, /contact
│
├── mobile/             # React Native (Expo) — iOS & Android
│   └── src/            # Screens, components, hooks
│
├── shared/             # Shared TypeScript types, constants, validators
│   └── src/            # Types, constants, validators used across packages
│
├── docs/               # Documentation
│   ├── technical/      # Architecture, specs
│   ├── setup/          # Production setup guides
│   ├── api/            # API reference & OpenAPI spec
│   └── user-guides/    # End-user workflows
│
└── .github/            # CI/CD workflows, issue templates
```

## Modules

| Module | Description |
|---|---|
| **Student Information System** | Student profiles, enrollment lifecycle, class assignments |
| **Admissions & Enrollment** | Application forms, document uploads, acceptance workflows |
| **Finance & Fees** | Fee structures, invoices, multi-gateway payments (M-Pesa, Airtel, Stripe) |
| **Academics & Gradebook** | Exams, grading, report cards, curriculum management |
| **HR & Payroll** | Staff records, leave management, automated payroll |
| **Timetable & Scheduling** | Class schedules, room allocation, conflict detection |
| **Library Management** | Book catalog, circulation, overdue tracking |
| **Transport** | Route planning, fleet management, GPS tracking |
| **Communications** | SMS, email, and in-app notifications |
| **eWallet** | Digital wallet top-ups, transfers, and spending |
| **Marketplace** | Module marketplace with tier-based gating (Starter/Standard/Pro/Enterprise) |

## User Roles

| Role | Access |
|---|---|
| Platform Admin | Full system — tenant provisioning, billing, audit logs |
| School Admin | School-level settings, staff, students, modules |
| Principal | Academic oversight, reports, approvals |
| Teacher | Gradebook, attendance, timetable, student records |
| Parent | Child's grades, attendance, fees, communications |
| Student | Dashboard, assignments, timetable, wallet |
| Alumni | Alumni portal, events, directory |

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
# Edit .env.local with your Convex, WorkOS, and payment gateway keys

# Start development
npm run dev          # All services (frontend + landing + mobile)
npm run dev:frontend # Frontend only (port 3000)
npm run dev:backend  # Convex backend
npm run dev:landing  # Landing page only (port 3001)
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys. The file is organized by service:

- **Convex** — deployment URL and keys
- **WorkOS** — API key, client ID, redirect URI
- **M-Pesa / Airtel / Stripe** — payment gateway credentials
- **Africa's Talking** — SMS gateway
- **Resend** — transactional email

See [docs/setup/](docs/setup/) for production configuration guides.

## Architecture

### Multi-Tenancy
Every database query requires `tenantId` — enforced by `requireTenantContext()` in Convex helpers. Each school operates in complete data isolation with its own subdomain.

### Module Gating
Schools subscribe to a tier (Starter, Standard, Pro, Enterprise). Each tier unlocks a set of modules. The marketplace allows schools to browse and activate modules within their tier.

### Real-Time
Convex provides live subscriptions — changes to data are reflected instantly across all connected clients without polling.

### Authentication Flow
1. User visits `{school}.edumyles.com/auth/login`
2. WorkOS handles magic link / SSO authentication
3. Callback creates a Convex session with role + tenant context
4. Middleware enforces role-based route access

## Development

```bash
npm run type-check   # TypeScript checking across all packages
npm run lint         # ESLint
npm run lint:fix     # Auto-fix lint issues
npm run test         # Run test suite
npm run format       # Prettier formatting
npm run build        # Production build
npm run clean        # Remove build artifacts
```

## Deployment

- **Frontend + Landing**: Deployed to Vercel with subdomain routing
- **Backend**: `npx convex deploy` pushes functions to Convex cloud
- **Environment**: Production secrets managed via Vercel and Convex dashboards

## License

Proprietary — Mylesoft Technologies. All rights reserved.






SMALL NOTES 
Phase 1: communications send flow
finish broadcast page
test create + send
verify records appear in platform_message
verify records appear in tenant_notifications
Phase 2: notifications receive flow
list tenant notifications
unread count
mark as read
tenant admin-only inbox UI