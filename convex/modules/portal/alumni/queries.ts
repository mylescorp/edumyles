import { v } from "convex/values";
import { query } from "../../../_generated/server";
import { requireTenantContext } from "../../../helpers/tenantGuard";
import { requirePermission } from "../../../helpers/authorize";

/**
 * Get the alumni profile for the current authenticated user.
 */
export const getAlumniProfile = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);

        const alumniRecord = await ctx.db
            .query("alumni")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!alumniRecord || alumniRecord.tenantId !== tenant.tenantId) {
            return null;
        }

        // Also fetch user info for the profile
        const user = await ctx.db
            .query("users")
            .withIndex("by_tenant_email", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("email", tenant.email)
            )
            .first();

        return {
            ...alumniRecord,
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
            avatarUrl: user?.avatarUrl,
        };
    },
});

/**
 * Get academic transcripts (grades/report cards) from the alumni's student record.
 */
export const getTranscripts = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);
        requirePermission(tenant, "grades:read");

        const alumniRecord = await ctx.db
            .query("alumni")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!alumniRecord || alumniRecord.tenantId !== tenant.tenantId) {
            return { grades: [], reportCards: [], requests: [] };
        }

        // If the alumni has a linked studentId, fetch their academic records
        let grades: any[] = [];
        let reportCards: any[] = [];

        if (alumniRecord.studentId) {
            grades = await ctx.db
                .query("grades")
                .withIndex("by_student", (q) =>
                    q.eq("studentId", alumniRecord.studentId!)
                )
                .collect();

            reportCards = await ctx.db
                .query("reportCards")
                .withIndex("by_student_term", (q) =>
                    q.eq("studentId", alumniRecord.studentId!)
                )
                .collect();
        }

        // Fetch transcript requests
        const requests = await ctx.db
            .query("transcriptRequests")
            .withIndex("by_alumni", (q) => q.eq("alumniId", alumniRecord._id))
            .collect();

        return { grades, reportCards, requests };
    },
});

/**
 * Searchable alumni directory with filters.
 */
export const getAlumniDirectory = query({
    args: {
        graduationYear: v.optional(v.number()),
        program: v.optional(v.string()),
        search: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);

        let alumni;
        if (args.graduationYear) {
            alumni = await ctx.db
                .query("alumni")
                .withIndex("by_tenant_year", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("graduationYear", args.graduationYear!)
                )
                .collect();
        } else {
            alumni = await ctx.db
                .query("alumni")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();
        }

        // Apply in-memory filters
        let filtered = alumni;

        if (args.program) {
            filtered = filtered.filter(a => a.program === args.program);
        }

        if (args.search) {
            const searchLower = args.search.toLowerCase();
            // Fetch user info for name searching
            const enriched = await Promise.all(
                filtered.map(async (a) => {
                    const user = await ctx.db
                        .query("users")
                        .withIndex("by_tenant_role", (q) =>
                            q.eq("tenantId", tenant.tenantId).eq("role", "alumni")
                        )
                        .collect();
                    const matchedUser = user.find(u => u.eduMylesUserId === a.userId);
                    return {
                        ...a,
                        firstName: matchedUser?.firstName ?? "",
                        lastName: matchedUser?.lastName ?? "",
                    };
                })
            );
            return enriched.filter(
                a =>
                    a.firstName.toLowerCase().includes(searchLower) ||
                    a.lastName.toLowerCase().includes(searchLower) ||
                    (a.currentEmployer?.toLowerCase().includes(searchLower)) ||
                    (a.program?.toLowerCase().includes(searchLower))
            );
        }

        // Enrich with user names
        const enriched = await Promise.all(
            filtered.map(async (a) => {
                const user = await ctx.db
                    .query("users")
                    .withIndex("by_tenant_role", (q) =>
                        q.eq("tenantId", tenant.tenantId).eq("role", "alumni")
                    )
                    .collect();
                const matchedUser = user.find(u => u.eduMylesUserId === a.userId);
                return {
                    ...a,
                    firstName: matchedUser?.firstName ?? "",
                    lastName: matchedUser?.lastName ?? "",
                };
            })
        );

        return enriched;
    },
});

/**
 * Get upcoming alumni events.
 */
export const getAlumniEvents = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);

        const events = await ctx.db
            .query("alumniEvents")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .collect();

        // Sort by date ascending, upcoming first
        return events.sort((a, b) => a.date - b.date);
    },
});

/**
 * Get a single alumni event by ID.
 */
export const getAlumniEvent = query({
    args: {
        eventId: v.id("alumniEvents"),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);

        const event = await ctx.db.get(args.eventId);
        if (!event || event.tenantId !== tenant.tenantId) {
            return null;
        }

        return event;
    },
});

/**
 * Get alumni-specific announcements.
 */
export const getAlumniAnnouncements = query({
    args: {},
    handler: async (ctx) => {
        const tenant = await requireTenantContext(ctx);

        // Fetch notifications targeted at alumni
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_tenant", (q) =>
                q.eq("tenantId", tenant.tenantId)
            )
            .collect();

        // Filter for alumni-relevant notifications and sort by most recent
        return notifications
            .filter(n => n.type === "announcement" || n.type === "alumni")
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 20);
    },
});
