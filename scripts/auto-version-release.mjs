import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import {
  highestBump,
  inferChange,
  nextSemanticVersion,
  parseChangeset,
} from "./auto-version-release-utils.mjs";

const root = process.cwd();
const releaseDirectory = join(root, "release-notes");
const repo = process.env.GITHUB_REPOSITORY;

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function git(...args) {
  return run("git", args);
}

function gh(...args) {
  return run("gh", args);
}

function readEvent() {
  const path = process.env.GITHUB_EVENT_PATH;
  if (!path || !existsSync(path)) throw new Error("GitHub Actions event payload is unavailable.");
  return JSON.parse(readFileSync(path, "utf8"));
}

function changedFilesForPullRequest(number) {
  return gh("api", "--paginate", `repos/${repo}/pulls/${number}/files`, "--jq", ".[] | .filename")
    .split(/\r?\n/)
    .map((path) => path.trim())
    .filter(Boolean);
}

function sourceForChangeset(path, commit) {
  try {
    return git("show", `${commit}:${path}`);
  } catch {
    return null;
  }
}

function manifestForSource(sourceId) {
  for (const filename of readdirSync(releaseDirectory).filter((name) =>
    /^\d+\.\d+\.\d+.*\.json$/.test(name)
  )) {
    const manifest = JSON.parse(readFileSync(join(releaseDirectory, filename), "utf8"));
    if (manifest.sourceId === sourceId) {
      return { version: filename.replace(/\.json$/, ""), manifest };
    }
  }
  return null;
}

function changesetsFor(unit) {
  return unit.changedFiles
    .filter((path) => /^\.changeset\/.+\.md$/.test(path) && path !== ".changeset/README.md")
    .map((path) => ({ path, source: sourceForChangeset(path, unit.commit) }))
    .filter(({ source }) => source !== null)
    .map(({ path, source }) => ({ path, ...parseChangeset(source, path) }));
}

function entriesFor(unit, changesets) {
  if (changesets.length) return changesets.map(({ entry }) => entry);
  return [inferChange(unit.title, unit.changedFiles).entry];
}

function bumpFor(unit, changesets) {
  return changesets.length
    ? highestBump(changesets)
    : inferChange(unit.title, unit.changedFiles).bump;
}

