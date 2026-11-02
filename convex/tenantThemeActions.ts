"use node";

import { ConvexError, v } from "convex/values";
import { action, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { compile } from "../packages/design-system/tools/compile-theme.mjs";

const engineVersion = "1.2.0";

function validateInputs(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConvexError({ code: "INVALID_THEME", message: "Theme inputs must be an object." });
  }
  const inputs = value as Record<string, unknown>;
  const topKeys = new Set(["branding", "colors", "typography"]);
  const unexpected = Object.keys(inputs).find((key) => !topKeys.has(key));
  if (unexpected) throw new ConvexError({ code: "INVALID_THEME", message: `Unknown key: ${unexpected}` });

  const branding = inputs.branding;
  const colors = inputs.colors;
  if (!branding || typeof branding !== "object" || Array.isArray(branding)) {
    throw new ConvexError({ code: "INVALID_THEME", message: "Missing or invalid key: branding" });
  }
  if (!colors || typeof colors !== "object" || Array.isArray(colors)) {
    throw new ConvexError({ code: "INVALID_THEME", message: "Missing or invalid key: colors" });
  }
  const brandingRecord = branding as Record<string, unknown>;
  const colorRecord = colors as Record<string, unknown>;
  const brandingKeys = new Set(["schoolName", "logoUrl", "logoDarkUrl", "markUrl", "faviconUrl"]);
  const colorKeys = new Set(["primary", "accent"]);
  const extraBrand = Object.keys(brandingRecord).find((key) => !brandingKeys.has(key));
  const extraColor = Object.keys(colorRecord).find((key) => !colorKeys.has(key));
  if (extraBrand) throw new ConvexError({ code: "INVALID_THEME", message: `Unknown key: branding.${extraBrand}` });
  if (extraColor) throw new ConvexError({ code: "INVALID_THEME", message: `Unknown key: colors.${extraColor}` });

  for (const key of ["logoUrl", "logoDarkUrl", "markUrl", "faviconUrl"] as const) {
    const url = brandingRecord[key];
    if (url == null || url === "") continue;
    if (typeof url !== "string" || /^(?:javascript:|data:|\/\/)/i.test(url)) {
      throw new ConvexError({ code: "INVALID_THEME", message: `Invalid URL: branding.${key}` });
    }
    if (!url.startsWith("/") && !/^https:\/\/([a-z0-9-]+\.)*edumyles\.com\//i.test(url)) {
      throw new ConvexError({ code: "INVALID_THEME", message: `Use a platform-hosted URL for branding.${key}` });
    }
  }
  if (inputs.typography && typeof inputs.typography === "object") {
    const font = (inputs.typography as Record<string, unknown>).font;
    if (font !== undefined && !["Inter", "Source Sans 3", "Noto Sans", "Nunito Sans"].includes(String(font))) {
      throw new ConvexError({ code: "INVALID_THEME", message: "Invalid key: typography.font" });
    }
  }
  return inputs;
}

async function compileAndStore(
  ctx: ActionCtx,
  identity: { tenantId: string; userId: string; email: string; nextVersion: number },
  rawInputs: unknown
): Promise<{ version: number; notes: unknown[] }> {
  const inputs = validateInputs(rawInputs);
  const now = Math.floor(Date.now() / 1000);
  const theme = {
    ...inputs,
    schemaVersion: 1,
    tenantId: identity.tenantId,
    version: identity.nextVersion,
    updatedAt: now,
  };
  const result = compile(theme);
  if (!result.ok) {
    throw new ConvexError({ code: "INVALID_THEME", message: (result.errors ?? []).join("; ") });
  }
  if (!result.allPass) {
    throw new ConvexError({ code: "INVALID_THEME", message: "The theme did not pass its contrast checks." });
  }
  const version: number = await ctx.runMutation((internal as any).tenantThemes.savePublishedTheme, {
    tenantId: identity.tenantId,
    version: identity.nextVersion,
    inputs: theme,
    compiledCss: result.css,
    engineVersion,
    updatedAt: now,
    updatedBy: identity.userId,
    actorEmail: identity.email,
  });
  return { version, notes: result.notes };
}

export const publishTenantTheme = action({
  args: { sessionToken: v.string(), inputs: v.any() },
  returns: v.object({ version: v.number(), notes: v.array(v.any()) }),
  handler: async (ctx, args) => {
    const identity: { tenantId: string; userId: string; email: string; nextVersion: number } = await ctx.runQuery((internal as any).tenantThemes.authorizePublish, {
      sessionToken: args.sessionToken,
    });
    return await compileAndStore(ctx, identity, args.inputs);
  },
});

export const rollbackTenantTheme = action({
  args: { sessionToken: v.string(), version: v.number() },
  returns: v.object({ version: v.number(), notes: v.array(v.any()) }),
  handler: async (ctx, args) => {
    const target: { tenantId: string; userId: string; email: string; nextVersion: number; inputs: unknown } = await ctx.runQuery((internal as any).tenantThemes.getRollbackInputs, {
      sessionToken: args.sessionToken,
      version: args.version,
    });
    return await compileAndStore(ctx, target, target.inputs);
  },
});
