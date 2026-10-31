import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const baseRef = process.env.GITHUB_BASE_REF;
if (!baseRef) {
  console.error("GITHUB_BASE_REF is required to check pull request changes.");
  process.exit(2);
}

const base = `origin/${baseRef}`;
const changedFiles = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean);
const changesApplication = changedFiles.some((file) =>
  /^(frontend|convex|shared|mobile|packages|landing|scripts)\//.test(file) ||
  /^\.github\/workflows\//.test(file) ||
  /^(package\.json|package-lock\.json|next\.config\.(?:js|mjs|ts))$/.test(file)
);

const changesetFiles = changedFiles.filter(
  (file) => /^\.changeset\/.+\.md$/.test(file) && file !== ".changeset/README.md" && existsSync(file)
);
const packageChanged = changedFiles.includes("package.json");
const releaseManifestChanged = changedFiles.some((file) => /^release-notes\/\d+\.\d+\.\d+.*\.json$/.test(file));

if (packageChanged && releaseManifestChanged && !changesetFiles.length) {
  console.log("Versioned release pull request contains its generated release manifest.");
  process.exit(0);
}

if (!changesApplication) {
  console.log("No application changes require a Changeset.");
  process.exit(0);
}

if (!changesetFiles.length) {
  console.error("Application changes require one user-facing Changeset per distinct feature or fix.");
  process.exit(1);
}

const allowedBumps = new Set(["major", "minor", "patch"]);
const allowedTypes = new Set(["feature", "improvement", "fix", "breaking"]);
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

for (const file of changesetFiles) {
  const source = readFileSync(file, "utf8");
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) throw new Error(`${file} must have valid Changeset frontmatter.`);
  const fields = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([a-z]+):\s*(.*?)\s*$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value])
  );
  if (!allowedBumps.has(fields.edumyles))
    throw new Error(`${file} must declare edumyles with a major, minor, or patch bump.`);
  if (!allowedTypes.has(fields.type))
    throw new Error(`${file} must declare a supported user-facing type.`);
  const panels = (fields.panels ?? "").split(",").map((panel) => panel.trim()).filter(Boolean);
  if (!panels.length || panels.some((panel) => !allowedPanels.has(panel)))
    throw new Error(`${file} must list one or more supported panels.`);
  const [title, ...descriptionLines] = match[2].trim().split(/\r?\n/);
  if (!title?.trim() || !descriptionLines.join(" ").trim())
    throw new Error(`${file} must include a title and description separated by a blank line.`);
}

console.log(`Application changes include ${changesetFiles.length} valid Changeset(s).`);
