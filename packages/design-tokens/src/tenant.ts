export type ThemeMode = "light" | "dark" | "system";

export interface TenantBranding {
  schoolName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

/** Hex colours, #RRGGBB only. Validated and corrected by the theme engine before use. */
export interface TenantColors {
  primary: string;
  accent: string;
}

export interface TenantTheme {
  schemaVersion: 1;
  tenantId: string;
  branding: TenantBranding;
  colors: TenantColors;
  updatedAt: number;
}

export interface UserAppearance {
  userId: string;
  themeMode: ThemeMode;
  density: "balanced" | "compact";
}

/** CSS variables injected on the tenant shell root. Status and focus tokens are never included. */
export interface ResolvedTenantVars {
  "--tenant-primary": string;
  "--tenant-primary-foreground": string;
  "--tenant-primary-dark": string;
  "--tenant-primary-dark-foreground": string;
  "--tenant-accent": string;
}
