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
      // Check for automatic tier upgrades based on performance
      const currentTier = publisher.tier;
      
      // Tier upgrade logic
      if (currentTier === "indie" && publisher.stats.totalModules >= 5 && publisher.stats.activeInstalls >= 50) {
        await ctx.db.patch(publisher._id, {
          tier: "verified",
          updatedAt: Date.now(),
        });
        tierUpdates.push({
          publisherId: publisher._id,
          businessName: publisher.businessName,
          oldTier: "indie",
          newTier: "verified",
        });
      } else if (currentTier === "verified" && publisher.stats.totalModules >= 20 && publisher.stats.activeInstalls >= 200) {
        await ctx.db.patch(publisher._id, {
          tier: "enterprise",
          updatedAt: Date.now(),
        });
        tierUpdates.push({
          publisherId: publisher._id,
          businessName: publisher.businessName,
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
        .query("moduleRegistry")
        .filter(q => q.eq(q.field("publisherId"), publisher._id))
        .collect();

      // Get installations for the month (simplified - would come from paymentTransactions)
      const monthlyRevenue = 0; // TODO: Calculate from actual payment data
      const monthlyInstalls = 0; // TODO: Calculate from installation data

      const reportData = {
        publisherId: publisher._id,
        businessName: publisher.businessName,
        period: {
          start: monthStart,
          end: monthEnd,
          month: lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
        },
        revenue: {
          monthly: monthlyRevenue,
          total: publisher.stats.totalRevenue,
        },
        modules: {
          total: modules.length,
          active: modules.filter(m => m.status === "published").length,
          newInstalls: monthlyInstalls,
        },
        stats: publisher.stats,
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
      .withIndex("by_status", q => q.eq("status", "submitted"))
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
          businessName: application.businessName,
          businessType: application.businessType,
          website: application.website,
          description: application.businessDescription,
          tier: "indie", // Start at indie tier
          status: "active",
          verifiedAt: Date.now(),
          verificationDocuments: [],
          contactInfo: {
            email: application.applicantEmail,
            phone: application.contactPhone,
            address: application.contactAddress,
            country: application.country,
          },
          banking: {
            bankName: "",
            accountNumber: "",
            accountName: "",
            branchCode: "",
          },
          stats: {
            totalModules: 0,
            activeModules: 0,
            totalRevenue: 0,
            monthlyRevenue: 0,
            totalInstalls: 0,
            activeInstalls: 0,
          },
          settings: {
            autoApproveUpdates: true,
            emailNotifications: true,
            supportLevel: "basic",
          },
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
        .query("moduleRegistry")
        .filter(q => q.eq(q.field("publisherId"), publisher._id))
        .collect();

      // Get installations (simplified)
      const totalInstalls = 0; // TODO: Calculate from installation data
      const activeInstalls = 0; // TODO: Calculate from active installation data

      // Calculate revenue (simplified)
      const totalRevenue = 0; // TODO: Calculate from payment transactions
      const monthlyRevenue = 0; // TODO: Calculate from recent transactions

      const updatedStats = {
        totalModules: modules.length,
        activeModules: modules.filter(m => m.status === "published").length,
        totalRevenue,
        monthlyRevenue,
        totalInstalls,
        activeInstalls,
      };

      await ctx.db.patch(publisher._id, {
        stats: updatedStats,
        updatedAt: Date.now(),
      });

      statsUpdated.push({
        publisherId: publisher._id,
        businessName: publisher.businessName,
        stats: updatedStats,
      });
    }

    return { statsUpdated: statsUpdated.length };
  },
});
