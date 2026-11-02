import { ConvexError, v } from "convex/values";
import { internalQuery, internalMutation, query } from "./_generated/server";
import { requireTenantSession } from "./helpers/tenantGuard";
import { requireRole } from "./helpers/authorize";

const themeRecord = v.object({
  tenantId: v.string(),
  version: v.number(),
  inputs: v.any(),
  compiledCss: v.string(),
  engineVersion: v.string(),
  updatedAt: v.number(),
  updatedBy: v.string(),
});

export const authorizePublish = internalQuery({
  args: { sessionToken: v.string() },
  returns: v.object({
    tenantId: v.string(),
    userId: v.string(),
    email: v.string(),
    nextVersion: v.number(),
  }),
  handler: async (ctx, args) => {
    const tenantContext = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
    requireRole(tenantContext, "school_admin");
    if (tenantContext.tenantId === "PLATFORM") {
      throw new ConvexError({ code: "FORBIDDEN", message: "Tenant administrators only." });
    }
    const latest = await ctx.db
      .query("tenantThemes")
      .withIndex("by_tenantId_and_version", (q) => q.eq("tenantId", tenantContext.tenantId))
      .order("desc")
      .first();
    return {
      tenantId: tenantContext.tenantId,
      userId: tenantContext.userId,
      email: tenantContext.email,
      nextVersion: (latest?.version ?? 0) + 1,
    };
  },
});

export const getRollbackInputs = internalQuery({
  args: { sessionToken: v.string(), version: v.number() },
  returns: v.object({
    tenantId: v.string(),
    userId: v.string(),
    email: v.string(),
    nextVersion: v.number(),
    inputs: v.any(),
  }),
  handler: async (ctx, args) => {
    const tenantContext = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
    requireRole(tenantContext, "school_admin");
    if (tenantContext.tenantId === "PLATFORM") {
      throw new ConvexError({ code: "FORBIDDEN", message: "Tenant administrators only." });
    }
    const [target, latest] = await Promise.all([
      ctx.db
        .query("tenantThemes")
        .withIndex("by_tenantId_and_version", (q) =>
          q.eq("tenantId", tenantContext.tenantId).eq("version", args.version)
        )
        .unique(),
      ctx.db
        .query("tenantThemes")
        .withIndex("by_tenantId_and_version", (q) => q.eq("tenantId", tenantContext.tenantId))
        .order("desc")
        .first(),
    ]);
    if (!target) throw new ConvexError({ code: "NOT_FOUND", message: "Theme version not found." });
    return {
      tenantId: tenantContext.tenantId,
      userId: tenantContext.userId,
      email: tenantContext.email,
      nextVersion: (latest?.version ?? 0) + 1,
      inputs: target.inputs,
    };
  },
});

export const savePublishedTheme = internalMutation({
  args: {
    tenantId: v.string(),
    version: v.number(),
    inputs: v.any(),
    compiledCss: v.string(),
    engineVersion: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
    actorEmail: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("tenantThemes")
      .withIndex("by_tenantId_and_version", (q) => q.eq("tenantId", args.tenantId));
    const [latest, existingVersions] = await Promise.all([
      query.order("desc").first(),
      query.order("desc").take(11),
    ]);
    const expectedVersion = (latest?.version ?? 0) + 1;
    if (args.version !== expectedVersion) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Another theme was published. Reload the branding page and try again.",
      });
    }
    const record = {
      tenantId: args.tenantId,
      version: args.version,
      inputs: args.inputs,
      compiledCss: args.compiledCss,
      engineVersion: args.engineVersion,
      updatedAt: args.updatedAt,
      updatedBy: args.updatedBy,
    };
    await ctx.db.insert("tenantThemes", record);
    for (const old of existingVersions.slice(9)) await ctx.db.delete(old._id);
    await ctx.db.insert("auditLogs", {
      tenantId: args.tenantId,
      actorId: args.updatedBy,
      actorEmail: args.actorEmail,
      action: "tenant_theme.published",
      entityId: `${args.tenantId}:${args.version}`,
      entityType: "tenant_theme",
      before: latest?.inputs,
      after: args.inputs,
      timestamp: args.updatedAt,
    });
    return args.version;
  },
});

export const listVersions = query({
  args: { sessionToken: v.string() },
  returns: v.array(themeRecord),
  handler: async (ctx, args) => {
    const tenantContext = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
    requireRole(tenantContext, "school_admin");
    if (tenantContext.tenantId === "PLATFORM") return [];
    const records = await ctx.db
      .query("tenantThemes")
      .withIndex("by_tenantId_and_version", (q) => q.eq("tenantId", tenantContext.tenantId))
      .order("desc")
      .take(10);
    return records.map(({ tenantId, version, inputs, compiledCss, engineVersion, updatedAt, updatedBy }) => ({
      tenantId, version, inputs, compiledCss, engineVersion, updatedAt, updatedBy,
    }));
  },
});

export const getForSubdomain = query({
  args: { subdomain: v.string() },
  returns: v.union(
    v.object({
      tenantId: v.string(),
      version: v.number(),
      inputs: v.any(),
      compiledCss: v.string(),
      engineVersion: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(args.subdomain)) return null;
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .unique();
    if (!tenant || tenant.status === "archived") return null;
    const theme = await ctx.db
      .query("tenantThemes")
      .withIndex("by_tenantId_and_version", (q) => q.eq("tenantId", tenant.tenantId))
      .order("desc")
      .first();
    if (!theme) return null;
    return {
      tenantId: theme.tenantId,
      version: theme.version,
      inputs: theme.inputs,
      compiledCss: theme.compiledCss,
      engineVersion: theme.engineVersion,
    };
  },
});
