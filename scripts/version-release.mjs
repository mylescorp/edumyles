import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const changesetDir = join(root, ".changeset");
const changesetFiles = readdirSync(changesetDir)
  .filter((file) => file.endsWith(".md") && file !== "README.md")
  .sort();

if (!changesetFiles.length) {
  console.log("No Changesets found; there is no release to prepare.");
  process.exit(0);
}

const allowedBumps = new Set(["major", "minor", "patch"]);
const allowedTypes = new Set(["feature", "improvement", "fix", "breaking"]);
const changes = changesetFiles.map((file) => {
  const source = readFileSync(join(changesetDir, file), "utf8");
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) throw new Error(`${file} must have valid Changeset frontmatter.`);
  const fields = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([a-z]+):\s*(.*?)\s*$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value])
  );
  if (!allowedBumps.has(fields.edumyles)) throw new Error(`${file} has an invalid version bump.`);
  if (!allowedTypes.has(fields.type)) throw new Error(`${file} has an invalid update type.`);
  const panels = (fields.panels ?? "").split(",").map((panel) => panel.trim()).filter(Boolean);
  if (!panels.length) throw new Error(`${file} must list affected panels.`);

  const [title, ...descriptionLines] = match[2].trim().split(/\r?\n/);
  const description = descriptionLines.join(" ").trim();
  if (!title?.trim() || !description) throw new Error(`${file} needs a title and description.`);
  return {
    file,
    bump: fields.edumyles,
    entry: {
      title: title.trim(),
      description,
      type: fields.type,
      panels,
      tags: [],
    },
  };
});

const packageJsonPath = join(root, "package.json");
const lockJsonPath = join(root, "package-lock.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const current = packageJson.version.match(/^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/);
if (!current) throw new Error(`Cannot bump non-semantic app version ${packageJson.version}.`);

const rank = { patch: 0, minor: 1, major: 2 };
const bump = changes.reduce(
  (highest, change) => (rank[change.bump] > rank[highest] ? change.bump : highest),
  "patch"
);
let [major, minor, patch] = current.slice(1).map(Number);
if (bump === "major") [major, minor, patch] = [major + 1, 0, 0];
else if (bump === "minor") [major, minor, patch] = [major, minor + 1, 0];
else patch += 1;
const version = `${major}.${minor}.${patch}`;

const releasePath = join(root, "release-notes", `${version}.json`);
let manifest = { entries: [] };
try {
  manifest = JSON.parse(readFileSync(releasePath, "utf8"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
if (!Array.isArray(manifest.entries)) throw new Error(`${releasePath} must contain an entries array.`);
const titles = new Set(manifest.entries.map((entry) => entry.title.trim().toLowerCase()));
for (const change of changes) {
  if (titles.has(change.entry.title.toLowerCase()))
    throw new Error(`Release ${version} already contains a card titled “${change.entry.title}”.`);
  titles.add(change.entry.title.toLowerCase());
  manifest.entries.push(change.entry);
}

packageJson.version = version;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
const lockJson = JSON.parse(readFileSync(lockJsonPath, "utf8"));
lockJson.version = version;
if (lockJson.packages?.[""]) lockJson.packages[""].version = version;
writeFileSync(lockJsonPath, `${JSON.stringify(lockJson, null, 2)}\n`);
writeFileSync(releasePath, `${JSON.stringify(manifest, null, 2)}\n`);
for (const change of changes) rmSync(join(changesetDir, change.file));

console.log(`Prepared ${changes.length} What's new card(s) for release ${version}.`);
