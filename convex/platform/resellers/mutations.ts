import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformRole } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

const platformResellerRoles = [
  "marketplace_reviewer",
  "platform_manager",
  "super_admin",
  "master_admin",
] as const;

function buildResellerId() {
  return `RES-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function getDefaultTier(applicantType: "reseller" | "affiliate") {
  return applicantType === "affiliate" ? "starter" : "silver";
}

function getDefaultCommissionRate(tier: "starter" | "silver" | "gold" | "platinum") {
  switch (tier) {
    case "platinum":
      return 35;
    case "gold":
      return 30;
    case "silver":
      return 25;
    default:
      return 20;
  }
}

export const reviewResellerApplication = mutation({
  args: {
    sessionToken: v.string(),
    applicationId: v.id("resellerApplications"),
    decision: v.union(
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("on_hold")
    ),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [...platformResellerRoles]);
    const application = await ctx.db.get(args.applicationId);

    if (!application) {
      throw new Error("Reseller application not found");
    }

    const now = Date.now();
    const reviewNotes = args.reviewNotes?.trim();

    await ctx.db.patch(args.applicationId, {
      status: args.decision,
      reviewNotes,
      rejectedReason: args.decision === "rejected" ? reviewNotes : undefined,
      reviewedBy: platform.userId,
      reviewedAt: now,
      updatedAt: now,
    });

    let resellerId: string | undefined;

    if (args.decision === "approved") {
      const existingReseller = await ctx.db
        .query("resellers")
        .withIndex("by_userId", (q) => q.eq("userId", application.applicantId))
        .first();

      const tier = existingReseller?.tier ?? getDefaultTier(application.businessType);
      const commissionRate = getDefaultCommissionRate(tier);

      if (existingReseller) {
        resellerId = existingReseller.resellerId;
        await ctx.db.patch(existingReseller._id, {
          businessName: application.businessName,
          applicantType: application.businessType,
          website: application.website,
          description: application.businessDescription,
          status: "active",
          tier,
          verifiedAt: now,
          contactInfo: {
            email: application.applicantEmail,
            phone: application.contactPhone,
            address: application.contactAddress,
            country: application.country,
          },
          commission: {
            ...existingReseller.commission,
            rate: existingReseller.commission.rate || commissionRate,
            tier,
          },
          updatedAt: now,
        });
      } else {
        resellerId = buildResellerId();
        await ctx.db.insert("resellers", {
          userId: application.applicantId,
          resellerId,
          businessName: application.businessName,
          applicantType: application.businessType,
          website: application.website,
          description: application.businessDescription,
          tier,
          status: "active",
          verifiedAt: now,
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
            accountName: application.businessName,
            branchCode: undefined,
            payPalEmail: application.applicantEmail,
          },
          commission: {
            rate: commissionRate,
            tier,
            holdDays: 7,
            minPayout: 500,
          },
          stats: {
            totalReferrals: 0,
            activeReferrals: 0,
            totalCommission: 0,
            monthlyCommission: 0,
            totalPayouts: 0,
            conversionRate: 0,
          },
          settings: {
            emailNotifications: true,
            monthlyReports: true,
            referralTracking: true,
          },
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "user.updated" as any,
      entityType: "resellerApplication",
      entityId: String(args.applicationId),
      after: {
        decision: args.decision,
        reviewNotes,
        resellerId,
      },
    });

    return {
      success: true,
      resellerId,
      role: application.businessType === "affiliate" ? "affiliate" : "reseller",
      portalPath:
        application.businessType === "affiliate" ? "/portal/affiliate" : "/portal/reseller",
    };
  },
});

export const updateResellerProgramSettings = mutation({
  args: {
    sessionToken: v.string(),
    settings: v.any(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [...platformResellerRoles]);
    const now = Date.now();
    const existing = await ctx.db
      .query("platform_settings")
      .withIndex("by_key", (q) => q.eq("key", "reseller_program_settings"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.settings,
        updatedBy: platform.userId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("platform_settings", {
        key: "reseller_program_settings",
        value: args.settings,
        updatedBy: platform.userId,
        updatedAt: now,
        createdAt: now,
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "settings.updated" as any,
      entityType: "platform_setting",
      entityId: "reseller_program_settings",
      after: args.settings,
    });

    return { success: true };
  },
});
