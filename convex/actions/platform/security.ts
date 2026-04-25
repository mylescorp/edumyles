"use node";

import { internalAction } from "../../_generated/server";
import { v } from "convex/values";

export const sendSlackSecurityAlert = internalAction({
  args: {
    title: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (_ctx, args) => {
    const webhookUrl =
      process.env.SLACK_WEBHOOK_URL ??
      process.env.PLATFORM_SLACK_WEBHOOK_URL ??
      process.env.SECURITY_SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      return { delivered: false, skipped: true, reason: "missing_webhook" };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Security Alert: ${args.title}`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: args.title,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: args.message,
            },
          },
          ...(args.metadata
            ? [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `\`\`\`${JSON.stringify(args.metadata, null, 2)}\`\`\``,
                  },
                },
              ]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SLACK_ALERT_FAILED: ${response.status} ${errorText}`);
    }

    return { delivered: true };
  },
});
