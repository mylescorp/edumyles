import { describe, expect, it } from "vitest";
import {
  PARTNER_PROGRAM_RULES,
  PUBLIC_CURRICULA,
  PUBLIC_MODULES,
  PUBLIC_PRICING_PLANS,
} from "./publicCatalog";

describe("public landing catalog", () => {
  it("exposes canonical public pricing", () => {
    expect(PUBLIC_PRICING_PLANS).toHaveLength(3);
    expect(PUBLIC_PRICING_PLANS.map((plan) => plan.key)).toEqual([
      "starter",
      "professional",
      "enterprise",
    ]);
    const starter = PUBLIC_PRICING_PLANS.find((plan) => plan.key === "starter");
    const professional = PUBLIC_PRICING_PLANS.find((plan) => plan.key === "professional");
    const enterprise = PUBLIC_PRICING_PLANS.find((plan) => plan.key === "enterprise");

    expect(starter?.monthlyPriceKes).toBe(12900);
    expect(starter?.annualMonthlyPriceKes).toBe(10320);
    expect(professional?.monthlyPriceKes).toBe(38900);
    expect(professional?.annualMonthlyPriceKes).toBe(31120);
    expect(enterprise?.monthlyPriceKes).toBeNull();
  });

  it("mirrors supported modules and curricula without unsupported IB claims", () => {
    expect(PUBLIC_MODULES).toHaveLength(13);
    expect(PUBLIC_MODULES.map((module) => module.slug)).toEqual([
      "sis",
      "admissions",
      "finance",
      "timetable",
      "academics",
      "hr",
      "library",
      "transport",
      "communications",
      "users",
      "tickets",
      "ewallet",
      "ecommerce",
    ]);
    expect(PUBLIC_CURRICULA.map((curriculum) => curriculum.code)).toEqual([
      "cbc",
      "ace",
      "igcse",
      "844",
    ]);
    expect(PUBLIC_CURRICULA.map((curriculum) => curriculum.label)).not.toContain("IB");
  });

  it("exposes current partner programme rules", () => {
    expect(PARTNER_PROGRAM_RULES.affiliate.commissionRatePct).toBe(10);
    expect(PARTNER_PROGRAM_RULES.reseller.commissionRatesPct).toEqual({
      starter: 20,
      silver: 25,
      gold: 30,
      platinum: 35,
    });
    expect(PARTNER_PROGRAM_RULES.developer.portalPath).toBe("/portal/developer");
  });
});
