import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { sanitizeSocialHtml, socialPlatformValidator } from "./shared";

function heuristicCaption(prompt: string, platform: string) {
  const cleaned = sanitizeSocialHtml(prompt).replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (platform === "twitter") {
    return cleaned.slice(0, 240) + (cleaned.length > 240 ? "..." : "");
  }
  if (platform === "linkedin") {
    return `${cleaned}\n\nWhat do you think?`;
  }
  return cleaned;
}

function heuristicHashtags(prompt: string) {
  const words = sanitizeSocialHtml(prompt)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word: string) => word.length > 4)
    .slice(0, 5);
  return Array.from(new Set(words)).map((word) => `#${word}`);
}

export const generateSocialCaption = action({
  args: {
    sessionToken: v.string(),
    isPlatformContext: v.optional(v.boolean()),
    platform: socialPlatformValidator,
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery((internal as any).modules.social.shared.resolveActionSocialScope, {
      sessionToken: args.sessionToken,
      isPlatformContext: args.isPlatformContext,
      featureKey: "create_posts",
    });
    return {
      caption: heuristicCaption(args.prompt, args.platform),
    };
  },
});

export const generateHashtags = action({
  args: {
    sessionToken: v.string(),
    isPlatformContext: v.optional(v.boolean()),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery((internal as any).modules.social.shared.resolveActionSocialScope, {
      sessionToken: args.sessionToken,
      isPlatformContext: args.isPlatformContext,
      featureKey: "create_posts",
    });
    return { hashtags: heuristicHashtags(args.prompt) };
  },
});

export const suggestBestPostTime = action({
  args: {
    sessionToken: v.string(),
    isPlatformContext: v.optional(v.boolean()),
    platform: v.optional(socialPlatformValidator),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery((internal as any).modules.social.shared.resolveActionSocialScope, {
      sessionToken: args.sessionToken,
      isPlatformContext: args.isPlatformContext,
      featureKey: "view_analytics",
    });
    return {
      timezone: "Africa/Nairobi",
      suggestions: [
        { day: "Tuesday", hour: 9, reason: "Strong weekday morning engagement." },
        { day: "Thursday", hour: 13, reason: "Midday performance is consistently stable." },
        { day: "Saturday", hour: 10, reason: "Weekend reach tends to improve for school communities." },
      ],
      platform: args.platform ?? "all",
    };
  },
});

export const generateCommentReply = action({
  args: {
    sessionToken: v.string(),
    isPlatformContext: v.optional(v.boolean()),
    commentText: v.string(),
    tone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery((internal as any).modules.social.shared.resolveActionSocialScope, {
      sessionToken: args.sessionToken,
      isPlatformContext: args.isPlatformContext,
      featureKey: "reply_comments",
    });
    const tone = args.tone ?? "warm";
    return {
      reply: `${tone === "formal" ? "Thank you for your message." : "Thanks for reaching out!"} ${sanitizeSocialHtml(args.commentText).slice(0, 80)}${args.commentText.length > 80 ? "..." : ""}`,
    };
  },
});
