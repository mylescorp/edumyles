import { describe, expect, it } from "vitest";
import { GradingSystem } from "./grading.js";
import type { Grade } from "./grading.js";

describe("GradingSystem.calculatePercentage", () => {
  it("returns correct percentage", () => {
    const grade: Grade = { score: 75, maxScore: 100, weight: 1, type: "exam" };
    expect(GradingSystem.calculatePercentage(grade)).toBe(75);
  });

  it("returns 0 when maxScore is 0", () => {
    const grade: Grade = { score: 0, maxScore: 0, weight: 1, type: "exam" };
    expect(GradingSystem.calculatePercentage(grade)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    const grade: Grade = { score: 2, maxScore: 3, weight: 1, type: "exam" };
    expect(GradingSystem.calculatePercentage(grade)).toBe(67);
  });
});

describe("GradingSystem.getLetterGrade (KE-8-4-4)", () => {
  const curriculum = "KE-8-4-4" as const;

  it("returns A for 70%+", () => {
    expect(GradingSystem.getLetterGrade(70, curriculum).letterGrade).toBe("A");
    expect(GradingSystem.getLetterGrade(100, curriculum).letterGrade).toBe("A");
    expect(GradingSystem.getLetterGrade(85, curriculum).letterGrade).toBe("A");
  });

  it("returns B for 60–69%", () => {
    expect(GradingSystem.getLetterGrade(60, curriculum).letterGrade).toBe("B");
    expect(GradingSystem.getLetterGrade(69, curriculum).letterGrade).toBe("B");
  });

  it("returns C for 50–59%", () => {
    expect(GradingSystem.getLetterGrade(50, curriculum).letterGrade).toBe("C");
    expect(GradingSystem.getLetterGrade(59, curriculum).letterGrade).toBe("C");
  });

  it("returns D for 40–49%", () => {
    expect(GradingSystem.getLetterGrade(40, curriculum).letterGrade).toBe("D");
    expect(GradingSystem.getLetterGrade(49, curriculum).letterGrade).toBe("D");
  });

  it("returns E (fail) for below 40%", () => {
    expect(GradingSystem.getLetterGrade(39, curriculum).letterGrade).toBe("E");
    expect(GradingSystem.getLetterGrade(0, curriculum).letterGrade).toBe("E");
  });

  it("includes remarks", () => {
    const result = GradingSystem.getLetterGrade(80, curriculum);
    expect(result.remarks).toBe("Excellent");
  });
});

describe("GradingSystem.getLetterGrade (UG-UNEB)", () => {
  const curriculum = "UG-UNEB" as const;

  it("returns A for 80%+", () => {
    expect(GradingSystem.getLetterGrade(80, curriculum).letterGrade).toBe("A");
  });

  it("returns B for 75–79%", () => {
    expect(GradingSystem.getLetterGrade(75, curriculum).letterGrade).toBe("B");
    expect(GradingSystem.getLetterGrade(79, curriculum).letterGrade).toBe("B");
  });

  it("returns F for below 65%", () => {
    expect(GradingSystem.getLetterGrade(64, curriculum).letterGrade).toBe("F");
    expect(GradingSystem.getLetterGrade(0, curriculum).letterGrade).toBe("F");
  });
});

describe("GradingSystem.getLetterGrade (TZ-NECTA)", () => {
  const curriculum = "TZ-NECTA" as const;

  it("returns A for 75%+", () => {
    expect(GradingSystem.getLetterGrade(75, curriculum).letterGrade).toBe("A");
  });

  it("returns F for below 45%", () => {
    expect(GradingSystem.getLetterGrade(44, curriculum).letterGrade).toBe("F");
  });
});
