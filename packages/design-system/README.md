# @edumyles/design-system

Single source of truth for EduMyles colour, type, radius, motion, tenant theming and brand assets. MylesCorp Technologies.
Full spec: `docs/EduMyles-Design-System-Theming-Architecture.pdf`.

## Layout
| Path | What | Edit by hand? |
|---|---|---|
| `tokens/*.tokens.json` | Primitive → semantic → component tokens (the spec) | Yes |
| `css/platform.css` | App tokens (re-exports `generated/platform-default.css`) | No |
| `css/shadcn-bridge.css` | shadcn variables → EduMyles tokens | Yes |
| `schema/tenant-theme.schema.json` | What a tenant may set (brand inputs only) | Yes, with a MAJOR/MINOR bump |
| `tools/compile-theme.mjs` | Tenant JSON → derived, contrast-checked CSS | Yes |
| `examples/*.theme.json` | 3 regression themes (default, high-saturation, low-contrast) | Rarely |
| `generated/` | Compiler output. Committed so diffs are reviewable | **Never** |
| `assets/logos/` | Logo set v2 + favicons | Replace files only |
| `docs/` | PDFs, PDF builder source, and `design-system-explorer.html` (open in a browser: live theme lab, tokens, logos, repo map; works offline) | No |

## Use in an app (Next.js + Tailwind + shadcn)
1. `apps/web/package.json`: `"@edumyles/design-system": "workspace:*"` (or `*` for npm workspaces).
2. `app/globals.css` (Tailwind v4):
```css
@import "tailwindcss";
@import "@edumyles/design-system/css";
@theme inline {
  --color-background: var(--background);   --color-foreground: var(--foreground);
  --color-primary: var(--primary);         --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);             --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);           --color-ring: var(--ring);
  --radius-lg: var(--radius);
}
```
3. In `app/layout.tsx` `<head>`: set `data-theme` before paint (inline script reading cookie/localStorage), and inject the tenant's compiled CSS in `<style id="tenant-theme">` with `data-tenant` on `<html>` (spec §4.4). Fall back to platform CSS if the tenant theme is missing.
4. Logos/favicon: `npm run sync:assets -- ../../apps/web/public/brand`; copy `favicon.ico` to `app/favicon.ico`.


Components use only `var(--color-*)` / shadcn names. No hex outside `tokens/` and `generated/`.

## Change workflow
- New/changed token → edit `tokens/*.json` + the CSS that mirrors it → bump version → `CHANGELOG.md`.
- Theme logic change → edit `tools/compile-theme.mjs` → `npm run verify` (tests + regenerate + fail on diff).
- Debugging a tenant colour: open `generated/<tenant>.report.json` (every adjustment and ratio is listed).

## Known gaps (do these next)
- `generated/platform-default.css` is hand-maintained, not built from `tokens/semantic.tokens.json`. Wire Style Dictionary with a custom light/dark transform (`tools/style-dictionary.config.json` is the starting config) so they cannot drift.
- Add a repo-level `stylelint` rule `color-no-hex` ignoring `packages/design-system/{tokens,generated,css}/**`.
