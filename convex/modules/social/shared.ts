import { ConvexError, v } from "convex/values";
import { internalQuery, MutationCtx, QueryCtx } from "../../_generated/server";
import { requireModuleAccess, requireModuleFeatureAccess } from "../../helpers/moduleGuard";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { requirePlatformContext } from "../../helpers/platformGuard";

export const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "youtube",
  "tiktok",
  "whatsapp",
  "telegram",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const socialPlatformValidator = v.union(
  v.literal("facebook"),
  v.literal("instagram"),
  v.literal("twitter"),
  v.literal("linkedin"),
  v.literal("youtube"),
  v.literal("tiktok"),
  v.literal("whatsapp"),
  v.literal("telegram")
);

export const socialPostStatusValidator = v.union(
  v.literal("draft"),
  v.literal("pending_approval"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("scheduled"),
  v.literal("publishing"),
  v.literal("published"),
  v.literal("partially_published"),
  v.literal("failed"),
  v.literal("cancelled")
);

export const socialAccountStatusValidator = v.union(
  v.literal("active"),
  v.literal("token_expired"),
  v.literal("disconnected"),
  v.literal("error")
);

export const socialScopeArgs = {
  sessionToken: v.string(),
  isPlatformContext: v.optional(v.boolean()),
};

const PLATFORM_FEATURE_PERMISSION: Record<string, string> = {
  create_posts: "social.create",
  approve_posts: "social.approve",
  manage_accounts: "social.manage_accounts",
  view_analytics: "social.view_analytics",
  reply_comments: "social.manage_comments",
  manage_campaigns: "social.create",
  manage_settings: "social.manage_accounts",
  view_social_dashboard: "social.view",
};

function fallbackSanitize(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

export function sanitizeSocialHtml(value?: string | null) {
  if (!value) return "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const DOMPurify = require("isomorphic-dompurify");
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "br", "p", "ul", "ol", "li"],
      ALLOWED_ATTR: ["href", "target", "rel"],
    }).trim();
  } catch {
    return fallbackSanitize(value);
  }
}

export function getPlatformSocialPermission(featureKey: string) {
  return PLATFORM_FEATURE_PERMISSION[featureKey] ?? "social.view";
}

