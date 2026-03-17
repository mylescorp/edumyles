import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requirePmRole } from "./roles";

// Queries
export const getProjects = query({
  args: {
    sessionToken: v.string(),
    workspaceId: v.id("pmWorkspaces"),
  },
  handler: async (ctx, args) => {
    await requirePmRole(ctx, args, "viewer", args.workspaceId);

    const projects = await ctx.db
      .query("pmProjects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Add task counts and other metadata to each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const tasks = await ctx.db
          .query("pmTasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        const completedTasks = tasks.filter(task => project.status === "completed").length;
        const totalEstimatedMinutes = tasks.reduce((sum, task) => sum + (task.estimateMinutes || 0), 0);
        const totalLoggedMinutes = tasks.reduce((sum, task) => sum + task.loggedMinutes, 0);

        return {
          ...project,
          taskCount: tasks.length,
          completedTasks,
          totalEstimatedMinutes,
          totalLoggedMinutes,
          progress: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
        };
      })
    );

    return projectsWithStats;
  },
});

export const getProject = query({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "viewer", project.workspaceId);

    // Get tasks for this project
    const tasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    // Get epics for this project
    const epics = await ctx.db
      .query("pmEpics")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    return {
      ...project,
      tasks,
      epics,
    };
  },
});

// Mutations
export const createProject = mutation({
  args: {
    sessionToken: v.string(),
    workspaceId: v.id("pmWorkspaces"),
    name: v.string(),
    description: v.string(),
    startDate: v.number(),
    dueDate: v.number(),
    memberIds: v.optional(v.array(v.string())),
    githubRepo: v.optional(v.string()),
    customFields: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePmRole(ctx, args, "member", args.workspaceId);

    const projectId = await ctx.db.insert("pmProjects", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: args.description,
      status: "active",
      startDate: args.startDate,
      dueDate: args.dueDate,
      ownerId: tenantCtx.userId,
      memberIds: args.memberIds || [tenantCtx.userId],
      githubRepo: args.githubRepo,
      customFields: args.customFields || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

export const updateProject = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("paused"), v.literal("completed"), v.literal("archived"))),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    memberIds: v.optional(v.array(v.string())),
    githubRepo: v.optional(v.string()),
    customFields: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.startDate !== undefined) updateData.startDate = args.startDate;
    if (args.dueDate !== undefined) updateData.dueDate = args.dueDate;
    if (args.memberIds !== undefined) updateData.memberIds = args.memberIds;
    if (args.githubRepo !== undefined) updateData.githubRepo = args.githubRepo;
    if (args.customFields !== undefined) updateData.customFields = args.customFields;

    await ctx.db.patch(args.projectId, updateData);
    return true;
  },
});

export const deleteProject = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "admin", project.workspaceId);

    // Check if project has tasks
    const tasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    if (tasks.length > 0) {
      throw new Error("CANNOT_DELETE_PROJECT_WITH_TASKS");
    }

    // Check if project has epics
    const epics = await ctx.db
      .query("pmEpics")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    if (epics.length > 0) {
      throw new Error("CANNOT_DELETE_PROJECT_WITH_EPICS");
    }

    await ctx.db.delete(args.projectId);
    return true;
  },
});

export const addProjectMember = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    const currentMembers = project.memberIds || [];
    if (currentMembers.includes(args.userId)) {
      throw new Error("USER_ALREADY_MEMBER");
    }

    await ctx.db.patch(args.projectId, {
      memberIds: [...currentMembers, args.userId],
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const removeProjectMember = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    const currentMembers = project.memberIds || [];
    if (!currentMembers.includes(args.userId)) {
      throw new Error("USER_NOT_MEMBER");
    }

    // Don't allow removing the project owner
    if (project.ownerId === args.userId) {
      throw new Error("CANNOT_REMOVE_PROJECT_OWNER");
    }

    await ctx.db.patch(args.projectId, {
      memberIds: currentMembers.filter(id => id !== args.userId),
      updatedAt: Date.now(),
    });

    return true;
  },
});
