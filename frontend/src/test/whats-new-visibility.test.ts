import { describe, expect, it } from "vitest";
import { historyAudienceKey, isVisibleTo } from "../../../convex/platform/changelog/visibility";
import {
  classifyType,
  displayDescription,
  normalizeDisplayTitle,
  panelsForFiles,
} from "../../../scripts/whats-new-github-history-utils.mjs";

describe("What's new panel visibility", () => {
  it("stores unread snapshots separately for each panel and all-panel access", () => {
    expect(historyAudienceKey({ panel: "teacher", canSeeAllPanels: false })).toBe("panel:teacher");
    expect(historyAudienceKey({ panel: "admin", canSeeAllPanels: false })).toBe("panel:admin");
    expect(historyAudienceKey({ panel: "platform", canSeeAllPanels: true })).toBe("all");
  });

  it("keeps panel releases out of other tenant panels", () => {
    const teacher = { panel: "teacher", workspaceId: "TENANT-1", canSeeAllPanels: false };
    expect(isVisibleTo({ panels: ["teacher"], workspaceIds: undefined }, teacher)).toBe(true);
    expect(isVisibleTo({ panels: ["admin"] }, teacher)).toBe(false);
    expect(isVisibleTo({ panels: ["platform"] }, teacher)).toBe(false);
  });

  it("lets the Platform panel see every panel and workspace release", () => {
    const platform = { panel: "platform", workspaceId: "PLATFORM", canSeeAllPanels: true };
    expect(isVisibleTo({ panels: ["teacher"], workspaceIds: ["TENANT-1"] }, platform)).toBe(true);
    expect(isVisibleTo({ panels: ["admin"] }, platform)).toBe(true);
  });

  it("limits workspace-targeted entries to the selected workspace for tenant panels", () => {
    const tenant = { panel: "admin", workspaceId: "TENANT-1", canSeeAllPanels: false };
    expect(isVisibleTo({ panels: ["admin"], workspaceIds: ["TENANT-1"] }, tenant)).toBe(true);
    expect(isVisibleTo({ panels: ["admin"], workspaceIds: ["TENANT-2"] }, tenant)).toBe(false);
    expect(isVisibleTo({ panels: ["admin"] }, tenant)).toBe(true);
  });

  it("supports updates that target more than one panel", () => {
    expect(
      isVisibleTo(
        { panels: ["admin", "teacher"] },
        { panel: "teacher", workspaceId: "TENANT-1", canSeeAllPanels: false }
      )
    ).toBe(true);
  });

  it("keeps merged history with unknown panel scope visible only to Platform", () => {
    const historyEntry = { panels: panelsForFiles(["scripts/a-new-integration.mjs"]) };
    expect(
      isVisibleTo(historyEntry, {
        panel: "teacher",
        workspaceId: "TENANT-1",
        canSeeAllPanels: false,
      })
    ).toBe(false);
    expect(
      isVisibleTo(historyEntry, {
        panel: "platform",
        workspaceId: "PLATFORM",
        canSeeAllPanels: true,
      })
    ).toBe(true);
  });

  it("keeps breaking conventional commit titles in the breaking category", () => {
    expect(classifyType({ title: "feat(finance)!: remove legacy exports" })).toBe("breaking");
    expect(classifyType({ title: "feat!: remove legacy exports" })).toBe("breaking");
    expect(classifyType({ title: "fix!: remove legacy exports" })).toBe("breaking");
    expect(normalizeDisplayTitle("feat(finance)!: remove legacy exports", "breaking")).toBe(
      "remove legacy exports"
    );
  });

  it("recognizes plain-language fix and feature titles", () => {
    expect(classifyType({ title: "Fix invoice export" })).toBe("fix");
    expect(classifyType({ title: "Feature bulk import" })).toBe("feature");
  });

  it("uses safe generic text when PR copy contains contributor or ticket details", () => {
    expect(normalizeDisplayTitle("Replace export flow by Jane Smith", "feature")).toBe(
      "New product capability"
    );
    expect(normalizeDisplayTitle("Jane Smith adds invoice exports", "feature")).toBe(
      "New product capability"
    );
    expect(normalizeDisplayTitle("Fix export flow by Jane", "fix")).toBe("Product fix");
    expect(normalizeDisplayTitle("Fix invoice export PR 123", "fix")).toBe("Product fix");
    expect(displayDescription("feature")).not.toContain("Jane Smith");
  });

  it("routes unknown files only to Platform and known portal paths to their panel", () => {
    expect(panelsForFiles(["scripts/a-new-integration.mjs"])).toEqual(["platform"]);
    expect(panelsForFiles(["frontend/src/app/portal/teacher/reports/page.tsx"])).toEqual([
      "teacher",
    ]);
  });
});
