# Production Tenant Onboarding Checklist

Run these gates before onboarding real schools.

## Required checks

```bash
npm run production:check
npm run type-check
npm run test:tenant-isolation
npm run test:e2e:onboarding
```

`test:e2e:onboarding` needs either `E2E_SEED_DATA=true` with Convex seed env configured or a live tenant admin `E2E_SESSION_TOKEN`.

## Provider smoke checks

```bash
npm run production:smoke
```

The smoke checks intentionally fail when production credentials or callback URLs are missing. Run them against the deployment URL in `NEXT_PUBLIC_APP_URL`, not localhost, before inviting tenants.

## Hard blockers

- `ENABLE_DEV_AUTH_BYPASS` must be unset or `false`.
- `SOCIAL_SANDBOX_MODE` must be unset or `false`.
- `NODE_ENV` must be `production`.
- WorkOS, Convex, Resend, Stripe, and the tenant root domain env vars must be present.
- M-Pesa, Airtel, and Africa's Talking env vars should be present before schools use live billing, parent invites, or SMS notifications.
