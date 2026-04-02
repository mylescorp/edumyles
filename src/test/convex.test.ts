// @vitest-environment node
import { ConvexError } from "convex/values";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getPermissions, requirePermission } from "../../convex/helpers/authorize";
import { requirePlatformSession } from "../../convex/helpers/platformGuard";

type SessionDoc = {
  _id: string;
  email?: string;
  expiresAt: number;
  role: string;
  tenantId: string;
  userId: string;
};

function createPlatformCtx(session: SessionDoc | null) {
  return {
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => session,
        }),
      }),
    },
  } as any;
}

describe("Convex auth and payment wiring", () => {
  it("accepts a valid master admin platform session", async () => {
    const ctx = createPlatformCtx({
      _id: "session_1",
      email: "admin@example.com",
      expiresAt: Date.now() + 60_000,
      role: "master_admin",
      tenantId: "PLATFORM",
      userId: "user_1",
    });

    await expect(
      requirePlatformSession(ctx, { sessionToken: "token_123" })
    ).resolves.toMatchObject({
      email: "admin@example.com",
      role: "master_admin",
      tenantId: "PLATFORM",
      userId: "user_1",
    });
  });

  it("rejects expired platform sessions", async () => {
    const ctx = createPlatformCtx({
      _id: "session_2",
      email: "admin@example.com",
      expiresAt: Date.now() - 1,
      role: "master_admin",
      tenantId: "PLATFORM",
      userId: "user_2",
    });

    await expect(requirePlatformSession(ctx, { sessionToken: "expired" })).rejects.toThrow(
      /expired/i
    );
  });

  it("denies non-platform roles from privileged access", async () => {
    const ctx = createPlatformCtx({
      _id: "session_3",
      email: "staff@example.com",
      expiresAt: Date.now() + 60_000,
      role: "school_admin",
      tenantId: "TENANT_1",
      userId: "user_3",
    });

    await expect(requirePlatformSession(ctx, { sessionToken: "staff" })).rejects.toThrow(
      /platform access denied/i
    );
  });

  it("grants the newly added delete and approve permissions to the expected roles", () => {
    expect(getPermissions("transport_manager")).toContain("transport:delete");
    expect(getPermissions("librarian")).toContain("library:delete");
    expect(getPermissions("bursar")).toContain("ewallet:approve");
    expect(getPermissions("school_admin")).toContain("ecommerce:approve");
  });

  it("throws a ConvexError when a role lacks the requested permission", () => {
    expect(() =>
      requirePermission(
        {
          email: "teacher@example.com",
          role: "teacher",
          tenantId: "TENANT_1",
          userId: "user_4",
        },
        "finance:approve"
      )
    ).toThrow(ConvexError);
  });

  it("exposes the Airtel initiation action at the audited file path", () => {
    const file = readFileSync("convex/actions/payments/airtel.ts", "utf8");
    expect(file).toContain('export { initiateAirtelPayment }');
    expect(file).toContain('../../modules/finance/actions');
  });
});
