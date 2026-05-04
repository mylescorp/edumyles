"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { api } from "../../_generated/api";

function localNarrative(summary: any) {
  const average = Number(summary?.overallPct ?? 0);
  const subjects = Array.isArray(summary?.subjects) ? summary.subjects : [];
  const strongest = [...subjects].sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))[0];
  const needsSupport = [...subjects].sort((a, b) => Number(a.score ?? 0) - Number(b.score ?? 0))[0];

  const tone =
    average >= 75
      ? "The learner has demonstrated strong academic progress this term"
      : average >= 55
        ? "The learner has made steady progress this term"
        : "The learner is encouraged to strengthen study routines and seek support where needed";

  const focus =
    strongest && needsSupport && strongest.subjectId !== needsSupport.subjectId
      ? ` Performance was strongest in ${strongest.subjectName ?? strongest.subjectId}, while ${needsSupport.subjectName ?? needsSupport.subjectId} needs more focused practice.`
      : "";

  return `${tone}, with an overall average of ${average}%.${focus} Continued class participation, timely revision, and teacher-guided practice will support further improvement.`;
}

type NarrativeResult = {
  narrative: string;
  source: "openrouter" | "fallback";
  error?: string;
};

export const generateAIReportNarrativeWithOpenRouter: any = action({
  args: {
    sessionToken: v.string(),
    studentId: v.string(),
    termId: v.string(),
  },
  handler: async (ctx, args): Promise<NarrativeResult> => {
    const summary: any = await ctx.runQuery(api.modules.academics.queries.getStudentResultsSummary, {
      sessionToken: args.sessionToken,
      studentId: args.studentId,
      termId: args.termId,
    });

    const fallback = localNarrative(summary);
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { narrative: fallback, source: "fallback" };
    }

    const subjects = Array.isArray((summary as any)?.subjects)
      ? (summary as any).subjects.map((subject: any) => ({
          subject: subject.subjectName ?? subject.subjectId ?? "Subject",
          score: subject.score,
          grade: subject.grade,
          remarks: subject.remarks,
        }))
      : [];

    try {
      const response: Response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "https://edumyles.com",
          "X-Title": process.env.OPENROUTER_APP_NAME ?? "EduMyles",
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_REPORT_MODEL ?? "anthropic/claude-3.5-sonnet",
          models: ["openai/gpt-4o-mini", "google/gemini-2.0-flash-001"],
          temperature: 0.3,
          max_tokens: 220,
          messages: [
            {
              role: "system",
              content:
                "Write concise, professional Kenyan school report-card narratives. Do not invent personal data. Use one paragraph, 45-70 words, encouraging but specific.",
            },
            {
              role: "user",
              content: JSON.stringify({
                overallPercentage: (summary as any)?.overallPct ?? 0,
                meanGrade: (summary as any)?.meanGrade ?? null,
                subjects,
              }),
            },
          ],
        }),
      });

      if (!response.ok) {
        return { narrative: fallback, source: "fallback", error: `OpenRouter ${response.status}` };
      }

      const payload = await response.json();
      const narrative = payload?.choices?.[0]?.message?.content?.trim();
      return {
        narrative: narrative || fallback,
        source: narrative ? "openrouter" : "fallback",
      };
    } catch (error) {
      return {
        narrative: fallback,
        source: "fallback",
        error: error instanceof Error ? error.message : "OpenRouter request failed",
      };
    }
  },
});
