#!/usr/bin/env node

const REQUIRED = [
  "NODE_ENV",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_FRONTEND_URL",
  "NEXT_PUBLIC_ROOT_DOMAIN",
  "NEXT_PUBLIC_CONVEX_URL",
  "CONVEX_WEBHOOK_SECRET",
  "WORKOS_API_KEY",
  "WORKOS_CLIENT_ID",
  "NEXT_PUBLIC_WORKOS_CLIENT_ID",
  "WORKOS_REDIRECT_URI",
  "WORKOS_COOKIE_PASSWORD",
  "WORKOS_WEBHOOK_SECRET",
  "MASTER_ADMIN_WORKOS_USER_ID",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_SUPPORT_EMAIL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

const RECOMMENDED = [
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_SHORTCODE",
  "MPESA_PASSKEY",
  "MPESA_CALLBACK_URL",
  "AIRTEL_WEBHOOK_SECRET",
  "AT_USERNAME",
  "AT_API_KEY",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "SENTRY_AUTH_TOKEN",
  "SLACK_WEBHOOK_URL",
  "SECURITY_SLACK_WEBHOOK_URL",
];

const FORBIDDEN_PRODUCTION_VALUES = [
  ["ENABLE_DEV_AUTH_BYPASS", "true"],
  ["SOCIAL_SANDBOX_MODE", "true"],
];

function isPlaceholder(value) {
  return /x{6,}|placeholder|your-deployment|example\.com|localhost/i.test(value);
}

const failures = [];
const warnings = [];

for (const key of REQUIRED) {
  const value = process.env[key]?.trim();
  if (!value) {
    failures.push(`Missing required env: ${key}`);
  } else if (isPlaceholder(value)) {
    failures.push(`Required env appears to be a placeholder: ${key}`);
  }
}

for (const key of RECOMMENDED) {
  const value = process.env[key]?.trim();
  if (!value) {
    warnings.push(`Missing recommended env: ${key}`);
  } else if (isPlaceholder(value)) {
    warnings.push(`Recommended env appears to be a placeholder: ${key}`);
  }
}

for (const [key, forbidden] of FORBIDDEN_PRODUCTION_VALUES) {
  if ((process.env[key] ?? "").toLowerCase() === forbidden) {
    failures.push(`${key} must not be ${forbidden} in production`);
  }
}

if (process.env.NODE_ENV !== "production") {
  failures.push("NODE_ENV must be production for production readiness");
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
if (appUrl && rootDomain) {
  try {
    const host = new URL(appUrl).hostname;
    if (!host.endsWith(rootDomain)) {
      warnings.push(
        `NEXT_PUBLIC_APP_URL host (${host}) does not end with NEXT_PUBLIC_ROOT_DOMAIN (${rootDomain})`
      );
    }
  } catch {
    failures.push("NEXT_PUBLIC_APP_URL must be a valid URL");
  }
}

const report = {
  ok: failures.length === 0,
  failures,
  warnings,
  checkedAt: new Date().toISOString(),
};

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}
