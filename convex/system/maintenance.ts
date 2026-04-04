import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export const cleanupExpiredSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db.query("sessions").collect();
    let removed = 0;

    for (const session of sessions) {
      if ((session.expiresAt ?? 0) < now || session.isActive === false) {
        await ctx.db.delete(session._id);
        removed += 1;
      }
    }

    return { removed };
  },
});

export const sendOverdueInvoiceAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = todayIsoDate();
    const invoices = await ctx.db.query("invoices").collect();
    const overdueInvoices = invoices.filter(
      (invoice) =>
        invoice.status === "pending" &&
        typeof invoice.dueDate === "string" &&
        invoice.dueDate < today
    );

    if (overdueInvoices.length === 0) {
      return { alerted: 0 };
    }

    const students = await ctx.db.query("students").collect();
    const notifications = await ctx.db.query("notifications").collect();
    const studentMap = new Map(students.map((student) => [student._id.toString(), student]));
    let alerted = 0;

    for (const invoice of overdueInvoices) {
      const student = studentMap.get(invoice.studentId);
      const guardianIds = Array.isArray((student as any)?.guardianIds)
        ? ((student as any).guardianIds as string[])
        : [];

      for (const guardianId of guardianIds) {
        const duplicate = notifications.find(
          (notification) =>
            notification.tenantId === invoice.tenantId &&
            notification.userId === guardianId &&
            notification.type === "fee_reminder" &&
            notification.link === `/portal/parent/fees?invoiceId=${invoice._id}` &&
            new Date(notification.createdAt).toISOString().slice(0, 10) === today
        );

        if (duplicate) {
          continue;
        }

        await ctx.db.insert("notifications", {
          tenantId: invoice.tenantId,
          userId: guardianId,
          title: "Overdue fee reminder",
          message: `Invoice ${invoice._id} is overdue. Please review the outstanding balance.`,
          type: "fee_reminder",
          isRead: false,
          link: `/portal/parent/fees?invoiceId=${invoice._id}`,
          createdAt: Date.now(),
        });
        alerted += 1;
      }
    }

    return { alerted };
  },
});

export const detectSlaBreaches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_sla", (q) => q.lte("slaResolutionDL", now))
      .collect();

    let breached = 0;
    for (const ticket of tickets) {
      if (
        ticket.slaBreached ||
        ticket.slaClockPaused ||
        ticket.status === "resolved" ||
        ticket.status === "closed"
      ) {
        continue;
      }

      await ctx.db.patch(ticket._id, {
        slaBreached: true,
        updatedAt: now,
      });
      breached += 1;
    }

    return { breached };
  },
});

export const reconcilePendingPayments = internalMutation({
  args: {
    staleAfterHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const staleAfterHours = args.staleAfterHours ?? 24;
    const cutoff = Date.now() - staleAfterHours * 60 * 60 * 1000;
    const callbacks = await ctx.db.query("paymentCallbacks").collect();
    let reconciled = 0;

    for (const callback of callbacks) {
      if (callback.status !== "pending" || callback.updatedAt >= cutoff) {
        continue;
      }

      await ctx.db.patch(callback._id, {
        status: "failed",
        updatedAt: Date.now(),
        payload: {
          ...(callback.payload ?? {}),
          reconciliation: "marked_failed_by_cron",
          reconciledAt: Date.now(),
        },
      });
      reconciled += 1;
    }

    return { reconciled };
  },
});
