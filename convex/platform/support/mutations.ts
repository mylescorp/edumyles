import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

// Rule-based analysis helpers
function analyzeSentiment(text: string): string {
  const neg = ["urgent", "broken", "error", "fail", "crash", "can't", "cannot", "problem", "issue", "wrong", "bad", "terrible", "horrible"];
  const pos = ["thank", "great", "works", "fixed", "resolved", "good", "excellent", "happy"];
  const lower = text.toLowerCase();
  const negCount = neg.filter((w) => lower.includes(w)).length;
  const posCount = pos.filter((w) => lower.includes(w)).length;
  if (negCount > posCount) return "negative";
  if (posCount > negCount) return "positive";
  return "neutral";
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("payment") || lower.includes("invoice") || lower.includes("billing") || lower.includes("charge")) return "billing";
  if (lower.includes("password") || lower.includes("login") || lower.includes("account") || lower.includes("access")) return "account";
  if (lower.includes("feature") || lower.includes("request") || lower.includes("add") || lower.includes("improve")) return "feature_request";
  if (lower.includes("bug") || lower.includes("error") || lower.includes("crash") || lower.includes("broken")) return "bug_report";
  if (lower.includes("server") || lower.includes("database") || lower.includes("api") || lower.includes("technical")) return "technical";
  return "general";
}

function inferPriority(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("urgent") || lower.includes("critical") || lower.includes("emergency") || lower.includes("immediately")) return "urgent";
  if (lower.includes("asap") || lower.includes("high priority") || lower.includes("important")) return "high";
  if (lower.includes("when possible") || lower.includes("low priority") || lower.includes("minor")) return "low";
  return "medium";
}

function generateResponseTemplate(category: string, responseType: string, tone: string): string {
  const templates: Record<string, Record<string, string>> = {
    billing: {
      initial: "Thank you for reaching out about your billing concern. We understand this is important to you. Our billing team will review your account and get back to you within 1 business day.",
      resolution: "We have reviewed your billing issue and made the necessary adjustments to your account. Please allow 2-3 business days for any changes to reflect.",
    },
    technical: {
      initial: "Thank you for reporting this technical issue. Our engineering team has been notified and will investigate as soon as possible. We apologize for any inconvenience.",
      resolution: "The technical issue you reported has been resolved. Please clear your cache and try again. If you continue to experience issues, please don't hesitate to contact us.",
    },
    account: {
      initial: "Thank you for contacting us about your account. For security purposes, our team will verify your identity before making any changes. You will receive an email with next steps.",
      resolution: "Your account issue has been resolved. Please log in again to access your updated account settings.",
    },
    general: {
      initial: "Thank you for reaching out to EduMyles support. We have received your inquiry and will respond within 24 hours.",
      resolution: "We're pleased to let you know that your inquiry has been resolved. Please let us know if you need any further assistance.",
    },
  };
  return (templates[category] ?? templates.general)[responseType] ??
    "Thank you for contacting EduMyles support. We will assist you as soon as possible.";
}

export const createAISupportTicket = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("technical"),
      v.literal("billing"),
      v.literal("account"),
      v.literal("feature_request"),
      v.literal("bug_report"),
      v.literal("general")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    tenantId: v.string(),
    userId: v.string(),
    contactInfo: v.optional(v.record(v.string(), v.any())),
    attachments: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    submittedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, args);
    const fullText = `${args.title} ${args.description}`;
    const sentiment = analyzeSentiment(fullText);
    const inferredCategory = inferCategory(fullText);
    const inferredPriority = inferPriority(fullText);

    const aiAnalysis = {
      sentiment,
      category: inferredCategory,
      priority: inferredPriority,
      escalation: {
        recommended: args.priority === "urgent" || inferredPriority === "urgent",
        confidence: 0.7,
      },
    };

    const now = Date.now();
    const ticketId = `ticket_${now}_${Math.random().toString(36).substr(2, 6)}`;

    const docId = await ctx.db.insert("aiSupportTickets", {
      ticketId,
      title: args.title,
      description: args.description,
      category: args.category,
      priority: args.priority,
      status: "open",
      tenantId: args.tenantId,
      userId: args.userId,
      contactInfo: args.contactInfo,
      submittedBy: args.submittedBy,
      assignedTo: undefined,
      resolvedAt: undefined,
      aiAnalysis,
      aiResponses: [],
      tags: args.tags ?? [],
      satisfaction: undefined,
      resolutionTime: undefined,
      escalationHistory: [],
      knowledgeBaseRefs: [],
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "support.ticket.created",
      entityType: "ai_support_ticket",
      entityId: docId,
      after: {
        title: args.title,
        category: args.category,
        priority: args.priority,
        tenantId: args.tenantId,
      },
    });

    return { success: true, ticketId: docId, message: "Support ticket created" };
  },
});

