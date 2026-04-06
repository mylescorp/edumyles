import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockMutation = vi.fn();
const mockQuery = vi.fn();

vi.mock("convex/browser", () => ({
  ConvexHttpClient: function MockConvexHttpClient() {
    return {
      mutation: mockMutation,
      query: mockQuery,
    };
  },
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    sessions: {
      createMobileAuthRequest: "createMobileAuthRequest",
      getMobileAuthRequest: "getMobileAuthRequest",
      cancelMobileAuthRequest: "cancelMobileAuthRequest",
      consumeMobileAuthRequest: "consumeMobileAuthRequest",
      getSession: "getSession",
    },
  },
}));

import { POST as startMobileAuth } from "@/app/api/auth/mobile/start/route";
import { GET as getMobileAuthStatus } from "@/app/api/auth/mobile/status/route";
import { GET as getMobileSession } from "@/app/api/auth/mobile/session/route";

function makeJsonRequest(body: unknown): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

function makeUrlRequest(url: string): NextRequest {
  return {
    nextUrl: new URL(url),
    headers: {
      get: vi.fn(() => null),
    },
  } as unknown as NextRequest;
}

describe("mobile auth API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_CONVEX_URL = "http://localhost:3210";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.edumyles.test";
    process.env.CONVEX_WEBHOOK_SECRET = "trusted-secret";
  });

  it("starts a mobile auth request and returns an approval URL", async () => {
    mockMutation.mockResolvedValueOnce({ success: true });

    const response = await startMobileAuth(
      makeJsonRequest({ email: "Parent@School.test", deviceInfo: "Pixel 9" })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockMutation).toHaveBeenCalledOnce();
    expect(json.requestId).toBeTruthy();
    expect(json.approvalUrl).toContain("/auth/login");
    expect(json.approvalUrl).toContain("returnTo=");
  });

  it("returns pending while a mobile auth request is awaiting approval", async () => {
    mockQuery.mockResolvedValueOnce({
      requestId: "req-1",
      status: "pending",
      expiresAt: Date.now() + 60_000,
    });

    const response = await getMobileAuthStatus(
      makeUrlRequest("https://app.edumyles.test/api/auth/mobile/status?requestId=req-1")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe("pending");
  });

  it("returns a completed session and consumes the auth request", async () => {
    mockQuery
      .mockResolvedValueOnce({
        requestId: "req-2",
        status: "completed",
        sessionToken: "session-123",
        expiresAt: Date.now() + 60_000,
      })
      .mockResolvedValueOnce({
        sessionToken: "session-123",
        email: "parent@school.test",
        role: "parent",
        tenantId: "TENANT-school-123",
        userId: "user-123",
      });
    mockMutation.mockResolvedValueOnce({ success: true });

    const response = await getMobileAuthStatus(
      makeUrlRequest("https://app.edumyles.test/api/auth/mobile/status?requestId=req-2")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe("completed");
    expect(json.session.sessionToken).toBe("session-123");
    expect(mockMutation).toHaveBeenCalledOnce();
  });

  it("validates a mobile session token", async () => {
    mockQuery.mockResolvedValueOnce({
      sessionToken: "session-456",
      email: "teacher@school.test",
      role: "teacher",
      tenantId: "TENANT-school-456",
      userId: "user-456",
    });

    const response = await getMobileSession(
      makeUrlRequest("https://app.edumyles.test/api/auth/mobile/session?sessionToken=session-456")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.session.role).toBe("teacher");
    expect(json.session.tenantId).toBe("TENANT-school-456");
  });
});
