"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { api } from "../../_generated/api";

/**
 * Suggests a response to a support ticket using the Anthropic Claude API.
 * Uses ctx.runQuery to fetch ticket data (actions cannot access ctx.db directly).
 * Requires ANTHROPIC_API_KEY in Convex environment variables to return AI suggestions;
 * degrades gracefully with a template response when the key is absent.
 */
export const suggestTicketResponse = action({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args): Promise<{ suggestion: string; source: "ai" | "fallback" }> => {
    const ticket = await ctx.runQuery(api.tickets.getTicket, {
      ticketId: args.ticketId,
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        suggestion: buildFallbackResponse(ticket.category, ticket.priority),
        source: "fallback",
      };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: SUPPORT_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: buildPrompt(ticket),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`AI API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text: string }>;
    };

    const suggestion = data.content?.find((b) => b.type === "text")?.text;
    if (!suggestion) {
      throw new Error("Unexpected response format from AI API");
    }

    return { suggestion, source: "ai" };
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────────

const SUPPORT_SYSTEM_PROMPT = `You are a knowledgeable support agent for EduMyles, a multi-tenant school management platform serving institutions across East Africa (Kenya, Uganda, Tanzania, Rwanda, Ethiopia).

Your role is to draft professional, empathetic first-response messages to support tickets submitted by school administrators, teachers, and bursars.

Guidelines:
- Be concise and actionable (3–5 sentences maximum).
- Acknowledge the issue with empathy.
- Suggest 1–2 concrete next steps the user can take immediately.
- If the issue is billing or payment-related, remind them that our finance team reviews within 1 business day.
- Use plain language — avoid jargon.
- Do not make commitments about specific timelines unless you are certain.
- Sign off as "EduMyles Support Team".`;

function buildPrompt(ticket: {
  category: string;
  priority: string;
  title: string;
  body: string;
}): string {
  return `Support ticket details:

Category: ${ticket.category}
Priority: ${ticket.priority}
Title: ${ticket.title}
Description:
${ticket.body}

Please draft a helpful first-response message to send to this school.`;
}

function buildFallbackResponse(category: string, priority: string): string {
  const urgencyNote =
    priority === "P0" || priority === "P1"
      ? "Given the priority of this request, we will escalate it to our senior support team immediately."
      : "We aim to respond to all tickets within 1 business day.";

  return `Thank you for reaching out to EduMyles Support. We have received your ${category} request and our team is reviewing it now. ${urgencyNote} In the meantime, please check our help centre for common solutions. If you have additional context to share, reply to this ticket and we will include it in our review.\n\nEduMyles Support Team`;
}
