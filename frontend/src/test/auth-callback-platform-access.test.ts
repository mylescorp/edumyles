import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  api: {
    modules: {
      platform: {
        users: {
          getPlatformAccessByWorkosIdentity: "getPlatformAccessByWorkosIdentity",
          acceptPlatformInvite: "acceptPlatformInvite",
          syncPlatformUserProfile: "syncPlatformUserProfile",
        },
        auth: { recordPlatformLogin: "recordPlatformLogin" },
      },
    },
    users: {
      getUserByWorkosIdGlobal: "getUserByWorkosIdGlobal",
      getPendingUserInvitationByEmail: "getPendingUserInvitationByEmail",
      hasMasterAdmin: "hasMasterAdmin",
    },
    sessions: { createSession: "createSession" },
    waitlist: { submitWaitlistApplication: "submitWaitlistApplication" },
  },
  authenticateWithCode: vi.fn(),
  query: vi.fn(),
  mutation: vi.fn(),
  saveSession: vi.fn(),
}));

vi.mock("@workos-inc/node", () => ({
  WorkOS: class {
    userManagement = { authenticateWithCode: mocks.authenticateWithCode };
  },
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({ saveSession: mocks.saveSession }));

vi.mock("convex/browser", () => ({
  ConvexHttpClient: class {
    query = mocks.query;
    mutation = mocks.mutation;
  },
}));

vi.mock("@/convex/_generated/api", () => ({ api: mocks.api }));

import { GET } from "@/app/auth/callback/route";

const workosIdentity = {
  id: "workos-user-1",
  email: "invitee@example.com",
  firstName: "Invitee",
  lastName: "User",
};

function callbackRequest() {
  const state = Buffer.from(JSON.stringify({})).toString("base64url");
  return new NextRequest(`https://app.edumyles.com/auth/callback?code=oauth-code&state=${state}`);
}

function createQueryResult() {
  return {
    platformUser: {
      id: "platform-user-1",
      role: "platform_manager",
      status: "active",
    },
    pendingInvite: null,
  };
}

describe("WorkOS callback platform access", () => {
  const originalEnv = {
    WORKOS_API_KEY: process.env.WORKOS_API_KEY,
    WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  };

  beforeEach(() => {
    process.env.WORKOS_API_KEY = "test-api-key";
    process.env.WORKOS_CLIENT_ID = "test-client-id";
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://test.convex.cloud";
    mocks.authenticateWithCode.mockReset().mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: workosIdentity,
      impersonator: null,
    });
    mocks.query.mockReset();
    mocks.mutation.mockReset().mockResolvedValue(undefined);
    mocks.saveSession.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it("rejects an unprovisioned PLATFORM account before creating an app session", async () => {
    mocks.query
      .mockResolvedValueOnce({ platformUser: null, pendingInvite: null })
      .mockResolvedValueOnce({
        role: "member",
        tenantId: "PLATFORM",
        workosUserId: workosIdentity.id,
        isActive: true,
      });

    const response = await GET(callbackRequest());

    expect(response.headers.get("location")).toContain("reason=platform_role_required");
    expect(mocks.mutation).not.toHaveBeenCalled();
    expect(mocks.saveSession).not.toHaveBeenCalled();
  });

  it("allows a user with an active EduMyles platform invite", async () => {
    mocks.query
      .mockResolvedValueOnce({
        platformUser: null,
        pendingInvite: { id: "invite-1", token: "invite-token", role: "platform_manager" },
      })
      .mockResolvedValueOnce(createQueryResult());

    const response = await GET(callbackRequest());

    expect(response.headers.get("location")).toBe("https://app.edumyles.com/platform");
    expect(mocks.mutation).toHaveBeenCalledTimes(4);
    expect(mocks.mutation.mock.calls[0][1]).toMatchObject({
      token: "invite-token",
      userId: workosIdentity.id,
    });
    expect(
      mocks.mutation.mock.calls.some(([, args]) => args.tenantId === "PLATFORM" && args.role === "platform_manager")
    ).toBe(true);
    expect(mocks.saveSession).toHaveBeenCalledTimes(1);
  });
});
