import { internalMutation } from "../../../_generated/server";

// Process publisher tier upgrades and validations
export const processPublisherTierReviews = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const publishers = await ctx.db
      .query("publishers")
      .collect();

    const tierUpdates = [];

    for (const publisher of publishers) {
      const publisherModules = await ctx.db
        .query("modules")
        .withIndex("by_publisherId", (q: any) => q.eq("publisherId", String(publisher._id)))
        .collect();
      const publisherInstalls = publisherModules.length === 0
        ? []
        : await ctx.db
            .query("module_installs")
            .collect()
            .then((items: any[]) =>
              items.filter((install) => publisherModules.some((module: any) => String(module._id) === install.moduleId))
            );

      // Check for automatic tier upgrades based on performance
      const currentTier = publisher.tier;
      const totalModules = publisherModules.length;
      const activeInstalls = publisherInstalls.filter((install: any) => install.status === "active").length;
      
      // Tier upgrade logic
      if (currentTier === "indie" && totalModules >= 5 && activeInstalls >= 50) {
        await ctx.db.patch(publisher._id, {
          tier: "verified",
          updatedAt: Date.now(),
        });
        tierUpdates.push({
          publisherId: publisher._id,
          businessName: publisher.companyName,
          oldTier: "indie",
          newTier: "verified",
        });
      } else if (currentTier === "verified" && totalModules >= 20 && activeInstalls >= 200) {
        await ctx.db.patch(publisher._id, {
          tier: "enterprise",
          updatedAt: Date.now(),
        });
        tierUpdates.push({
          publisherId: publisher._id,
          businessName: publisher.companyName,
          oldTier: "verified",
          newTier: "enterprise",
        });
      }
    }

    return { tierUpdates: tierUpdates.length };
  },
});

// Generate publisher revenue reports
export const generatePublisherRevenueReports = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const now = Date.now();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).getTime();
    const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getTime();

    const publishers = await ctx.db
      .query("publishers")
      .collect();

    const reportsGenerated = [];

    for (const publisher of publishers) {
      // Get modules for this publisher
      const modules = await ctx.db
        .query("modules")
        .withIndex("by_publisherId", (q: any) => q.eq("publisherId", String(publisher._id)))
        .collect();

      // Get installations for the month (simplified - would come from paymentTransactions)
      const monthlyRevenue = 0; // TODO: Calculate from actual payment data
      const monthlyInstalls = 0; // TODO: Calculate from installation data

      const reportData = {
        publisherId: publisher._id,
        businessName: publisher.companyName,
        period: {
          start: monthStart,
          end: monthEnd,
          month: lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
        },
        revenue: {
          monthly: monthlyRevenue,
          total: 0,
        },
        modules: {
          total: modules.length,
          active: modules.filter((m: any) => m.status === "published").length,
          newInstalls: monthlyInstalls,
        },
        stats: {
          tier: publisher.tier,
          status: publisher.status,
        },
      };

      reportsGenerated.push(reportData);
    }

    return { reportsGenerated: reportsGenerated.length };
  },
});

// Review pending publisher applications
export const reviewPendingApplications = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const pendingApplications = await ctx.db
      .query("publisherApplications")
      .withIndex("by_status", (q: any) => q.eq("status", "submitted"))
      .collect();

    const autoApproved = [];
    const flaggedForReview = [];

    for (const application of pendingApplications) {
      // Auto-approval criteria
      const shouldAutoApprove = 
        application.businessType === "individual" || // Individuals get auto-approved
        (application.businessType === "company" && application.modules.length >= 3); // Companies with 3+ modules

      if (shouldAutoApprove) {
        // Create publisher account
        const publisherId = `PUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        await ctx.db.insert("publishers", {
          userId: application.applicantId,
          publisherId,
          companyName: application.businessName,
          email: application.applicantEmail,
          website: application.website,
          revenueSharePct: 70,
          tier: "indie", // Start at indie tier
          status: "approved",
          taxId: undefined,
          billingCountry: application.country,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Update application status
        await ctx.db.patch(application._id, {
          status: "approved",
          reviewedAt: Date.now(),
          updatedAt: Date.now(),
        });

        autoApproved.push({
          applicationId: application._id,
          businessName: application.businessName,
          publisherId,
        });
      } else {
        // Flag for manual review
        await ctx.db.patch(application._id, {
          status: "under_review",
          reviewedAt: Date.now(),
          updatedAt: Date.now(),
        });

        flaggedForReview.push({
          applicationId: application._id,
          businessName: application.businessName,
        });
      }
    }

    return {
      autoApproved: autoApproved.length,
      flaggedForReview: flaggedForReview.length,
    };
  },
});

// Update publisher statistics
export const updatePublisherStats = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const publishers = await ctx.db
      .query("publishers")
      .collect();

    const statsUpdated = [];

    for (const publisher of publishers) {
      // Get modules for this publisher
      const modules = await ctx.db
        .query("modules")
        .withIndex("by_publisherId", (q: any) => q.eq("publisherId", String(publisher._id)))
        .collect();

      const installs = modules.length === 0
        ? []
        : await ctx.db
            .query("module_installs")
            .collect()
            .then((items: any[]) =>
              items.filter((install) => modules.some((module: any) => String(module._id) === install.moduleId))
            );

      const updatedStats = {
        totalModules: modules.length,
        activeModules: modules.filter((m: any) => m.status === "published").length,
        totalInstalls: installs.length,
        activeInstalls: installs.filter((install: any) => install.status === "active").length,
      };

      statsUpdated.push({
        publisherId: publisher._id,
        businessName: publisher.companyName,
        stats: updatedStats,
      });
    }

    return { statsUpdated: statsUpdated.length };
  },
});
