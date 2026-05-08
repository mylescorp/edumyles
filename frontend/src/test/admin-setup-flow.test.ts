import { describe, expect, it } from "vitest";
import { getNextSetupStepIndex, shouldRedirectCompletedSetup } from "@/lib/adminSetupFlow";

describe("admin setup flow", () => {
  it("moves forward when the server returns the same completed step", () => {
    expect(
      getNextSetupStepIndex({
        activeStepIndex: 1,
        currentStep: 2,
        totalSteps: 12,
      })
    ).toBe(2);
  });

  it("trusts a server step that is ahead of the local step", () => {
    expect(
      getNextSetupStepIndex({
        activeStepIndex: 1,
        currentStep: 4,
        totalSteps: 12,
      })
    ).toBe(3);
  });

  it("clamps movement at the final step", () => {
    expect(
      getNextSetupStepIndex({
        activeStepIndex: 11,
        currentStep: 13,
        totalSteps: 12,
      })
    ).toBe(11);
  });

  it("redirects only completed setup records", () => {
    expect(shouldRedirectCompletedSetup(true)).toBe(true);
    expect(shouldRedirectCompletedSetup(false)).toBe(false);
    expect(shouldRedirectCompletedSetup(undefined)).toBe(false);
  });
});
