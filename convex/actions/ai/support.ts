import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

// AI Service configurations
const AI_SERVICE_CONFIG = {
  sentimentAnalysis: {
    provider: "openai", // Can be switched to other providers
    model: "gpt-3.5-turbo",
    endpoint: "https://api.openai.com/v1/chat/completions",
  },
  textAnalysis: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    endpoint: "https://api.openai.com/v1/chat/completions",
  },
  ticketCategorization: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    endpoint: "https://api.openai.com/v1/chat/completions",
  },
};

// Helper function to call AI APIs
async function callAIApi(prompt: string, service: keyof typeof AI_SERVICE_CONFIG) {
  const config = AI_SERVICE_CONFIG[service];
  
  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error(`AI Service (${service}) error:`, error);
    throw new Error(`Failed to process AI request: ${error.message}`);
  }
}

// Analyze sentiment of ticket content
export const analyzeSentiment = mutation({
  args: {
    sessionToken: v.string(),
    text: v.string(),
    ticketId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify session and permissions
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_sessionToken", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    const prompt = `
    Analyze the sentiment of this customer support message and provide a detailed analysis:
    
    Message: "${args.text}"
    
    Please provide the response in this exact JSON format:
    {
      "sentiment": "positive|negative|neutral",
      "confidence": 0.95,
      "emotions": ["frustrated", "confused", "satisfied"],
      "keyPhrases": ["login problem", "slow response", "helpful staff"],
      "urgency": "high|medium|low",
      "escalationRecommended": true
    }
    `;

    try {
      const aiResponse = await callAIApi(prompt, "sentimentAnalysis");
      
      // Parse AI response
      let analysis;
      try {
        analysis = JSON.parse(aiResponse);
      } catch (parseError) {
        // Fallback if AI response is not valid JSON
        analysis = {
          sentiment: "neutral",
          confidence: 0.5,
          emotions: [],
          keyPhrases: [],
          urgency: "medium",
          escalationRecommended: false,
        };
      }

      // Store analysis in database if ticketId provided
      if (args.ticketId) {
        await ctx.db.patch(args.ticketId as any, {
          aiAnalysis: {
            sentiment: analysis,
            analyzedAt: Date.now(),
            analyzedBy: "ai_system",
          },
        });
      }

      return analysis;
    } catch (error) {
      console.error("Sentiment analysis failed:", error);
      throw new Error("Failed to analyze sentiment");
    }
  },
});

// Categorize and prioritize tickets automatically
export const categorizeTicket = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    description: v.string(),
    ticketId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_sessionToken", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    const prompt = `
    Analyze this support ticket and categorize it:
    
    Title: "${args.title}"
    Description: "${args.description}"
    
    Please provide the response in this exact JSON format:
    {
      "category": "technical|billing|account|feature_request|bug_report|general",
      "confidence": 0.92,
      "priority": "low|medium|high|urgent",
      "reasoning": "Keywords indicate technical authentication issues",
      "alternatives": ["technical", "account"],
      "factors": ["user_impact", "urgency_indicators", "multiple_users_affected"],
      "escalation": {
        "recommended": false,
        "confidence": 0.65,
        "reason": "Standard technical issue within support scope",
        "suggestedLevel": "level_1"
      }
    }
    `;

    try {
      const aiResponse = await callAIApi(prompt, "ticketCategorization");
      
      let categorization;
      try {
        categorization = JSON.parse(aiResponse);
      } catch (parseError) {
        categorization = {
          category: "general",
          confidence: 0.5,
          priority: "medium",
          reasoning: "Unable to categorize automatically",
          alternatives: ["general"],
          factors: [],
          escalation: {
            recommended: false,
            confidence: 0.5,
            reason: "Default categorization",
            suggestedLevel: "level_1",
          },
        };
      }

      // Update ticket with categorization if ticketId provided
      if (args.ticketId) {
        await ctx.db.patch(args.ticketId as any, {
          category: categorization.category,
          priority: categorization.priority,
          aiCategorization: categorization,
          categorizedAt: Date.now(),
          categorizedBy: "ai_system",
        });
      }

      return categorization;
    } catch (error) {
      console.error("Ticket categorization failed:", error);
      throw new Error("Failed to categorize ticket");
    }
  },
});

// Generate AI-powered response suggestions
export const generateResponse = mutation({
  args: {
    sessionToken: v.string(),
    ticketContent: v.string(),
    sentiment: v.optional(v.string()),
    category: v.optional(v.string()),
    responseType: v.union(v.literal("initial"), v.literal("follow_up"), v.literal("resolution")),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_sessionToken", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    const prompt = `
    Generate a professional customer support response for this ticket:
    
    Ticket Content: "${args.ticketContent}"
    Sentiment: ${args.sentiment || "neutral"}
    Category: ${args.category || "general"}
    Response Type: ${args.responseType}
    
    Please provide the response in this exact JSON format:
    {
      "content": "Professional response text here...",
      "tone": "empathetic|professional|friendly|urgent",
      "confidence": 0.89,
      "suggestedActions": ["Try clearing browser cache", "Check internet connection"],
      "followUpQuestions": ["Is the issue still occurring?", "Have you tried restarting?"],
      "escalationNeeded": false
    }
    
    Guidelines:
    - Be empathetic and professional
    - Provide specific, actionable advice
    - Include relevant troubleshooting steps
    - Ask clarifying questions if needed
    - Keep response concise but comprehensive
    `;

    try {
      const aiResponse = await callAIApi(prompt, "textAnalysis");
      
      let response;
      try {
        response = JSON.parse(aiResponse);
      } catch (parseError) {
        response = {
          content: "Thank you for reaching out. I understand you're experiencing an issue and I'm here to help. Could you please provide more details about the problem you're facing?",
          tone: "professional",
          confidence: 0.5,
          suggestedActions: ["Provide more details", "Check system status"],
          followUpQuestions: ["When did this issue start?", "What troubleshooting steps have you tried?"],
          escalationNeeded: false,
        };
      }

      return {
        ...response,
        generatedAt: Date.now(),
        generatedBy: "ai_system",
      };
    } catch (error) {
      console.error("Response generation failed:", error);
      throw new Error("Failed to generate AI response");
    }
  },
});

// Get AI insights and analytics
export const getAIInsights = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.union(v.literal("24h"), v.literal("7d"), v.literal("30d"), v.literal("90d"))),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_sessionToken", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    const timeRange = args.timeRange || "30d";
    const timeRangeMs = timeRange === "24h" ? 24 * 60 * 60 * 1000 :
                       timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 :
                       timeRange === "30d" ? 30 * 24 * 60 * 60 * 1000 :
                       90 * 24 * 60 * 60 * 1000;

    const cutoffTime = Date.now() - timeRangeMs;

    // Get tickets with AI analysis
    const tickets = await ctx.db
      .query("tickets")
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    const ticketsWithAI = tickets.filter(ticket => ticket.aiAnalysis || ticket.aiCategorization);

    // Calculate metrics
    const totalTickets = tickets.length;
    const aiAnalyzedTickets = ticketsWithAI.length;
    const aiResolvedTickets = ticketsWithAI.filter(t => t.status === "resolved").length;
    const averageResolutionTime = calculateAverageResolutionTime(ticketsWithAI);

    // Sentiment analysis
    const sentimentCounts = ticketsWithAI.reduce((acc, ticket) => {
      const sentiment = ticket.aiAnalysis?.sentiment?.sentiment || "neutral";
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Category distribution
    const categoryCounts = ticketsWithAI.reduce((acc, ticket) => {
      const category = ticket.aiCategorization?.category || "general";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // AI performance metrics
    const aiPerformance = {
      aiHandledTickets: aiAnalyzedTickets,
      aiResolutionRate: aiAnalyzedTickets > 0 ? aiResolvedTickets / aiAnalyzedTickets : 0,
      averageResponseTime: averageResolutionTime,
      customerSatisfaction: calculateCustomerSatisfaction(ticketsWithAI),
      escalationRate: calculateEscalationRate(ticketsWithAI),
      costSavings: aiAnalyzedTickets * 25, // Estimated KES saved per AI-handled ticket
      timeSavings: aiAnalyzedTickets * 0.5, // Hours saved per ticket
    };

    return {
      totalTickets,
      resolvedTickets: aiResolvedTickets,
      averageResolutionTime,
      topCategories: Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category]) => category),
      aiPerformance,
      sentimentDistribution: sentimentCounts,
      categoryDistribution: categoryCounts,
      recommendations: generateRecommendations(aiPerformance),
    };
  },
});

// Helper functions
function calculateAverageResolutionTime(tickets: any[]): number {
  const resolvedTickets = tickets.filter(t => t.status === "resolved" && t.resolvedAt);
  if (resolvedTickets.length === 0) return 0;
  
  const totalTime = resolvedTickets.reduce((sum, ticket) => {
    return sum + (ticket.resolvedAt - ticket.createdAt);
  }, 0);
  
  return totalTime / resolvedTickets.length / (1000 * 60 * 60); // Convert to hours
}

function calculateCustomerSatisfaction(tickets: any[]): number {
  const ticketsWithSatisfaction = tickets.filter(t => t.csatScore !== undefined);
  if (ticketsWithSatisfaction.length === 0) return 0;
  
  const totalScore = ticketsWithSatisfaction.reduce((sum, ticket) => sum + ticket.csatScore, 0);
  return totalScore / ticketsWithSatisfaction.length;
}

function calculateEscalationRate(tickets: any[]): number {
  if (tickets.length === 0) return 0;
  
  const escalatedTickets = tickets.filter(t => 
    t.aiCategorization?.escalation?.recommended || 
    t.priority === "urgent" || 
    t.escalatedAt
  );
  
  return escalatedTickets.length / tickets.length;
}

function generateRecommendations(performance: any): string[] {
  const recommendations = [];
  
  if (performance.aiResolutionRate < 0.7) {
    recommendations.push("Improve AI training data for better resolution rates");
  }
  
  if (performance.customerSatisfaction < 4.0) {
    recommendations.push("Enhance AI response templates for better satisfaction");
  }
  
  if (performance.escalationRate > 0.3) {
    recommendations.push("Implement proactive AI outreach for common issues");
  }
  
  recommendations.push("Fine-tune sentiment analysis models");
  recommendations.push("Optimize AI response generation for better accuracy");
  
  return recommendations;
}
