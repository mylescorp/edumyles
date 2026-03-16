import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requirePmRole } from "./roles";

// Queries
export const getDeployLogs = query({
  args: {
    sessionToken: v.string(),
    projectId: v.optional(v.id("pmProjects")),
    taskId: v.optional(v.id("pmTasks")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let workspaceId: string | undefined;

    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
      }
      workspaceId = project.workspaceId;
      await requirePmRole(ctx, args, "member", workspaceId);
    } else {
      await requirePmRole(ctx, args, "admin");
    }

    let deploysQuery = ctx.db.query("pmDeploys");

    if (args.projectId) {
      // Filter by project by finding deploys that reference tasks in this project
      const projectTasks = await ctx.db
        .query("pmTasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();

      const taskIds = projectTasks.map(task => task._id);
      const deploys = await deploysQuery.collect();
      
      // Filter deploys that contain any of the project's task IDs
      return deploys.filter(deploy => 
        deploy.taskIds.some(taskId => taskIds.includes(taskId))
      );
    } else if (args.taskId) {
      // Filter by specific task
      return await deploysQuery
        .withIndex("by_task", (q) => q.eq("taskIds", args.taskId))
        .collect();
    } else {
      // Return all deploys (admin only)
      return await deploysQuery.collect();
    }
  },
});

export const getDeployStats = query({
  args: {
    sessionToken: v.string(),
    projectId: v.optional(v.id("pmProjects")),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"))),
  },
  handler: async (ctx, args) => {
    let workspaceId: string | undefined;

    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
      }
      workspaceId = project.workspaceId;
      await requirePmRole(ctx, args, "member", workspaceId);
    } else {
      await requirePmRole(ctx, args, "admin");
    }

    const now = Date.now();
    let startDate: number;

    switch (args.timeRange) {
      case "7d":
        startDate = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = now - (90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = now - (30 * 24 * 60 * 60 * 1000); // Default to 30 days
    }

    let deploysQuery = ctx.db.query("pmDeploys")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startDate));

    if (args.projectId) {
      // Filter by project
      const projectTasks = await ctx.db
        .query("pmTasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();

      const taskIds = projectTasks.map(task => task._id);
      const deploys = await deploysQuery.collect();
      
      return deploys.filter(deploy => 
        deploy.taskIds.some(taskId => taskIds.includes(taskId))
      );
    } else {
      return await deploysQuery.collect();
    }
  },
});

// Mutations
export const logDeploy = mutation({
  args: {
    sessionToken: v.string(),
    deployId: v.string(),
    gitSha: v.string(),
    deployer: v.string(),
    environment: v.string(),
    modifiedFunctions: v.array(v.string()),
    taskIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePmRole(ctx, args, "member");

    // Validate that all referenced tasks exist
    if (args.taskIds.length > 0) {
      const tasks = await Promise.all(
        args.taskIds.map(taskId => ctx.db.get(taskId))
      );
      
      const missingTasks = tasks.filter(task => !task);
      if (missingTasks.length > 0) {
        throw new Error(`TASKS_NOT_FOUND: ${missingTasks.map(t => t._id).join(", ")}`);
      }
    }

    const deployId = await ctx.db.insert("pmDeploys", {
      deployId: args.deployId,
      timestamp: Date.now(),
      gitSha: args.gitSha,
      deployer: args.deployer,
      environment: args.environment,
      modifiedFunctions: args.modifiedFunctions,
      taskIds: args.taskIds,
      createdAt: Date.now(),
    });

    return { success: true, deployId };
  },
});

export const linkTaskToDeploy = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    deployId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    // Verify deploy exists
    const deploy = await ctx.db
      .query("pmDeploys")
      .withIndex("by_deployId", (q) => q.eq("deployId", args.deployId))
      .first();

    if (!deploy) {
      throw new Error("DEPLOY_NOT_FOUND");
    }

    // Check if task is already linked to this deploy
    if (deploy.taskIds.includes(args.taskId)) {
      throw new Error("TASK_ALREADY_LINKED_TO_DEPLOY");
    }

    // Add task to deploy
    await ctx.db.patch(deploy._id, {
      taskIds: [...deploy.taskIds, args.taskId],
    });

    // Link deploy to task
    await ctx.db.patch(args.taskId, {
      convexDeployId: args.deployId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const unlinkTaskFromDeploy = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    deployId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    // Verify deploy exists
    const deploy = await ctx.db
      .query("pmDeploys")
      .withIndex("by_deployId", (q) => q.eq("deployId", args.deployId))
      .first();

    if (!deploy) {
      throw new Error("DEPLOY_NOT_FOUND");
    }

    // Remove task from deploy
    await ctx.db.patch(deploy._id, {
      taskIds: deploy.taskIds.filter(taskId => taskId !== taskId),
    });

    // Unlink deploy from task
    await ctx.db.patch(args.taskId, {
      convexDeployId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteDeployLog = mutation({
  args: {
    sessionToken: v.string(),
    deployId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePmRole(ctx, args, "admin");

    const deploy = await ctx.db
      .query("pmDeploys")
      .withIndex("by_deployId", (q) => q.eq("deployId", args.deployId))
      .first();

    if (!deploy) {
      throw new Error("DEPLOY_NOT_FOUND");
    }

    // Unlink all tasks from this deploy
    if (deploy.taskIds.length > 0) {
      await Promise.all(
        deploy.taskIds.map(taskId => 
          ctx.db.patch(taskId, {
            convexDeployId: undefined,
            updatedAt: Date.now(),
          })
        )
      );
    }

    // Delete deploy log
    await ctx.db.delete(deploy._id);

    return { success: true };
  },
});
