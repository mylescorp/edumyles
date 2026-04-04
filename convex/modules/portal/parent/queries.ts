import { v } from "convex/values";
import { query } from "../../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../../helpers/tenantGuard";
import { requirePermission } from "../../../helpers/authorize";
import { requireModule } from "../../../helpers/moduleGuard";

function isSuccessfulPayment(payment: any) {
  return payment.status === "completed" || payment.status === "success";
}

function sortByNewestTimestamp(items: Array<{ processedAt?: number; updatedAt?: number; createdAt?: number }>) {
  return [...items].sort((a, b) => {
    const aTime = a.processedAt ?? a.updatedAt ?? a.createdAt ?? 0;
    const bTime = b.processedAt ?? b.updatedAt ?? b.createdAt ?? 0;
    return bTime - aTime;
  });
}

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

export const getParentProfile = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);
      await requireModule(ctx, tenant.tenantId, "sis");

      const guardian = await ctx.db
        .query("guardians")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .filter((q) => q.eq(q.field("userId"), tenant.userId))
        .first();

      if (!guardian) {
        console.log("Guardian not found for userId:", tenant.userId);
        return null;
      }

      return guardian;
    } catch (error) {
      console.error("Error in getParentProfile:", error);
      throw error;
    }
  },
});

export const getChildren = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
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

    const allPayments = await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const invoiceIds = new Set(invoices.map((i) => i._id.toString()));
    const payments = allPayments.filter(
      (p) => invoiceIds.has(p.invoiceId) && isSuccessfulPayment(p)
    );

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
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");
    const children = await resolveParentChildren(ctx, tenant);
    if (!children.length) {
      return [];
    }

    const studentIds = new Set(children.map((c: any) => c._id.toString()));
    const allInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const invoices = allInvoices.filter((i) => studentIds.has(i.studentId));

    const invoiceIds = new Set(invoices.map((i) => i._id.toString()));
    const allPayments = await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const payments = allPayments.filter((p) => invoiceIds.has(p.invoiceId));
    const childMap = new Map<string, any>(
      children.map((child: any) => [child._id.toString(), child])
    );
    const invoiceMap = new Map<string, any>(
      invoices.map((invoice: any) => [invoice._id.toString(), invoice])
    );

    return sortByNewestTimestamp(payments).map((payment: any) => {
      const invoice = invoiceMap.get(payment.invoiceId);
      const child = invoice ? childMap.get(invoice.studentId) : null;

      return {
        ...payment,
        studentId: invoice?.studentId,
        studentName: child
          ? `${child.firstName} ${child.lastName}`
          : "Unknown Student",
        invoiceAmount: invoice?.amount ?? 0,
        invoiceStatus: invoice?.status ?? "unknown",
        dueDate: invoice?.dueDate ?? null,
      };
    });
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
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    // Using notifications table as announcements proxy for now
    requirePermission(tenant, "students:read");

    return await ctx.db
      .query("notifications")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .order("desc")
      .collect();
  },
});

export const getChildrenFeeOverview = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");

    const children = await resolveParentChildren(ctx, tenant);
    if (!children.length) {
      return [];
    }

    const studentIds = children.map((c: any) => c._id.toString());

    const allInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const invoices = allInvoices.filter((i: any) => studentIds.includes(i.studentId));

    const invoiceIds = new Set(invoices.map((i: any) => i._id.toString()));
    const allPayments = await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const payments = allPayments.filter(
      (p: any) => invoiceIds.has(p.invoiceId) && isSuccessfulPayment(p)
    );

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
      const pendingInvoices = childInvoices.filter(
        (invoice: any) =>
          invoice.status === "pending" || invoice.status === "partially_paid"
      );

      return {
        studentId: child._id.toString(),
        firstName: child.firstName,
        lastName: child.lastName,
        totalInvoiced,
        totalPaid,
        balance: totalInvoiced - totalPaid,
        pendingInvoiceCount: pendingInvoices.length,
        paidInvoiceCount: childInvoices.filter((invoice: any) => invoice.status === "paid").length,
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
    const allPayments = await ctx.db
      .query("payments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const invoicePayments = allPayments.filter((payment: any) =>
      invoices.some((invoice: any) => invoice._id.toString() === payment.invoiceId)
    );

    return sortByNewestTimestamp(
      invoices
        .filter(
          (inv: any) =>
            inv.status === "pending" || inv.status === "partially_paid"
        )
        .map((invoice: any) => {
          const successfulPayments = invoicePayments.filter(
            (payment: any) =>
              payment.invoiceId === invoice._id.toString() &&
              isSuccessfulPayment(payment)
          );
          const amountPaid = successfulPayments.reduce(
            (sum: number, payment: any) => sum + payment.amount,
            0
          );

          return {
            ...invoice,
            amountPaid,
            balance: Math.max(invoice.amount - amountPaid, 0),
            lastPaymentAt:
              successfulPayments[0]?.processedAt ??
              successfulPayments[0]?._creationTime ??
              null,
          };
        })
    );
  },
});



