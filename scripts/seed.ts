import { ConvexHttpClient } from "convex/browser";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { api } from "../convex/_generated/api";

type SeedOptions = {
  convexUrl?: string;
  webhookSecret?: string;
  tenantName?: string;
  subdomain?: string;
  adminEmail?: string;
};

export async function seedDevData(options: SeedOptions = {}) {
  const convexUrl = options.convexUrl ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  const webhookSecret = options.webhookSecret ?? process.env.CONVEX_WEBHOOK_SECRET;

  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is required to seed data");
  }

  if (!webhookSecret) {
    throw new Error("CONVEX_WEBHOOK_SECRET is required to seed data");
  }

  const suffix = randomUUID().slice(0, 8);
  const tenantName = options.tenantName ?? `EduMyles Seed School ${suffix}`;
  const subdomain = options.subdomain ?? `seed-${suffix}`;
  const adminEmail = options.adminEmail ?? `seed-admin+${suffix}@example.com`;

  const client = new ConvexHttpClient(convexUrl);

  return await client.action(api.dev.seed.seedDevData, {
    webhookSecret,
    tenantName,
    subdomain,
    adminEmail,
  });
}

async function main() {
  const result = await seedDevData();
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
