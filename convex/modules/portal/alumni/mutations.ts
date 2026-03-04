import { v } from "convex/values";
import { mutation } from "../../../_generated/server";
import { requireTenantContext } from "../../../helpers/tenantGuard";
import { logAction } from "../../../helpers/auditLog";

/**
 * Update alumni profile (contact info, career details).
 */
export const updateAlumniProfile = mutation({
    args: {
        currentEmployer: v.optional(v.string()),
        jobTitle: v.optional(v.string()),
        linkedIn: v.optional(v.string()),
        bio: v.optional(v.string()),
        contactEmail: v.optional(v.string()),
        contactPhone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);

        const alumniRecord = await ctx.db
            .query("alumni")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!alumniRecord || alumniRecord.tenantId !== tenant.tenantId) {
            throw new Error("Alumni profile not found");
        }

        const updates: Record<string, any> = { updatedAt: Date.now() };
        if (args.currentEmployer !== undefined) updates.currentEmployer = args.currentEmployer;
        if (args.jobTitle !== undefined) updates.jobTitle = args.jobTitle;
        if (args.linkedIn !== undefined) updates.linkedIn = args.linkedIn;
        if (args.bio !== undefined) updates.bio = args.bio;
        if (args.contactEmail !== undefined) updates.contactEmail = args.contactEmail;
        if (args.contactPhone !== undefined) updates.contactPhone = args.contactPhone;

        await ctx.db.patch(alumniRecord._id, updates);

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "alumni.profile_updated",
            entityType: "alumni",
            entityId: alumniRecord._id,
            after: updates,
        });

        return alumniRecord._id;
    },
});

/**
 * Request an official or unofficial transcript.
 */
export const requestTranscript = mutation({
    args: {
        type: v.union(v.literal("official"), v.literal("unofficial")),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);

        const alumniRecord = await ctx.db
            .query("alumni")
            .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
            .first();

        if (!alumniRecord || alumniRecord.tenantId !== tenant.tenantId) {
            throw new Error("Alumni profile not found");
        }

        const requestId = await ctx.db.insert("transcriptRequests", {
            tenantId: tenant.tenantId,
            alumniId: alumniRecord._id,
            userId: tenant.userId,
            type: args.type,
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...(args.notes ? { notes: args.notes } : {}),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "alumni.transcript_requested",
            entityType: "transcriptRequest",
            entityId: requestId,
            after: { type: args.type },
        });

        return requestId;
    },
});

/**
 * RSVP to an alumni event.
 */
export const rsvpEvent = mutation({
    args: {
        eventId: v.id("alumniEvents"),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);

        const event = await ctx.db.get(args.eventId);
        if (!event || event.tenantId !== tenant.tenantId) {
            throw new Error("Event not found");
        }

        if (event.status === "cancelled") {
            throw new Error("Cannot RSVP to a cancelled event");
        }

        const alreadyRsvpd = event.rsvps.includes(tenant.userId);

        let updatedRsvps: string[];
        if (alreadyRsvpd) {
            // Toggle off — cancel RSVP
            updatedRsvps = event.rsvps.filter(id => id !== tenant.userId);
        } else {
            // Check capacity
            if (event.capacity && event.rsvps.length >= event.capacity) {
                throw new Error("Event is at full capacity");
            }
            updatedRsvps = [...event.rsvps, tenant.userId];
        }

        await ctx.db.patch(args.eventId, {
            rsvps: updatedRsvps,
            updatedAt: Date.now(),
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "alumni.event_rsvp",
            entityType: "alumniEvent",
            entityId: args.eventId,
            after: { rsvpd: !alreadyRsvpd },
        });

        return { rsvpd: !alreadyRsvpd };
    },
});
