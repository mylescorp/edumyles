import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "process scheduled reports",
  { hours: 1 },
  internal.platform.scheduledReports.mutations.processDueReports,
  {}
);

export default crons;
