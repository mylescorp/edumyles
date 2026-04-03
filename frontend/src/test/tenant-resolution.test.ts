import { describe, expect, it } from "vitest";
import { deriveTenantResolutionState } from "@/hooks/useTenant";

describe("tenant resolution state", () => {
  it("stays loading while auth is still resolving", () => {
    expect(
      deriveTenantResolutionState({
        isLoading: true,
        isAuthenticated: false,
        hasLiveTenantSession: false,
        isPlatformSession: false,
        resolvedTenantId: null,
      }).status
    ).toBe("loading");
  });

  it("reports unauthenticated when auth has completed with no session", () => {
    const result = deriveTenantResolutionState({
      isLoading: false,
      isAuthenticated: false,
      hasLiveTenantSession: false,
      isPlatformSession: false,
      resolvedTenantId: null,
    });

    expect(result.status).toBe("unauthenticated");
    expect(result.isUnauthenticated).toBe(true);
    expect(result.tenantResolutionError).toBeNull();
  });

  it("keeps loading while a live tenant session is still resolving tenant context", () => {
    const result = deriveTenantResolutionState({
      isLoading: false,
      isAuthenticated: true,
      hasLiveTenantSession: true,
      isPlatformSession: false,
      resolvedTenantId: null,
    });

    expect(result.status).toBe("loading");
    expect(result.queryPending).toBe(true);
  });

  it("treats platform sessions as resolved without tenant context queries", () => {
    const result = deriveTenantResolutionState({
      isLoading: false,
      isAuthenticated: true,
      hasLiveTenantSession: true,
      isPlatformSession: true,
      resolvedTenantId: "PLATFORM",
    });

    expect(result.status).toBe("resolved");
    expect(result.tenantResolutionError).toBeNull();
  });
});
