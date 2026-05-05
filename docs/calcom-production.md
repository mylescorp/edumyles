# EduMyles Cal.com Production Setup

EduMyles uses Cal.com for live demo scheduling on `https://edumyles.com/book-demo`.

## Runtime behavior

1. The visitor submits the EduMyles demo form.
2. The landing API stores the request in Convex and returns a `demoRequestId`.
3. The page renders an inline Cal.com embed prefilled with name, email, phone, school name, and `metadata[demoRequestId]`.
4. Cal.com posts booking lifecycle events to `/api/webhooks/cal/demo`.
5. The webhook verifies `x-cal-signature-256`, then updates the matching Convex demo request by `demoRequestId` first and email as a fallback.

If Convex is temporarily unavailable, the landing API sends the request by fallback email and returns a captured state. The page does not show the inline Cal.com scheduler in that path, because there is no Convex request id for the later webhook to update.

## Required production variables

Set these in the **landing Vercel project**:

```env
NEXT_PUBLIC_LANDING_URL=https://edumyles.com
NEXT_PUBLIC_CALCOM_ORIGIN=https://cal.com
NEXT_PUBLIC_CALCOM_EMBED_ORIGIN=https://app.cal.com
NEXT_PUBLIC_CALCOM_DEMO_LINK=edumyles/demo
NEXT_PUBLIC_CALCOM_DEMO_NAMESPACE=edumyles-demo
CALCOM_API_KEY=cal_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CALCOM_WEBHOOK_SECRET=generate-a-long-random-secret
```

Use a live Cal.com API key for production. Cal.com API keys are bearer tokens, and Cal.com documents that live keys use the `cal_live_` prefix.

The frontend app only needs the public Cal.com link values if it displays or links to booking surfaces:

```env
NEXT_PUBLIC_CALCOM_ORIGIN=https://cal.com
NEXT_PUBLIC_CALCOM_EMBED_ORIGIN=https://app.cal.com
NEXT_PUBLIC_CALCOM_DEMO_LINK=edumyles/demo
NEXT_PUBLIC_CALCOM_DEMO_NAMESPACE=edumyles-demo
```

Do not add `CALCOM_API_KEY` or `CALCOM_WEBHOOK_SECRET` to public/client-exposed environments.

## Webhook setup

Create or verify the production webhook from the repo root:

```bash
CALCOM_API_KEY=cal_live_... \
CALCOM_WEBHOOK_SECRET=... \
NEXT_PUBLIC_LANDING_URL=https://edumyles.com \
npm run calcom:smoke -- --create
```

The script creates `/api/webhooks/cal/demo` with these triggers:

- `BOOKING_CREATED`
- `BOOKING_RESCHEDULED`
- `BOOKING_CANCELLED`
- `MEETING_STARTED`
- `MEETING_ENDED`

After setup, verify without creating anything:

```bash
CALCOM_API_KEY=cal_live_... \
NEXT_PUBLIC_LANDING_URL=https://edumyles.com \
npm run calcom:smoke
```

## Manual Cal.com dashboard equivalent

In Cal.com, create a webhook under developer/webhook settings:

- Subscriber URL: `https://edumyles.com/api/webhooks/cal/demo`
- Secret: same value as `CALCOM_WEBHOOK_SECRET`
- Version: `2021-10-20`
- Active: enabled
- Triggers: the five triggers listed above

## Security notes

The production webhook route refuses unsigned traffic if `CALCOM_WEBHOOK_SECRET` is missing. Keep `CALCOM_API_KEY` and `CALCOM_WEBHOOK_SECRET` server-side only; do not expose them through `NEXT_PUBLIC_` variables.
