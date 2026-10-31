# EduMyles token redesign plan

## Goal

Apply the approved Tidepool system from the 2026-10-31 design-system handoff across the ERP application and public landing site, with clear light/dark surface hierarchy.

## Agreed direction

- Explore a deep blue-green / teal primary.
- Explore a cooler supporting accent in place of decorative gold.
- Keep the light and dark themes recognizably related, while making their surfaces visibly distinct.
- Retain separate platform-owned success, warning, danger, info, and focus colors.
- Palette comparison completed; Tidepool was selected using the supplied design-system handoff preview.
- Apply the system to both the ERP application and public landing site.
- Keep tenant theme resolution behind the schema and authentication phase gates in the supplied directive.

## Implementation phases

### 1. Palette review (complete)

Prepare three teal-led options with coordinated primary, supporting accent, shell chrome, neutral surfaces, and dark-mode values. Show each in a small shell specimen with a primary action, an accent state, and content surfaces. Review both light and dark modes, then select or adjust one option before changing the package source of truth.

| Option | Light primary | Dark primary | Cooler accent | White-on-light-primary contrast |
| --- | --- | --- | --- | ---: |
| Harbor | `#0F766E` | `#48B9AD` | `#3D7380` | 5.47:1 |
| North Sea | `#155E75` | `#62BFD0` | `#486F91` | 7.27:1 |
| Tidepool (handoff) | `#276B63` | `#5BB4AA` | `#52788A` | 5.47:1 |

The approved handoff uses `#276B63` / `#5BB4AA` as the light/dark primary, `#52788A` steel accent, and teal-tinted tide neutrals. Its accent is applied to tinted surfaces for text legibility. The candidate text pairings shown in the preview meet 4.5:1 contrast.

### 2. Token foundation (complete)

Update `packages/design-tokens/tokens.json` as the source of truth. Define primitive and semantic color scales, platform chrome, light and dark surfaces, readable foreground pairings, and supporting accent tokens. Keep status and focus colors separate from the brand palette. Regenerate the CSS and TypeScript outputs with the existing build script, then run the contrast audit.

### 3. Shared shell and component adoption (complete)

Connect the landing app to the shared token package and import its generated stylesheet. Update both apps' Tailwind mappings and shared styles to use semantic tokens. Migrate the ERP top bar, sidebar, navigation states, cards, forms, buttons, and public landing sections. Keep compatibility aliases during migration, then remove aliases when no consumers remain.

### 4. Route migration (complete for the current shared palette rollout)

Apply the shared semantics to remaining ERP app and public landing surfaces in coherent route groups. Check for hard-coded colors and module-specific styles that override the token system. Do not change unrelated behavior or tenant-specific theme resolution.

### 5. Acceptance review (build and contrast gates complete; browser visual review remains)

Review `/platform`, `/admin`, and `/dashboard` in light and dark modes, plus the landing site at desktop and mobile widths. Verify shell contrast, component states, and responsive layouts. Run token contrast checks, type checks, lint, and production builds for the affected apps. Confirm status and focus colors remain platform-owned and tenant-resolution gates remain intact.

## Repository facts

- Frontend uses Next.js 16, React 19, Tailwind CSS 3, and Radix UI.
- `packages/design-tokens/tokens.json` is the token source of truth; `scripts/build.py` generates CSS and TypeScript.
- Both ERP and landing now import the shared token package.
- The current contrast report passes AA for declared semantic text pairs and component boundaries. The redesign must preserve those contrast thresholds.

## Review gate

Tidepool was selected and applied. Contrast checks, app type checks, and production builds pass. The remaining acceptance work is a manual browser review of ERP shell routes and landing layouts in both modes. Tenant-specific theme resolution remains behind the schema and authentication phase gates.
