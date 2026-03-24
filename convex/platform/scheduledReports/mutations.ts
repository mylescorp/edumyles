import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

/**
 * Create a new scheduled report.
 */
export const createScheduledReport = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    reportType: v.string(),
    schedule: v.string(),
    filters: v.optional(v.record(v.string(), v.any())),
    format: v.union(v.literal("csv"), v.literal("excel"), v.literal("pdf")),
    recipients: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, {
      sessionToken: args.sessionToken,
    });

    const now = Date.now();

    // Calculate a next run time based on schedule
    let nextRun = now;
    switch (args.schedule) {
      case "daily":
        nextRun = now + 24 * 60 * 60 * 1000;
        break;
      case "weekly":
        nextRun = now + 7 * 24 * 60 * 60 * 1000;
        break;
      case "monthly":
        nextRun = now + 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        nextRun = now + 24 * 60 * 60 * 1000;
    }

    const id = await ctx.db.insert("scheduledReports", {
      name: args.name,
      reportType: args.reportType,
      schedule: args.schedule,
      filters: args.filters ?? {},
      format: args.format,
      recipients: args.recipients,
      nextRun,
      isActive: true,
      createdBy: userId,
      tenantId,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId,
      actorId: userId,
      actorEmail: email,
      action: "scheduled_report.created",
      entityType: "scheduled_report",
      entityId: String(id),
      after: { name: args.name, reportType: args.reportType, schedule: args.schedule, format: args.format, recipients: args.recipients },
    });

    return { success: true, id, message: "Scheduled report created" };
  },
});

/**
 * Update an existing scheduled report.
 */
export const updateScheduledReport = mutation({
  args: {
    sessionToken: v.string(),
    reportId: v.string(),
    name: v.optional(v.string()),
    reportType: v.optional(v.string()),
    schedule: v.optional(v.string()),
    filters: v.optional(v.record(v.string(), v.any())),
    format: v.optional(v.union(v.literal("csv"), v.literal("excel"), v.literal("pdf"))),
    recipients: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const report = await ctx.db.get(args.reportId as Id<"scheduledReports">);
    if (!report) throw new Error("Report not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.reportType !== undefined) updates.reportType = args.reportType;
    if (args.schedule !== undefined) updates.schedule = args.schedule;
    if (args.filters !== undefined) updates.filters = args.filters;
    if (args.format !== undefined) updates.format = args.format;
    if (args.recipients !== undefined) updates.recipients = args.recipients;

    await ctx.db.patch(args.reportId as Id<"scheduledReports">, updates);

    await logAction(ctx, {
      tenantId,
      actorId: userId,
      actorEmail: email,
      action: "scheduled_report.updated",
      entityType: "scheduled_report",
      entityId: args.reportId,
      before: { name: report.name, reportType: report.reportType, schedule: report.schedule, format: report.format, recipients: report.recipients },
      after: updates,
    });

    return { success: true, message: "Report updated" };
  },
});

/**
 * Delete a scheduled report.
 */
export const deleteScheduledReport = mutation({
  args: {
    sessionToken: v.string(),
    reportId: v.string(),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const report = await ctx.db.get(args.reportId as Id<"scheduledReports">);
    if (!report) throw new Error("Report not found");

    await ctx.db.delete(args.reportId as Id<"scheduledReports">);

    await logAction(ctx, {
      tenantId,
      actorId: userId,
      actorEmail: email,
      action: "scheduled_report.deleted",
      entityType: "scheduled_report",
      entityId: args.reportId,
      before: { name: report.name, reportType: report.reportType, schedule: report.schedule },
    });

    return { success: true, message: "Report deleted" };
  },
});

/**
 * Toggle a scheduled report active/inactive.
 */
export const toggleActive = mutation({
  args: {
    sessionToken: v.string(),
    reportId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const report = await ctx.db.get(args.reportId as Id<"scheduledReports">);
    if (!report) throw new Error("Report not found");

    await ctx.db.patch(args.reportId as Id<"scheduledReports">, {
      isActive: !report.isActive,
      updatedAt: Date.now(),
    });

    return { success: true, isActive: !report.isActive };
  },
});

/**
 * Trigger an immediate report run.
 */
export const runNow = mutation({
  args: {
    sessionToken: v.string(),
    reportId: v.string(),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const report = await ctx.db.get(args.reportId as Id<"scheduledReports">);
    if (!report) throw new Error("Report not found");

    const now = Date.now();

    // Create a run record
    const runId = await ctx.db.insert("scheduledReportRuns", {
      reportId: args.reportId,
      status: "running",
      startedAt: now,
      tenantId,
    });

    // Simulate report generation completing
    await ctx.db.patch(runId, {
      status: "completed",
      completedAt: now + 1000,
      resultUrl: `/reports/${args.reportId}/run-${runId}`,
    });

    // Update the report's lastRun
    await ctx.db.patch(args.reportId as Id<"scheduledReports">, {
      lastRun: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId,
      actorId: userId,
      actorEmail: email,
      action: "scheduled_report.executed",
      entityType: "scheduled_report",
      entityId: args.reportId,
      after: { runId: String(runId), status: "completed" },
    });

    return { success: true, runId, message: "Report run initiated" };
  },
});
