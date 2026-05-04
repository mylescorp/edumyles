export const SCHOOL_CURRICULUM_CODES = {
  CBC: "cbc",
  ACE: "ace",
  IGCSE: "igcse",
  KENYA_844: "844",
} as const;

export type SchoolCurriculumCode =
  (typeof SCHOOL_CURRICULUM_CODES)[keyof typeof SCHOOL_CURRICULUM_CODES];

export type SchoolCurriculumMode = "single" | "multi";

export type SchoolCurriculumDefinition = {
  code: SchoolCurriculumCode;
  label: string;
  shortLabel: string;
  educationModel: "kenyan_national" | "international" | "individualized";
  defaultAcademicStructure: "termly" | "semester";
  defaultGradingPreset: string;
  levelLabels: string[];
  isActive: boolean;
};

export const SCHOOL_CURRICULA: readonly SchoolCurriculumDefinition[] = [
  {
    code: SCHOOL_CURRICULUM_CODES.CBC,
    label: "CBC",
    shortLabel: "CBC",
    educationModel: "kenyan_national",
    defaultAcademicStructure: "termly",
    defaultGradingPreset: "kenya_cbc",
    levelLabels: ["PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"],
    isActive: true,
  },
  {
    code: SCHOOL_CURRICULUM_CODES.ACE,
    label: "ACE",
    shortLabel: "ACE",
    educationModel: "individualized",
    defaultAcademicStructure: "termly",
    defaultGradingPreset: "ace_mastery",
    levelLabels: ["ACE Level 1", "ACE Level 2", "ACE Level 3", "ACE Level 4", "ACE Level 5", "ACE Level 6"],
    isActive: true,
  },
  {
    code: SCHOOL_CURRICULUM_CODES.IGCSE,
    label: "IGCSE",
    shortLabel: "IGCSE",
    educationModel: "international",
    defaultAcademicStructure: "semester",
    defaultGradingPreset: "igcse_standard",
    levelLabels: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11"],
    isActive: true,
  },
  {
    code: SCHOOL_CURRICULUM_CODES.KENYA_844,
    label: "8-4-4",
    shortLabel: "8-4-4",
    educationModel: "kenyan_national",
    defaultAcademicStructure: "termly",
    defaultGradingPreset: "kenya_secondary",
    levelLabels: ["Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6", "Standard 7", "Standard 8", "Form 1", "Form 2", "Form 3", "Form 4"],
    isActive: true,
  },
] as const;

export const DEFAULT_SCHOOL_CURRICULUM_CODE = SCHOOL_CURRICULUM_CODES.CBC;

export function isSupportedSchoolCurriculumCode(value: string): value is SchoolCurriculumCode {
  return SCHOOL_CURRICULA.some((curriculum) => curriculum.code === value);
}

export function getSchoolCurriculumByCode(code: SchoolCurriculumCode) {
  return SCHOOL_CURRICULA.find((curriculum) => curriculum.code === code) ?? null;
}

export function normalizeSchoolCurriculumCodes(codes: readonly string[]): SchoolCurriculumCode[] {
  return Array.from(new Set(codes.filter(isSupportedSchoolCurriculumCode)));
}
