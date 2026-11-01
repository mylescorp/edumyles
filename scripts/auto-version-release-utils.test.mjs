import test from "node:test";
import assert from "node:assert/strict";
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
