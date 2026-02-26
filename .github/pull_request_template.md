## Summary
<!-- What does this PR do? Link to the related issue or task. -->

Closes #

## Type of Change
- [ ] 🐛 Bug fix
- [ ] ✨ New feature / module
- [ ] 🔧 Refactor / internal improvement
- [ ] 💥 Breaking change (explain below)
- [ ] 🗄️  Database schema change (migration plan required)
- [ ] 🔒 Security-related change
- [ ] 📄 Documentation only

## Breaking Change Description
<!-- If breaking change, describe what it changes and how to migrate -->

---

## Tenant Isolation Checklist
> All Convex functions touching tenant data must pass this checklist.

- [ ] Every new/modified Convex query calls `requireTenantContext(ctx)` as the **first line**
- [ ] No query accesses data without a `tenantId` filter
- [ ] Cross-tenant data access is impossible in this change
- [ ] Tested with at least **2 different tenant IDs** locally

## Security Checklist
- [ ] No secrets, API keys, or credentials committed
- [ ] All user inputs are validated (Convex validators / Zod)
- [ ] Audit log updated for any admin/finance/HR actions
- [ ] Sensitive fields are not exposed in public queries

## Schema Changes
<!-- If you modified convex/schema.ts, describe what changed -->
- [ ] No schema changes
- [ ] Schema changes included — indexes updated correctly
- [ ] Backfill migration handled (describe below if yes)

## Payment / Finance Changes
<!-- Extra scrutiny for money-touching code -->
- [ ] Does not touch payment or wallet code
- [ ] Touches payment/wallet code — reviewed M-Pesa/Stripe flow end-to-end

## Testing
- [ ] Unit tests added or updated
- [ ] Tested locally against dev Convex deployment
- [ ] Tested on Vercel preview deployment
- [ ] QA tested (for features going to staging)

## Screenshots / Recordings
<!-- For UI changes, attach before/after screenshots or a screen recording -->

## Notes for Reviewers
<!-- Anything specific reviewers should look at carefully? -->
