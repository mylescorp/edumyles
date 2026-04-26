import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "process scheduled reports",
  { hours: 1 },
  internal.platform.scheduledReports.mutations.processDueReports,
  {}
);

crons.interval(
  "cleanup expired sessions",
  { hours: 6 },
  internal.system.maintenance.cleanupExpiredSessions,
  {}
);

crons.interval(
  "send overdue invoice alerts",
  { hours: 24 },
  internal.system.maintenance.sendOverdueInvoiceAlerts,
  {}
);

crons.interval(
  "detect sla breaches",
  { hours: 1 },
  internal.system.maintenance.detectSlaBreaches,
  {}
);

crons.interval(
  "reconcile pending payments",
  { hours: 2 },
  internal.system.maintenance.reconcilePendingPayments,
  { staleAfterHours: 24 }
);

crons.interval(
  "refresh currency rates",
  { hours: 24 },
  (internal as any).modules.platform.currency.updateCurrencyRates,
  {}
);

crons.interval(
  "process expired pilot grants",
  { hours: 24 },
  (internal as any).modules.platform.pilotGrants.processExpiredGrants,
  {}
);

crons.daily(
  "process pilot grant expiry",
  { hourUTC: 21, minuteUTC: 0 },
  (internal as any).modules.platform.pilotGrants.processExpiredGrants,
  {}
);

crons.daily(
  "check stalled onboardings",
  { hourUTC: 21, minuteUTC: 30 },
  (internal as any).modules.platform.onboarding.checkStalledOnboardings,
  {}
);

crons.daily(
  "send trial interventions",
  { hourUTC: 22, minuteUTC: 0 },
  (internal as any).modules.platform.onboarding.sendTrialInterventions,
  {}
);

crons.daily(
  "refresh currency rates daily",
  { hourUTC: 6, minuteUTC: 0 },
  (internal as any).modules.platform.currency.updateCurrencyRates,
  {}
);

crons.daily(
  "check overdue crm follow-ups",
  { hourUTC: 5, minuteUTC: 0 },
  (internal as any).modules.platform.crm.checkOverdueFollowUps,
  {}
);

crons.interval(
  "send upcoming demo reminders",
  { hours: 1 },
  (internal as any).modules.platform.demoRequests.sendUpcomingDemoReminders,
  {}
);

crons.interval(
  "send overdue demo alerts",
  { hours: 2 },
  (internal as any).modules.platform.demoRequests.sendOverdueDemoAlerts,
  {}
);

crons.daily(
  "send daily demo digest",
  { hourUTC: 4, minuteUTC: 45 },
  (internal as any).modules.platform.demoRequests.sendDailyDemoDigest,
  {}
);

crons.interval(
  "social refresh expired tokens",
  { hours: 6 },
  (internal as any).modules.social.oauth.refreshExpiredTokens,
  {}
);

crons.daily(
  "social alert expiring tokens",
  { hourUTC: 5, minuteUTC: 30 },
  (internal as any).modules.social.oauth.alertExpiringTokens,
  {}
);

crons.interval(
  "social process scheduled posts",
  { minutes: 5 },
  (internal as any).modules.social.publish.processScheduledPosts,
  {}
);

crons.interval(
  "social pull post analytics",
  { hours: 4 },
  (internal as any).modules.social.analytics.pullAllPostAnalytics,
  {}
);

crons.daily(
  "social pull account analytics",
  { hourUTC: 4, minuteUTC: 0 },
  (internal as any).modules.social.analytics.pullAllAccountAnalytics,
  {}
);

crons.interval(
  "social pull comments",
  { minutes: 30 },
  (internal as any).modules.social.comments.pullAllCommentsForPublishedPosts,
  {}
);

crons.daily(
  "expire crm lead shares",
  { hourUTC: 6, minuteUTC: 0 },
  (internal as any).modules.platform.crm.expireCRMShares,
  {}
);

crons.weekly(
  "send weekly crm pipeline report",
  { dayOfWeek: "monday", hourUTC: 6, minuteUTC: 0 },
  (internal as any).modules.platform.crm.sendWeeklyPipelineReport,
  {}
);

