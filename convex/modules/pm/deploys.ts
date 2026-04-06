import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requirePmRole } from "./roles";

// SECURITY: PM functions use requirePmRole(), which internally validates the
// tenant session before applying PM-specific authorization.

// Simplified deploy logging
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
