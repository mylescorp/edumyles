# EduMyles Multi-Curriculum Technical Specification and Implementation Plan
**Version:** 1.0  
**Date:** April 29, 2026  
**Status:** Proposed  
**Scope:** Tenant onboarding, tenant settings, SIS, academics, admissions, finance alignment

---

## 1. Objective

EduMyles should support multiple curricula in one system and allow a tenant to:

- choose one or more curricula during tenant onboarding
- update curriculum choices later from tenant settings
- operate single-curriculum schools cleanly
- operate multi-curriculum schools cleanly
- keep downstream modules curriculum-aware without breaking existing tenants

The curricula confirmed from the provided image are:

- CBC
- ACE
- IGCSE
- 8-4-4

---

## 2. Current State Analysis

Based on the current codebase:

- Tenant identity exists in `convex/schema.ts` under `tenants`
- Tenant provisioning already captures school profile data in `convex/platform/tenants/mutations.ts`
- Tenant setup wizard already exists in `frontend/src/app/admin/setup/page.tsx`
- Onboarding persistence already exists in `convex/modules/platform/onboarding.ts`
- Academic setup currently depends on generic `levels`, `classes`, `subjects`, `gradingSystem`, and `academicYear`
- Classes currently store only `name`, `level`, `stream`, `capacity`, and `academicYear`
- Subjects are tenant-wide and not curriculum-aware
- Fee structures are tied to `grade` as free text
- Admission applications use `requestedGrade` as free text
- Report cards, exams, assignments, and grades are still driven by general class and subject structures

### Key current gaps

1. Curriculum is not a first-class domain object.
2. Onboarding is school-profile driven, but not curriculum driven.
3. Academic structures are stored as free text, which will create inconsistency across CBC, ACE, IGCSE, and 8-4-4.
4. Multi-curriculum tenants cannot safely separate subject catalogs, class structures, grading logic, and admissions flows.
5. Platform provisioning has `termStructure` and `academicYearStartMonth`, but no curriculum selection.

---

## 3. Product Requirements

### 3.1 Functional Requirements

- The platform must expose a system-supported curriculum catalog containing CBC, ACE, IGCSE, and 8-4-4.
- A tenant must be able to select:
  - one primary curriculum
  - one or more active curricula
- Curriculum selection must be available:
  - during platform tenant onboarding
  - during tenant admin setup wizard
  - later in tenant settings by authorized users
- The system must support mixed institutions, for example:
  - CBC + 8-4-4
  - IGCSE + ACE
  - CBC + IGCSE
- Curriculum selection must affect:
  - class creation
  - student placement
  - subject setup
  - admissions requested grade/year
  - grading presets
  - report card generation
  - finance grade/class targeting

### 3.2 Non-Functional Requirements

- No tenant isolation regressions
- Backward compatibility for existing tenants
- Zero forced migration downtime
- Clear audit logging for curriculum changes
- UI should remain simple for single-curriculum schools

---

## 4. Design Principles

1. Curriculum support should be configuration-driven, not hardcoded into page logic.
2. Tenant-level curriculum choice should be explicit and persistent.
3. Academic entities should reference curriculum code where needed.
4. Existing free-text fields should be migrated carefully, not broken abruptly.
5. Single-curriculum experience should remain the default/simple path.

---

## 5. Proposed Architecture

## 5.1 System Curriculum Catalog

Add a shared configuration source, for example:

- `shared/src/constants/curricula.ts`

This file becomes the system source of truth for supported curricula and defines:

- `code`: `cbc`, `ace`, `igcse`, `844`
- `label`
- `status`: `active`
- `educationModel`
- default year/grade labels
- default term/semester structure
- default grading preset
- default subject families
- default admissions labels

This should be code-configured first because the supported list is controlled and small. If later the business wants platform-managed curriculum creation, this can evolve into a database table.

## 5.2 Tenant Curriculum Selection Model

### Recommended approach

Use both:

- denormalized tenant summary fields in `tenants`
- a dedicated `tenant_curricula` table for detail and history

### Add to `tenants`

