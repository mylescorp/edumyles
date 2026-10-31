# @edumyles/design-tokens v1.0

Token source for the EduMyles design system. Premium enterprise, tenant-first, balanced density.

## Contents
- `tokens.json`: single source of truth (primitives, semantic light and dark, typography, spacing, radius, shadow, motion, layout, breakpoints, component tokens).
- `styles/tokens.css`: semantic CSS variables for light and dark themes, generated from the token data. It contains no Tailwind directives so apps can map the variables through their existing Tailwind configuration.
- `src/*.ts`: typed constants generated from the JSON, plus `tenant.ts` (theme types) and `contrast.ts` (ContrastValidator helpers).
- `scripts/build.py`: regenerates CSS and TS from the token data. `scripts/check-contrast.mjs`: fails if any pair drops below AA.
- `docs/AGENT_DIRECTIVE.md`: instructions for the coding agent. `docs/CONTRAST_REPORT.md`: verified ratios and corrections.

## Use
1. Copy this folder to `packages/design-tokens` (Step 0 of the directive must inspect the repo first).
2. In the app's global CSS, import `@edumyles/design-tokens/tokens.css` before Tailwind's directives. The app remains responsible for importing Tailwind.
3. Components use semantic classes only (`bg-primary`, `text-muted-foreground`, `border-input`). No hex in components.
4. Tenant shell root sets `--tenant-primary`, `--tenant-primary-foreground`, `--tenant-primary-dark`, `--tenant-primary-dark-foreground`, `--tenant-accent` after validation (`checkPrimary`, `deriveDarkPrimary`, `readableForeground`). Nothing else is tenant-controlled.
5. Toggle dark mode with the `dark` class (next-themes).
6. Change values only in `scripts/build.py` token data, then run `npm run build:tokens` and `npm run check:contrast`. Never edit generated files.

## Rules
Status (success, warning, danger, info) and focus ring tokens are platform-owned. Tenants cannot override them. Platform panels use the default theme.
