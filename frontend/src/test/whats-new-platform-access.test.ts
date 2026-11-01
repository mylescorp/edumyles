import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../convex/helpers/platformGuard", () => ({
  requirePlatformSession: vi.fn(),
}));
vi.mock("../../../convex/helpers/tenantGuard", () => ({
  requireTenantSession: vi.fn(),
}));

import { getFeedContext, getUnreadCount, visibleEntries } from "../../../convex/platform/changelog/access";

function queryResult(value: unknown) {
  return {
    withIndex: vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(value),
      collect: vi.fn().mockResolvedValue(value),
    }),
    order: vi.fn().mockReturnValue({ collect: vi.fn().mockResolvedValue(value) }),
  };
}

describe("What's new access for legacy unprovisioned platform sessions", () => {
  const now = Date.now();
  const legacySession = {
    sessionToken: "legacy-platform-token",
    userId: "workos-user-1",
    tenantId: "PLATFORM",
    role: "member",
    email: "invitee@example.com",
    expiresAt: now + 60_000,
  };

  let ctx: { db: { query: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    ctx = {
      db: {
        query: vi.fn((table: string) => {
          if (table === "sessions") return queryResult(legacySession);
          if (table === "users") return queryResult({ workosUserId: "workos-user-1" });
          if (table === "platform_users") return queryResult(null);
          if (table === "changelogEntries") {
            return queryResult([
              {
                _id: "platform-entry",
                panels: ["platform"],
                date: now,
                createdAt: now,
              },
              {
                _id: "admin-entry",
                panels: ["admin"],
                date: now,
                createdAt: now,
              },
            ]);
          }
          if (table === "whatsNewReads") return queryResult([]);
          throw new Error(`Unexpected table ${table}`);
        }),
      },
    };
  });

  it("returns an empty feed and zero unread without granting platform visibility", async () => {
    const context = await getFeedContext(ctx, legacySession.sessionToken);

    await expect(visibleEntries(ctx, context)).resolves.toEqual([]);
    await expect(getUnreadCount(ctx, context)).resolves.toBe(0);
    expect(context).toMatchObject({
      panel: "unauthorized",
      workspaceId: "PLATFORM",
      canSeeAllPanels: false,
    });
  });
});
