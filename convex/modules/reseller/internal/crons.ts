import { internalMutation } from "../../_generated/server";
import { COMMISSION_HOLD_DAYS, AFFILIATE_COMMISSION_RATE } from "../../../shared/src/constants";

// Process commission availability - move commissions from "held" to "available"
export const processCommissionAvailability = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all held commissions that should now be available
    const heldCommissions = await ctx.db
      .query("resellerCommissions")
      .withIndex("by_status", q => q.eq("status", "held"))
      .collect();

    const availableCommissions = heldCommissions.filter(c => c.availableAt <= now);

    // Update status to available
    await Promise.all(
      availableCommissions.map(commission =>
        ctx.db.patch(commission._id, {
          status: "available",
        })
      )
    );

    return { processed: availableCommissions.length };
  },
});

// Calculate and create renewal commissions for existing subscriptions
export const processRenewalCommissions = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all active reseller schools
    const activeSchools = await ctx.db
      .query("resellerSchools")
      .withIndex("by_status", q => q.eq("status", "converted"))
      .collect();

    const renewalsProcessed = [];

    for (const school of activeSchools) {
      // Check if this school has a renewal due (simplified - in reality you'd check actual subscription dates)
      const lastRenewalDate = school.convertedAt; // This would be the actual subscription renewal date
      const renewalPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days
      const nextRenewalDate = lastRenewalDate + renewalPeriod;

      if (nextRenewalDate <= Date.now()) {
        // Create renewal commission
        const commissionId = `COMM-RENEWAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const holdDays = COMMISSION_HOLD_DAYS;
        const availableAt = Date.now() + (holdDays * 24 * 60 * 60 * 1000);

        await ctx.db.insert("resellerCommissions", {
          resellerId: school.resellerId,
          commissionId,
          sourceId: school.schoolId,
          sourceType: "school",
          type: "renewal",
          amount: school.subscriptionValue * (school.commissionRate / 100),
          rate: school.commissionRate,
          currency: "KES",
          status: "held",
          earnedAt: Date.now(),
          availableAt,
          description: `Renewal commission for ${school.schoolName} (${school.subscriptionPlan})`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        renewalsProcessed.push({
          schoolId: school.schoolId,
          commissionId,
          amount: school.subscriptionValue * (school.commissionRate / 100),
        });
      }
    }

    return { renewalsProcessed: renewalsProcessed.length };
  },
});

// Check for tier promotions based on performance
export const processTierPromotions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const resellers = await ctx.db
      .query("resellers")
      .collect();

    const promotions = [];

    for (const reseller of resellers) {
      if (reseller.applicantType !== "reseller") continue; // Only process resellers, not affiliates

      // Get tier requirements
      const tierRequirements = await ctx.db
        .query("resellerTiers")
        .withIndex("by_tier", q => q.eq("tierName", reseller.tier))
        .first();

      if (!tierRequirements) continue;

      // Check if reseller qualifies for next tier
      const tierOrder = ["starter", "silver", "gold", "platinum"];
      const currentIndex = tierOrder.indexOf(reseller.tier);
      if (currentIndex >= tierOrder.length - 1) continue; // Already at highest tier

      const nextTier = tierOrder[currentIndex + 1];
      const nextTierRequirements = await ctx.db
        .query("resellerTiers")
        .withIndex("by_tier", q => q.eq("tierName", nextTier))
        .first();

      if (!nextTierRequirements) continue;

      // Check requirements
      const qualifies = 
        reseller.stats.totalReferrals >= nextTierRequirements.requirements.minReferrals &&
        reseller.stats.totalCommission >= nextTierRequirements.requirements.minRevenue &&
        reseller.stats.conversionRate >= nextTierRequirements.requirements.minConversionRate;

      if (qualifies) {
        // Promote to next tier
        await ctx.db.patch(reseller._id, {
          tier: nextTier,
          commission: {
            ...reseller.commission,
            tier: nextTier,
            rate: nextTierRequirements.commissionRate,
          },
          updatedAt: Date.now(),
        });

        promotions.push({
          resellerId: reseller._id,
          businessName: reseller.businessName,
          oldTier: reseller.tier,
          newTier: nextTier,
        });
      }
    }

    return { promotions: promotions.length };
  },
});

// Generate monthly commission reports
export const generateMonthlyReports = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).getTime();
    const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getTime();

    const resellers = await ctx.db
      .query("resellers")
      .collect();

    const reportsGenerated = [];

    for (const reseller of resellers) {
      // Get commissions for the month
      const monthlyCommissions = await ctx.db
        .query("resellerCommissions")
        .withIndex("by_reseller", q => q.eq("resellerId", reseller._id))
        .collect();

      const monthCommissions = monthlyCommissions.filter(c => 
        c.earnedAt >= monthStart && c.earnedAt < monthEnd
      );

      // Get schools converted during the month
      const monthlySchools = await ctx.db
        .query("resellerSchools")
        .withIndex("by_reseller", q => q.eq("resellerId", reseller._id))
        .collect();

      const monthSchools = monthlySchools.filter(s => 
        s.convertedAt >= monthStart && s.convertedAt < monthEnd
      );

      // Generate report data
      const reportData = {
        resellerId: reseller._id,
        businessName: reseller.businessName,
        period: {
          start: monthStart,
          end: monthEnd,
          month: lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
        },
        commissions: {
          total: monthCommissions.length,
          amount: monthCommissions.reduce((sum, c) => sum + c.amount, 0),
          byType: monthCommissions.reduce((acc, c) => {
            if (!acc[c.type]) acc[c.type] = { count: 0, amount: 0 };
            acc[c.type].count++;
            acc[c.type].amount += c.amount;
            return acc;
          }, {} as Record<string, { count: number; amount: number }>),
        },
        schools: {
          totalConverted: monthSchools.length,
          totalValue: monthSchools.reduce((sum, s) => sum + (s.subscriptionValue || 0), 0),
        },
        stats: {
          totalReferrals: reseller.stats.totalReferrals,
          conversionRate: reseller.stats.conversionRate,
          tier: reseller.tier,
        },
      };

      reportsGenerated.push(reportData);
    }

    return { reportsGenerated: reportsGenerated.length };
  },
});

// Clean up old referral clicks (older than 90 days)
export const cleanupOldReferralClicks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffDate = Date.now() - (90 * 24 * 60 * 60 * 1000);

    const oldClicks = await ctx.db
      .query("resellerReferralClicks")
      .collect();

    const clicksToDelete = oldClicks.filter(c => c.timestamp < cutoffDate && !c.converted);

    await Promise.all(
      clicksToDelete.map(click => ctx.db.delete(click._id))
    );

    return { deleted: clicksToDelete.length };
  },
});
