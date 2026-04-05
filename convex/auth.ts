import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sync WorkOS user events into the EduMyles users table.
 * user.created → insert or update users row
 * user.updated → patch existing row
 * user.deleted → mark as inactive
 */
export const authKitEvent = internalMutation({
  args: {
    event: v.string(),
    data: v.record(v.string(), v.any()),
  },
  returns: v.null(),
  handler: async (ctx, event) => {
    switch (event.event) {
      case "user.created": {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) => q.eq("workosUserId", event.data.id as string))
      .first();

        if (!existing) {
          await ctx.db.insert("users", {
            tenantId: "PLATFORM",
            eduMylesUserId: `USER-${event.data.id}`,
            workosUserId: event.data.id as string,
            email: event.data.email as string,
            firstName: (event.data.firstName as string | undefined) ?? undefined,
            lastName: (event.data.lastName as string | undefined) ?? undefined,
            role: "school_admin",
            permissions: [],
            organizationId: undefined,
            isActive: true,
            avatarUrl: (event.data.profilePictureUrl as string | undefined) ?? undefined,
            createdAt: Date.now(),
          });
        }
        break;
      }

      case "user.updated": {
        const user = await ctx.db
          .query("users")
          .withIndex("by_workos_user", (q) => q.eq("workosUserId", event.data.id as string))
          .first();

        if (user) {
          await ctx.db.patch(user._id, {
            email: event.data.email as string,
            firstName: (event.data.firstName as string | undefined) ?? undefined,
            lastName: (event.data.lastName as string | undefined) ?? undefined,
            avatarUrl: (event.data.profilePictureUrl as string | undefined) ?? undefined,
          });
        }
        break;
      }

      case "user.deleted": {
        const user = await ctx.db
          .query("users")
          .withIndex("by_workos_user", (q) => q.eq("workosUserId", event.data.id as string))
          .first();

        if (user) {
          await ctx.db.patch(user._id, { isActive: false });
        }
        break;
      }
    }
    return null;
  },
});