function updateVersionFiles(version, manifest, changesets) {
  const packagePath = join(root, "package.json");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  packageJson.version = version;
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const lockPath = join(root, "package-lock.json");
  const lockJson = JSON.parse(readFileSync(lockPath, "utf8"));
  lockJson.version = version;
  if (lockJson.packages?.[""]) lockJson.packages[""].version = version;
  writeFileSync(lockPath, `${JSON.stringify(lockJson, null, 2)}\n`);

  writeFileSync(
    join(releaseDirectory, `${version}.json`),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  for (const { path } of changesets) rmSync(join(root, path), { force: true });
}

function sourceCommitForManifest(version) {
  return git("log", "-1", "--format=%H", "--", `release-notes/${version}.json`);
}

function githubReleaseForTag(tag) {
  try {
    return JSON.parse(gh("api", `repos/${repo}/releases/tags/${tag}`));
  } catch {
    return null;
  }
}

function releaseNotes(manifest) {
  return manifest.entries.map((entry) => `### ${entry.title}\n\n${entry.description}`).join("\n\n");
}

function ensureGithubRelease(version, manifest) {
  const tag = `v${version}`;
  const existing = githubReleaseForTag(tag);
  if (existing) return existing;
  const target = sourceCommitForManifest(version);
  gh(
    "release",
    "create",
    tag,
    "--target",
    target,
    "--title",
    `${tag} — EduMyles Updates`,
    "--notes",
    releaseNotes(manifest)
  );
  const created = githubReleaseForTag(tag);
  if (!created) throw new Error(`GitHub did not return the newly created ${tag} release.`);
  return created;
}

function publishRelease(release) {
  const eventPath = join(tmpdir(), `edumyles-release-event-${process.pid}.json`);
  writeFileSync(eventPath, JSON.stringify({ release }));
  try {
    execFileSync(process.execPath, [join(root, "scripts/publish-whats-new-release.mjs")], {
      encoding: "utf8",
      stdio: "inherit",
      env: { ...process.env, GITHUB_EVENT_PATH: eventPath },
    });
  } finally {
    rmSync(eventPath, { force: true });
  }
}

function ensurePublishedRelease(version, manifest) {
  const release = ensureGithubRelease(version, manifest);
  if (!release.published_at) throw new Error(`GitHub release v${version} is not published.`);
  publishRelease(release);
}

function makeManifest(unit, version, changesets) {
  return {
    sourceId: unit.sourceId,
    sourceCommit: unit.commit,
    entries: entriesFor(unit, changesets),
  };
}

function createUnitForPullRequest(event) {
  const pullRequest = event.pull_request;
  const commit = pullRequest.merge_commit_sha;
  return {
    sourceId: `pull-request:${pullRequest.number}`,
    commit,
    title: pullRequest.title ?? "Product update",
    changedFiles: changedFilesForPullRequest(pullRequest.number),
  };
}

function hasMergedPullRequest(commit) {
  const associated = JSON.parse(
    gh("api", "-H", "Accept: application/vnd.github+json", `repos/${repo}/commits/${commit}/pulls`)
  );
  return associated.some(
    (pullRequest) => pullRequest.merged_at && pullRequest.base?.ref === "main"
  );
}

function createUnitsForPush(event) {
  return (event.commits ?? []).map((commit) => ({
    sourceId: `commit:${commit.id}`,
    commit: commit.id,
    title: commit.message ?? "Product update",
    changedFiles: [...(commit.added ?? []), ...(commit.modified ?? []), ...(commit.removed ?? [])],
  }));
}

function releaseCommitExists(sourceId) {
  const existing = manifestForSource(sourceId);
  if (!existing) return null;
  return existing;
}

function updateMainCheckout() {
  git("fetch", "origin", "main");
  git("reset", "--hard", "origin/main");
}

function processUnit(unit) {
  const previouslyReleased = releaseCommitExists(unit.sourceId);
  if (previouslyReleased) {
    ensurePublishedRelease(previouslyReleased.version, previouslyReleased.manifest);
    console.log(`Verified existing release v${previouslyReleased.version} for ${unit.sourceId}.`);
    return;
  }

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    updateMainCheckout();
    const existing = releaseCommitExists(unit.sourceId);
    if (existing) {
      ensurePublishedRelease(existing.version, existing.manifest);
      console.log(`Verified existing release v${existing.version} for ${unit.sourceId}.`);
      return;
    }

    const changesets = changesetsFor(unit);
    const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const version = nextSemanticVersion(packageJson.version, bumpFor(unit, changesets));
    const manifest = makeManifest(unit, version, changesets);
    updateVersionFiles(version, manifest, changesets);
    git("config", "user.name", "github-actions[bot]");
    git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com");
    git("add", "package.json", "package-lock.json", `release-notes/${version}.json`);
    for (const { path } of changesets) git("add", "--", path);
    git(
      "commit",
      "-m",
      `chore(release): v${version} [skip ci]`,
      "-m",
      `Automated release for ${unit.sourceId}.`
    );
    try {
      git("push", "origin", "HEAD:main");
    } catch (error) {
      if (attempt === 5) throw error;
      updateMainCheckout();
      continue;
    }
    ensurePublishedRelease(version, manifest);
    console.log(`Published v${version} for ${unit.sourceId}.`);
    return;
  }
}

function main() {
  if (!repo) throw new Error("GITHUB_REPOSITORY is required.");
  const event = readEvent();
  if (process.env.GITHUB_EVENT_NAME === "pull_request") {
    if (!event.pull_request?.merged || event.pull_request.base?.ref !== "main") return;
    processUnit(createUnitForPullRequest(event));
    return;
  }
  if (process.env.GITHUB_EVENT_NAME !== "push")
    throw new Error(`Unsupported GitHub event: ${process.env.GITHUB_EVENT_NAME ?? "unknown"}.`);

  for (const unit of createUnitsForPush(event)) {
    if (hasMergedPullRequest(unit.commit)) {
      console.log(`Skipping ${unit.sourceId}; its pull request is released by the merge event.`);
      continue;
    }
    processUnit(unit);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error?.message ?? "Automatic release failed.");
    process.exitCode = 1;
  });
}

export { bumpFor, entriesFor, makeManifest };
