# EduMyles Production Domains

EduMyles runs as two production web surfaces:

- `https://edumyles.com` — public marketing, SEO pages, lead capture, waitlist, partner applications.
- `https://app.edumyles.com` — authenticated product app, admin dashboards, portals, APIs, payments, webhooks.

## Vercel Projects

Use two Vercel projects so the marketing site and authenticated app can deploy independently.

### Landing Project

- Domain: `edumyles.com`
- Optional alias: `www.edumyles.com`, redirected permanently to `https://edumyles.com`
- Build command: `npm run build --prefix landing`
- Output directory: `landing/.next`
- Config file from repo root: `vercel.json`

Required environment variables:

```env
NEXT_PUBLIC_LANDING_URL=https://edumyles.com
NEXT_PUBLIC_APP_URL=https://app.edumyles.com
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
WORKOS_REDIRECT_URI=https://app.edumyles.com/auth/callback
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://app.edumyles.com/auth/callback
```

### App Project

- Domain: `app.edumyles.com`
- Build command from `frontend/`: `cd .. && npm --workspace frontend run build`
- Output directory: `.next`
- Config file: `frontend/vercel.json`

Required environment variables:

```env
NEXT_PUBLIC_APP_URL=https://app.edumyles.com
NEXT_PUBLIC_LANDING_URL=https://edumyles.com
NEXT_PUBLIC_MARKETING_SITE_URL=https://edumyles.com
NEXT_PUBLIC_ROOT_DOMAIN=edumyles.com
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
WORKOS_REDIRECT_URI=https://app.edumyles.com/auth/callback
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://app.edumyles.com/auth/callback
CONVEX_WEBHOOK_SECRET=<shared secret>
```

## DNS

Point the apex domain and app subdomain at Vercel:

- `edumyles.com` should resolve to the landing Vercel project.
- `www.edumyles.com` should resolve to Vercel and redirect to the apex.
- `app.edumyles.com` should resolve to the frontend Vercel project.

If tenant subdomains are enabled later, add `*.edumyles.com` to the frontend Vercel project and keep `edumyles.com` on the landing project.

## External Callback URLs

Configure providers to call the app domain:

- WorkOS callback: `https://app.edumyles.com/auth/callback`
- M-Pesa webhook: `https://app.edumyles.com/api/webhooks/mpesa`
- Airtel webhook: `https://app.edumyles.com/api/webhooks/airtel`
- Stripe webhook: `https://app.edumyles.com/api/webhooks/stripe`

## Search Behavior

The landing app is indexable and publishes `https://edumyles.com/sitemap.xml`.

The frontend app is private and sends `noindex` metadata plus a disallow-all `robots.txt`, so authenticated dashboards and tenant workflows are not indexed.
