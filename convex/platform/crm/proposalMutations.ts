import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const createProposalTemplate = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("standard"),
      v.literal("custom"),
      v.literal("legal"),
      v.literal("pricing")
    ),
    sections: v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
      order: v.number(),
      isRequired: v.boolean(),
      variables: v.array(v.string()),
    })),
    variables: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.union(v.literal("text"), v.literal("number"), v.literal("date"), v.literal("currency"), v.literal("select")),
      defaultValue: v.optional(v.string()),
      options: v.optional(v.array(v.string())),
      description: v.string(),
      required: v.boolean(),
    })),
    terms: v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
      category: v.union(v.literal("payment"), v.literal("service"), v.literal("legal"), v.literal("termination"), v.literal("confidentiality")),
      isDefault: v.boolean(),
    })),
    pricing: v.object({
      currency: v.string(),
      oneTime: v.boolean(),
      recurring: v.boolean(),
      customPricing: v.boolean(),
      priceTiers: v.array(v.object({
        id: v.string(),
        name: v.string(),
        minStudents: v.number(),
        maxStudents: v.number(),
        setupFee: v.number(),
        monthlyFee: v.number(),
        perStudentFee: v.number(),
        features: v.array(v.string()),
      })),
    }),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const templateId = await ctx.db.insert("proposalTemplates", {
      name: args.name,
      description: args.description,
      category: args.category,
      sections: args.sections,
      variables: args.variables,
      terms: args.terms,
      pricing: args.pricing,
      isDefault: args.isDefault ?? false,
      usageCount: 0,
      isActive: true,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, templateId, message: "Template created successfully" };
  },
});

export const updateProposalTemplate = mutation({
  args: {
    sessionToken: v.string(),
    templateId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("standard"),
      v.literal("custom"),
      v.literal("legal"),
      v.literal("pricing")
    )),
    sections: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
      order: v.number(),
      isRequired: v.boolean(),
      variables: v.array(v.string()),
    }))),
    variables: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.union(v.literal("text"), v.literal("number"), v.literal("date"), v.literal("currency"), v.literal("select")),
      defaultValue: v.optional(v.string()),
      options: v.optional(v.array(v.string())),
      description: v.string(),
      required: v.boolean(),
    }))),
    terms: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
      category: v.union(v.literal("payment"), v.literal("service"), v.literal("legal"), v.literal("termination"), v.literal("confidentiality")),
      isDefault: v.boolean(),
    }))),
    pricing: v.optional(v.object({
      currency: v.string(),
      oneTime: v.boolean(),
      recurring: v.boolean(),
      customPricing: v.boolean(),
      priceTiers: v.array(v.object({
        id: v.string(),
        name: v.string(),
        minStudents: v.number(),
        maxStudents: v.number(),
        setupFee: v.number(),
        monthlyFee: v.number(),
        perStudentFee: v.number(),
        features: v.array(v.string()),
      })),
    })),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const template = await ctx.db.get(args.templateId as any);
    if (!template) throw new Error("Template not found");

    const { sessionToken, templateId, ...updates } = args;
    const cleanUpdates: Record<string, any> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) cleanUpdates[key] = val;
    }
    cleanUpdates.updatedAt = Date.now();

    await ctx.db.patch(args.templateId as any, cleanUpdates);

    return { success: true, message: "Template updated successfully" };
  },
});

export const deleteProposalTemplate = mutation({
  args: {
    sessionToken: v.string(),
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const template = await ctx.db.get(args.templateId as any);
    if (!template) throw new Error("Template not found");

    await ctx.db.patch(args.templateId as any, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true, message: "Template deleted successfully" };
  },
});

export const generateProposal = mutation({
  args: {
    sessionToken: v.string(),
    templateId: v.string(),
    dealId: v.optional(v.string()),
    schoolName: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    variables: v.any(),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const template = await ctx.db.get(args.templateId as any) as any;
    if (!template) throw new Error("Template not found");

    // Build content from template sections with variable substitution
    let content = template.sections
      .sort((a: any, b: any) => a.order - b.order)
      .map((section: any) => {
        let sectionContent = section.content;
        if (args.variables && typeof args.variables === "object") {
          for (const [key, value] of Object.entries(args.variables as Record<string, string>)) {
            sectionContent = sectionContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
          }
        }
        return `## ${section.title}\n\n${sectionContent}`;
      })
      .join("\n\n");

    // Replace global variables
    content = content.replace(/\{\{schoolName\}\}/g, args.schoolName);
    content = content.replace(/\{\{date\}\}/g, new Date().toISOString().split("T")[0]);

    const now = Date.now();

    const proposalId = await ctx.db.insert("proposals", {
      templateId: args.templateId,
      dealId: args.dealId,
      schoolName: args.schoolName,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      status: "draft",
      variables: args.variables,
      content,
      amount: args.amount,
      currency: args.currency ?? template.pricing?.currency ?? "KES",
      validUntil: args.validUntil,
      sentAt: undefined,
      viewedAt: undefined,
      signedAt: undefined,
      rejectedAt: undefined,
      signatureUrl: undefined,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    // Increment template usage count
    await ctx.db.patch(args.templateId as any, {
      usageCount: (template.usageCount ?? 0) + 1,
      updatedAt: now,
    });

    // If linked to a deal, create activity
    if (args.dealId) {
      await ctx.db.insert("crmActivities", {
        tenantId: session.tenantId,
        dealId: args.dealId,
        leadId: undefined,
        type: "proposal_sent",
        title: `Proposal generated for ${args.schoolName}`,
        description: undefined,
        outcome: undefined,
        scheduledAt: undefined,
        completedAt: undefined,
        createdBy: session.userId,
        createdAt: now,
      });
    }

    return { success: true, proposalId, message: "Proposal generated successfully" };
  },
});

export const updateProposalStatus = mutation({
  args: {
    sessionToken: v.string(),
    proposalId: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("viewed"),
      v.literal("signed"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    signatureUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const proposal = await ctx.db.get(args.proposalId as any);
    if (!proposal) throw new Error("Proposal not found");

    const now = Date.now();
    const updates: Record<string, any> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "sent") updates.sentAt = now;
    if (args.status === "viewed") updates.viewedAt = now;
    if (args.status === "signed") {
      updates.signedAt = now;
      if (args.signatureUrl) updates.signatureUrl = args.signatureUrl;
    }
    if (args.status === "rejected") updates.rejectedAt = now;

    await ctx.db.patch(args.proposalId as any, updates);

    return { success: true, message: `Proposal status updated to ${args.status}` };
  },
});

export const sendProposal = mutation({
  args: {
    sessionToken: v.string(),
    proposalId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const proposal = await ctx.db.get(args.proposalId as any) as any;
    if (!proposal) throw new Error("Proposal not found");
    if (proposal.status !== "draft") throw new Error("Only draft proposals can be sent");

    const now = Date.now();

    await ctx.db.patch(args.proposalId as any, {
      status: "sent",
      sentAt: now,
      updatedAt: now,
    });

    // Create activity if linked to a deal
    if (proposal.dealId) {
      await ctx.db.insert("crmActivities", {
        tenantId: session.tenantId,
        dealId: proposal.dealId,
        leadId: undefined,
        type: "proposal_sent",
        title: `Proposal sent to ${proposal.schoolName}`,
        description: `Sent to ${proposal.contactEmail ?? "contact"}`,
        outcome: undefined,
        scheduledAt: undefined,
        completedAt: now,
        createdBy: session.userId,
        createdAt: now,
      });
    }

    return { success: true, message: "Proposal sent successfully" };
  },
});
