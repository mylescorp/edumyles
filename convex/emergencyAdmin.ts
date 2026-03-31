import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Emergency master admin creation - bypass session check for initial setup
export const createEmergencyMasterAdmin = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    // This is a one-time emergency function - remove after use
    console.log("Emergency master admin creation for:", args.email);

    // Get or create PLATFORM organization
    let org = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", "PLATFORM"))
      .first();

    if (!org) {
      console.log("Creating PLATFORM organization");
      org = await ctx.db.insert("organizations", {
        tenantId: "PLATFORM",
        workosOrgId: "platform-default",
        name: "EduMyles Platform",
        subdomain: "platform",
        tier: "enterprise",
        isActive: true,
        createdAt: Date.now(),
      });
    }

    const allUsers = await ctx.db.query("users").collect();
    const matchingUsers = allUsers.filter(
      (user) => user.email.toLowerCase() === args.email.toLowerCase()
    );

    if (matchingUsers.length > 0) {
      console.log("User already exists, updating matching records to master_admin");

      for (const user of matchingUsers) {
        await ctx.db.patch(user._id, {
          tenantId: "PLATFORM",
          role: "master_admin",
          organizationId: org._id,
          permissions: user.permissions.includes("*") ? user.permissions : ["*", ...user.permissions],
          isActive: true,
        });
      }

      const sessions = await ctx.db.query("sessions").collect();
      for (const session of sessions.filter(
        (record) => record.email?.toLowerCase() === args.email.toLowerCase()
      )) {
        await ctx.db.patch(session._id, {
          tenantId: "PLATFORM",
          role: "master_admin",
        });
      }

      return {
        success: true,
        action: "updated",
        userIds: matchingUsers.map((user) => user._id),
      };
    }

    // Create the master admin user
    const userId = `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const userId_db = await ctx.db.insert("users", {
      tenantId: "PLATFORM",
      eduMylesUserId: userId,
      workosUserId: `pending-${userId}`,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: "master_admin",
      permissions: [],
      organizationId: org._id,
      isActive: true,
      createdAt: Date.now(),
    });

    console.log("Created master admin:", { userId, email: args.email });
    
    return { 
      success: true, 
      action: "created", 
      userId: userId_db,
      eduMylesUserId: userId,
      organizationId: org._id
    };
  },
});
