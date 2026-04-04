import { describe, expect, it } from "vitest";
import { BillingEngine } from "./billing";
import type { Subscription } from "./billing";

function makeSubscription(overrides: Partial<Subscription> = {}): Subscription {
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    id: "sub_test",
    tenantId: "tenant_001",
    planId: "starter-monthly",
    status: "active",
    billingCycle: "monthly",
    currentPeriodStart: now,
    currentPeriodEnd: future,
    nextBillingDate: future,
    ...overrides,
  };
}

describe("BillingEngine.getPlans", () => {
  it("returns a non-empty list of plans", () => {
    const plans = BillingEngine.getPlans();
    expect(plans.length).toBeGreaterThan(0);
  });

  it("each plan has required fields", () => {
    BillingEngine.getPlans().forEach((plan) => {
      expect(plan.id).toBeTruthy();
      expect(plan.name).toBeTruthy();
      expect(plan.monthlyPrice).toBeGreaterThanOrEqual(0);
      expect(plan.maxStudents).toBeGreaterThan(0);
    });
  });
});

describe("BillingEngine.getPlanById", () => {
  it("returns the correct plan", () => {
    const plan = BillingEngine.getPlanById("starter-monthly");
    expect(plan).not.toBeNull();
    expect(plan?.tier).toBe("starter");
  });

  it("returns null for unknown plan id", () => {
    expect(BillingEngine.getPlanById("nonexistent")).toBeNull();
  });
});

describe("BillingEngine.isSubscriptionActive", () => {
  it("returns true for active subscription", () => {
    expect(BillingEngine.isSubscriptionActive(makeSubscription({ status: "active" }))).toBe(true);
  });

  it("returns true for trial subscription", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    expect(
      BillingEngine.isSubscriptionActive(
        makeSubscription({ status: "trial", trialEndsAt: future })
      )
    ).toBe(true);
  });

  it("returns false for cancelled subscription", () => {
    expect(
      BillingEngine.isSubscriptionActive(makeSubscription({ status: "cancelled" }))
    ).toBe(false);
  });

  it("returns false for suspended subscription", () => {
    expect(
      BillingEngine.isSubscriptionActive(makeSubscription({ status: "suspended" }))
    ).toBe(false);
  });
});

describe("BillingEngine.isSubscriptionPastDue", () => {
  it("returns true for past_due status", () => {
    expect(BillingEngine.isSubscriptionPastDue(makeSubscription({ status: "past_due" }))).toBe(true);
  });

  it("returns false for active status", () => {
    expect(BillingEngine.isSubscriptionPastDue(makeSubscription({ status: "active" }))).toBe(false);
  });
});

describe("BillingEngine.calculateProratedAmount", () => {
  it("returns a non-negative prorated amount", () => {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    const midpoint = new Date(start.getTime() + 15 * 24 * 60 * 60 * 1000);
    const amount = BillingEngine.calculateProratedAmount(100, start, end, midpoint);
    expect(amount).toBeGreaterThanOrEqual(0);
    expect(amount).toBeLessThanOrEqual(100);
  });
});
