#!/usr/bin/env node

import { envReport, isPlaceholder, loadEnvFiles, parseArgs, printJsonAndExit } from "./lib/env.mjs";

const args = parseArgs();
const loadedEnvFiles = loadEnvFiles(args.envFiles);
const target = args.values.get("target") ?? "all";

const FRONTEND_REQUIRED = [
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
  "NEXT_PUBLIC_WORKOS_REDIRECT_URI",
  "WORKOS_COOKIE_PASSWORD",
  "WORKOS_WEBHOOK_SECRET",
  "MASTER_ADMIN_WORKOS_USER_ID",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_SUPPORT_EMAIL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "VERCEL_TOKEN",
  "VERCEL_FRONTEND_PROJECT_ID",
];

const LANDING_REQUIRED = [
  "NEXT_PUBLIC_LANDING_URL",
  "NEXT_PUBLIC_APP_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_SUPPORT_EMAIL",
  "WAITLIST_NOTIFY_EMAIL",
  "DEMO_NOTIFY_EMAIL",
  "NEXT_PUBLIC_CALCOM_ORIGIN",
  "NEXT_PUBLIC_CALCOM_EMBED_ORIGIN",
  "NEXT_PUBLIC_CALCOM_DEMO_LINK",
  "NEXT_PUBLIC_CALCOM_DEMO_NAMESPACE",
  "CALCOM_API_KEY",
  "CALCOM_WEBHOOK_SECRET",
];

const CONVEX_REQUIRED = [
  "NEXT_PUBLIC_CONVEX_URL",
  "CONVEX_WEBHOOK_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "WORKOS_API_KEY",
  "WORKOS_CLIENT_ID",
];

const RECOMMENDED = [
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_SHORTCODE",
  "MPESA_PASSKEY",
  "MPESA_CALLBACK_URL",
  "MPESA_ENVIRONMENT",
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

function unique(values) {
  return [...new Set(values)];
}

function keysForTarget() {
  if (target === "frontend") return FRONTEND_REQUIRED;
  if (target === "landing") return LANDING_REQUIRED;
  if (target === "convex") return CONVEX_REQUIRED;
  return unique([...FRONTEND_REQUIRED, ...LANDING_REQUIRED, ...CONVEX_REQUIRED]);
}

function checkRequired(keys) {
  return keys.flatMap((key) => {
    const value = process.env[key]?.trim();
    if (!value) return `Missing required env: ${key}`;
    if (isPlaceholder(value)) return `Required env appears to be a placeholder: ${key}`;
    return [];
  });
}

function checkUrl(key, failures) {
  const value = process.env[key];
  if (!value) return;
  try {
    const parsed = new URL(value);
    if (!["https:", "http:"].includes(parsed.protocol)) {
      failures.push(`${key} must be an HTTP(S) URL`);
    }
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      failures.push(`${key} must use HTTPS in production`);
    }
  } catch {
    failures.push(`${key} must be a valid URL`);
  }
}

const required = keysForTarget();
const failures = checkRequired(required);
const warnings = [];

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

if ((target === "all" || target === "frontend" || target === "convex") && process.env.NODE_ENV !== "production") {
  failures.push("NODE_ENV must be production for production readiness");
}

checkUrl("NEXT_PUBLIC_APP_URL", failures);
checkUrl("NEXT_PUBLIC_FRONTEND_URL", failures);
checkUrl("NEXT_PUBLIC_LANDING_URL", failures);
checkUrl("NEXT_PUBLIC_CONVEX_URL", failures);
checkUrl("WORKOS_REDIRECT_URI", failures);
checkUrl("NEXT_PUBLIC_WORKOS_REDIRECT_URI", failures);
checkUrl("MPESA_CALLBACK_URL", failures);

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
    // Already reported by checkUrl.
  }
}

const report = {
  ok: failures.length === 0,
  target,
  loadedEnvFiles,
  failures,
  warnings,
  required: envReport(required),
  checkedAt: new Date().toISOString(),
};

printJsonAndExit(report);
