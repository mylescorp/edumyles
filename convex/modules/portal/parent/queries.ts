import { v } from "convex/values";
import { query } from "../../../_generated/server";
import { requireTenantContext } from "../../../helpers/tenantGuard";
import { requirePermission } from "../../../helpers/authorize";
import { requireModule } from "../../../helpers/moduleGuard";

// Helper to resolve all children linked to the current parent
async function resolveParentChildren(ctx: any, tenant: any) {
  const guardians = await ctx.db
    .query("guardians")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
    .filter((q: any) => q.eq(q.field("userId"), tenant.userId))
    .collect();

  const guardianStudentIds = new Set<string>();
  for (const g of guardians) {
    for (const sid of g.studentIds) {
      guardianStudentIds.add(sid);
    }
  }

  const allStudents = await ctx.db
    .query("students")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
    .collect();

  const children = allStudents.filter(
    (s: any) =>
      s.guardianUserId === tenant.userId ||
      guardianStudentIds.has(s._id.toString())
  );

  return children;
}

async function assertChildOwnership(
  ctx: any,
  tenant: any,
  studentId: string
) {
  const children = await resolveParentChildren(ctx, tenant);
  const allowedIds = new Set(
    children.map((c: any) => c._id.toString())
  );

  if (!allowedIds.has(studentId)) {
    throw new Error("FORBIDDEN: Child not linked to parent");
  }
}

async function assertClassOwnership(
  ctx: any,
  tenant: any,
  classId: string
) {
  const children = await resolveParentChildren(ctx, tenant);
  const ownsClass = children.some(
    (c: any) => c.classId && c.classId === classId
  );

  if (!ownsClass) {
    throw new Error("FORBIDDEN: Class not linked to any child");
  }
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

export const getChildGrades = query({
  args: {
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    await assertChildOwnership(ctx, tenant, args.studentId);
    return await ctx.db
      .query("grades")
      .withIndex("by_student", (q) =>
        q.eq("studentId", args.studentId)
      )
      .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

export const getChildAttendance = query({
  args: {
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "attendance:read");

    await assertChildOwnership(ctx, tenant, args.studentId);
    return await ctx.db
      .query("attendance")
      .withIndex("by_student_date", (q) =>
        q.eq("studentId", args.studentId)
      )
      .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

export const getChildTimetable = query({
  args: {
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "students:read");

    await assertClassOwnership(ctx, tenant, args.classId);
    return await ctx.db
      .query("timetables")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

export const getFeeBalance = query({
  args: {
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");

    await assertChildOwnership(ctx, tenant, args.studentId);
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant_student", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("studentId", args.studentId)
      )
      .collect();

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .filter((q) =>
        q.in(
          q.field("invoiceId"),
          invoices.map((i) => i._id.toString())
        )
      )
      .collect();

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalInvoiced,
      totalPaid,
      balance: totalInvoiced - totalPaid,
    };
  },
});

export const getPaymentHistory = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");
    const children = await resolveParentChildren(ctx, tenant);
    if (!children.length) {
      return [];
    }

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .filter((q) =>
        q.in(
          q.field("studentId"),
          children.map((c: any) => c._id.toString())
        )
      )
      .collect();

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .filter((q) =>
        q.in(
          q.field("invoiceId"),
          invoices.map((i) => i._id.toString())
        )
      )
      .collect();

    return payments;
  },
});

export const getChildAssignments = query({
  args: {
    studentId: v.string(),
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    // Ensure both the student and class belong to this parent
    await assertChildOwnership(ctx, tenant, args.studentId);
    await assertClassOwnership(ctx, tenant, args.classId);
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();

    // Later we could join with submissions for per-student status
    return assignments;
  },
});

export const getAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    // Using notifications table as announcements proxy for now
    requirePermission(tenant, "students:read");

    return await ctx.db
      .query("notifications")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .order("desc")
      .collect();
  },
});

// Combined view: children with fee overview for each
export const getChildrenFeeOverview = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");

    const children = await resolveParentChildren(ctx, tenant);
    if (!children.length) {
      return [];
    }

    const studentIds = children.map((c: any) => c._id.toString());

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .filter((q: any) => q.in(q.field("studentId"), studentIds))
      .collect();

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .filter((q: any) =>
        q.in(
          q.field("invoiceId"),
          invoices.map((i: any) => i._id.toString())
        )
      )
      .collect();

    return children.map((child: any) => {
      const childInvoices = invoices.filter(
        (inv: any) => inv.studentId === child._id.toString()
      );
      const childInvoiceIds = new Set(
        childInvoices.map((inv: any) => inv._id.toString())
      );
      const childPayments = payments.filter((p: any) =>
        childInvoiceIds.has(p.invoiceId)
      );

      const totalInvoiced = childInvoices.reduce(
        (sum: number, inv: any) => sum + inv.amount,
        0
      );
      const totalPaid = childPayments.reduce(
        (sum: number, p: any) => sum + p.amount,
        0
      );

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
  args: {
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");

    await assertChildOwnership(ctx, tenant, args.studentId);
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant_student", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("studentId", args.studentId)
      )
      .collect();

    return invoices.filter(
      (inv: any) =>
        inv.status === "pending" || inv.status === "partially_paid"
    );
  },
});



