import { AuthKit, type AuthFunctions } from "@convex-dev/workos-authkit";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

const authFunctions = (internal as Record<string, unknown>).auth as AuthFunctions;

export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
  authFunctions,
});

/**
 * Sync WorkOS user events into the EduMyles users table.
 * user.created → insert or update users row
 * user.updated → patch existing row
 * user.deleted → mark as inactive
 */
export const { authKitEvent } = authKit.events({
  "user.created": async (ctx, event) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) => q.eq("workosUserId", event.data.id))
      .first();

    if (!existing) {
      await ctx.db.insert("users", {
        tenantId: "PLATFORM",
        eduMylesUserId: `USER-${event.data.id}`,
        workosUserId: event.data.id,
        email: event.data.email,
        firstName: event.data.firstName ?? undefined,
        lastName: event.data.lastName ?? undefined,
        role: "school_admin",
        permissions: [],
        organizationId: undefined as any,
        isActive: true,
        avatarUrl: event.data.profilePictureUrl ?? undefined,
        createdAt: Date.now(),
      });
    }
  },

  "user.updated": async (ctx, event) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) => q.eq("workosUserId", event.data.id))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        email: event.data.email,
        firstName: event.data.firstName ?? undefined,
        lastName: event.data.lastName ?? undefined,
        avatarUrl: event.data.profilePictureUrl ?? undefined,
      });
    }
  },

  "user.deleted": async (ctx, event) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q) => q.eq("workosUserId", event.data.id))
      .first();

    if (user) {
      await ctx.db.patch(user._id, { isActive: false });
    }
  },
});