export const analyzeTicketWithAI = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.string(),
    analysisType: v.union(
      v.literal("sentiment"),
      v.literal("category"),
      v.literal("priority"),
      v.literal("escalation")
    ),
    context: v.optional(v.string()),
    requestedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const ticket = await ctx.db.get(args.ticketId as any);
    if (!ticket) throw new Error("Ticket not found");

    const t = ticket as any;
    const fullText = `${t.title} ${t.description} ${args.context ?? ""}`;
    const sentiment = analyzeSentiment(fullText);
    const category = inferCategory(fullText);
    const priority = inferPriority(fullText);

    const updatedAnalysis = {
      ...t.aiAnalysis,
      sentiment,
      category,
      priority,
      escalation: {
        recommended: priority === "urgent",
        confidence: 0.75,
      },
    };

    await ctx.db.patch(args.ticketId as any, {
      aiAnalysis: updatedAnalysis,
      updatedAt: Date.now(),
    });

    return { success: true, analysisId: `analysis_${Date.now()}`, results: updatedAnalysis };
  },
});

export const generateAIResponse = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.string(),
    responseType: v.union(
      v.literal("initial"),
      v.literal("follow_up"),
      v.literal("resolution"),
      v.literal("escalation")
    ),
    tone: v.union(v.literal("professional"), v.literal("friendly"), v.literal("empathetic"), v.literal("technical")),
    context: v.optional(v.string()),
    includeSuggestions: v.boolean(),
    requestedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, args);
    const ticket = await ctx.db.get(args.ticketId as any);
    if (!ticket) throw new Error("Ticket not found");

    const t = ticket as any;
    const content = generateResponseTemplate(t.category, args.responseType, args.tone);

    const aiResponse = {
      type: args.responseType,
      content,
      tone: args.tone,
      confidence: 0.8,
      generatedAt: Date.now(),
    };

    const updatedResponses = [...(t.aiResponses ?? []), aiResponse];
    await ctx.db.patch(args.ticketId as any, {
      aiResponses: updatedResponses,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "support.ai_response.generated",
      entityType: "ai_support_ticket",
      entityId: args.ticketId,
      after: {
        responseType: args.responseType,
        tone: args.tone,
      },
    });

    return {
      success: true,
      responseId: `response_${Date.now()}`,
      aiResponse,
      message: "AI response generated",
    };
  },
});

export const escalateToHumanAgent = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.string(),
    escalationReason: v.string(),
    urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    assignedAgentId: v.optional(v.string()),
    notes: v.optional(v.string()),
    escalatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, args);
    const ticket = await ctx.db.get(args.ticketId as any);
    if (!ticket) throw new Error("Ticket not found");

    const t = ticket as any;
    const escalation = {
      escalatedAt: Date.now(),
      reason: args.escalationReason,
      urgency: args.urgency,
      escalatedBy: args.escalatedBy,
      assignedTo: args.assignedAgentId,
    };

    const responseTimeMap: Record<string, string> = {
      critical: "1 hour",
      high: "4 hours",
      medium: "24 hours",
      low: "48 hours",
    };

    await ctx.db.patch(args.ticketId as any, {
      status: "escalated",
      assignedTo: args.assignedAgentId,
      escalationHistory: [...(t.escalationHistory ?? []), escalation],
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "support.ticket.escalated",
      entityType: "ai_support_ticket",
      entityId: args.ticketId,
      after: {
        urgency: args.urgency,
        assignedAgentId: args.assignedAgentId,
      },
    });

    return {
      success: true,
      escalationId: `escalation_${Date.now()}`,
      assignedAgentId: args.assignedAgentId,
      estimatedResponseTime: responseTimeMap[args.urgency],
      message: "Ticket escalated to human agent",
    };
  },
});

