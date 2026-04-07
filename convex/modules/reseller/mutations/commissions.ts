import { v } from "convex/values";
import { mutation, query } from "../../../_generated/server";
import { requireResellerContext } from "../../../helpers/resellerGuard";
import { internalLogAction } from "../../../helpers/auditLog";

export const getCommissions = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("held"),
      v.literal("available"),
      v.literal("paid"),
      v.literal("cancelled")
    )),
    type: v.optional(v.union(
      v.literal("referral"),
      v.literal("subscription"),
      v.literal("upgrade"),
      v.literal("renewal")
    )),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);
    
    const page = args.page || 1;
    const pageSize = args.pageSize || 25;
    const skip = (page - 1) * pageSize;

    let commissions = await ctx.db
      .query("resellerCommissions")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    // Filter by status if provided
    if (args.status) {
      commissions = commissions.filter(c => c.status === args.status);
    }

    // Filter by type if provided
    if (args.type) {
      commissions = commissions.filter(c => c.type === args.type);
    }

    // Sort by earned date (newest first)
    commissions.sort((a, b) => b.earnedAt - a.earnedAt);

    // Apply pagination
    const paginatedCommissions = commissions.slice(skip, skip + pageSize);

    // Get source information for each commission
    const commissionsWithSource = await Promise.all(
      paginatedCommissions.map(async (commission) => {
        let sourceInfo = null;
        
        if (commission.sourceType === "school") {
          const school = await ctx.db
            .query("resellerSchools")
            .withIndex("by_school", q => q.eq("schoolId", commission.sourceId))
            .first();
          if (school) {
            sourceInfo = {
              type: "school",
              name: school.schoolName,
              status: school.status,
            };
          }
        }

        return {
          ...commission,
          sourceInfo,
        };
      })
    );

    return {
      commissions: commissionsWithSource,
      total: commissions.length,
      page,
      pageSize,
      hasMore: skip + pageSize < commissions.length,
    };
  },
});

