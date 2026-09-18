---
type: context
status: active
date: 2026-06-23
tags:
  - context
  - edumyles
---

# EduMyles — CONTEXT.md

Last updated: 2026-06-23
Updated by: Vault seed — update via /grill-with-docs

## What This Product Does

[[EduMyles]] is a multi-tenant school management platform for Kenyan and East African schools.

## Target User

School administrators, teachers, finance officers, and parents in Kenya and East Africa.

## Stack

- Framework: Next.js 16.2 (Turborepo monorepo)
- Backend: [[Convex]]
- Auth: [[WorkOS]] AuthKit
- Payments: M-Pesa Daraja (primary), Stripe (secondary)
- SMS: Africa's Talking (Sender ID: EduMyles)
- Email: [[Resend]]
- Hosting: [[Vercel]]
- Mobile: React Native / Expo
- Domain: edumyles.com

## Panel Architecture

| Panel | URL | Folder | Role |
|---|---|---|---|
| Master Admin | admin.edumyles.com/platform | apps/admin/app/platform/ | MylesCorp internal control |
| Super Admin | network.edumyles.com/admin | apps/network/app/admin/ | Network and operator management |
| Tenant App | [school].edumyles.com/dashboard | apps/web/app/dashboard/ | School portal |

## Roles

| Role | Panel | Access |
|---|---|---|
| platform_admin | Master Admin | Full platform control |
| network_admin | Super Admin | Network-level school management |
| school_admin | Tenant App | Full school management |
| teacher | Tenant App | Academics and class management |
| finance_officer | Tenant App | Fee management and payments |
| parent | Tenant App | Student view and fee payment |

## Domain Glossary

| Term | Meaning |
|---|---|
| Tenant | A school — one subdomain, one Convex org, one WorkOS org |
| School | Same as Tenant in this codebase |
| Stream | A class section within a grade (e.g. Form 1 East) |
| Term | Academic term — Kenya runs three terms per year |

## Architecture Decisions (Permanent)

- Auth: [[WorkOS]] AuthKit only
- Backend: [[Convex]] only
- Payment: M-Pesa Daraja (primary), Stripe (secondary)
- SMS: Africa's Talking, Sender ID: EduMyles
- Email: [[Resend]]
- Hosting: [[Vercel]] and Convex Cloud
- Curriculum: CBC, KCSE, KCPE support required
- All tenant-scoped queries must filter by tenantId
- TypeScript strict mode — no any, no ts-ignore

## Current Phase

Check `products/edumyles/status.md` in the vault for the current phase.

## Known Pitfalls

- Subdomain routing: tenantId is resolved from the subdomain in middleware, never from the client
- M-Pesa callback: validate MSISDN format before processing — Safaricom sends inconsistent formats
- Africa's Talking bulk SMS: chunk to 1000 recipients per batch to avoid rate limits
- Phone normalisation: always normalise to +254 format before sending SMS
