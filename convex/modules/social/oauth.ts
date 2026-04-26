import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { encrypt } from "../../lib/encryption";
import {
  ensureOwnedRecord,
  getScopeFlag,
  requireSocialContext,
  resolveActionSocialScope,
  socialAccountStatusValidator,
  socialPlatformValidator,
  socialScopeArgs,
} from "./shared";

function getPublicBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    process.env.APP_URL ||
    "http://localhost:3005"
  );
}

function buildOAuthUrl(base: string, params: Record<string, string | undefined>) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function buildOAuthState() {
  return `social_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function buildFacebookOAuthUrl(state: string, redirectUri: string) {
  return buildOAuthUrl("https://www.facebook.com/v19.0/dialog/oauth", {
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope:
      "pages_manage_posts,pages_read_engagement,pages_show_list,pages_messaging,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,read_insights",
  });
}

export function buildTwitterOAuthUrl(state: string, redirectUri: string) {
  return buildOAuthUrl("https://twitter.com/i/oauth2/authorize", {
    client_id: process.env.TWITTER_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    code_challenge: state,
    code_challenge_method: "plain",
    scope: "tweet.read tweet.write tweet.moderate.write users.read offline.access",
  });
}

export function buildLinkedInOAuthUrl(state: string, redirectUri: string) {
  return buildOAuthUrl("https://www.linkedin.com/oauth/v2/authorization", {
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope: "r_organization_social w_organization_social r_organization_admin r_basicprofile",
  });
}

export function buildGoogleOAuthUrl(state: string, redirectUri: string) {
  return buildOAuthUrl("https://accounts.google.com/o/oauth2/v2/auth", {
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope:
      "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtubepartner https://www.googleapis.com/auth/yt-analytics.readonly",
  });
}

export function buildTikTokOAuthUrl(state: string, redirectUri: string) {
  return buildOAuthUrl("https://www.tiktok.com/v2/auth/authorize/", {
    client_key: process.env.TIKTOK_CLIENT_KEY,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope: "video.publish,video.list,business.account.info.basic",
  });
}

export const getOAuthUrl = query({
  args: {
    ...socialScopeArgs,
    platform: socialPlatformValidator,
    redirectUri: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSocialContext(ctx, args, "manage_accounts");
    const state = buildOAuthState();
    const redirectUri =
      args.redirectUri ??
      `${getPublicBaseUrl()}${args.isPlatformContext ? "/platform/social" : "/admin/social"}/accounts/oauth-callback`;

    const urlBuilders: Record<string, (state: string, redirectUri: string) => string> = {
      facebook: buildFacebookOAuthUrl,
      instagram: buildFacebookOAuthUrl,
      twitter: buildTwitterOAuthUrl,
      linkedin: buildLinkedInOAuthUrl,
      youtube: buildGoogleOAuthUrl,
      tiktok: buildTikTokOAuthUrl,
    };

    const builder = urlBuilders[args.platform];
    if (!builder) {
      return { url: null, state, manualSetup: true };
    }

    return { url: builder(state, redirectUri), state, redirectUri };
  },
});

export const getConnectedAccounts = query({
  args: {
    ...socialScopeArgs,
    platform: v.optional(socialPlatformValidator),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "view_social_dashboard");
    const rows = await ctx.db.query("social_accounts").collect();
    return rows
      .filter((row) =>
        scope.isPlatformContext ? row.isPlatformAccount : row.tenantId === scope.tenantId
      )
      .filter((row) => (args.platform ? row.platform === args.platform : true))
      .map(({ accessToken, refreshToken, pageToken, ...safe }) => safe)
      .sort((a, b) => b.connectedAt - a.connectedAt);
  },
});

export const disconnectAccount = mutation({
  args: {
    ...socialScopeArgs,
    accountDocId: v.id("social_accounts"),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "manage_accounts");
    const account = await ctx.db.get(args.accountDocId);
    ensureOwnedRecord(scope, account, "Social account");
    await ctx.db.patch(args.accountDocId, {
      status: "disconnected",
      accessToken: await encrypt("disconnected"),
      refreshToken: undefined,
      pageToken: undefined,
      tokenExpiresAt: undefined,
      lastErrorMessage: undefined,
    });
    return { success: true };
  },
});

export const connectWhatsApp = mutation({
  args: {
    ...socialScopeArgs,
    accountName: v.string(),
    accountHandle: v.optional(v.string()),
    wabaId: v.string(),
    phoneNumberId: v.string(),
    systemUserToken: v.string(),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "manage_accounts");
    const encrypted = await encrypt(args.systemUserToken);
    const existing = await ctx.db
      .query("social_accounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.wabaId))
      .unique();

    const payload = {
      ...getScopeFlag(scope, "tenantId", "isPlatformAccount"),
      platform: "whatsapp" as const,
      accountName: args.accountName,
      accountHandle: args.accountHandle,
      accountId: args.wabaId,
      accessToken: encrypted,
      accountType: "business",
      wabaId: args.wabaId,
      phoneNumberId: args.phoneNumberId,
      status: "active" as const,
      connectedBy: scope.actorId,
      connectedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { success: true, accountId: existing._id };
    }

    const accountId = await ctx.db.insert("social_accounts", payload);
    return { success: true, accountId };
  },
});

export const connectTelegram = mutation({
  args: {
    ...socialScopeArgs,
    accountName: v.string(),
    channelUsername: v.string(),
    botToken: v.string(),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "manage_accounts");
    const meResponse = await fetch(`https://api.telegram.org/bot${args.botToken}/getMe`);
    const meJson: any = await meResponse.json();
    if (!meResponse.ok || !meJson.ok) {
      throw new Error("Telegram token verification failed");
    }

    const encrypted = await encrypt(args.botToken);
    const existing = await ctx.db
      .query("social_accounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.channelUsername))
      .unique();

    const payload = {
      ...getScopeFlag(scope, "tenantId", "isPlatformAccount"),
      platform: "telegram" as const,
      accountName: args.accountName,
      accountHandle: args.channelUsername,
      accountId: args.channelUsername,
      accessToken: encrypted,
      accountType: "channel",
      status: "active" as const,
      connectedBy: scope.actorId,
      connectedAt: Date.now(),
      lastSyncAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { success: true, accountId: existing._id, botUsername: meJson.result?.username };
    }

    const accountId = await ctx.db.insert("social_accounts", payload);
    return { success: true, accountId, botUsername: meJson.result?.username };
  },
});

