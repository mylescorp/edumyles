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
    
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) =>
        q.eq("tenantId", "PLATFORM").eq("email", args.email)
      )
      .first();

    if (existing) {
      console.log("User already exists, updating role to master_admin");
      await ctx.db.patch(existing._id, { role: "master_admin" });
      return { success: true, action: "updated", userId: existing._id };
    }

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
