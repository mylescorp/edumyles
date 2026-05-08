#!/usr/bin/env node

const apiKey = process.env.AT_API_KEY ?? process.env.AFRICAS_TALKING_API_KEY;
const username = process.env.AT_USERNAME ?? process.env.AFRICAS_TALKING_USERNAME;
const smokeTo = process.env.SMS_SMOKE_TO;
const senderId = process.env.AT_SENDER_ID ?? process.env.AFRICAS_TALKING_SENDER_ID;

const failures = [];

if (!apiKey) failures.push("Missing AT_API_KEY or AFRICAS_TALKING_API_KEY");
if (!username) failures.push("Missing AT_USERNAME or AFRICAS_TALKING_USERNAME");
if (!smokeTo) failures.push("Missing SMS_SMOKE_TO");

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

const body = new URLSearchParams({
  username,
  to: smokeTo,
  message: `EduMyles production SMS smoke check ${new Date().toISOString()}`,
});

if (senderId) {
  body.set("from", senderId);
}

try {
  const response = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apiKey,
    },
    body,
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = text;
  }

  const ok = response.ok;
  console.log(
    JSON.stringify(
      {
        ok,
        provider: "Africa's Talking",
        status: response.status,
        recipient: smokeTo,
        response: payload,
        checkedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  if (!ok) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        provider: "Africa's Talking",
        reason: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
}
