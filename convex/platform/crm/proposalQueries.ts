import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const listProposalTemplates = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.union(
      v.literal("standard"),
      v.literal("custom"),
      v.literal("legal"),
      v.literal("pricing")
    )),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let templates;
    if (args.category) {
      templates = await ctx.db
        .query("proposalTemplates")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
      templates = templates.filter((t) => t.isActive);
    } else {
      templates = await ctx.db
        .query("proposalTemplates")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower)
      );
    }

    return templates;
  },
});

export const getProposalTemplateById = query({
  args: {
    sessionToken: v.string(),
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const template = await ctx.db.get(args.templateId as any);
    if (!template) throw new Error("Template not found");

    return template;
  },
});

export const listProposals = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("viewed"),
      v.literal("signed"),
      v.literal("rejected"),
      v.literal("expired")
    )),
    dealId: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let proposals;
    if (args.status) {
      proposals = await ctx.db
        .query("proposals")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(100);
    } else if (args.dealId) {
      proposals = await ctx.db
        .query("proposals")
        .withIndex("by_dealId", (q) => q.eq("dealId", args.dealId!))
        .order("desc")
        .take(100);
    } else {
      proposals = await ctx.db
        .query("proposals")
        .withIndex("by_createdAt")
        .order("desc")
        .take(100);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      proposals = proposals.filter(
        (p) => p.schoolName.toLowerCase().includes(searchLower)
      );
    }

    return proposals;
  },
});

export const getProposalById = query({
  args: {
    sessionToken: v.string(),
    proposalId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const proposal = await ctx.db.get(args.proposalId as any);
    if (!proposal) throw new Error("Proposal not found");

    return proposal;
  },
});
