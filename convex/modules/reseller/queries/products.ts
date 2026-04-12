import { query } from "../../../_generated/server";
import { requireResellerContext } from "../../../helpers/resellerGuard";

export const getProducts = query({
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

    const productsByTenant = await Promise.all(
      schools.map(async (school) => {
        const [products, orders] = await Promise.all([
          ctx.db
            .query("products")
            .withIndex("by_tenant", (q) => q.eq("tenantId", school.schoolId))
            .collect(),
          ctx.db
            .query("orders")
            .withIndex("by_tenant", (q) => q.eq("tenantId", school.schoolId))
            .collect(),
        ]);

        const orderIds = orders.map((order) => String(order._id));
        const items = (
          await Promise.all(
            orderIds.map((orderId) =>
              ctx.db
                .query("orderItems")
                .withIndex("by_order", (q) => q.eq("orderId", orderId))
                .collect()
            )
          )
        ).flat();

        const aggregates = new Map<
          string,
          {
            quantitySold: number;
            revenueCents: number;
          }
        >();

        for (const item of items) {
          const entry = aggregates.get(item.productId) ?? {
            quantitySold: 0,
            revenueCents: 0,
          };
          entry.quantitySold += item.quantity;
          entry.revenueCents += item.quantity * item.unitPriceCents;
          aggregates.set(item.productId, entry);
        }

        return products.map((product) => {
          const aggregate = aggregates.get(String(product._id)) ?? {
            quantitySold: 0,
            revenueCents: 0,
          };

          return {
            ...product,
            schoolId: school.schoolId,
            schoolName: school.schoolName,
            schoolStatus: school.status,
            quantitySold: aggregate.quantitySold,
            revenueCents: aggregate.revenueCents,
            inventoryValueCents: product.stock * product.priceCents,
          };
        });
      })
    );

    return productsByTenant
      .flat()
      .sort((a, b) => b.revenueCents - a.revenueCents || a.name.localeCompare(b.name));
  },
});
