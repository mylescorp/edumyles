"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";

const ROLE_LABELS: Record<string, string> = {
  school_admin: "School Administrator",
  principal: "Principal",
  bursar: "Bursar",
  hr_manager: "HR Manager",
  librarian: "Librarian",
  transport_manager: "Transport Manager",
  teacher: "Teacher",
};

/**
 * Send an invite email to a new tenant user.
 * Uses Resend API. Falls back gracefully if RESEND_API_KEY is not set.
 */
export const sendInviteEmail = action({
  args: {
    to: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.string(),
    tenantName: v.string(),
    subdomain: v.string(),
    invitedByEmail: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[sendInviteEmail] RESEND_API_KEY not set — invite email skipped");
      return { sent: false, reason: "RESEND_API_KEY not configured" };
    }

    const from = process.env.RESEND_FROM_EMAIL ?? "EduMyles <noreply@edumyles.com>";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.edumyles.com";
    const loginUrl = `${appUrl}/auth/login/api`;
    const roleLabel = ROLE_LABELS[args.role] ?? args.role;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>You've been invited to ${args.tenantName} on EduMyles</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1a56db;padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">EduMyles</h1>
            <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">School Management Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">
              You&apos;ve been invited to ${args.tenantName}
            </h2>
            <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
              Hi ${args.firstName},
            </p>
            <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
              <strong>${args.invitedByEmail}</strong> has invited you to join
              <strong>${args.tenantName}</strong> on EduMyles as a
              <strong>${roleLabel}</strong>.
            </p>
            <p style="color:#374151;line-height:1.6;margin:0 0 24px;">
              Click the button below to sign in and access your dashboard.
              If you don&apos;t have an account yet, you can create one during sign-in.
            </p>
            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="background:#1a56db;border-radius:6px;padding:14px 28px;">
                  <a href="${loginUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">
                    Accept Invitation &amp; Sign In
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0 0 8px;">
              Or copy this link into your browser:
            </p>
            <p style="color:#1a56db;font-size:13px;word-break:break-all;margin:0 0 32px;">
              ${loginUrl}
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              If you weren&apos;t expecting this invitation, you can safely ignore this email.
              This invite was sent by ${args.invitedByEmail}.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              &copy; ${new Date().getFullYear()} EduMyles. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: args.to,
          subject: `You've been invited to ${args.tenantName} on EduMyles`,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[sendInviteEmail] Resend API error:", err);
        return { sent: false, reason: err };
      }

      const data = await res.json();
      return { sent: true, id: (data as any).id };
    } catch (err) {
      console.error("[sendInviteEmail] Network error:", err);
      return { sent: false, reason: String(err) };
    }
  },
});
