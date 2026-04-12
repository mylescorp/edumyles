import { query } from "../../../_generated/server";
import { v } from "convex/values";
import { requireResellerContext } from "../../../helpers/resellerGuard";

export const getOrders = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);
    const schools = await ctx.db
      .query("resellerSchools")
      .withIndex("by_reseller", (q) => q.eq("resellerId", reseller.resellerId))
      .collect();

    if (schools.length === 0) {
      return [];
    }

    const schoolMap = new Map(schools.map((school) => [school.schoolId, school]));
    const ordersBySchool = await Promise.all(
      schools.map((school) =>
        ctx.db
          .query("orders")
          .withIndex("by_tenant", (q) => q.eq("tenantId", school.schoolId))
          .collect()
      )
    );

    let orders = ordersBySchool.flat();
    if (args.status) {
      orders = orders.filter((order) => order.status === args.status);
    }

    const itemCounts = new Map<string, number>();
    await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();
        itemCounts.set(
          String(order._id),
          items.reduce((sum, item) => sum + item.quantity, 0)
        );
      })
    );

    return orders
      .map((order) => {
        const school = schoolMap.get(order.tenantId);
        return {
          ...order,
          schoolName: school?.schoolName ?? order.tenantId,
          schoolEmail: school?.schoolEmail ?? null,
          schoolPhone: school?.schoolPhone ?? null,
          itemCount: itemCounts.get(String(order._id)) ?? 0,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getOrderDetail = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);
    const order = await ctx.db.get(args.orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    const school = await ctx.db
      .query("resellerSchools")
      .withIndex("by_school", (q) => q.eq("schoolId", order.tenantId))
      .first();

    if (!school || school.resellerId !== reseller.resellerId) {
      throw new Error("Order access denied");
    }

    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    const products = await Promise.all(items.map((item) => ctx.db.get(item.productId as any)));
    const productMap = new Map(
      products.filter(Boolean).map((product: any) => [String(product._id), product])
    );

    return {
      ...order,
      schoolName: school.schoolName,
      schoolEmail: school.schoolEmail,
      schoolPhone: school.schoolPhone,
      items: items.map((item) => ({
        ...item,
        productName: productMap.get(String(item.productId))?.name ?? item.productId,
        productCategory: productMap.get(String(item.productId))?.category ?? null,
        lineTotalCents: item.quantity * item.unitPriceCents,
      })),
    };
  },
});
