// ============================================================
// EduMyles — Student Queries with Organization Scoping
// ============================================================

import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

function isAuthOrTenantError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const message = error.message.toUpperCase();
    return message.includes("UNAUTHENTICATED")
        || message.includes("FORBIDDEN")
        || message.includes("INVALID_TENANT");
}

async function fetchStudentsBySchool(ctx: any, args: any) {
    // 1. AUTHENTICATION & TENANT CONTEXT
    // Get tenant context either from session token or auth context
    const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);

    // 2. PERMISSION VALIDATION
    // Check if user has SIS module access and student read permissions
    await requireModule(ctx, tenant.tenantId, "sis");
    requirePermission(tenant, "students:read");

    // 3. ORGANIZATION SCOPING
    // Determine which organization to query
    let targetTenantId = tenant.tenantId;

    // Platform admins can query other schools if orgId is provided
    if (args.orgId && (tenant.role === "master_admin" || tenant.role === "super_admin")) {
        targetTenantId = args.orgId;

        // Validate that the orgId exists and is a valid tenant
        const targetTenant = await ctx.db
            .query("tenants")
            .withIndex("by_tenantId", (q: any) => q.eq("tenantId", args.orgId))
            .first();

        if (!targetTenant) {
            throw new Error("Organization not found");
        }
    }

    // 4. QUERY CONSTRUCTION WITH INDEX-BASED FILTERING
    let studentsQuery;

    // Choose the most efficient index based on available filters
    if (args.classId) {
        // Use compound index for class-specific queries
        studentsQuery = ctx.db
            .query("students")
            .withIndex("by_tenant_class", (q: any) =>
                q.eq("tenantId", targetTenantId).eq("classId", args.classId)
            );
    } else if (args.status) {
        // Use compound index for status-specific queries
        studentsQuery = ctx.db
            .query("students")
            .withIndex("by_tenant_status", (q: any) =>
                q.eq("tenantId", targetTenantId).eq("status", args.status)
            );
    } else {
        // Use basic tenant index for general queries
        studentsQuery = ctx.db
            .query("students")
            .withIndex("by_tenant", (q: any) => q.eq("tenantId", targetTenantId));
    }

    // 5. ADDITIONAL FILTERING (CLIENT-SIDE FOR NON-INDEXED FIELDS)
    const students = await studentsQuery.collect();

    // Apply additional filters that aren't indexed
    let filteredStudents = students;

    if (args.grade) {
        // Filter by grade level (would need to join with classes table)
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_tenant_grade", (q: any) =>
                q.eq("tenantId", targetTenantId).eq("level", args.grade)
            )
            .collect();

        const classIds = new Set(classes.map((c: any) => c._id));
        filteredStudents = filteredStudents.filter((student: any) =>
            student.classId && classIds.has(student.classId)
        );
    }

    if (args.streamId) {
        filteredStudents = filteredStudents.filter((student: any) =>
            student.streamId === args.streamId
        );
    }

    if (args.search) {
        const searchLower = args.search.toLowerCase();
        filteredStudents = filteredStudents.filter((student: any) =>
            student.firstName.toLowerCase().includes(searchLower) ||
            student.lastName.toLowerCase().includes(searchLower) ||
            student.admissionNumber.toLowerCase().includes(searchLower)
        );
    }

    // 6. SORTING
    if (args.sortBy) {
        filteredStudents.sort((a: any, b: any) => {
            let aValue: any, bValue: any;

            switch (args.sortBy) {
                case "name":
                    aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
                    bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
                    break;
                case "admissionNumber":
                    aValue = a.admissionNumber;
                    bValue = b.admissionNumber;
                    break;
                case "enrolledAt":
                    aValue = a.enrolledAt;
                    bValue = b.enrolledAt;
                    break;
                default:
                    aValue = a.createdAt;
                    bValue = b.createdAt;
            }

            if (args.sortOrder === "desc") {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            } else {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            }
        });
    } else {
        // Default sorting by creation date (newest first)
        filteredStudents.sort((a: any, b: any) => b.createdAt - a.createdAt);
    }

    // 7. PAGINATION
    let paginatedStudents = filteredStudents;

    if (args.cursor) {
        const cursorIndex = filteredStudents.findIndex(
            (student: any) => String(student._id) === args.cursor
        );
        if (cursorIndex !== -1) {
            paginatedStudents = filteredStudents.slice(cursorIndex + 1);
        }
    }

    if (args.limit && args.limit > 0) {
        paginatedStudents = paginatedStudents.slice(0, args.limit);
    }

    // 8. ENRICHMENT (OPTIONAL)
    // Enrich with related data if needed
    const enrichedStudents = await Promise.all(
        paginatedStudents.map(async (student: any) => {
            const enriched: any = { ...student };

            // Add class information if available
            if (student.classId) {
                const classInfo = await ctx.db.get(student.classId);
                enriched.class = classInfo;
            }

            // Add guardian information if available
            if (student.guardianUserId) {
                const guardian = await ctx.db
                    .query("users")
                    .withIndex("by_userId", (q: any) => q.eq("userId", student.guardianUserId))
                    .first();
                enriched.guardian = guardian;
            }

            return enriched;
        })
    );

    // 9. AUDIT LOGGING
    await ctx.db.insert("auditLogs", {
        tenantId: tenant.tenantId,
        actorId: tenant.userId,
        actorEmail: tenant.email,
        action: "students:query",
        entityId: targetTenantId,
        entityType: "tenant",
        timestamp: Date.now(),
    });

    return {
        students: enrichedStudents,
        hasMore: filteredStudents.length > (args.limit || filteredStudents.length),
        total: filteredStudents.length,
        nextCursor: paginatedStudents.length > 0
            ? String(paginatedStudents[paginatedStudents.length - 1]._id)
            : null,
    };
}

