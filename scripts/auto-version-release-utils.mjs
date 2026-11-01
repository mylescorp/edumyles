import { normalizeDisplayTitle } from "./whats-new-github-history-utils.mjs";

export const PANELS = [
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
];

const BUMP_RANK = { patch: 0, minor: 1, major: 2 };
export function nextSemanticVersion(current, bump) {
  const match = current.match(/^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/);
  if (!match) throw new Error(`Cannot bump non-semantic app version ${current}.`);
  if (!(bump in BUMP_RANK)) throw new Error(`Unsupported semantic version bump: ${bump}.`);
  let [major, minor, patch] = match.slice(1).map(Number);
  if (bump === "major") [major, minor, patch] = [major + 1, 0, 0];
  else if (bump === "minor") [major, minor, patch] = [major, minor + 1, 0];
  else patch += 1;
  return `${major}.${minor}.${patch}`;
}

export function highestBump(changes) {
  return changes.reduce(
    (highest, change) => (BUMP_RANK[change.bump] > BUMP_RANK[highest] ? change.bump : highest),
    "patch"
  );
}

export function parseChangeset(source, filename = "Changeset") {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) throw new Error(`${filename} must have valid Changeset frontmatter.`);
  const fields = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([a-z]+):\s*(.*?)\s*$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value])
  );
  if (!(fields.edumyles in BUMP_RANK))
    throw new Error(`${filename} must declare edumyles with a major, minor, or patch bump.`);
  if (!["feature", "improvement", "fix", "breaking"].includes(fields.type))
    throw new Error(`${filename} must declare a supported update type.`);
  const panels = (fields.panels ?? "")
    .split(",")
    .map((panel) => panel.trim())
    .filter(Boolean);
  if (!panels.length || panels.some((panel) => !PANELS.includes(panel)))
    throw new Error(`${filename} must list one or more supported panels.`);
  const [title, ...descriptionLines] = match[2].trim().split(/\r?\n/);
  const description = descriptionLines.join(" ").trim();
  if (!title?.trim() || !description)
    throw new Error(`${filename} needs a title and a description.`);
  return {
    bump: fields.edumyles,
    entry: { title: title.trim(), description, type: fields.type, panels, tags: [] },
  };
}

export function inferChange(title, changedPaths = []) {
  const firstLine = (title ?? "").split(/\r?\n/, 1)[0];
  const isBreaking =
    /^[a-z][\w-]*(?:\([^)]+\))?!:/i.test(firstLine) ||
    /(?:^|\s)BREAKING(?:\s+CHANGE)?:/i.test(firstLine);
  const type = isBreaking
    ? "breaking"
    : /^(?:fix|bug)(?:\([^)]*\))?!?(?::|\s)/i.test(firstLine)
      ? "fix"
      : /^(?:feat|feature)(?:\([^)]*\))?!?(?::|\s)/i.test(firstLine)
        ? "feature"
        : "improvement";
  const safeTitle = normalizeDisplayTitle(firstLine.replace(/\s*\(#\d+\)\s*$/, ""), type).slice(
    0,
    140
  );
  const panels = panelsForFiles(changedPaths);
  const description =
    type === "feature"
      ? "A new capability is available in the affected EduMyles panels."
      : type === "fix"
        ? "An issue has been fixed in the affected EduMyles panels."
        : type === "breaking"
          ? "This update may require teams to adjust their workflow."
          : "The affected EduMyles panels have been improved.";
  return {
    bump: type === "breaking" ? "major" : type === "feature" ? "minor" : "patch",
    entry: { title: safeTitle, description, type, panels, tags: [] },
  };
}

export function panelsForFiles(files) {
  const panels = new Set();
  let unknownScope = files.length === 0;
  for (const file of files) {
    const path = file.toLowerCase().replaceAll("\\", "/");
    if (
      path.startsWith("shared/") ||
      path.startsWith("packages/") ||
      path.startsWith("frontend/src/components/ui/") ||
      path.startsWith("frontend/src/components/whats-new/") ||
      path.startsWith("frontend/src/app/(")
    ) {
      return PANELS;
    }
    const portal = path.match(/(?:^|\/)portal\/([a-z-]+)(?:\/|$)/);
    const route = path.match(
      /(?:^|\/)(platform|admin|teacher|student|parent|alumni|partner|developer|affiliate|reseller)(?:\/|$)/
    );
    const panel = portal?.[1] ?? route?.[1];
    if (panel && PANELS.includes(panel)) panels.add(panel);
    else unknownScope = true;
  }
  if (unknownScope) panels.add("platform");
  return panels.size ? [...panels] : ["platform"];
}
