import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const eventPath = process.env.GITHUB_EVENT_PATH;
const deployKey = process.env.CONVEX_DEPLOY_KEY;
const releaseSecret = process.env.WHATS_NEW_RELEASE_SECRET;
if (!eventPath || !deployKey || !releaseSecret) {
  throw new Error(
    "Release publication needs the GitHub event, Convex deploy key, and publisher secret."
  );
}

const event = JSON.parse(readFileSync(eventPath, "utf8"));
const release = event.release;
const tag = release?.tag_name;
const version = tag?.replace(/^v/, "");
if (!release?.published_at || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version ?? "")) {
  throw new Error(
    "Published GitHub release must have a semantic version tag and publication date."
  );
}

const manifest = JSON.parse(readFileSync(join("release-notes", `${version}.json`), "utf8"));
const allowedPanels = new Set([
  "admin",
  "teacher",
  "student",
  "parent",
  "alumni",
  "partner",
  "developer",
  "affiliate",
  "reseller",
  "platform",
]);
const allowedTypes = new Set(["feature", "improvement", "fix", "breaking"]);
if (!Array.isArray(manifest.entries) || manifest.entries.length === 0)
  throw new Error("Release manifest must contain at least one entry.");
for (const entry of manifest.entries) {
  if (!entry.title?.trim() || !entry.description?.trim() || !allowedTypes.has(entry.type))
    throw new Error("Every update needs a title, description, and supported category.");
  if (
    !Array.isArray(entry.panels) ||
    entry.panels.length === 0 ||
    entry.panels.some((panel) => !allowedPanels.has(panel))
  )
    throw new Error("Every update must target at least one supported panel.");
  for (const link of entry.links ?? []) {
    if (
      !link.label?.trim() ||
      !link.url ||
      (!link.url.startsWith("/") && !link.url.startsWith("https://"))
    )
      throw new Error("Update links must be labelled HTTPS URLs or relative application paths.");
  }
}

const args = JSON.stringify({
  releaseSecret,
  releaseKey: tag,
  version,
  date: Date.parse(release.published_at),
  entries: manifest.entries,
});
try {
  const result = execFileSync(
    "npx",
    ["convex", "run", "platform/changelog/release:publishReleaseManifest", args],
    {
      encoding: "utf8",
      env: { ...process.env, CONVEX_DEPLOY_KEY: deployKey },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  process.stdout.write(result);
} catch (error) {
  const stderr = error?.stderr?.toString?.().replaceAll(releaseSecret, "[REDACTED]");
  throw new Error(stderr || "Convex rejected the release publication. Credentials were redacted.");
}
