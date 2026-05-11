#!/usr/bin/env node

import { loadEnvFiles, parseArgs } from "./lib/env.mjs";

const args = parseArgs();
loadEnvFiles(args.envFiles);

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM_EMAIL?.trim();
const to = process.env.RESEND_SMOKE_TO?.trim();
const failures = [];

if (!apiKey) failures.push("Missing RESEND_API_KEY");
if (!from) failures.push("Missing RESEND_FROM_EMAIL");
if (!to) failures.push("Missing RESEND_SMOKE_TO");

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, provider: "Resend", failures }, null, 2));
  process.exit(1);
}

const subject = `EduMyles Resend smoke test ${new Date().toISOString()}`;
const text = [
  "EduMyles production Resend smoke test.",
  "",
  `From: ${from}`,
  `To: ${to}`,
  `Timestamp: ${new Date().toISOString()}`,
].join("\n");

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject,
    text,
  }),
});

const payload = await response.json().catch(() => null);

if (!response.ok) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        provider: "Resend",
        status: response.status,
        response: payload ?? null,
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      provider: "Resend",
      to,
      response: payload,
      checkedAt: new Date().toISOString(),
    },
    null,
    2
  )
);
