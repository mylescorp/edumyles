# EduMyles Design System v1.0: Agent Directive

Source of truth for visuals: the EduMyles Design System canvas (https://claude.ai/artifact/GJCjHnXxWr8b52mPt5zAwq) and `tokens.css` from it. Where this file and the canvas differ, stop and ask Myles.

## Decisions already made
- Direction: premium enterprise, tenant-first branding, balanced density.
- Default palette: neutral surfaces, `#1565C0` primary, navy `#1A395B` only for platform chrome. Amber and gold are fills only, never text.
- Font: Inter only, tabular numerals for money, counts, dates and IDs.
- Modes: light, dark, system. Dark primary is derived per tenant, not reused.
- Status colours (success, warning, danger, info) and focus rings are platform-owned. Tenants cannot override them.
- Tenants set only: school name, logo, favicon, primary, accent. Appearance mode is a per-user preference.
- Fresh design-system foundation first, then migrate existing pages. Do not restyle pages in place before the foundation passes review.

## Step 0: inspect and plan (no code yet)
1. Report Next.js, React, Tailwind (v3 or v4), shadcn/ui, Radix and package-manager versions in the repo.
2. List existing shared components in `frontend/src/components/ui`, `shared` and `layout`, and which map to the new set.
3. Report conflicting styling (hardcoded hex, per-module CSS, `tailwind.config.ts`).
4. Produce a short repo-specific plan and wait for approval. Keep the repo's existing package manager. Do not switch to pnpm.

## Phase order (Myles's rule: never skip, flag conflicts)
- Allowed now: tokens, base components, shell, Storybook, tests.
- Blocked until Phase 1 (schema) and Phase 2 (auth) are complete: theme persistence and resolution. Until then, use a static default theme and build the engine against an interface.
- If a task needs a blocked phase, stop and say: "Phase X is not complete yet..." and list what remains.

## Packages (start with five)
`design-tokens`, `theme-engine`, `ui` (components, education, finance, tables, forms, charts as folders), `layouts`, `config`. Split further only with a written ownership reason. Dependencies stay acyclic: tokens, then theme-engine and ui, then layouts, then apps.

## Rules
- Components read semantic tokens only. No hex in shared components, no tenant colours in components.
- Strict TypeScript, no `any`, no ts-ignore, Zod on all form and theme input.
- No mock data in shipped code. Fixtures are allowed only in `*.stories.tsx` and tests, in a clearly named `fixtures` file.
- No stack names, file paths or raw errors in any UI string. Use the professional error translation table from the standards.
- Lucide icons only. Never emoji or image icons.
- Every component: variants, keyboard support, labelled controls, loading, disabled and error states, light and dark, Storybook story, test.
- Money is stored and calculated in minor units, never floats. Show `KES` explicitly, right-align, tabular numerals.
- Status is never colour alone: always text or icon.
- Cookies follow the existing cookie standard. A client-sent tenant ID is never proof of access.

## Tenant theme engine
- Schema: versioned `TenantTheme` (`schemaVersion`, `tenantId`, branding, colors, `updatedAt`). Stored in the Convex tenants data, written only by tenant admins with an audit log entry.
- Resolution: WorkOS membership gives the active tenant on the server; load the theme there; validate; inject `--tenant-primary`, `--tenant-primary-dark`, `--tenant-accent` on the shell root during server render so there is no flash.
- ContrastValidator: primary must give 4.5:1 with white text. If not, propose a corrected shade and block the save. Derive the dark variant by raising lightness until 4.5:1 on the dark card surface.
- Cache keys include `tenantId` and theme `version`. No shared cache for authenticated responses. Invalidate on save.
- Logos: PNG, JPG or WebP only, size and type checked, stored in trusted storage. No SVG upload in v1.0. Escape the school name everywhere.
- Platform panels (`/platform`) always use the default theme, never a tenant theme.

## App shell
Three modes mapped to the existing panels: `/platform`, `/admin`, `/dashboard`. Header 64px, sidebar 256px or 72px collapsed, page padding 24px (16px on mobile), content max 1600px. Navigation is generated from role and permissions on the server. Hiding a link is not authorisation. School switcher for users with more than one tenant. Mobile: drawer navigation, single-column forms, tables scroll or become cards, totals stay visible.

## Component order
1. Foundations: tokens, Inter, Tailwind v4 migration (own PR), light and dark.
2. Core: Button, Input, Select, Checkbox, Radio, Dialog, Drawer, Dropdown, Tabs, Tooltip, Toast (Sonner), Alert, Badge, Avatar, Card, Skeleton, EmptyState, ErrorState.
3. Shell: Sidebar, Header, Breadcrumbs, PageHeader, SchoolSwitcher, UserMenu.
4. DataTable on TanStack Table with server-side sort, filter and pagination, plus pagination and column visibility.
5. Forms on React Hook Form and Zod, including DatePicker.
6. Theme engine: provider, resolver, validator, contrast validator, cache, preview.
7. Education and finance, composed from the above: StudentCard, StudentProfile, StudentDirectory, AttendanceRegister, ClassCard, TimetableGrid, ExamResultsTable, GradeBadge (CBC bands EE, ME, AE, BE), ReportCard, GuardianProfile, FeeInvoice, FeeStatement, PaymentStatus (pending M-Pesa, confirmed, timed out), PaymentSummary.

## Deferred, do not build in v1.0
Alumni role navigation, login banner and email branding, compact density mode, visual regression suite, separate icons/charts/tables/forms packages, SVG logos.

## Quality gates per PR
`npm run typecheck`, `npm run lint`, tests, `npm run build`, `npm audit` (no critical or high), axe checks on every story, keyboard-only pass, light and dark and three tenant themes in Storybook, multi-tenant isolation test for the theme resolver. Follow the PR template and branch naming standard; one Linear issue per PR.

## Production acceptance
Two or more tenants with different identities on identical components; theme change without a rebuild; no cross-tenant leakage in cache or SSR; status colours unchanged by any tenant; WCAG 2.2 AA verified; works on desktop, tablet and mobile; a new module can ship using only shared components.