export const requestPayout = mutation({
  args: {
    commissionIds: v.array(v.string()),
    method: v.union(v.literal("bank_transfer"), v.literal("mpesa"), v.literal("paypal")),
    bankDetails: v.optional(v.object({
      bankName: v.string(),
      accountNumber: v.string(),
      accountName: v.string(),
      branchCode: v.optional(v.string()),
    })),
    mpesaDetails: v.optional(v.object({
      phoneNumber: v.string(),
      accountName: v.string(),
    })),
    paypalDetails: v.optional(v.object({
      email: v.string(),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Get the commissions
    const commissions = await ctx.db
      .query("resellerCommissions")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.inq("commissionId", args.commissionIds))
      .collect();

    if (commissions.length !== args.commissionIds.length) {
      throw new Error("Some commissions not found");
    }

    // Check if all commissions are available for payout
    const unavailableCommissions = commissions.filter(c => c.status !== "available");
    if (unavailableCommissions.length > 0) {
      throw new Error("Some commissions are not available for payout");
    }

    // Calculate total amount
    const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);

    // Check minimum payout
    if (totalAmount < reseller.reseller.commission.minPayout) {
      throw new Error(`Total amount (${totalAmount} KES) is below minimum payout (${reseller.reseller.commission.minPayout} KES)`);
    }

    // Generate payout ID
    const payoutId = `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payout record
    const payoutDocId = await ctx.db.insert("resellerPayouts", {
      resellerId: reseller.resellerId,
      payoutId,
      amount: totalAmount,
      currency: "KES",
      status: "pending",
      method: args.method,
      bankDetails: args.bankDetails,
      mpesaDetails: args.mpesaDetails,
      paypalDetails: args.paypalDetails,
      commissionIds: args.commissionIds,
      period: {
        startDate: Math.min(...commissions.map(c => c.earnedAt)),
        endDate: Math.max(...commissions.map(c => c.earnedAt)),
      },
      requestedAt: Date.now(),
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update commission status to paid
    await Promise.all(
      commissions.map(commission =>
        ctx.db.patch(commission._id, {
          status: "paid",
          paidAt: Date.now(),
          payoutId: payoutId,
        })
      )
    );

    // Log the action
    await ctx.runMutation(internalLogAction, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "reseller.payout_requested",
      entityType: "payout",
      entityId: payoutDocId,
      after: { 
        payoutId, 
        amount: totalAmount, 
        method: args.method,
        commissionCount: commissions.length 
      },
    });

    return { success: true, payoutId, payoutDocId };
  },
});

export const getPayouts = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    )),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);
    
    const page = args.page || 1;
    const pageSize = args.pageSize || 25;
    const skip = (page - 1) * pageSize;

    let payouts = await ctx.db
      .query("resellerPayouts")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    // Filter by status if provided
    if (args.status) {
      payouts = payouts.filter(p => p.status === args.status);
    }

    // Sort by requested date (newest first)
    payouts.sort((a, b) => b.requestedAt - a.requestedAt);

    // Apply pagination
    const paginatedPayouts = payouts.slice(skip, skip + pageSize);

    return {
      payouts: paginatedPayouts,
      total: payouts.length,
      page,
      pageSize,
      hasMore: skip + pageSize < payouts.length,
    };
  },
});

export const getPayoutDetails = query({
  args: {
    payoutId: v.string(),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Get the payout
    const payout = await ctx.db
      .query("resellerPayouts")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.eq(q.field("payoutId"), args.payoutId))
      .first();

    if (!payout) {
      throw new Error("Payout not found");
    }

    // Get the commissions included in this payout
    const commissions = await ctx.db
      .query("resellerCommissions")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.eq(q.field("payoutId"), args.payoutId))
      .collect();

    // Get source information for each commission
    const commissionsWithSource = await Promise.all(
      commissions.map(async (commission) => {
        let sourceInfo = null;
        
        if (commission.sourceType === "school") {
          const school = await ctx.db
            .query("resellerSchools")
            .withIndex("by_school", q => q.eq("schoolId", commission.sourceId))
            .first();
          if (school) {
            sourceInfo = {
              type: "school",
              name: school.schoolName,
              status: school.status,
            };
          }
        }

        return {
          ...commission,
          sourceInfo,
        };
      })
    );

    return {
      ...payout,
      commissions: commissionsWithSource,
    };
  },
});

export const cancelPayout = mutation({
  args: {
    payoutId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Get the payout
    const payout = await ctx.db
      .query("resellerPayouts")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.eq(q.field("payoutId"), args.payoutId))
      .first();

    if (!payout) {
      throw new Error("Payout not found");
    }

    // Can only cancel pending payouts
    if (payout.status !== "pending") {
      throw new Error("Can only cancel pending payouts");
    }

    // Update payout status
    await ctx.db.patch(payout._id, {
      status: "cancelled",
      notes: args.reason,
      updatedAt: Date.now(),
    });

    // Return commissions to available status
    const commissions = await ctx.db
      .query("resellerCommissions")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .filter(q => q.eq(q.field("payoutId"), args.payoutId))
      .collect();

    await Promise.all(
      commissions.map(commission =>
        ctx.db.patch(commission._id, {
          status: "available",
          paidAt: undefined,
          payoutId: undefined,
        })
      )
    );

    // Log the action
    await ctx.runMutation(internalLogAction, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "reseller.payout_cancelled",
      entityType: "payout",
      entityId: payout._id,
      after: { payoutId: args.payoutId, reason: args.reason },
    });

    return { success: true };
  },
});

export const getCommissionSummary = query({
  args: {
    period: v.union(v.literal("30d"), v.literal("90d"), v.literal("1y")),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Calculate date range
    const now = Date.now();
    let startDate: number;
    
    switch (args.period) {
      case "30d":
        startDate = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = now - (90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = now - (365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get commissions in the period
    const commissions = await ctx.db
      .query("resellerCommissions")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    const periodCommissions = commissions.filter(c => c.earnedAt >= startDate);

    // Group by type
    const byType = periodCommissions.reduce((acc, commission) => {
      if (!acc[commission.type]) {
        acc[commission.type] = { count: 0, amount: 0 };
      }
      acc[commission.type].count++;
      acc[commission.type].amount += commission.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Group by status
    const byStatus = periodCommissions.reduce((acc, commission) => {
      if (!acc[commission.status]) {
        acc[commission.status] = { count: 0, amount: 0 };
      }
      acc[commission.status].count++;
      acc[commission.status].amount += commission.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Get daily data
    const dailyData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate.getTime() <= now) {
      const dayStart = currentDate.getTime();
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      const dayCommissions = periodCommissions.filter(c => 
        c.earnedAt >= dayStart && c.earnedAt < dayEnd
      );

      dailyData.push({
        date: currentDate.toISOString().split('T')[0],
        earned: dayCommissions.reduce((sum, c) => sum + c.amount, 0),
        count: dayCommissions.length,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      period: args.period,
      summary: {
        totalAmount: periodCommissions.reduce((sum, c) => sum + c.amount, 0),
        totalCount: periodCommissions.length,
        byType,
        byStatus,
      },
      dailyData,
    };
  },
});
