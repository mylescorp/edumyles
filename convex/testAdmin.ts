import { query } from "./_generated/server";

// Simple query to test if master admin was created
export const testMasterAdmin = query({
  args: {},
  handler: async (ctx) => {
    console.log("Testing if ayany004@gmail.com exists as master admin...");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) =>
        q.eq("tenantId", "PLATFORM").eq("email", "ayany004@gmail.com")
      )
      .first();

    if (!user) {
      console.log("❌ User not found");
      return { found: false, message: "User ayany004@gmail.com not found" };
    }

    console.log("✅ User found:", {
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive,
      eduMylesUserId: user.eduMylesUserId
    });

    return {
      found: true,
      user: {
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        isActive: user.isActive,
        eduMylesUserId: user.eduMylesUserId,
        createdAt: user.createdAt
      },
      isMasterAdmin: user.role === "master_admin"
    };
  },
});
