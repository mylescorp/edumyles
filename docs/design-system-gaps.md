# Design system integration gaps

## Intentional input and document colors

- `frontend/src/app/admin/setup/page.tsx:314-316`: the tenant branding setup form stores literal colors as tenant-provided values. These fields are data inputs governed by the existing branding contract, not UI styles; replacing them with CSS variables would make the saved values invalid for color pickers and the tenant configuration API.
- `frontend/src/app/admin/setup/page.tsx:1653-1671`: placeholders document the accepted hex format for the same brand inputs.
- `frontend/src/app/admin/settings/branding/page.tsx`: the tenant brand color picker defaults are initial editable brand data. Published values are compiled into tokens by the shared theme engine.
- `frontend/src/app/platform/settings/settingsDraft.ts`: legacy platform branding defaults are serialized configuration values, rather than CSS. Existing email/PDF fields remain until their rendering systems migrate to the new theme engine.
- `frontend/src/lib/email.ts` and `frontend/src/app/api/documents/**`: generated email and PDF/print templates still contain standalone CSS colors. The supplied architecture explicitly keeps email/PDF template theming out of this integration.

No literal colors remain in landing or application visual styles outside editable brand-data inputs. The legacy setup wizard still records a secondary brand color under its existing onboarding contract; the published tenant theme accepts only primary and accent colors.
