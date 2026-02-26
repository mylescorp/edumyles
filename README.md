# EduMyles

> Multi-tenant, modular school management platform for East Africa.

## Architecture

- **Frontend**: Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Convex (real-time serverless database + compute)
- **Auth**: WorkOS (magic links, SSO, Organizations)
- **Mobile**: React Native (Expo)
- **SMS**: Africa's Talking
- **Email**: Resend + React Email
- **Payments**: M-Pesa (Daraja), Airtel Money, Stripe, Bank Transfer
- **Hosting**: Vercel (subdomain routing)

## Monorepo Structure

```
edumyles/
├── apps/
│   ├── web/          # Next.js App Router frontend
│   └── mobile/       # React Native (Expo)
├── convex/
│   ├── modules/      # Domain modules (sis, finance, academics, ...)
│   ├── helpers/      # Shared backend utilities
│   └── platform/     # Master admin, tenant provisioning, billing
├── packages/
│   └── shared/       # Shared types, constants, validators
└── docs/             # Architecture docs, API reference, guides
```

## Getting Started

See [docs/guides/getting-started.md](docs/guides/getting-started.md)

## Security

- All Convex queries enforce mandatory `tenantId` isolation
- No cross-tenant data access is possible
- See [docs/architecture/tenant-isolation.md](docs/architecture/tenant-isolation.md)

## License

Proprietary — © Mylesoft Technologies. All rights reserved.
