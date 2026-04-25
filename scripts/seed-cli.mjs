import { ConvexHttpClient } from "convex/browser";
import { randomUUID } from "node:crypto";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required to seed data");
}

if (!webhookSecret) {
  throw new Error("CONVEX_WEBHOOK_SECRET is required to seed data");
}

const suffix = randomUUID().slice(0, 8);
const tenantName = process.env.SEED_TENANT_NAME ?? `EduMyles Seed School ${suffix}`;
const subdomain = process.env.SEED_TENANT_SUBDOMAIN ?? `seed-${suffix}`;
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? `seed-admin+${suffix}@example.com`;
const mode = process.env.SEED_MODE;
const pilotDays = process.env.SEED_PILOT_DAYS ? Number(process.env.SEED_PILOT_DAYS) : undefined;

const client = new ConvexHttpClient(convexUrl);
const result = await client.action(api.dev.seed.seedDevData, {
  webhookSecret,
  tenantName,
  subdomain,
  adminEmail,
  mode,
  pilotDays,
});

console.log(JSON.stringify(result, null, 2));
