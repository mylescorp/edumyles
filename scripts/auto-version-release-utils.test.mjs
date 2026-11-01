import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { changedFilesForCommit, commitIdsForPush } from "./auto-version-release.mjs";
import {
  highestBump,
  inferChange,
  nextSemanticVersion,
  parseChangeset,
} from "./auto-version-release-utils.mjs";

test("increments semantic versions using the strongest Changeset bump", () => {
  assert.equal(
    nextSemanticVersion("0.2.0", highestBump([{ bump: "patch" }, { bump: "minor" }])),
    "0.3.0"
  );
  assert.equal(nextSemanticVersion("0.2.0", "patch"), "0.2.1");
  assert.equal(nextSemanticVersion("0.2.0", "major"), "1.0.0");
});

test("parses a Changeset as one release card", () => {
  const change = parseChangeset(
    [
      "---",
      "edumyles: minor",
      "type: feature",
      "panels: teacher, student",
      "---",
      "New learning tools",
      "",
      "Teachers can share resources with their classes.",
    ].join("\n"),
    "learning-tools.md"
  );

  assert.deepEqual(change, {
    bump: "minor",
    entry: {
      title: "New learning tools",
      description: "Teachers can share resources with their classes.",
      type: "feature",
      panels: ["teacher", "student"],
      tags: [],
    },
  });
});

test("creates a safe platform-scoped patch card for an unclassified direct commit", () => {
  assert.deepEqual(inferChange("chore: update CI cache", [".github/workflows/ci.yml"]), {
    bump: "patch",
    entry: {
      title: "update CI cache",
      description: "The affected EduMyles panels have been improved.",
      type: "improvement",
      panels: ["platform"],
      tags: [],
    },
  });
});

test("uses semantic feature prefixes and infers the affected panel", () => {
  assert.deepEqual(
    inferChange("feat: New timetable #42 @contributor", [
      "frontend/src/app/teacher/timetable/page.tsx",
    ]),
    {
      bump: "minor",
      entry: {
        title: "New timetable",
        description: "A new capability is available in the affected EduMyles panels.",
        type: "feature",
        panels: ["teacher"],
        tags: [],
      },
    }
  );
});

test("creates a major release for a breaking conventional commit", () => {
  const change = inferChange("feat!: Replace the old billing contract", [
    "frontend/src/app/admin/billing/page.tsx",
  ]);
  assert.equal(change.bump, "major");
  assert.equal(change.entry.type, "breaking");
  assert.equal(change.entry.panels[0], "admin");
});

test("does not interpret non-breaking as a major bump", () => {
  const change = inferChange("fix: preserve non-breaking spaces in reports", [
    "frontend/src/app/admin/reports/page.tsx",
  ]);
  assert.equal(change.bump, "patch");
  assert.equal(change.entry.type, "fix");
});

test("hides PR references without a hash from customer-facing release titles", () => {
  const change = inferChange("chore: follow up PR 123", ["frontend/src/app/admin/page.tsx"]);
  assert.equal(change.entry.title, "Product improvement");
});

test("the release script entry point exits successfully after a valid empty push", () => {
  const directory = mkdtempSync(join(tmpdir(), "edumyles-release-entry-"));
  const eventPath = join(directory, "event.json");
  writeFileSync(eventPath, JSON.stringify({ before: "0".repeat(40), after: "", commits: [] }));
  try {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL("./auto-version-release.mjs", import.meta.url))],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          GITHUB_EVENT_NAME: "push",
          GITHUB_EVENT_PATH: eventPath,
          GITHUB_REPOSITORY: "mylescorp/edumyles",
        },
      }
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("push processing enumerates commits and their files from Git history", () => {
  const directory = mkdtempSync(join(tmpdir(), "edumyles-release-git-"));
  const git = (...args) => execFileSync("git", args, { cwd: directory, encoding: "utf8" }).trim();
  try {
    git("init", "--initial-branch=main");
    git("config", "user.name", "Release test");
    git("config", "user.email", "release-test@example.invalid");
    mkdirSync(join(directory, "frontend/src/app/admin"), { recursive: true });
    writeFileSync(join(directory, "frontend/src/app/admin/page.tsx"), "export {}\n");
    git("add", ".");
    git("commit", "-m", "initial");
    const before = git("rev-parse", "HEAD");

    mkdirSync(join(directory, ".changeset"));
    writeFileSync(join(directory, ".changeset/release-note.md"), "---\nedumyles: minor\n---\n");
    writeFileSync(
      join(directory, "frontend/src/app/admin/page.tsx"),
      "export const updated = true\n"
    );
    git("add", ".");
    git("commit", "-m", "feat: add admin capability");
    const after = git("rev-parse", "HEAD");

    const runGit = (...args) => git(...args);
    assert.deepEqual(commitIdsForPush({ before, after }, runGit), [after]);
    assert.deepEqual(changedFilesForCommit(after, runGit), [
      ".changeset/release-note.md",
      "frontend/src/app/admin/page.tsx",
    ]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