- `primaryCurriculumCode?: string`
- `activeCurriculumCodes?: string[]`
- `curriculumMode?: "single" | "multi"`
- `curriculumConfiguredAt?: number`
- `curriculumConfiguredBy?: string`

### New table: `tenant_curricula`

Purpose:

- store each tenant-curriculum relationship explicitly
- support future status/history
- avoid overloading `tenants`

Proposed shape:

```ts
tenant_curricula: defineTable({
  tenantId: v.string(),
  curriculumCode: v.string(), // cbc | ace | igcse | 844
  isPrimary: v.boolean(),
  isActive: v.boolean(),
  configuredFrom: v.union(v.literal("platform_onboarding"), v.literal("tenant_setup"), v.literal("tenant_settings"), v.literal("migration")),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_tenant_curriculum", ["tenantId", "curriculumCode"]);
```

## 5.3 Curriculum-Aware Academic Model

Curriculum should influence the academic layer, not replace it.

### Add curriculum references to existing entities

- `classes`
  - add `curriculumCode?: string`
  - add `levelCode?: string`
  - add `pathwayCode?: string`
- `students`
  - add `curriculumCode?: string`
  - add `levelCode?: string`
- `subjects`
  - add `curriculumCode?: string`
  - add `levelCodes?: string[]`
  - add `subjectType?: string`
- `admissionApplications`
  - add `curriculumCode?: string`
  - replace or augment `requestedGrade` with `requestedLevelCode`
- `feeStructures`
  - add `curriculumCode?: string`
  - replace or augment `grade` with `levelCode`
- `tenant_onboarding.stepPayloads`
  - add curriculum payloads

### New optional table: `tenant_curriculum_levels`

Use this if the team wants tenant-specific overrides on level naming or activation.

Example:

```ts
tenant_curriculum_levels: defineTable({
  tenantId: v.string(),
  curriculumCode: v.string(),
  levelCode: v.string(),
  levelLabel: v.string(),
  sortOrder: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant_curriculum", ["tenantId", "curriculumCode"]);
```

This is useful for phased rollouts where a school only uses part of a curriculum.

---

## 6. Curriculum Definitions

## 6.1 CBC

- Code: `cbc`
- Typical structure:
  - PP1, PP2
  - Grade 1-6
  - Grade 7-9
  - optionally Grade 10-12 later if the product expands with full senior school modeling
- Default structure: term-based
- Default grading tendency: competency + score/level hybrid

## 6.2 ACE

- Code: `ace`
- Typical structure:
  - level/year based, often individualized progression
- Default structure: term or semester configurable
- Default grading tendency: percentage / mastery

## 6.3 IGCSE

- Code: `igcse`
- Typical structure:
  - Year 7-11 or Year 9-11 depending on school model
- Default structure: term or semester configurable
- Default grading tendency: letter/percentage aligned to Cambridge-style reporting

## 6.4 8-4-4

- Code: `844`
- Typical structure:
  - Standard 1-8
  - Form 1-4
- Default structure: term-based
- Default grading tendency: numeric + letter grading

### Important modeling note

The system should not assume that `schoolType` alone determines curriculum. A tenant may be:

- primary + CBC
- secondary + 8-4-4
- mixed + CBC + 8-4-4
- international + IGCSE + ACE

---

## 7. Onboarding Changes

## 7.1 Platform Tenant Provisioning

Update `convex/platform/tenants/mutations.ts` `provisionTenant` to accept:

- `primaryCurriculumCode`
- `activeCurriculumCodes`
- `curriculumMode`

Update the platform onboarding/API layer:

- `frontend/src/app/api/tenants/onboard/route.ts`
- any platform provisioning UI such as tenant provisioning wizard components

### Provisioning behavior

When a platform admin creates a tenant:

1. Validate selected curricula against the supported catalog.
2. Require at least one active curriculum.
3. Require primary curriculum to be a member of active curricula.
4. Write summary fields to `tenants`.
5. Insert related `tenant_curricula` records.
6. Seed onboarding payload with curriculum context.

## 7.2 Tenant Setup Wizard