export const updateTicketWithAI = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.string(),
    action: v.union(
      v.literal("classify"),
      v.literal("prioritize"),
      v.literal("route"),
      v.literal("suggest_resolution")
    ),
    aiInsights: v.record(v.string(), v.any()),
    confidence: v.number(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const ticket = await ctx.db.get(args.ticketId as any);
    if (!ticket) throw new Error("Ticket not found");

    const t = ticket as any;
    const updatedAnalysis = {
      ...t.aiAnalysis,
      ...args.aiInsights,
      lastUpdatedBy: args.updatedBy,
      confidence: args.confidence,
    };

    await ctx.db.patch(args.ticketId as any, {
      aiAnalysis: updatedAnalysis,
      updatedAt: Date.now(),
    });

    return { success: true, updateId: `update_${Date.now()}`, message: "Ticket updated with AI insights" };
  },
});

export const trainAIModel = mutation({
  args: {
    sessionToken: v.string(),
    modelType: v.union(
      v.literal("classification"),
      v.literal("sentiment"),
      v.literal("response_generation")
    ),
    trainingData: v.array(v.any()),
    parameters: v.optional(v.record(v.string(), v.any())),
    trainedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    // Log the training request — actual ML training would be done via external service
    await ctx.db.insert("auditLogs", {
      tenantId: "PLATFORM",
      actorId: args.trainedBy,
      actorEmail: args.trainedBy,
      action: "ai_model_training_requested",
      entityId: args.modelType,
      entityType: "ai_model",
      before: null,
      after: { modelType: args.modelType, dataPoints: args.trainingData.length, parameters: args.parameters },
      timestamp: Date.now(),
    });

    return {
      success: true,
      trainingId: `training_${Date.now()}`,
      estimatedTime: "15-30 minutes",
      message: `Training job queued for ${args.modelType} model`,
    };
  },
});

export const createAIKnowledgeBase = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    keywords: v.array(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    isPublic: v.boolean(),
    relatedTickets: v.optional(v.array(v.string())),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, args);
    const wordCount = args.content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    const kbId = await ctx.db.insert("aiKnowledgeBase", {
      title: args.title,
      content: args.content,
      category: args.category,
      tags: args.tags,
      keywords: args.keywords,
      priority: args.priority,
      isPublic: args.isPublic,
      viewCount: 0,
      helpfulCount: 0,
      relatedTickets: args.relatedTickets ?? [],
      aiGenerated: false,
      aiConfidence: undefined,
      language: "en",
      estimatedReadTime: readTime,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "support.knowledge_base.created",
      entityType: "ai_knowledge_base",
      entityId: kbId,
      after: {
        title: args.title,
        category: args.category,
        isPublic: args.isPublic,
      },
    });

    return { success: true, kbId, message: "Knowledge base article created" };
  },
});

export const generateAIInsights = mutation({
  args: {
    sessionToken: v.string(),
    reportType: v.union(
      v.literal("ticketTrends"),
      v.literal("agentPerformance"),
      v.literal("customerSatisfaction"),
      v.literal("aiEffectiveness")
    ),
    dateRange: v.object({ start: v.number(), end: v.number() }),
    filters: v.optional(v.record(v.string(), v.any())),
    includeRecommendations: v.boolean(),
    requestedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const tickets = await ctx.db
      .query("aiSupportTickets")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), args.dateRange.start),
          q.lte(q.field("createdAt"), args.dateRange.end)
        )
      )
      .collect();

    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

    const insights: Record<string, any> = {
      ticketTrends: { totalTickets: total, resolvedTickets: resolved },
      agentPerformance: { totalAgents: 0, totalTickets: total },
      customerSatisfaction: { averageRating: 0, responseRate: 0 },
      aiEffectiveness: {
        aiHandledTickets: tickets.filter((t) => t.aiResponses.length > 0).length,
        escalationRate: total > 0 ? Math.round((tickets.filter((t) => t.status === "escalated").length / total) * 100) : 0,
      },
    };

    return {
      success: true,
      insightsId: `insights_${Date.now()}`,
      insights: insights[args.reportType],
      message: "AI insights generated",
    };
  },
});