export const completeOAuthConnection = action({
  args: {
    sessionToken: v.string(),
    isPlatformContext: v.optional(v.boolean()),
    platform: socialPlatformValidator,
    code: v.string(),
    state: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const scope: any = await ctx.runQuery((internal as any).modules.social.shared.resolveActionSocialScope, {
      sessionToken: args.sessionToken,
      isPlatformContext: args.isPlatformContext,
      featureKey: "manage_accounts",
    });

    const actionMap: Record<string, string> = {
      facebook: "facebook",
      instagram: "facebook",
      twitter: "twitter",
      linkedin: "linkedin",
      youtube: "google",
      tiktok: "tiktok",
    };

    const provider = actionMap[args.platform];
    if (!provider) {
      throw new Error(`${args.platform} does not use OAuth in EduMyles`);
    }

    const actionRef =
      provider === "facebook"
        ? (internal as any).actions.auth.social.facebook.exchangeCodeForAccount
        : provider === "twitter"
          ? (internal as any).actions.auth.social.twitter.exchangeCodeForAccount
          : provider === "linkedin"
            ? (internal as any).actions.auth.social.linkedin.exchangeCodeForAccount
            : provider === "google"
              ? (internal as any).actions.auth.social.google.exchangeCodeForAccount
              : (internal as any).actions.auth.social.tiktok.exchangeCodeForAccount;

    const result: any = await ctx.runAction(actionRef, {
      platform: args.platform,
      code: args.code,
      redirectUri: args.redirectUri,
      state: args.state,
    });

    const existing: any = await ctx.runQuery((internal as any).modules.social.oauth.getAccountByExternalId, {
      accountId: result.account.id,
    });

    const payload = {
      ...getScopeFlag(scope, "tenantId", "isPlatformAccount"),
      platform: args.platform,
      accountName: result.account.name,
      accountHandle: result.account.handle,
      accountId: result.account.id,
      profileImageUrl: result.account.profileImageUrl,
      followerCount: result.account.followerCount,
      followingCount: result.account.followingCount,
      accessToken: await encrypt(result.tokens.accessToken),
      refreshToken: result.tokens.refreshToken ? await encrypt(result.tokens.refreshToken) : undefined,
      pageToken: result.tokens.pageToken ? await encrypt(result.tokens.pageToken) : undefined,
      tokenExpiresAt: result.tokens.expiresAt,
      accountType: result.account.type,
      pageId: result.account.pageId,
      igUserId: result.account.igUserId,
      status: "active" as const,
      connectedBy: scope.actorId,
      connectedAt: Date.now(),
      lastErrorMessage: undefined,
    };

    if (existing?._id) {
      await ctx.runMutation((internal as any).modules.social.oauth.patchAccountInternal, {
        accountDocId: existing._id,
        payload,
      });
      return { success: true, accountId: existing._id };
    }

    const accountId: any = await ctx.runMutation((internal as any).modules.social.oauth.insertAccountInternal, {
      payload,
    });
    return { success: true, accountId };
  },
});

export const getAccountByExternalId = internalQuery({
  args: { accountId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("social_accounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .unique();
  },
});

export const patchAccountInternal = internalMutation({
  args: {
    accountDocId: v.id("social_accounts"),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.accountDocId, args.payload);
    return args.accountDocId;
  },
});

export const insertAccountInternal = internalMutation({
  args: { payload: v.any() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("social_accounts", args.payload);
  },
});

export const refreshExpiredTokens = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const soon = now + 24 * 60 * 60 * 1000;
    const accounts = await ctx.db
      .query("social_accounts")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const expiring = accounts.filter(
      (account) =>
        account.refreshToken &&
        account.tokenExpiresAt !== undefined &&
        account.tokenExpiresAt < soon
    );

    for (const account of expiring) {
      await ctx.db.patch(account._id, {
        lastSyncAt: now,
        lastErrorMessage: undefined,
      });
    }

    return { processed: expiring.length };
  },
});

export const alertExpiringTokens = internalMutation({
  args: {},
  handler: async (ctx) => {
    const soon = Date.now() + 24 * 60 * 60 * 1000;
    const accounts = await ctx.db.query("social_accounts").collect();
    const expiring = accounts.filter(
      (account) => account.status === "active" && account.tokenExpiresAt && account.tokenExpiresAt < soon
    );
    return {
      count: expiring.length,
      accounts: expiring.map((account) => ({
        _id: account._id,
        platform: account.platform,
        accountName: account.accountName,
      })),
    };
  },
});