Update `frontend/src/app/admin/setup/page.tsx`.

### Recommended onboarding flow changes

Current early steps:

- School profile
- Academic year
- Grading system
- Subjects
- Classes

Proposed early steps:

1. School profile
2. Curriculum selection
3. Academic year
4. Grading setup
5. Subjects
6. Classes

### New step: Curriculum selection

Fields:

- curriculum mode: single or multi
- active curricula multi-select
- primary curriculum single-select
- optional notes for transition schools

Behavior:

- if single mode, only allow one active curriculum
- if multi mode, allow multiple
- prefill recommended grading presets and class-level options after selection

## 7.3 Onboarding Persistence

Extend `tenant_onboarding.steps` and `stepPayloads` with:

- `curriculumSelection`

Example payload:

```ts
curriculumSelection: {
  curriculumMode: "single" | "multi",
  primaryCurriculumCode: string,
  activeCurriculumCodes: string[],
}
```

---

## 8. Tenant Settings Changes

Add curriculum management to tenant settings, likely under:

- `frontend/src/app/admin/settings/page.tsx`
- or a new `frontend/src/app/admin/settings/curriculum/page.tsx`

### Capabilities

- view current curricula
- change primary curriculum
- add a new curriculum
- deactivate a curriculum if no active data depends on it
- view impact warnings before saving

### Validation rules

- cannot remove a curriculum if classes, students, subjects, fee structures, or admissions still depend on it unless reassigned first
- must always have one primary curriculum
- only `school_admin` and permitted senior roles can change curriculum settings

---

## 9. Module Impact Analysis

## 9.1 SIS

Affected files:

- `convex/modules/sis/mutations.ts`
- `convex/modules/sis/queries.ts`

Changes:

- class creation must capture `curriculumCode`
- student creation/import should capture `curriculumCode`
- lists and filters should support curriculum filtering

## 9.2 Academics

Affected files:

- `convex/modules/academics/mutations.ts`
- report cards, exams, grading flows

Changes:

- grading presets should default from curriculum
- report cards should render curriculum-appropriate labels
- subject selection should filter by class/student curriculum where applicable

## 9.3 Admissions

Changes:

- application form should ask for curriculum when the tenant supports multiple curricula
- `requestedGrade` should evolve to curriculum-aware level selection

## 9.4 Finance

Changes:

- fee structures should be mapped to curriculum and level
- invoicing flows should remain compatible with existing `grade` values during migration

## 9.5 Reporting

Changes:

- analytics should slice by curriculum
- platform health dashboards can track tenant curriculum distribution

---

## 10. Data Migration Strategy

## 10.1 Existing Tenants

Existing tenants have no curriculum field today. Migration should be safe and gradual.

### Migration approach

1. Add new nullable schema fields.
2. Deploy code that reads both old and new data.
3. Backfill tenant curricula using heuristics.
4. Show admin prompt for unresolved tenants.
5. Enforce new rules only after backfill period.

### Backfill heuristics

- if levels include `junior_secondary`, `pre_primary`, `primary`, assume likely `cbc`
- if data contains `Form 1`, `Form 2`, or classic secondary grade language, assume likely `844`
- if tenant uses `Year` naming with international school type, flag for `igcse` review
- if confidence is low, mark tenant as `curriculum review required`

Do not silently hard-lock inferred data without admin confirmation.

## 10.2 Existing Academic Data

Add curriculum fields as optional first.

- legacy classes remain valid with `curriculumCode = undefined`
- migration script attempts to assign curriculum where confidence is high
- UI should label ambiguous legacy records and allow batch reassignment

---

## 11. API and Validation Requirements

All curriculum write paths must validate:

- curriculum code exists in supported catalog
- primary curriculum belongs to active set
- active set is non-empty
- entities cannot reference inactive curricula
- entities cannot reference curricula not enabled for the tenant

Add server-side guards in Convex rather than relying on frontend validation.

---

## 12. Suggested Implementation Phases

## Phase 1: Foundation

- add shared curriculum catalog
- add tenant curriculum schema
- add tenant summary fields
- add server validators and helper utilities

