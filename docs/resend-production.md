# EduMyles Resend Production Setup

EduMyles sends email from two production surfaces:

- `landing/` on `https://edumyles.com` for contact, chat, waitlist, and demo-request flows
- Convex plus frontend app flows for tenant communications, invites, and managed email sends

## Required production variables

Set these in the **landing Vercel project** and the **frontend Vercel project**:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=EduMyles <no-reply@edumyles.com>
RESEND_FROM_NAME=EduMyles
RESEND_SUPPORT_EMAIL=support@edumyles.com
WAITLIST_NOTIFY_EMAIL=sales@edumyles.com
DEMO_NOTIFY_EMAIL=sales@edumyles.com
```

Set this extra variable in the **frontend Vercel project** because the webhook route lives there:

```env
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Set these in the **Convex production deployment** as well:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=EduMyles <no-reply@edumyles.com>
RESEND_FROM_NAME=EduMyles
CONVEX_WEBHOOK_SECRET=<same shared secret used by frontend server routes>
```

## Resend domain setup

Use a verified production sender domain in Resend before switching live traffic:

1. Add the sending domain in Resend.
2. Publish the SPF and DKIM DNS records at your DNS provider.
3. Wait until Resend marks the domain as verified.
4. Use the verified address in `RESEND_FROM_EMAIL`.

For EduMyles, a clean default is `EduMyles <no-reply@edumyles.com>`.

## What uses Resend today

- `landing/src/app/api/contact/route.ts`
- `landing/src/app/api/chat/route.ts`
- `landing/src/app/api/waitlist/route.ts` fallback notification path
- `landing/src/app/api/demo-request/route.ts` fallback notification path
- `frontend/src/app/api/email/send/route.ts`
- `frontend/src/app/api/communications/email/send/route.ts`
- `convex/modules/communications/email.ts`
- `frontend/src/app/api/webhooks/resend/route.ts`

## Important production behavior

The frontend email routes do not send directly to Resend. They authenticate the active EduMyles session, then call the trusted Convex communications action using `CONVEX_WEBHOOK_SECRET`. That means:

- Vercel needs `CONVEX_WEBHOOK_SECRET`
- Convex needs the same `CONVEX_WEBHOOK_SECRET`
- Convex needs the live Resend credentials

If those values drift, the request will fail before it reaches Resend.

## Smoke test

After setting production env vars, run:

```bash
RESEND_API_KEY=... \
RESEND_FROM_EMAIL="EduMyles <no-reply@edumyles.com>" \
RESEND_SMOKE_TO="you@yourdomain.com" \
node scripts/resend-smoke-check.mjs
```

Or from the repo root:

```bash
npm run resend:smoke
```

The script sends one plain-text verification email through the live Resend API and prints the returned message id.

## Webhook setup

Production now includes `frontend/src/app/api/webhooks/resend/route.ts`. In Resend:

1. Create a webhook that points to `https://app.edumyles.com/api/webhooks/resend`.
2. Subscribe at minimum to:
   - `email.sent`
   - `email.delivered`
   - `email.opened`
   - `email.clicked`
   - `email.bounced`
   - `email.complained`
   - `email.failed`
   - `email.suppressed`
3. Copy the webhook signing secret into `RESEND_WEBHOOK_SECRET` in the frontend Vercel project.

The route verifies the raw payload signature and forwards verified events into Convex so `messageRecords` can reflect actual delivery outcomes.

## Current boundary

EduMyles-owned transactional and invite emails now use Resend. WorkOS still owns authentication-provider emails such as account verification and password reset, because those flows depend on WorkOS-managed auth tokens and screens.
