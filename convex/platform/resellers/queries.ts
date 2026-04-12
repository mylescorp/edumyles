import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformRole } from "../../helpers/platformGuard";

const platformResellerRoles = [
  "marketplace_reviewer",
  "platform_manager",
  "super_admin",
  "master_admin",
] as const;

export const getResellers = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(v.literal("active"), v.literal("suspended"), v.literal("inactive"))
    ),
    tier: v.optional(
      v.union(
        v.literal("starter"),
        v.literal("silver"),
        v.literal("gold"),
        v.literal("platinum")
      )
    ),
    applicantType: v.optional(v.union(v.literal("reseller"), v.literal("affiliate"))),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [...platformResellerRoles]);

    let resellers = await ctx.db.query("resellers").collect();
    if (args.status) {
      resellers = resellers.filter((reseller) => reseller.status === args.status);
    }
    if (args.tier) {
      resellers = resellers.filter((reseller) => reseller.tier === args.tier);
    }
    if (args.applicantType) {
      resellers = resellers.filter((reseller) => reseller.applicantType === args.applicantType);
    }

    const [schools, commissions, payouts, applications] = await Promise.all([
      ctx.db.query("resellerSchools").collect(),
      ctx.db.query("resellerCommissions").collect(),
      ctx.db.query("resellerPayouts").collect(),
      ctx.db.query("resellerApplications").collect(),
    ]);

    return resellers
      .map((reseller) => {
        const resellerSchools = schools.filter((school) => school.resellerId === reseller.resellerId);
        const resellerCommissions = commissions.filter(
          (commission) => commission.resellerId === reseller.resellerId
        );
        const resellerPayouts = payouts.filter((payout) => payout.resellerId === reseller.resellerId);
        const matchingApplication = applications.find(
          (application) =>
            application.applicantId === reseller.userId ||
            application.applicantEmail === reseller.contactInfo.email
        );

        return {
          ...reseller,
          applicationStatus: matchingApplication?.status ?? null,
          schools: {
            total: resellerSchools.length,
            converted: resellerSchools.filter((school) => school.status === "converted").length,
            trial: resellerSchools.filter((school) => school.status === "trial").length,
            lead: resellerSchools.filter((school) => school.status === "lead").length,
          },
          commissions: {
            totalKes: resellerCommissions.reduce((sum, commission) => sum + commission.amount, 0),
            availableKes: resellerCommissions
              .filter((commission) => commission.status === "available")
              .reduce((sum, commission) => sum + commission.amount, 0),
            paidKes: resellerCommissions
              .filter((commission) => commission.status === "paid")
              .reduce((sum, commission) => sum + commission.amount, 0),
            count: resellerCommissions.length,
          },
          payouts: {
            totalKes: resellerPayouts
              .filter((payout) => payout.status === "completed")
              .reduce((sum, payout) => sum + payout.amount, 0),
            pendingKes: resellerPayouts
              .filter((payout) => ["pending", "processing"].includes(payout.status))
              .reduce((sum, payout) => sum + payout.amount, 0),
            count: resellerPayouts.length,
          },
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getResellerApplications = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(
        v.literal("submitted"),
        v.literal("under_review"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("on_hold")
      )
    ),
    businessType: v.optional(v.union(v.literal("reseller"), v.literal("affiliate"))),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [...platformResellerRoles]);

    let applications = await ctx.db.query("resellerApplications").collect();
    if (args.status) {
      applications = applications.filter((application) => application.status === args.status);
    }
    if (args.businessType) {
      applications = applications.filter(
        (application) => application.businessType === args.businessType
      );
    }

    const resellers = await ctx.db.query("resellers").collect();

    return applications
      .map((application) => {
        const provisionedReseller = resellers.find(
          (reseller) =>
            reseller.userId === application.applicantId ||
            reseller.contactInfo.email === application.applicantEmail
        );

        return {
          ...application,
          provisionedResellerId: provisionedReseller?.resellerId ?? null,
          provisionedResellerStatus: provisionedReseller?.status ?? null,
          provisionedResellerTier: provisionedReseller?.tier ?? null,
        };
      })
      .sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

const DEFAULT_RESELLER_PROGRAM_SETTINGS = {
  commission: {
    tiers: {
      starter: { rate: 8, minRevenueKes: 0, supportHours: 48 },
      silver: { rate: 12, minRevenueKes: 50000, supportHours: 24 },
      gold: { rate: 15, minRevenueKes: 150000, supportHours: 12 },
      platinum: { rate: 20, minRevenueKes: 500000, supportHours: 4 },
    },
    minimumPayoutKes: 1000,
    payoutSchedule: "monthly",
    paymentMethod: "bank_transfer",
    taxWithholdingPct: 5,
  },
  applications: {
    autoApproveTier: "none",
    reviewProcess: "manual",
    probationDays: 90,
    requiredDocuments: ["business_registration", "tax_compliance", "bank_statement"],
    welcomeEmail: true,
    onboardingMaterials: true,
  },
  support: {
    responseHours: {
      starter: 48,
      silver: 24,
      gold: 12,
      platinum: 4,
    },
    supportChannels: ["email", "phone", "chat", "knowledge_base"],
    escalationPolicy: true,
  },
  notifications: {
    newApplications: true,
    commissionPayouts: true,
    tierUpgrades: true,
    performanceReports: true,
    systemMaintenance: true,
    complianceAlerts: true,
  },
};

function getAnalyticsPeriodStart(period: "7d" | "30d" | "90d" | "1y") {
  const now = Date.now();
  switch (period) {
    case "7d":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return now - 30 * 24 * 60 * 60 * 1000;
    case "90d":
      return now - 90 * 24 * 60 * 60 * 1000;
    case "1y":
      return now - 365 * 24 * 60 * 60 * 1000;
  }
}

function mergeResellerProgramSettings(overrides: any) {
  return {
    ...DEFAULT_RESELLER_PROGRAM_SETTINGS,
    ...overrides,
    commission: {
      ...DEFAULT_RESELLER_PROGRAM_SETTINGS.commission,
      ...overrides?.commission,
      tiers: {
        ...DEFAULT_RESELLER_PROGRAM_SETTINGS.commission.tiers,
        ...overrides?.commission?.tiers,
      },
    },
    applications: {
      ...DEFAULT_RESELLER_PROGRAM_SETTINGS.applications,
      ...overrides?.applications,
    },
    support: {
      ...DEFAULT_RESELLER_PROGRAM_SETTINGS.support,
      ...overrides?.support,
      responseHours: {
        ...DEFAULT_RESELLER_PROGRAM_SETTINGS.support.responseHours,
        ...overrides?.support?.responseHours,
      },
    },
    notifications: {
      ...DEFAULT_RESELLER_PROGRAM_SETTINGS.notifications,
      ...overrides?.notifications,
    },
  };
}

export const getResellerProgramSettings = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [...platformResellerRoles]);
    const record = await ctx.db
      .query("platform_settings")
      .withIndex("by_key", (q) => q.eq("key", "reseller_program_settings"))
      .first();

    return mergeResellerProgramSettings(record?.value);
  },
});

