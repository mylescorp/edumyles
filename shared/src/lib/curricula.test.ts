import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCHOOL_CURRICULUM_CODE,
  SCHOOL_CURRICULUM_CODES,
  getSchoolCurriculumByCode,
  isSupportedSchoolCurriculumCode,
  normalizeSchoolCurriculumCodes,
} from "../constants";
import { tenantCurriculumSelectionSchema } from "../validators";

describe("school curriculum catalog", () => {
  it("recognizes supported school curricula", () => {
    expect(isSupportedSchoolCurriculumCode(SCHOOL_CURRICULUM_CODES.CBC)).toBe(true);
    expect(isSupportedSchoolCurriculumCode("unknown")).toBe(false);
  });

  it("normalizes duplicates and unsupported curriculum codes", () => {
    expect(
      normalizeSchoolCurriculumCodes([
        SCHOOL_CURRICULUM_CODES.CBC,
        SCHOOL_CURRICULUM_CODES.CBC,
        "invalid",
        SCHOOL_CURRICULUM_CODES.IGCSE,
      ])
    ).toEqual([SCHOOL_CURRICULUM_CODES.CBC, SCHOOL_CURRICULUM_CODES.IGCSE]);
  });

  it("returns a default and resolvable curriculum", () => {
    expect(DEFAULT_SCHOOL_CURRICULUM_CODE).toBe(SCHOOL_CURRICULUM_CODES.CBC);
    expect(getSchoolCurriculumByCode(SCHOOL_CURRICULUM_CODES.KENYA_844)?.label).toBe("8-4-4");
  });
});

describe("tenant curriculum selection schema", () => {
  it("accepts a valid single-curriculum payload", () => {
    const result = tenantCurriculumSelectionSchema.safeParse({
      curriculumMode: "single",
      primaryCurriculumCode: SCHOOL_CURRICULUM_CODES.CBC,
      activeCurriculumCodes: [SCHOOL_CURRICULUM_CODES.CBC],
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid primary curriculum mapping", () => {
    const result = tenantCurriculumSelectionSchema.safeParse({
      curriculumMode: "multi",
      primaryCurriculumCode: SCHOOL_CURRICULUM_CODES.CBC,
      activeCurriculumCodes: [SCHOOL_CURRICULUM_CODES.IGCSE, SCHOOL_CURRICULUM_CODES.ACE],
    });

    expect(result.success).toBe(false);
  });
});
