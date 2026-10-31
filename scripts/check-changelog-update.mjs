import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const baseRef = process.env.GITHUB_BASE_REF;
if (!baseRef) {
  console.error("GITHUB_BASE_REF is required to check pull request changes.");
  process.exit(2);
}

const base = `origin/${baseRef}`;
const allowedBumps = new Set(["major", "minor", "patch"]);
const allowedTypes = new Set(["feature", "improvement", "fix", "breaking"]);
const allowedPanels = new Set([
  "admin", "teacher", "student", "parent", "alumni", "partner", "developer", "affiliate", "reseller", "platform",
]);
const changedFiles = execFileSync("git", ["diff", "--name-status", `${base}...HEAD`], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => {
    const [status, file] = line.split("\t");
    return { status, file };
  });
const changedPaths = changedFiles.map(({ file }) => file);
const changesApplication = changedFiles.some((file) =>
  /^(frontend|convex|shared|mobile|packages|landing|scripts)\//.test(file.file) ||
  /^\.github\/workflows\//.test(file.file) ||
  /^(package\.json|package-lock\.json|next\.config\.(?:js|mjs|ts))$/.test(file.file)
);

const changesetFiles = changedFiles.filter(
  ({ file, status }) => /^\.changeset\/.+\.md$/.test(file) && file !== ".changeset/README.md" && status !== "D" && existsSync(file)
);
const packageChanged = changedPaths.includes("package.json");
const releaseManifestFiles = changedPaths.filter((file) => /^release-notes\/\d+\.\d+\.\d+.*\.json$/.test(file));

if (packageChanged && releaseManifestFiles.length) {
  const allowedGeneratedFiles = new Set(["package.json", "package-lock.json", ...releaseManifestFiles]);
  const deletedChangesets = changedFiles.filter(
    ({ file, status }) => status === "D" && /^\.changeset\/.+\.md$/.test(file) && file !== ".changeset/README.md"
  );
  const isGeneratedRelease =
    releaseManifestFiles.length === 1 &&
    deletedChangesets.length > 0 &&
    changedFiles.every(({ file, status }) =>
      allowedGeneratedFiles.has(file) ||
      (status === "D" && /^\.changeset\/.+\.md$/.test(file) && file !== ".changeset/README.md")
    );
  if (isGeneratedRelease) {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const releaseVersion = releaseManifestFiles[0].match(/^release-notes\/(\d+\.\d+\.\d+).*\.json$/)?.[1];
    const manifest = JSON.parse(readFileSync(releaseManifestFiles[0], "utf8"));
    if (packageJson.version !== releaseVersion || !Array.isArray(manifest.entries))
      throw new Error("Generated release package version must match its versioned manifest.");
    const releasedTitles = new Set(manifest.entries.map((entry) => entry.title.trim().toLowerCase()));
    for (const { file } of deletedChangesets) {
      const source = execFileSync("git", ["show", `${base}:${file}`], { encoding: "utf8" });
      const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
      const title = match?.[2]?.trim().split(/\r?\n/)[0]?.trim();
      if (!title || !releasedTitles.has(title.toLowerCase()))
        throw new Error(`${file} must be represented by a card in the generated release manifest.`);
    }
    for (const entry of manifest.entries) {
      if (!entry.title?.trim() || !entry.description?.trim() || !["feature", "improvement", "fix", "breaking"].includes(entry.type))
        throw new Error(`${releaseManifestFiles[0]} contains an invalid release card.`);
      if (!Array.isArray(entry.panels) || entry.panels.length === 0 || entry.panels.some((panel) => !allowedPanels.has(panel)))
        throw new Error(`${releaseManifestFiles[0]} contains an invalid panel audience.`);
    }
    console.log("Generated release files have a matching semantic version and valid release cards.");
    process.exit(0);
  }
}

if (!changesApplication && !changesetFiles.length) {
  console.log("No application changes require a Changeset.");
  process.exit(0);
}

if (!changesetFiles.length) {
  console.error("Application changes require one user-facing Changeset per distinct feature or fix.");
  process.exit(1);
}

for (const { file } of changesetFiles) {
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
