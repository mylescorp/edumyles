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
  (internal as any).modules.marketplace.pilotGrants.processPilotExpiry,
  {}
);

crons.daily(
  "monthly module billing",
  { hourUTC: 21, minuteUTC: 1 },
  (internal as any).modules.marketplace.billing.runMonthlyModuleBilling,
  {}
);

crons.daily(
  "module data purge",
  { hourUTC: 0, minuteUTC: 0 },
  (internal as any).modules.marketplace.installation.purgeExpiredModuleData,
  {}
);

crons.daily(
  "payment grace period check",
  { hourUTC: 5, minuteUTC: 0 },
  (internal as any).modules.marketplace.billing.checkPaymentGracePeriods,
  {}
);

crons.interval(
  "event bus dead letter retry",
  { minutes: 15 },
  internal.eventBus.retryFailedEvents,
  {}
);

crons.daily(
  "library overdue check",
  { hourUTC: 5, minuteUTC: 30 },
  (internal as any).modules.marketplace.billing.checkLibraryOverdues,
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
  "expire platform invites",
  { hourUTC: 22, minuteUTC: 30 },
  (internal as any).modules.platform.users.expireOldInvites,
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
