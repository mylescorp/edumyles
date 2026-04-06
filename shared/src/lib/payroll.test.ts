import { describe, expect, it } from "vitest";
import { PayrollEngine } from "./payroll.js";

describe("PayrollEngine.calculatePAYE (Kenya 2024)", () => {
  it("returns 0 for zero salary", () => {
    expect(PayrollEngine.calculatePAYE(0)).toBe(0);
  });

  it("applies lowest band for salary within band 1", () => {
    // Band 1: 0–24,000 at 10%
    const paye = PayrollEngine.calculatePAYE(20000);
    expect(paye).toBeGreaterThan(0);
    expect(paye).toBeLessThan(20000);
  });

  it("returns a higher PAYE for a higher salary", () => {
    const low = PayrollEngine.calculatePAYE(30000);
    const high = PayrollEngine.calculatePAYE(100000);
    expect(high).toBeGreaterThan(low);
  });

  it("PAYE is always less than gross salary", () => {
    [10000, 50000, 200000, 500000].forEach((salary) => {
      expect(PayrollEngine.calculatePAYE(salary)).toBeLessThan(salary);
    });
  });
});

describe("PayrollEngine.calculateNHIF (Kenya 2024)", () => {
  it("returns a positive deduction for salaried employees", () => {
    expect(PayrollEngine.calculateNHIF(30000)).toBeGreaterThan(0);
  });

  it("returns higher NHIF for higher salaries", () => {
    expect(PayrollEngine.calculateNHIF(100000)).toBeGreaterThanOrEqual(
      PayrollEngine.calculateNHIF(30000)
    );
  });
});

describe("PayrollEngine.calculateNSSF (Kenya 2024)", () => {
  it("returns a positive deduction", () => {
    expect(PayrollEngine.calculateNSSF(30000)).toBeGreaterThan(0);
  });

  it("does not exceed max contribution cap", () => {
    // NSSF has a maximum monthly contribution
    const nssf100k = PayrollEngine.calculateNSSF(100000);
    const nssf500k = PayrollEngine.calculateNSSF(500000);
    expect(nssf500k).toBeLessThanOrEqual(nssf100k * 2); // capped, not linearly scaling forever
  });
});

describe("PayrollEngine.calculateHousingLevy", () => {
  it("is 1.5% of gross salary", () => {
    const gross = 60000;
    expect(PayrollEngine.calculateHousingLevy(gross)).toBeCloseTo(gross * 0.015, 2);
  });
});

describe("PayrollEngine.calculateStatutoryDeductions", () => {
  it("returns all statutory deduction components", () => {
    const result = PayrollEngine.calculateStatutoryDeductions(50000);
    expect(result).toHaveProperty("paye");
    expect(result).toHaveProperty("nhif");
    expect(result).toHaveProperty("nssf");
    expect(result).toHaveProperty("housingLevy");
    expect(result).toHaveProperty("total");
  });

  it("total equals sum of components", () => {
    const result = PayrollEngine.calculateStatutoryDeductions(50000);
    const sum = result.paye + result.nhif + result.nssf + result.housingLevy;
    expect(result.total).toBeCloseTo(sum, 2);
  });

  it("net pay is positive for minimum-wage salary", () => {
    // Minimum wage in Kenya is ~15,000 KES/month
    const gross = 15000;
    const deductions = PayrollEngine.calculateStatutoryDeductions(gross);
    expect(gross - deductions.total).toBeGreaterThan(0);
  });
});

describe("PayrollEngine.calculateMonthlySalary / calculateAnnualSalary", () => {
  it("monthly * 12 === annual", () => {
    const monthly = PayrollEngine.calculateMonthlySalary(120000);
    expect(monthly).toBeCloseTo(10000, 2);
  });

  it("annual / 12 === monthly", () => {
    const annual = PayrollEngine.calculateAnnualSalary(10000);
    expect(annual).toBeCloseTo(120000, 2);
  });
});
