#!/usr/bin/env node

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

const checks = [
  {
    name: "Stripe",
    required: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "CONVEX_WEBHOOK_SECRET"],
    webhookPath: "/api/webhooks/stripe",
  },
  {
    name: "M-Pesa",
    required: [
      "MPESA_CONSUMER_KEY",
      "MPESA_CONSUMER_SECRET",
      "MPESA_SHORTCODE",
      "MPESA_PASSKEY",
      "MPESA_CALLBACK_URL",
      "CONVEX_WEBHOOK_SECRET",
    ],
    webhookUrl: process.env.MPESA_CALLBACK_URL,
  },
  {
    name: "Airtel",
    required: ["AIRTEL_WEBHOOK_SECRET", "CONVEX_WEBHOOK_SECRET"],
    webhookPath: "/api/webhooks/airtel",
  },
];

function missing(keys) {
  return keys.filter((key) => !process.env[key]?.trim());
}

async function probeWebhook(name, url) {
  if (!url) {
    return { name, ok: false, reason: "No webhook URL configured" };
  }

  try {
    const response = await fetch(url, { method: "OPTIONS", redirect: "manual" });
    return {
      name,
      ok: response.status < 500,
      status: response.status,
      url,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      url,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

if (!appUrl) {
  console.error("NEXT_PUBLIC_APP_URL is required");
  process.exit(1);
}

const results = [];
let failed = false;

for (const check of checks) {
  const missingKeys = missing(check.required);
  if (missingKeys.length > 0) {
    failed = true;
    results.push({
      name: check.name,
      ok: false,
      missing: missingKeys,
    });
    continue;
  }

  const webhookUrl = check.webhookUrl ?? `${appUrl}${check.webhookPath}`;
  const probe = await probeWebhook(check.name, webhookUrl);
  if (!probe.ok) {
    failed = true;
  }
  results.push(probe);
}

console.log(JSON.stringify({ ok: !failed, results, checkedAt: new Date().toISOString() }, null, 2));

if (failed) {
  process.exitCode = 1;
}
