# @edumyles/theme-engine

The theme engine contract is present for consumers to depend on. `staticDefaultThemeEngine` exposes only the default design-system palette.

Tenant theme persistence and tenant-aware resolution remain gated on completion of the tenant schema and server-auth phases. This package does not read tenant IDs, storage, cookies, or client-provided branding.
