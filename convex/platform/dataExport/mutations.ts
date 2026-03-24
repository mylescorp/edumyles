import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * Initiate a data export job
 */
export const createExport = mutation({
  args: {
    sessionToken: v.string(),
    exportType: v.union(
      v.literal("users"),
      v.literal("tenants"),
      v.literal("tickets"),
      v.literal("deals"),
      v.literal("analytics")
    ),
    format: v.union(v.literal("csv"), v.literal("json")),
    filters: v.optional(v.object({
      dateFrom: v.optional(v.number()),
      dateTo: v.optional(v.number()),
      status: v.optional(v.string()),
      search: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const exportId = await ctx.db.insert("dataExports", {
      tenantId,
      exportType: args.exportType,
      format: args.format,
      status: "pending",
      filters: args.filters,
      createdBy: userId,
      createdAt: Date.now(),
    });

    return { success: true, exportId, message: "Export job created" };
  },
});

/**
 * Generate export data — queries the relevant table, formats output, and stores result
 */
export const generateExportData = mutation({
  args: {
    sessionToken: v.string(),
    exportId: v.string(),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const exp = await ctx.db.get(args.exportId as Id<"dataExports">);
    if (!exp) throw new Error("Export not found");

    await ctx.db.patch(args.exportId as Id<"dataExports">, { status: "processing" });

    try {
      let rows: Record<string, unknown>[] = [];

      switch (exp.exportType) {
        case "users": {
          const users = await ctx.db
            .query("users")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();
          rows = users.map((u) => ({
            id: u._id,
            email: u.email,
            firstName: u.firstName ?? "",
            lastName: u.lastName ?? "",
            role: u.role,
            isActive: u.isActive,
            createdAt: new Date(u.createdAt).toISOString(),
          }));
          break;
        }
        case "tenants": {
          const tenants = await ctx.db.query("tenants").collect();
          rows = tenants.map((t) => ({
            id: t._id,
            tenantId: t.tenantId,
            name: t.name,
            subdomain: t.subdomain,
            plan: t.plan,
            status: t.status,
            email: t.email,
            createdAt: new Date(t.createdAt).toISOString(),
          }));
          break;
        }
        case "tickets": {
          const tickets = await ctx.db
            .query("tickets")
            .filter((q) => q.eq(q.field("tenantId"), tenantId))
            .collect();
          rows = tickets.map((t: any) => ({
            id: t._id,
            subject: t.subject ?? t.title ?? "",
            status: t.status,
            priority: t.priority ?? "",
            createdBy: t.createdBy ?? "",
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : "",
          }));
          break;
        }
        case "deals": {
          try {
            const deals = await ctx.db
              .query("crmDeals")
              .filter((q) => q.eq(q.field("tenantId"), tenantId))
              .collect();
            rows = deals.map((d: any) => ({
              id: d._id,
              name: d.schoolName ?? "",
              stage: d.stage ?? "",
              value: d.value ?? 0,
              status: d.status ?? "",
              createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : "",
            }));
          } catch {
            rows = [];
          }
          break;
        }
        case "analytics": {
          const [auditLogs, sessions] = await Promise.all([
            ctx.db
              .query("auditLogs")
              .filter((q) =>
                q.and(
                  q.eq(q.field("tenantId"), tenantId),
                  q.gte(q.field("timestamp"), Date.now() - 30 * 24 * 60 * 60 * 1000)
                )
              )
              .collect(),
            ctx.db
              .query("sessions")
              .filter((q) => q.eq(q.field("tenantId"), tenantId))
              .collect(),
          ]);
          rows = [
            { metric: "audit_events_30d", value: auditLogs.length, createdAt: new Date().toISOString() },
            { metric: "active_sessions", value: sessions.filter((s) => s.expiresAt > Date.now()).length, createdAt: new Date().toISOString() },
          ];
          break;
        }
      }

      // Apply date filters if present
      if (exp.filters?.dateFrom || exp.filters?.dateTo) {
        rows = rows.filter((row) => {
          const dateStr = row.createdAt as string;
          if (!dateStr) return true;
          const ts = new Date(dateStr).getTime();
          if (exp.filters?.dateFrom && ts < exp.filters.dateFrom) return false;
          if (exp.filters?.dateTo && ts > exp.filters.dateTo) return false;
          return true;
        });
      }

      // Format output
      let dataContent: string;

      if (exp.format === "json") {
        dataContent = JSON.stringify(rows, null, 2);
      } else {
        // CSV format
        if (rows.length === 0) {
          dataContent = "";
        } else {
          const headers = Object.keys(rows[0]);
          const csvLines = [
            headers.join(","),
            ...rows.map((row) =>
              headers
                .map((h) => {
                  const val = String(row[h] ?? "");
                  return val.includes(",") || val.includes('"')
                    ? `"${val.replace(/"/g, '""')}"`
                    : val;
                })
                .join(",")
            ),
          ];
          dataContent = csvLines.join("\n");
        }
      }

      await ctx.db.patch(args.exportId as Id<"dataExports">, {
        status: "completed",
        dataContent,
        rowCount: rows.length,
        completedAt: Date.now(),
      });

      return { success: true, rowCount: rows.length };
    } catch (error: any) {
      await ctx.db.patch(args.exportId as Id<"dataExports">, {
        status: "failed",
        errorMessage: error.message ?? "Unknown error",
        completedAt: Date.now(),
      });
      return { success: false, error: error.message };
    }
  },
});
