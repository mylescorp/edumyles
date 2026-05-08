#!/usr/bin/env node

const apiKey = process.env.CALCOM_API_KEY;
const apiBase = process.env.CALCOM_API_BASE ?? "https://api.cal.com/v2";
const embedOrigin = process.env.NEXT_PUBLIC_CALCOM_EMBED_ORIGIN ?? "https://app.cal.com";
const demoLink = process.env.NEXT_PUBLIC_CALCOM_DEMO_LINK;
const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? process.env.LANDING_URL;
const webhookSecret = process.env.CALCOM_WEBHOOK_SECRET;
const shouldCreate = process.argv.includes("--create");

const triggers = [
  "BOOKING_CREATED",
  "BOOKING_RESCHEDULED",
  "BOOKING_CANCELLED",
  "MEETING_STARTED",
  "MEETING_ENDED",
];

function fail(message) {
  throw new Error(message);
}

let subscriberUrl;
let embedUrl;

async function calFetch(path, init = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return json;
}

try {
  if (!apiKey) fail("CALCOM_API_KEY is required.");
  if (!landingUrl) fail("NEXT_PUBLIC_LANDING_URL or LANDING_URL is required.");
  if (!demoLink) fail("NEXT_PUBLIC_CALCOM_DEMO_LINK is required.");

  subscriberUrl = new URL("/api/webhooks/cal/demo", landingUrl).toString();
  embedUrl = new URL(`/${demoLink.replace(/^\/+/, "")}/embed`, embedOrigin);
  embedUrl.searchParams.set("embedType", "inline");
  embedUrl.searchParams.set(
    "embed",
    process.env.NEXT_PUBLIC_CALCOM_DEMO_NAMESPACE ?? "edumyles-demo"
  );

  const embedResponse = await fetch(embedUrl, { redirect: "follow" });
  if (!embedResponse.ok) {
    fail(
      `Demo booking link is not reachable (${embedResponse.status}). Check NEXT_PUBLIC_CALCOM_DEMO_LINK=${demoLink}.`
    );
  }

  const webhooks = await calFetch("/webhooks");
  const existing = (webhooks.data ?? []).find(
    (webhook) => webhook.subscriberUrl === subscriberUrl
  );

  if (!existing && !shouldCreate) {
    fail(
      `No active webhook found for ${subscriberUrl}. Re-run with --create after setting CALCOM_WEBHOOK_SECRET.`
    );
  }

  if (!existing && shouldCreate) {
    if (!webhookSecret) fail("CALCOM_WEBHOOK_SECRET is required when using --create.");
    const created = await calFetch("/webhooks", {
      method: "POST",
      body: JSON.stringify({
        active: true,
        subscriberUrl,
        triggers,
        secret: webhookSecret,
        version: "2021-10-20",
      }),
    });
    console.log(`Created Cal.com webhook ${created.data?.id ?? "(unknown id)"} for ${subscriberUrl}`);
    process.exitCode = 0;
  } else {
    if (!existing.active) {
      fail(`Webhook ${existing.id} exists for ${subscriberUrl}, but it is not active.`);
    }

    const missingTriggers = triggers.filter((trigger) => !existing.triggers?.includes(trigger));
    if (missingTriggers.length > 0) {
      fail(`Webhook ${existing.id} is missing triggers: ${missingTriggers.join(", ")}`);
    }

    console.log(
      `Demo booking link is reachable and webhook ${existing.id} is active for ${subscriberUrl}`
    );
  }
} catch (error) {
  console.error(
    `Cal.com production check failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
}