crons.daily(
  "expire platform invites",
  { hourUTC: 22, minuteUTC: 30 },
  (internal as any).modules.platform.rbac.expirePlatformInvites,
  {}
);

crons.daily(
  "expire platform access",
  { hourUTC: 19, minuteUTC: 30 },
  (internal as any).modules.platform.rbac.expireAccessExpiredAccounts,
  {}
);

crons.daily(
  "run daily security checks",
  { hourUTC: 6, minuteUTC: 0 },
  (internal as any).modules.platform.auth.runDailySecurityChecks,
  {}
);

crons.daily(
  "send pm task due notifications",
  { hourUTC: 5, minuteUTC: 0 },
  (internal as any).modules.pm.crons.sendTaskDueNotifications,
  {}
);

crons.daily(
  "mark overdue pm tasks",
  { hourUTC: 5, minuteUTC: 30 },
  (internal as any).modules.pm.crons.markOverdueTasks,
  {}
);

crons.daily(
  "notify sprint ending soon",
  { hourUTC: 6, minuteUTC: 0 },
  (internal as any).modules.pm.crons.notifySprintEndingSoon,
  {}
);

crons.weekly(
  "send weekly pm summary",
  { dayOfWeek: "monday", hourUTC: 6, minuteUTC: 15 },
  (internal as any).modules.pm.crons.sendWeeklyProjectSummary,
  {}
);

crons.monthly(
  "purge old platform notifications",
  { day: 1, hourUTC: 6, minuteUTC: 30 },
  (internal as any).platform.notifications.mutations.purgeOldNotifications,
  {}
);

crons.daily(
  "check sla breaches",
  { hourUTC: 8, minuteUTC: 0 },
  internal.system.maintenance.detectSlaBreaches,
  {}
);

// Publisher & Reseller System Cron Jobs

// TODO: Re-enable these crons after API generation includes reseller/publisher modules
// crons.hourly(
//   "process commission availability",
//   { minuteUTC: 0 },
//   internal.modules.reseller.internal.crons.processCommissionAvailability,
//   {}
// );

// crons.daily(
//   "process renewal commissions",
//   { hourUTC: 2, minuteUTC: 0 },
//   internal.modules.reseller.internal.crons.processRenewalCommissions,
//   {}
// );

// crons.weekly(
//   "process tier promotions",
//   { hourUTC: 1, minuteUTC: 0, dayOfWeek: "monday" },
//   internal.modules.reseller.internal.crons.processTierPromotions,
//   {}
// );

// crons.monthly(
//   "generate monthly reseller reports",
//   { hourUTC: 3, minuteUTC: 0, day: 1 },
//   internal.modules.reseller.internal.crons.generateMonthlyReports,
//   {}
// );

// crons.weekly(
//   "cleanup old referral clicks",
//   { hourUTC: 4, minuteUTC: 0, dayOfWeek: "sunday" },
//   internal.modules.reseller.internal.crons.cleanupOldReferralClicks,
//   {}
// );

// crons.weekly(
//   "process publisher tier reviews",
//   { hourUTC: 6, minuteUTC: 0, dayOfWeek: "wednesday" },
//   internal.modules.publisher.internal.crons.processPublisherTierReviews,
//   {}
// );

// crons.monthly(
//   "generate publisher revenue reports",
//   { hourUTC: 7, minuteUTC: 0, day: 1 },
//   internal.modules.publisher.internal.crons.generatePublisherRevenueReports,
//   {}
// );

// TODO: Re-enable after API generation includes publisher modules
// crons.daily(
//   "review pending publisher applications",
//   { hourUTC: 9, minuteUTC: 0 },
//   internal.modules.publisher.internal.crons.reviewPendingApplications,
//   {}
// );

// crons.daily(
//   "update publisher statistics",
//   { hourUTC: 5, minuteUTC: 0 },
//   internal.modules.publisher.internal.crons.updatePublisherStats,
//   {}
// );

export default crons;