export function assertPlatformRole(role: string, featureKey: string) {
  if (!role) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Platform role '${role}' cannot access social feature '${featureKey}'`,
    });
  }
}

export async function requireSocialContext(
  ctx: QueryCtx | MutationCtx,
  args: { sessionToken: string; isPlatformContext?: boolean },
  featureKey: string
) {
  if (args.isPlatformContext) {
    const actor = await requirePlatformContext(ctx, { sessionToken: args.sessionToken }, getPlatformSocialPermission(featureKey));
    return {
      isPlatformContext: true,
      tenantId: undefined,
      actorId: actor.userId,
      actorRole: actor.role,
      actorEmail: actor.email,
    };
  }

  const actor = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
  await requireModuleAccess(ctx, "mod_social", actor.tenantId);
  await requireModuleFeatureAccess(ctx, "mod_social", actor.tenantId, actor.role, featureKey);

  return {
    isPlatformContext: false,
    tenantId: actor.tenantId,
    actorId: actor.userId,
    actorRole: actor.role,
    actorEmail: actor.email,
  };
}

export function matchesSocialScope(
  record: { tenantId?: string; isPlatformPost?: boolean; isPlatformAccount?: boolean; isPlatformCampaign?: boolean; isPlatformFlow?: boolean; isPlatformAnalytics?: boolean; isPlatformComment?: boolean; isPlatformLibrary?: boolean; isPlatformTemplate?: boolean },
  scope: { tenantId?: string; isPlatformContext?: boolean }
) {
  if (scope.isPlatformContext) {
    return Boolean(
      record.isPlatformPost ||
        record.isPlatformAccount ||
        record.isPlatformCampaign ||
        record.isPlatformFlow ||
        record.isPlatformAnalytics ||
        record.isPlatformComment ||
        record.isPlatformLibrary ||
        record.isPlatformTemplate
    );
  }

  return record.tenantId === scope.tenantId;
}

export function getScopePatch(scope: { tenantId?: string; isPlatformContext?: boolean }) {
  return scope.isPlatformContext
    ? { tenantId: undefined, isPlatformPost: true }
    : { tenantId: scope.tenantId, isPlatformPost: undefined };
}

export function getScopeFlag(
  scope: { tenantId?: string; isPlatformContext?: boolean },
  tenantKey: string,
  platformKey:
    | "isPlatformPost"
    | "isPlatformAccount"
    | "isPlatformCampaign"
    | "isPlatformFlow"
    | "isPlatformAnalytics"
    | "isPlatformComment"
    | "isPlatformLibrary"
    | "isPlatformTemplate"
) {
  return scope.isPlatformContext
    ? { [tenantKey]: undefined, [platformKey]: true }
    : { [tenantKey]: scope.tenantId, [platformKey]: undefined };
}

export function ensureOwnedRecord(
  scope: { tenantId?: string; isPlatformContext?: boolean },
  record: any,
  entityLabel: string
) {
  if (!record || !matchesSocialScope(record, scope)) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: `${entityLabel} not found`,
    });
  }
}

export const resolveActionSocialScope = internalQuery({
  args: {
    sessionToken: v.string(),
    isPlatformContext: v.optional(v.boolean()),
    featureKey: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.isPlatformContext) {
      const actor = await requirePlatformContext(
        ctx,
        { sessionToken: args.sessionToken },
        getPlatformSocialPermission(args.featureKey)
      );
      return {
        isPlatformContext: true,
        tenantId: undefined,
        actorId: actor.userId,
        actorRole: actor.role,
        actorEmail: actor.email,
      };
    }

    const actor = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
    await requireModuleAccess(ctx, "mod_social", actor.tenantId);
    await requireModuleFeatureAccess(ctx, "mod_social", actor.tenantId, actor.role, args.featureKey);
    return {
      isPlatformContext: false,
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorRole: actor.role,
      actorEmail: actor.email,
    };
  },
});

export function validatePlatformLimits(variant: any) {
  const text = variant.textContent?.trim() ?? "";

  if (variant.platform === "twitter") {
    if (variant.tweetThreadParts?.some((part: string) => part.length > 280)) {
      throw new ConvexError({
        code: "INVALID_CONTENT",
        message: "Each X thread part must be 280 characters or fewer.",
      });
    }
    if (!variant.tweetThreadParts?.length && text.length > 280) {
      throw new ConvexError({
        code: "INVALID_CONTENT",
        message: "A single X post must be 280 characters or fewer.",
      });
    }
    if (variant.pollOptions && (variant.pollOptions.length < 2 || variant.pollOptions.length > 4)) {
      throw new ConvexError({
        code: "INVALID_CONTENT",
        message: "X polls require between 2 and 4 options.",
      });
    }
  }

  if (variant.platform === "linkedin" && text.length > 3000) {
    throw new ConvexError({
      code: "INVALID_CONTENT",
      message: "LinkedIn copy must be 3000 characters or fewer.",
    });
  }

  if (variant.platform === "telegram" && variant.pollOptions && variant.pollOptions.length < 2) {
    throw new ConvexError({
      code: "INVALID_CONTENT",
      message: "Telegram polls require at least 2 options.",
    });
  }

  if (variant.platform === "youtube") {
    if (!variant.youtubeTitle?.trim()) {
      throw new ConvexError({
        code: "INVALID_CONTENT",
        message: "YouTube posts require a title.",
      });
    }
    if (!variant.mediaUrls?.length) {
      throw new ConvexError({
        code: "INVALID_CONTENT",
        message: "YouTube posts require a video URL.",
      });
    }
  }

  if (variant.platform === "instagram" && !variant.mediaUrls?.length) {
    throw new ConvexError({
      code: "INVALID_CONTENT",
      message: "Instagram posts require at least one media asset.",
    });
  }

  if (variant.platform === "tiktok" && !variant.mediaUrls?.length) {
    throw new ConvexError({
      code: "INVALID_CONTENT",
      message: "TikTok posts require media.",
    });
  }
}
