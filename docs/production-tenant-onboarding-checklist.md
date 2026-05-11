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

For exported Vercel or CI env files, pass them directly:

```bash
npm run production:check -- --env-file frontend/.vercel/frontend-prod.env --target=frontend
npm run production:check -- --env-file landing/.vercel/landing-prod.env --target=landing
```

The all-in launch gate is:

```bash
npm run launch:verify -- --env-file frontend/.vercel/frontend-prod.env
```

Add `--full-smoke` only when live provider credentials and smoke recipients are available:

```bash
RESEND_SMOKE_TO=ops@example.com SMS_SMOKE_TO=+254700000000 E2E_SESSION_TOKEN=... \
  npm run launch:verify -- --full-smoke --env-file frontend/.vercel/frontend-prod.env
```

## Provider smoke checks

```bash
npm run production:smoke
```

The smoke checks intentionally fail when production credentials, callback URLs, or smoke recipients are missing. Run them against the deployment URL in `NEXT_PUBLIC_APP_URL`, not localhost, before inviting tenants. The smoke command accepts the same `--env-file` flag.

## Tenant onboarding preflight

`POST /api/tenants/onboard` supports a non-mutating preflight:

```json
{
  "dryRun": true,
  "sessionToken": "...",
  "schoolName": "Pilot Academy",
  "adminEmail": "admin@school.example",
  "adminFirstName": "Amina",
  "adminLastName": "Otieno"
}
```

In production, the real onboarding route fails before tenant creation if WorkOS, Resend, Convex, root domain, or Vercel domain provisioning env is missing. `allowPartialOnboarding: true` bypasses those production preflight failures and records them as warnings; use it only for an intentional manual recovery flow.

## Hard blockers

- `ENABLE_DEV_AUTH_BYPASS` must be unset or `false`.
- `SOCIAL_SANDBOX_MODE` must be unset or `false`.
- `NODE_ENV` must be `production`.
- WorkOS, Convex, Resend, Stripe, and the tenant root domain env vars must be present.
- M-Pesa, Airtel, and Africa's Talking env vars should be present before schools use live billing, parent invites, or SMS notifications.
