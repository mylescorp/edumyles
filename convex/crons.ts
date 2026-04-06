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

export default crons;
