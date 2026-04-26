"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { publishFacebookPost } from "../../modules/social/platforms/facebook";
import { publishInstagramPost } from "../../modules/social/platforms/instagram";
import { publishLinkedInPost } from "../../modules/social/platforms/linkedin";
import { publishTelegramPost } from "../../modules/social/platforms/telegram";
import { publishTikTokPost } from "../../modules/social/platforms/tiktok";
import { publishTwitterPost } from "../../modules/social/platforms/twitter";
import { publishWhatsAppPost } from "../../modules/social/platforms/whatsapp";
import { publishYouTubePost } from "../../modules/social/platforms/youtube";

const PUBLISHERS: Record<string, (args: { account: any; variant: any; postId: string }) => Promise<any>> = {
  facebook: publishFacebookPost,
  instagram: publishInstagramPost,
  twitter: publishTwitterPost,
  linkedin: publishLinkedInPost,
  youtube: publishYouTubePost,
  tiktok: publishTikTokPost,
  whatsapp: publishWhatsAppPost,
  telegram: publishTelegramPost,
};

type PublishResult = {
  platform: string;
  publishStatus: "published" | "failed";
  publishError?: string;
  publishedPostId?: string;
  publishedPostUrl?: string;
  publishedAt?: number;
};

export const publishPost: any = internalAction({
  args: {
    postId: v.id("social_posts"),
  },
  handler: async (ctx, args): Promise<any> => {
    const rawPost: any = await ctx.runQuery((internal as any).modules.social.publish.getRawPost, {
      postId: args.postId,
    });
    if (!rawPost) {
      throw new Error("Post not found");
    }

    const accounts = await Promise.all(
      rawPost.targetAccountIds.map((accountId: any) =>
        ctx.runQuery((internal as any).modules.social.publish.getRawAccount, { accountId })
      )
    );

    const results: PublishResult[] = [];
    for (const variant of rawPost.platformVariants as any[]) {
      const account = accounts.find((candidate: any) => String(candidate?._id) === String(variant.accountId));
      const publisher = PUBLISHERS[variant.platform];
      if (!account || !publisher) {
        results.push({
          platform: variant.platform,
          publishStatus: "failed",
          publishError: `Publisher unavailable for ${variant.platform}`,
        });
        continue;
      }

      try {
        const published = await publisher({
          account,
          variant,
          postId: String(args.postId),
        });
        results.push({
          platform: variant.platform,
          publishStatus: "published",
          publishedPostId: published.postId,
          publishedPostUrl: published.postUrl,
          publishedAt: Date.now(),
        });
      } catch (error: any) {
        results.push({
          platform: variant.platform,
          publishStatus: "failed",
          publishError: error?.message ?? `Unknown ${variant.platform} publishing error`,
        });
      }
    }

    const mergedVariants = rawPost.platformVariants.map((variant: any) => {
      const result = results.find((candidate: any) => candidate.platform === variant.platform);
      return result ? { ...variant, ...result } : variant;
    });

    const successCount = results.filter((result) => result.publishStatus === "published").length;
    const failedCount = results.length - successCount;
    const nextStatus =
      successCount === results.length
        ? "published"
        : successCount > 0
          ? "partially_published"
          : "failed";

    await ctx.runMutation((internal as any).modules.social.publish.patchPostAfterPublish, {
      postId: args.postId,
      platformVariants: mergedVariants,
      status: nextStatus,
      publishedAt: successCount > 0 ? Date.now() : undefined,
    });

    return {
      successCount,
      failedCount,
      status: nextStatus,
      variants: mergedVariants,
      post: rawPost,
    };
  },
});
