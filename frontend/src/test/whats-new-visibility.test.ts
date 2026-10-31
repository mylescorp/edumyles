import { describe, expect, it } from "vitest";
import { isVisibleTo } from "../../../convex/platform/changelog/visibility";

describe("What's new panel visibility", () => {
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
});