/**
 * Get students by school/organization with comprehensive filtering
 * 
 * This query demonstrates org-scoped data access following Convex patterns:
 * 1. Tenant context validation
 * 2. Permission-based access control
 * 3. Module requirement checking
 * 4. Index-based filtering for performance
 */
export const getStudentsBySchool = query({
    args: {
        // Authentication - can use session token or rely on auth context
        sessionToken: v.optional(v.string()),
        
        // Organization filtering
        orgId: v.optional(v.string()), // For platform admins to query specific schools
        
        // Student filtering options
        status: v.optional(v.string()), // active, inactive, graduated, suspended
        classId: v.optional(v.string()), // Filter by specific class
        grade: v.optional(v.string()), // Filter by grade level
        streamId: v.optional(v.string()), // Filter by stream/division
        
        // Search and pagination
        search: v.optional(v.string()), // Search by name or admission number
        limit: v.optional(v.number()), // Pagination limit
        cursor: v.optional(v.string()), // Pagination cursor
        
        // Sorting options
        sortBy: v.optional(v.string()), // name, admissionNumber, enrolledAt
        sortOrder: v.optional(v.string()), // asc, desc
    },
    handler: async (ctx, args) => {
        try {
            return await fetchStudentsBySchool(ctx, args);
        } catch (error) {
            if (isAuthOrTenantError(error)) throw error;
            console.error("getStudentsBySchool failed", error);
            throw new Error("Failed to fetch students");
        }
    },
});

/**
 * Simplified version for basic student listing by school
 */
export const listStudentsBySchool = query({
    args: {
        sessionToken: v.optional(v.string()),
        orgId: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const result = await fetchStudentsBySchool(ctx, args);
        return result.students;
    },
});

/**
 * Get student count by school for dashboard statistics
 */
export const getStudentCountBySchool = query({
    args: {
        sessionToken: v.optional(v.string()),
        orgId: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);

            await requireModule(ctx, tenant.tenantId, "sis");
            requirePermission(tenant, "students:read");

            let targetTenantId = tenant.tenantId;
            
            if (args.orgId && (tenant.role === "master_admin" || tenant.role === "super_admin")) {
                targetTenantId = args.orgId;
            }

            let studentsQuery;
            
            if (args.status) {
                studentsQuery = ctx.db
                    .query("students")
                    .withIndex("by_tenant_status", (q) =>
                        q.eq("tenantId", targetTenantId).eq("status", args.status!)
                    );
            } else {
                studentsQuery = ctx.db
                    .query("students")
                    .withIndex("by_tenant", (q) => q.eq("tenantId", targetTenantId));
            }

            const students = await studentsQuery.collect();
            
            return {
                total: students.length,
                byStatus: students.reduce((acc, student) => {
                    acc[student.status] = (acc[student.status] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
            };

        } catch (error) {
            if (isAuthOrTenantError(error)) throw error;
            console.error("getStudentCountBySchool failed", error);
            throw new Error("Failed to fetch student count");
        }
    },
});
