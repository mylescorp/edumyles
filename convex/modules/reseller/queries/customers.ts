import { query } from "../../../_generated/server";
import { requireResellerContext } from "../../../helpers/resellerGuard";

export const getCustomers = query({
  args: {},
  handler: async (ctx) => {
    const reseller = await requireResellerContext(ctx);
    const schools = await ctx.db
      .query("resellerSchools")
      .withIndex("by_reseller", (q) => q.eq("resellerId", reseller.resellerId))
      .collect();

    if (schools.length === 0) {
      return [];
    }

    const customers = await Promise.all(
      schools.map(async (school) => {
        const [tenant, orders] = await Promise.all([
          ctx.db
            .query("tenants")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", school.schoolId))
            .first(),
          ctx.db
            .query("orders")
            .withIndex("by_tenant", (q) => q.eq("tenantId", school.schoolId))
            .collect(),
        ]);

        const totalOrderCents = orders.reduce((sum, order) => sum + order.totalCents, 0);
        const lastOrderAt =
          orders.length > 0 ? Math.max(...orders.map((order) => order.createdAt)) : null;
        const successfulOrderCount = orders.filter(
          (order) => !["cancelled", "refunded"].includes(order.status)
        ).length;

        return {
          schoolId: school.schoolId,
          schoolName: school.schoolName,
          schoolEmail: school.schoolEmail,
          schoolPhone: school.schoolPhone,
          status: school.status,
          source: school.source,
          assignedAt: school.assignedAt,
          contactedAt: school.contactedAt ?? null,
          convertedAt: school.convertedAt ?? null,
          subscriptionPlan: school.subscriptionPlan ?? null,
          subscriptionValue: school.subscriptionValue ?? null,
          commissionRate: school.commissionRate,
          commissionEarned: school.commissionEarned,
          notesCount: school.notes.length,
          orderCount: successfulOrderCount,
          totalOrderCents,
          lastOrderAt,
          county: tenant?.county ?? null,
          country: tenant?.country ?? null,
          tenantStatus: tenant?.status ?? null,
          tenantPlan: tenant?.plan ?? null,
        };
      })
    );

    return customers.sort((a, b) => {
      if (b.totalOrderCents !== a.totalOrderCents) {
        return b.totalOrderCents - a.totalOrderCents;
      }
      return b.assignedAt - a.assignedAt;
    });
  },
});
