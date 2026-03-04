"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Send an email via Resend API.
 * Set RESEND_API_KEY in Convex env.
 * Templates: fee_reminder, exam_results, attendance_alert, payslip, or raw subject/body.
 */
export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    template: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Resend not configured. Set RESEND_API_KEY.");
    }

    const from = process.env.RESEND_FROM_EMAIL ?? "EduMyles <noreply@edumyles.com>";
    const subject = args.subject;
    let body = args.body;

    if (args.template && args.data) {
      switch (args.template) {
        case "fee_reminder":
          body = `Dear Parent, This is a reminder that fee payment of KES ${(args.data as { amount?: number })?.amount ?? "—"} is due. Please pay at your earliest convenience.`;
          break;
        case "exam_results":
          body = `Dear Parent, Exam results for ${(args.data as { term?: string })?.term ?? "the term"} are now available. Log in to the portal to view.`;
          break;
        case "attendance_alert":
          body = `Dear Parent, We noticed ${(args.data as { studentName?: string })?.studentName ?? "your child"} was marked absent today. Please contact the school if this is an error.`;
          break;
        case "payslip":
          body = `Your payslip for ${(args.data as { period?: string })?.period ?? "the period"} is ready. Log in to the staff portal to view.`;
          break;
        default:
          break;
      }
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject,
        html: body.replace(/\n/g, "<br/>"),
      }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { message?: string };
      throw new Error(err.message ?? `Resend API error: ${res.status}`);
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, id: data.id };
  },
});
