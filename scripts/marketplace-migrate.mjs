import { readFile } from "node:fs/promises";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const sessionToken = process.env.PLATFORM_SESSION_TOKEN;
const snapshotPath = process.env.MARKETPLACE_LEGACY_SNAPSHOT;
const dryRun = process.env.DRY_RUN !== "false";

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required");
}

if (!sessionToken) {
  throw new Error("PLATFORM_SESSION_TOKEN is required");
}

const client = new ConvexHttpClient(convexUrl);

let result;
if (snapshotPath) {
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  result = await client.mutation(api.modules.marketplace.migration.importLegacyMarketplaceSnapshot, {
    sessionToken,
    dryRun,
    moduleRegistry: snapshot.moduleRegistry ?? [],
    installedModules: snapshot.installedModules ?? [],
    moduleRequests: snapshot.moduleRequests ?? [],
  });
} else {
  result = await client.mutation(api.modules.marketplace.migration.repairCanonicalMarketplaceData, {
    sessionToken,
    dryRun,
  });
}

console.log(JSON.stringify(result, null, 2));
