const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM_EMAIL?.trim();
const to = process.env.RESEND_SMOKE_TO?.trim();

if (!apiKey) {
  console.error("Missing RESEND_API_KEY");
  process.exit(1);
}

if (!from) {
  console.error("Missing RESEND_FROM_EMAIL");
  process.exit(1);
}

if (!to) {
  console.error("Missing RESEND_SMOKE_TO");
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
  console.error("Resend smoke test failed");
  console.error(JSON.stringify(payload ?? { status: response.status }, null, 2));
  process.exit(1);
}

console.log("Resend smoke test sent successfully");
console.log(JSON.stringify(payload, null, 2));
