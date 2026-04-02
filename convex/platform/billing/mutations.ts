import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

const normalizePlan = (plan: "free" | "starter" | "growth" | "pro" | "enterprise") => {
    if (plan === "free") return "starter" as const;
    if (plan === "growth") return "standard" as const;
    return plan;
};

// Update a tenant's subscription tier/plan
export const updateTenantTier = mutation({
    args: {
        sessionToken: v.string(),
        tenantId: v.string(),
        plan: v.union(
            v.literal("free"),
            v.literal("starter"),
            v.literal("growth"),
            v.literal("pro"),
            v.literal("enterprise")
        ),
    },
    handler: async (ctx, args) => {
        const tenantCtx = await requirePlatformSession(ctx, args);

        const tenant = await ctx.db
            .query("tenants")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
            .first();

        if (!tenant) throw new Error("NOT_FOUND: Tenant not found");

        const previousPlan = tenant.plan;
        const nextPlan = normalizePlan(args.plan);

        await ctx.db.patch(tenant._id, {
            plan: nextPlan,
            updatedAt: Date.now(),
        });

        // Also update org tier if it exists
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
            .first();

        if (org) {
            await ctx.db.patch(org._id, { tier: nextPlan });
        }

        await logAction(ctx, {
            tenantId: tenantCtx.tenantId,
            actorId: tenantCtx.userId,
            actorEmail: tenantCtx.email,
            action: "settings.updated",
            entityType: "tenant",
            entityId: args.tenantId,
            before: { previousPlan },
            after: { plan: nextPlan },
        });
    },
});

// Create a new platform invoice for a tenant
export const createInvoice = mutation({
    args: {
        sessionToken: v.string(),
        tenantId: v.string(),
        tenantName: v.string(),
        plan: v.string(),
        amountCents: v.number(),
        currency: v.optional(v.string()),
        billingPeriodStart: v.number(),
        billingPeriodEnd: v.number(),
        dueDate: v.number(),
        lineItems: v.array(v.object({
            description: v.string(),
            quantity: v.number(),
            unitPriceCents: v.number(),
            totalCents: v.number(),
        })),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const actor = await requirePlatformSession(ctx, args);
        const now = Date.now();

        // Generate sequential invoice number
        const invoiceCount = await ctx.db
            .query("platformInvoices")
            .collect()
            .then((rows) => rows.length);
        const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(5, "0")}`;

        const invoiceId = await ctx.db.insert("platformInvoices", {
            invoiceNumber,
            tenantId: args.tenantId,
            tenantName: args.tenantName,
            plan: args.plan,
            amountCents: args.amountCents,
            currency: args.currency ?? "KES",
            status: "draft",
            billingPeriodStart: args.billingPeriodStart,
            billingPeriodEnd: args.billingPeriodEnd,
            dueDate: args.dueDate,
            lineItems: args.lineItems,
            notes: args.notes,
            createdBy: actor.userId,
            createdAt: now,
            updatedAt: now,
        });

        await logAction(ctx, {
            tenantId: actor.tenantId,
            actorId: actor.userId,
            actorEmail: actor.email,
            action: "billing.invoice.created",
            entityType: "platform_invoice",
            entityId: String(invoiceId),
            after: { invoiceNumber, tenantId: args.tenantId, amountCents: args.amountCents },
        });

        return { success: true, invoiceId, invoiceNumber };
    },
});

// Update invoice status
export const updateInvoiceStatus = mutation({
    args: {
        sessionToken: v.string(),
        invoiceId: v.string(),
        status: v.union(
            v.literal("draft"),
            v.literal("sent"),
            v.literal("paid"),
            v.literal("overdue"),
            v.literal("void"),
            v.literal("refunded")
        ),
        paymentReference: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const actor = await requirePlatformSession(ctx, args);

        const invoice = await ctx.db.get(args.invoiceId as any);
        if (!invoice) throw new Error("Invoice not found");

        const updates: Record<string, any> = {
            status: args.status,
            updatedAt: Date.now(),
        };
        if (args.status === "paid") {
            updates.paidAt = Date.now();
            if (args.paymentReference) updates.paymentReference = args.paymentReference;
            if (args.paymentMethod) updates.paymentMethod = args.paymentMethod;
        }

        await ctx.db.patch(args.invoiceId as any, updates);

        await logAction(ctx, {
            tenantId: actor.tenantId,
            actorId: actor.userId,
            actorEmail: actor.email,
            action: "billing.invoice.status_updated",
            entityType: "platform_invoice",
            entityId: args.invoiceId,
            before: { status: (invoice as any).status },
            after: { status: args.status },
        });

        return { success: true, message: "Invoice status updated" };
    },
});
