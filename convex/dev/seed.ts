"use node";

import { action, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { CORE_MODULE_IDS } from "../modules/marketplace/moduleDefinitions";
import { generateTenantId } from "../helpers/idGenerator";

function requireWebhookSecret(provided: string) {
  const expected = process.env.CONVEX_WEBHOOK_SECRET;
  if (!expected || provided !== expected) {
    throw new Error("Unauthorized: invalid webhook secret");
  }
}

export const seedDevDataInternal = internalMutation({
  args: {
    tenantName: v.string(),
    subdomain: v.string(),
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .first();

    if (existingTenant) {
      const existingSession = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("sessionToken", `seed-admin-${args.subdomain}`))
        .first();

      return {
        tenantId: existingTenant.tenantId,
        tenantRecordId: existingTenant._id,
        adminSessionToken: existingSession?.sessionToken ?? "",
        adminRole: existingSession?.role ?? "school_admin",
        created: false,
      };
    }

    const now = Date.now();
    const tenantId = generateTenantId();
    const adminUserId = `seed-admin-${args.subdomain}`;
    const adminSessionToken = `seed-admin-${args.subdomain}`;
    const teacherUserId = `seed-teacher-${args.subdomain}`;
    const bursarUserId = `seed-bursar-${args.subdomain}`;

    const tenantRecordId = await ctx.db.insert("tenants", {
      tenantId,
      name: args.tenantName,
      subdomain: args.subdomain,
      email: args.adminEmail,
      phone: "+254700000000",
      plan: "starter",
      status: "active",
      county: "Nairobi",
      country: "KE",
      createdAt: now,
      updatedAt: now,
    });

    const organizationId = await ctx.db.insert("organizations", {
      tenantId,
      workosOrgId: `seed-org-${args.subdomain}`,
      name: args.tenantName,
      subdomain: args.subdomain,
      tier: "starter",
      isActive: true,
      createdAt: now,
    });

    for (const moduleId of [...CORE_MODULE_IDS, "finance", "hr", "academics", "timetable"]) {
      const existingModule = await ctx.db
        .query("installedModules")
        .withIndex("by_tenant_module", (q) => q.eq("tenantId", tenantId).eq("moduleId", moduleId))
        .first();

      if (!existingModule) {
        await ctx.db.insert("installedModules", {
          tenantId,
          moduleId,
          installedAt: now,
          installedBy: adminUserId,
          config: {},
          status: "active",
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("users", {
      tenantId,
      eduMylesUserId: adminUserId,
      workosUserId: `pending-${adminUserId}`,
      email: args.adminEmail,
      firstName: "Seed",
      lastName: "Admin",
      role: "school_admin",
      permissions: [],
      organizationId,
      isActive: true,
      createdAt: now,
    });

    await ctx.db.insert("sessions", {
      sessionToken: adminSessionToken,
      tenantId,
      userId: adminUserId,
      email: args.adminEmail,
      role: "school_admin",
      expiresAt: now + 1000 * 60 * 60 * 24 * 30,
      createdAt: now,
    });

    const teacherStaffId = await ctx.db.insert("staff", {
      tenantId,
      employeeId: `EMP-${args.subdomain.toUpperCase()}-001`,
      firstName: "Seed",
      lastName: "Teacher",
      email: `teacher+${args.subdomain}@example.com`,
      role: "teacher",
      department: "Academics",
      phone: "+254711111111",
      qualification: "B.Ed",
      joinDate: "2026-01-01",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const bursarStaffId = await ctx.db.insert("staff", {
      tenantId,
      employeeId: `EMP-${args.subdomain.toUpperCase()}-002`,
      firstName: "Seed",
      lastName: "Bursar",
      email: `bursar+${args.subdomain}@example.com`,
      role: "bursar",
      department: "Finance",
      phone: "+254722222222",
      qualification: "CPA",
      joinDate: "2026-01-01",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const classId = await ctx.db.insert("classes", {
      tenantId,
      name: "Grade 7 East",
      level: "Grade 7",
      stream: "East",
      teacherId: teacherUserId,
      capacity: 40,
      academicYear: "2026",
      createdAt: now,
    });

    const studentIds: string[] = [];
    const invoiceIds: string[] = [];
    for (let index = 1; index <= 3; index += 1) {
      const studentId = await ctx.db.insert("students", {
        tenantId,
        admissionNumber: `ADM-${args.subdomain.toUpperCase()}-00${index}`,
        firstName: `Student${index}`,
        lastName: "Seed",
        dateOfBirth: "2012-01-15",
        gender: index % 2 === 0 ? "female" : "male",
        classId: classId.toString(),
        status: "active",
        guardianUserId: undefined,
        photoUrl: undefined,
        enrolledAt: now,
        createdAt: now,
        updatedAt: now,
      });
      studentIds.push(studentId.toString());

      const invoiceId = await ctx.db.insert("invoices", {
        tenantId,
        studentId: studentId.toString(),
        feeStructureId: "",
        amount: 45000,
        status: index === 1 ? "paid" : "pending",
        dueDate: "2026-05-15",
        issuedAt: "2026-04-01",
        createdAt: now,
        updatedAt: now,
      });
      invoiceIds.push(invoiceId.toString());

      if (index === 1) {
        await ctx.db.insert("payments", {
          tenantId,
          invoiceId,
          amount: 45000,
          method: "mpesa",
          reference: `SEED-PAY-${args.subdomain.toUpperCase()}-001`,
          status: "completed",
          processedAt: now,
        });
      }
    }

    const feeStructureId = await ctx.db.insert("feeStructures", {
      tenantId,
      name: "Tuition 2026",
      amount: 45000,
      academicYear: "2026",
      grade: "Grade 7",
      frequency: "termly",
      createdAt: now,
      updatedAt: now,
    });

    return {
      tenantId,
      tenantRecordId,
      organizationId,
      adminSessionToken,
      adminRole: "school_admin",
      staffIds: [teacherStaffId, bursarStaffId],
      classId,
      studentIds,
      feeStructureId,
      invoiceIds,
      created: true,
    };
  },
});

export const seedDevData = action({
  args: {
    webhookSecret: v.string(),
    tenantName: v.string(),
    subdomain: v.string(),
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args.webhookSecret);
    return await ctx.runMutation((ctx as any).internal.dev.seed.seedDevDataInternal, {
      tenantName: args.tenantName,
      subdomain: args.subdomain,
      adminEmail: args.adminEmail,
    });
  },
});