**Output:** curriculum becomes a real backend concept

## Phase 2: Platform Provisioning

- update tenant provisioning mutation
- update platform onboarding API
- update tenant provisioning UI

**Output:** platform admins can onboard tenants with curricula

## Phase 3: Tenant Setup Wizard

- add curriculum selection step
- persist onboarding curriculum payload
- preload curriculum-aware defaults for grading, subjects, and classes

**Output:** school admins can choose curricula during setup

## Phase 4: Tenant Settings Management

- build curriculum settings page
- add change-impact checks
- add audit logging

**Output:** tenants can update curricula later safely

## Phase 5: SIS and Academics Alignment

- make classes, students, and subjects curriculum-aware
- update admissions, grading, and reports
- add filtering and display changes in admin pages

**Output:** downstream workflows respect curriculum

## Phase 6: Migration and Rollout

- backfill existing tenants
- add review queue for ambiguous schools
- monitor errors and adoption

**Output:** feature is production-safe for both new and old tenants

---

## 13. Engineering Task Breakdown

## Backend

- update `convex/schema.ts`
- create curriculum constants/helpers in `shared/`
- add curriculum validators
- update tenant provisioning mutations
- update onboarding mutations
- update SIS mutations and queries
- update academics mutations and queries
- add migration/backfill script

## Frontend

- update platform tenant provisioning wizard
- update admin setup wizard
- add tenant curriculum settings UI
- update forms for class, student, subject, fee structure, admissions
- add curriculum chips, filters, and warnings

## QA

- single-curriculum onboarding
- multi-curriculum onboarding
- later curriculum update
- legacy tenant migration
- report card generation by curriculum
- admission to class mapping by curriculum
- fee structure targeting by curriculum

---

## 14. Risks and Mitigations

## Risk 1: Free-text academic data causes bad mapping

Mitigation:

- keep migration soft
- add admin review tools
- avoid destructive backfills

## Risk 2: Too much UI complexity for normal schools

Mitigation:

- default to single-curriculum mode
- hide advanced controls unless multi-curriculum is enabled

## Risk 3: Report cards and grading become inconsistent

Mitigation:

- centralize grading presets by curriculum
- do not let each page invent grading rules

## Risk 4: Tenant updates break existing class/student records

Mitigation:

- enforce dependency checks before deactivation/removal
- add reassignment tools

---

## 15. Acceptance Criteria

- A platform admin can create a tenant with CBC, ACE, IGCSE, 8-4-4, or a valid combination.
- A school admin can select curriculum during setup.
- A tenant can later update curriculum settings from admin settings.
- Classes, students, and subjects can be tagged to valid tenant curricula.
- Admissions and fee structures can target curriculum-aware levels.
- Existing tenants continue working after deployment.
- Audit logs record curriculum creation, update, activation, and deactivation events.

---

## 16. Recommended Build Order for This Repo

1. `shared/src/constants/curricula.ts`
2. `convex/schema.ts`
3. `convex/platform/tenants/mutations.ts`
4. `convex/modules/platform/onboarding.ts`
5. `frontend/src/app/admin/setup/page.tsx`
6. platform tenant provisioning UI and API
7. admin settings curriculum management UI
8. SIS and academics forms/pages
9. migration script
10. tests for provisioning, onboarding, and tenant isolation

---

## 17. Final Recommendation

The right implementation for EduMyles is not to hardcode curriculum labels into classes or grading pages. The system should introduce curriculum as a tenant-level configuration domain with:

- a shared supported-curriculum catalog
- persistent tenant curriculum assignments
- onboarding and settings entry points
- curriculum-aware academic entities

That approach fits the current architecture cleanly because the repo already has:

- a strong tenant model
- a real onboarding system
- modular Convex backend boundaries
- separate platform and tenant admin flows

The best first release should cover:

- curriculum selection during tenant onboarding
- curriculum update later in tenant settings
- curriculum-aware classes, subjects, students, and admissions

Then a second release should deepen report cards, grading, and analytics behavior.
