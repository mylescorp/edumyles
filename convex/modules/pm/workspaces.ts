import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requirePmRole } from "./roles";

// Queries
export const getWorkspaces = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePmRole(ctx, args, "viewer");

    const workspaces = await ctx.db.query("pmWorkspaces").collect();
    
    // Add project counts to each workspace
    const workspacesWithCounts = await Promise.all(
      workspaces.map(async (workspace) => {
        const projects = await ctx.db
          .query("pmProjects")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
          .collect();

        return {
          ...workspace,
          projectCount: projects.length,
        };
      })
    );

    return workspacesWithCounts;
  },
});

export const getWorkspace = query({
  args: {
    sessionToken: v.string(),
    workspaceId: v.id("pmWorkspaces"),
  },
  handler: async (ctx, args) => {
    await requirePmRole(ctx, args, "viewer", args.workspaceId);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("WORKSPACE_NOT_FOUND");
    }

    // Get projects for this workspace
    const projects = await ctx.db
      .query("pmProjects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();

    return {
      ...workspace,
      projects,
    };
  },
});

export const getWorkspaceBySlug = query({
  args: {
    sessionToken: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePmRole(ctx, args, "viewer");

    const workspace = await ctx.db
      .query("pmWorkspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!workspace) {
      throw new Error("WORKSPACE_NOT_FOUND");
    }

    return workspace;
  },
});

export const getPmStats = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePmRole(ctx, args, "viewer");

    // Count all tasks across all projects
    const allTasks = await ctx.db.query("pmTasks").collect();
    const activeTasks = allTasks.filter(
      (t) => t.status !== "Done" && t.status !== "done" && t.status !== "Cancelled"
    ).length;

    // Count all time logs this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const allTimeLogs = await ctx.db.query("pmTimeLogs").collect();
    const monthlyMinutes = allTimeLogs
      .filter((log) => log.loggedAt >= startOfMonth.getTime())
      .reduce((sum, log) => sum + (log.minutes ?? 0), 0);

    // Count unique contributors (users with PM roles)
    const allRoles = await ctx.db.query("pmRoles").collect();
    const uniqueMembers = new Set(allRoles.map((r) => r.userId)).size;

    return {
      activeTasks,
      hoursLoggedThisMonth: Math.round(monthlyMinutes / 60),
      teamMembers: uniqueMembers,
    };
  },
});

// Mutations
export const createWorkspace = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    slug: v.string(),
    type: v.union(v.literal("engineering"), v.literal("onboarding"), v.literal("bugs"), v.literal("okrs")),
    icon: v.string(),
    defaultStatuses: v.array(v.string()),
    customFieldSchema: v.optional(v.array(v.object({
      key: v.string(),
      name: v.string(),
      type: v.union(v.literal("text"), v.literal("number"), v.literal("select"), v.literal("multi_select"), v.literal("date"), v.literal("user"), v.literal("checkbox")),
      options: v.optional(v.array(v.string())),
      required: v.boolean(),
    }))),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePmRole(ctx, args, "admin");

    // Check if slug already exists
    const existing = await ctx.db
      .query("pmWorkspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("SLUG_ALREADY_EXISTS");
    }

    const workspaceId = await ctx.db.insert("pmWorkspaces", {
      name: args.name,
      slug: args.slug,
      type: args.type,
      icon: args.icon,
      defaultStatuses: args.defaultStatuses,
      customFieldSchema: args.customFieldSchema || [],
      createdBy: tenantCtx.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return workspaceId;
  },
});

export const updateWorkspace = mutation({
  args: {
    sessionToken: v.string(),
    workspaceId: v.id("pmWorkspaces"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    icon: v.optional(v.string()),
    defaultStatuses: v.optional(v.array(v.string())),
    customFieldSchema: v.optional(v.array(v.object({
      key: v.string(),
      name: v.string(),
      type: v.union(v.literal("text"), v.literal("number"), v.literal("select"), v.literal("multi_select"), v.literal("date"), v.literal("user"), v.literal("checkbox")),
      options: v.optional(v.array(v.string())),
      required: v.boolean(),
    }))),
  },
  handler: async (ctx, args) => {
    await requirePmRole(ctx, args, "admin", args.workspaceId);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("WORKSPACE_NOT_FOUND");
    }

    // Check if new slug conflicts with existing workspace
    if (args.slug && args.slug !== workspace.slug) {
      const existing = await ctx.db
        .query("pmWorkspaces")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
        .first();

      if (existing && existing._id !== args.workspaceId) {
        throw new Error("SLUG_ALREADY_EXISTS");
      }
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.slug !== undefined) updateData.slug = args.slug;
    if (args.icon !== undefined) updateData.icon = args.icon;
    if (args.defaultStatuses !== undefined) updateData.defaultStatuses = args.defaultStatuses;
    if (args.customFieldSchema !== undefined) updateData.customFieldSchema = args.customFieldSchema;

    await ctx.db.patch(args.workspaceId, updateData);
    return true;
  },
});

export const deleteWorkspace = mutation({
  args: {
    sessionToken: v.string(),
    workspaceId: v.id("pmWorkspaces"),
  },
  handler: async (ctx, args) => {
    await requirePmRole(ctx, args, "admin", args.workspaceId);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("WORKSPACE_NOT_FOUND");
    }

    // Check if workspace has projects
    const projects = await ctx.db
      .query("pmProjects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();

    if (projects.length > 0) {
      throw new Error("CANNOT_DELETE_WORKSPACE_WITH_PROJECTS");
    }

    await ctx.db.delete(args.workspaceId);
    return true;
  },
});
