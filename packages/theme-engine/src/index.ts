import { semantic, type ResolvedTenantVars } from "@edumyles/design-tokens";

export type AppearanceMode = "light" | "dark";

export interface StaticThemeDefaults {
  mode: AppearanceMode;
  tenantVars: ResolvedTenantVars;
}

/**
 * Interface for the future tenant-aware theme resolver. This package currently
 * exposes only static defaults until tenant schema and auth phases are complete.
 */
export interface ThemeEngine {
  getStaticDefaults(mode: AppearanceMode): StaticThemeDefaults;
}

/** Default palette for local development and unaffiliated/public surfaces. */
export const staticDefaultThemeEngine: ThemeEngine = {
  getStaticDefaults(mode) {
    return {
      mode,
      tenantVars: {
        "--tenant-primary": semantic.light.primary,
        "--tenant-primary-foreground": semantic.light["primary-foreground"],
        "--tenant-primary-dark": semantic.dark.primary,
        "--tenant-primary-dark-foreground": semantic.dark["primary-foreground"],
        "--tenant-accent": semantic.light.accent,
      },
    };
  },
};