export const getResellerAnalytics = query({
  args: {
    sessionToken: v.string(),
    period: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y")),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [...platformResellerRoles]);

    const startDate = getAnalyticsPeriodStart(args.period);
    const [resellers, schools, commissions, payouts, applications] = await Promise.all([
      ctx.db.query("resellers").collect(),
      ctx.db.query("resellerSchools").collect(),
      ctx.db.query("resellerCommissions").collect(),
      ctx.db.query("resellerPayouts").collect(),
      ctx.db.query("resellerApplications").collect(),
    ]);

    const filteredSchools = schools.filter((school) => school.createdAt >= startDate);
    const filteredCommissions = commissions.filter((commission) => commission.createdAt >= startDate);
    const filteredApplications = applications.filter((application) => application.submittedAt >= startDate);

    const summary = {
      totalPartners: resellers.length,
      activePartners: resellers.filter((reseller) => reseller.status === "active").length,
      totalSchools: schools.length,
      convertedSchools: schools.filter((school) => school.status === "converted").length,
      totalCommissionKes: filteredCommissions.reduce((sum, commission) => sum + commission.amount, 0),
      availableCommissionKes: filteredCommissions
        .filter((commission) => commission.status === "available")
        .reduce((sum, commission) => sum + commission.amount, 0),
      totalPayoutKes: payouts
        .filter((payout) => payout.status === "completed")
        .reduce((sum, payout) => sum + payout.amount, 0),
      pipelineValueKes: filteredSchools.reduce(
        (sum, school) => sum + (school.subscriptionValue ?? 0),
        0
      ),
    };

    const tierPerformance = ["starter", "silver", "gold", "platinum"].map((tier) => {
      const tierResellers = resellers.filter((reseller) => reseller.tier === tier);
      const resellerIds = new Set(tierResellers.map((reseller) => reseller.resellerId));
      const tierSchools = schools.filter((school) => resellerIds.has(school.resellerId));
      const tierCommissions = commissions.filter((commission) => resellerIds.has(commission.resellerId));

      return {
        tier,
        partners: tierResellers.length,
        activePartners: tierResellers.filter((reseller) => reseller.status === "active").length,
        schools: tierSchools.length,
        convertedSchools: tierSchools.filter((school) => school.status === "converted").length,
        commissionKes: tierCommissions.reduce((sum, commission) => sum + commission.amount, 0),
      };
    });

    const topPartners = resellers
      .map((reseller) => {
        const partnerSchools = schools.filter((school) => school.resellerId === reseller.resellerId);
        const partnerCommissions = commissions.filter(
          (commission) => commission.resellerId === reseller.resellerId
        );
        return {
          resellerId: reseller.resellerId,
          businessName: reseller.businessName,
          applicantType: reseller.applicantType,
          tier: reseller.tier,
          status: reseller.status,
          country: reseller.contactInfo.country,
          schools: partnerSchools.length,
          convertedSchools: partnerSchools.filter((school) => school.status === "converted").length,
          commissionKes: partnerCommissions.reduce((sum, commission) => sum + commission.amount, 0),
        };
      })
      .sort((a, b) => b.commissionKes - a.commissionKes || b.convertedSchools - a.convertedSchools)
      .slice(0, 10);

    const geographicPerformance = Object.values(
      resellers.reduce(
        (acc, reseller) => {
          const key = reseller.contactInfo.country || "Unknown";
          if (!acc[key]) {
            acc[key] = {
              country: key,
              partners: 0,
              activePartners: 0,
              schools: 0,
              convertedSchools: 0,
              commissionKes: 0,
            };
          }
          const entry = acc[key];
          const resellerSchools = schools.filter((school) => school.resellerId === reseller.resellerId);
          const resellerCommissions = commissions.filter(
            (commission) => commission.resellerId === reseller.resellerId
          );

          entry.partners += 1;
          entry.activePartners += reseller.status === "active" ? 1 : 0;
          entry.schools += resellerSchools.length;
          entry.convertedSchools += resellerSchools.filter((school) => school.status === "converted").length;
          entry.commissionKes += resellerCommissions.reduce(
            (sum, commission) => sum + commission.amount,
            0
          );
          return acc;
        },
        {} as Record<
          string,
          {
            country: string;
            partners: number;
            activePartners: number;
            schools: number;
            convertedSchools: number;
            commissionKes: number;
          }
        >
      )
    ).sort((a, b) => b.commissionKes - a.commissionKes);

    const applicationFunnel = {
      submitted: filteredApplications.filter((application) => application.status === "submitted").length,
      underReview: filteredApplications.filter((application) => application.status === "under_review").length,
      approved: filteredApplications.filter((application) => application.status === "approved").length,
      rejected: filteredApplications.filter((application) => application.status === "rejected").length,
      onHold: filteredApplications.filter((application) => application.status === "on_hold").length,
    };

    const performanceSeries = Object.values(
      filteredCommissions.reduce(
        (acc, commission) => {
          const date = new Date(commission.createdAt).toISOString().slice(0, 10);
          if (!acc[date]) {
            acc[date] = {
              date,
              commissionKes: 0,
              schoolsAssigned: 0,
              convertedSchools: 0,
            };
          }
          acc[date].commissionKes += commission.amount;
          return acc;
        },
        {} as Record<
          string,
          { date: string; commissionKes: number; schoolsAssigned: number; convertedSchools: number }
        >
      )
    );

    for (const school of filteredSchools) {
      const date = new Date(school.createdAt).toISOString().slice(0, 10);
      const existing =
        performanceSeries.find((entry) => entry.date === date) ??
        (() => {
          const created = {
            date,
            commissionKes: 0,
            schoolsAssigned: 0,
            convertedSchools: 0,
          };
          performanceSeries.push(created);
          return created;
        })();
      existing.schoolsAssigned += 1;
      existing.convertedSchools += school.status === "converted" ? 1 : 0;
    }

    performanceSeries.sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: args.period,
      summary,
      tierPerformance,
      topPartners,
      geographicPerformance,
      applicationFunnel,
      performanceSeries,
    };
  },
});
