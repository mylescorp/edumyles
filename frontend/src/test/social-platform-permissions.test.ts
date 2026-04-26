import { describe, expect, it } from "vitest";
import { PERMISSIONS, SYSTEM_ROLE_PERMISSIONS } from "../../../convex/shared/permissions";

describe("social platform permissions", () => {
  it("registers all social permission keys", () => {
    expect(PERMISSIONS["social.view"]).toBeDefined();
    expect(PERMISSIONS["social.create"]).toBeDefined();
    expect(PERMISSIONS["social.approve"]).toBeDefined();
    expect(PERMISSIONS["social.manage_accounts"]).toBeDefined();
    expect(PERMISSIONS["social.view_analytics"]).toBeDefined();
    expect(PERMISSIONS["social.manage_comments"]).toBeDefined();
  });

  it("assigns social permissions to the intended system roles", () => {
    expect(SYSTEM_ROLE_PERMISSIONS.platform_manager).toEqual(
      expect.arrayContaining([
        "social.view",
        "social.create",
        "social.approve",
        "social.manage_accounts",
        "social.view_analytics",
        "social.manage_comments",
      ])
    );

    expect(SYSTEM_ROLE_PERMISSIONS.content_moderator).toEqual(
      expect.arrayContaining(["social.view", "social.create", "social.manage_comments"])
    );

    expect(SYSTEM_ROLE_PERMISSIONS.analytics_viewer).toEqual(
      expect.arrayContaining(["social.view", "social.view_analytics"])
    );
  });
});
