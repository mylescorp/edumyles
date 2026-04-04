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

export default crons;
