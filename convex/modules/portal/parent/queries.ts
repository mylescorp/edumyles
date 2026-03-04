import { v } from "convex/values";
import { query } from "../../../_generated/server";
import { requireTenantContext } from "../../../helpers/tenantGuard";
import { requirePermission } from "../../../helpers/authorize";
import { requireModule } from "../../../helpers/moduleGuard";

async function resolveParentChildren(ctx: any, tenant: any) {
  const guardians = await ctx.db
    .query("guardians")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
    .collect();

  const guardianStudentIds = new Set<string>();
  for (const g of guardians) {
    if (g.userId !== tenant.userId) continue;
    for (const sid of g.studentIds ?? []) guardianStudentIds.add(String(sid));
  }

  const students = await ctx.db
    .query("students")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
    .collect();

  return students.filter(
    (s: any) =>
      s.guardianUserId === tenant.userId || guardianStudentIds.has(s._id.toString())
  );
}

async function assertChildOwnership(ctx: any, tenant: any, studentId: string) {
  const children = await resolveParentChildren(ctx, tenant);
  const ok = children.some((c: any) => c._id.toString() === studentId);
  if (!ok) throw new Error("FORBIDDEN: Child not linked to your account");
}

async function assertClassOwnership(ctx: any, tenant: any, classId: string) {
  const children = await resolveParentChildren(ctx, tenant);
  const ok = children.some((c: any) => c.classId === classId);
  if (!ok) throw new Error("FORBIDDEN: Class not linked to your children");
}

export const getChildren = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "sis");
    requirePermission(tenant, "students:read");
    return await resolveParentChildren(ctx, tenant);
  },
});

export const getChildrenFeeOverview = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");

    const children = await resolveParentChildren(ctx, tenant);
    if (!children.length) return [];

    const studentIds = new Set(children.map((c: any) => c._id.toString()));

    const invoices = (await ctx.db
      .query("invoices")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect()).filter((inv: any) => studentIds.has(inv.studentId));

    const invoiceIds = new Set(invoices.map((i: any) => i._id.toString()));
    const payments = (await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect()).filter((p: any) => invoiceIds.has(p.invoiceId));

    return children.map((child: any) => {
      const childInvoices = invoices.filter((inv: any) => inv.studentId === child._id.toString());
      const childInvoiceIds = new Set(childInvoices.map((inv: any) => inv._id.toString()));
      const childPayments = payments.filter((p: any) => childInvoiceIds.has(p.invoiceId));

      const totalInvoiced = childInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
      const totalPaid = childPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

      return {
        studentId: child._id.toString(),
        firstName: child.firstName,
        lastName: child.lastName,
        totalInvoiced,
        totalPaid,
        balance: totalInvoiced - totalPaid,
      };
    });
  },
});

export const getOutstandingInvoicesForChild = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");
    await assertChildOwnership(ctx, tenant, args.studentId);

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant_student", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("studentId", args.studentId)
      )
      .collect();

    return invoices.filter((inv: any) => inv.status !== "paid");
  },
});

export const getPaymentHistory = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");

    const children = await resolveParentChildren(ctx, tenant);
    if (!children.length) return [];

    const childIds = new Set(children.map((c: any) => c._id.toString()));
    const invoices = (await ctx.db
      .query("invoices")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect()).filter((inv: any) => childIds.has(inv.studentId));

    const invoiceIds = new Set(invoices.map((i: any) => i._id.toString()));
    const payments = (await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect()).filter((p: any) => invoiceIds.has(p.invoiceId));

    return payments;
  },
});

export const getAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    requirePermission(tenant, "students:read");
    return await ctx.db
      .query("notifications")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .order("desc")
      .collect();
  },
});

export const getChildTimetable = query({
  args: { classId: v.string() },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "students:read");
    await assertClassOwnership(ctx, tenant, args.classId);

    return await ctx.db
      .query("timetables")
      .withIndex("by_class", (q: any) => q.eq("classId", args.classId))
      .filter((q: any) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

export const getChildGrades = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");
    await assertChildOwnership(ctx, tenant, args.studentId);

    return await ctx.db
      .query("grades")
      .withIndex("by_tenant_student", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("studentId", args.studentId)
      )
      .collect();
  },
});

export const getChildAttendance = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "students:read");
    await assertChildOwnership(ctx, tenant, args.studentId);

    return await ctx.db
      .query("attendance")
      .withIndex("by_student", (q: any) => q.eq("studentId", args.studentId))
      .filter((q: any) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

export const getChildAssignments = query({
  args: { studentId: v.string(), classId: v.string() },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");
    await assertChildOwnership(ctx, tenant, args.studentId);
    await assertClassOwnership(ctx, tenant, args.classId);

    return await ctx.db
      .query("assignments")
      .withIndex("by_class", (q: any) => q.eq("classId", args.classId))
      .filter((q: any) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

