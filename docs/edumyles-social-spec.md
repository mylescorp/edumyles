# EduMyles Social Media Management
## Complete Technical Specification v1.0
### Two Systems: mod_social (Tenant Module) + /platform/social (MylesCorp Internal)
**Date:** April 2026 | **Status:** Definitive

---

# SECTION 1 — ARCHITECTURE DECISION & APPROACH

---

## 1.1 The Right Approach: Direct OAuth + Content Queue + Approval Workflow

The best approach for full social media management from inside EduMyles is a **Direct OAuth Publishing System** with a built-in content workflow. Here is why this beats alternatives:

**What this means in practice:**
- School connects their Facebook Page, Instagram Business, X account, LinkedIn Page, YouTube Channel, TikTok Business, WhatsApp Business account, and Telegram channel — all via OAuth or API tokens stored encrypted in Convex
- Content is created inside EduMyles using a multi-platform composer
- Posts go through a configurable approval workflow (draft → reviewed → approved → scheduled → published)
- Publishing happens via each platform's API directly from Convex server-side actions
- Analytics are pulled back from each platform's API and stored in Convex
- One content calendar shows all platforms, all scheduled posts, all live posts

**Why not a third-party aggregator (Buffer, Hootsuite API)?**
- Cost: paying per seat and per post on top of EduMyles creates margin bleed
- Data: school's social analytics would live in a third-party system, not Convex
- Branding: schools see "Buffer" not "EduMyles"
- Control: third-party rate limits and deprecations break EduMyles without warning

---

## 1.2 Two Separate but Identical Systems

```
SYSTEM 1: mod_social (Tenant Module)
  → Installed from marketplace by schools
  → Each school manages THEIR OWN social accounts
  → Lives at: /admin/social (school admin)
  → Teacher role: create/draft only
  → Admin role: approve/publish/schedule
  → Priced: KES 15/student/month
  → Slug: mod_social

SYSTEM 2: /platform/social (MylesCorp Internal)
  → Inside Platform Admin — NOT a tenant module
  → MylesCorp manages EduMyles brand accounts
  → Lives at: /platform/social
  → Platform RBAC: content_moderator → creates, platform_manager → approves
  → Free for EduMyles internal use
  → All 8 platforms connected once at company level
```

Both systems share the same Convex functions, schema tables (scoped by `tenantId` or `platformContext: true`), UI components, and OAuth connection infrastructure. The only difference is access control scope.

---

## 1.3 Supported Platforms — Full API Reference

| Platform | API | Auth Method | Post Types | Analytics API |
|---|---|---|---|---|
| Facebook | Graph API v19.0 | OAuth 2.0 (Page Token) | Text, Photo, Video, Story, Reel, Link | Graph API Insights |
| Instagram | Graph API v19.0 | OAuth 2.0 (via Facebook) | Photo, Video, Carousel, Story, Reel | Graph API Insights |
| X / Twitter | Twitter API v2 | OAuth 2.0 | Tweet, Thread, Poll, Media | Tweet Counts, Metrics |
| LinkedIn | LinkedIn Marketing API | OAuth 2.0 (Organization) | Text, Article, Photo, Video, Document | Analytics API |
| YouTube | YouTube Data API v3 | OAuth 2.0 | Video Upload, Community Post, Short | Analytics API |
| TikTok | TikTok Business API | OAuth 2.0 | Video, Photo Slideshow | Business Suite API |
| WhatsApp Business | WhatsApp Cloud API (Meta) | WABA Token (no OAuth) | Text, Media, Template, Status | WABA Analytics |
| Telegram | Telegram Bot API | Bot Token (no OAuth) | Text, Photo, Video, Document, Poll | Bot Statistics |

---

# SECTION 2 — DATABASE SCHEMA

---

## 2.1 Social Accounts (Connected Platform Accounts)

```typescript
// convex/schema.ts additions

social_accounts: defineTable({
  // Scope — one of these is set, the other is null
  tenantId: v.optional(v.string()),       // school tenant
  isPlatformAccount: v.optional(v.boolean()), // MylesCorp internal

  platform: v.union(
    v.literal("facebook"),
    v.literal("instagram"),
    v.literal("twitter"),
    v.literal("linkedin"),
    v.literal("youtube"),
    v.literal("tiktok"),
    v.literal("whatsapp"),
    v.literal("telegram"),
  ),
  accountName: v.string(),               // "Nairobi Academy" / "@edumyles"
  accountHandle: v.optional(v.string()), // "@nairobiacademy"
  accountId: v.string(),                 // platform-specific account/page ID
  profileImageUrl: v.optional(v.string()),
  followerCount: v.optional(v.number()),
  followingCount: v.optional(v.number()),

  // Tokens — ALL encrypted at rest using AES-256
  // Never stored in plaintext. Decrypted only in server-side Convex actions.
  accessToken: v.string(),              // encrypted
  refreshToken: v.optional(v.string()), // encrypted — not all platforms have this
  tokenExpiresAt: v.optional(v.number()), // epoch ms — null = no expiry
  pageToken: v.optional(v.string()),   // encrypted — Facebook pages need page token
  accountType: v.optional(v.string()), // "page" | "personal" | "business" | "channel"

  // Platform-specific IDs
  pageId: v.optional(v.string()),       // Facebook Page ID
  igUserId: v.optional(v.string()),     // Instagram User ID (separate from Facebook)
  wabaId: v.optional(v.string()),       // WhatsApp Business Account ID
  phoneNumberId: v.optional(v.string()),// WhatsApp Phone Number ID

  status: v.union(
    v.literal("active"),
    v.literal("token_expired"),
    v.literal("disconnected"),
    v.literal("error"),
  ),
  lastSyncAt: v.optional(v.number()),
  lastErrorMessage: v.optional(v.string()),
  connectedBy: v.string(),             // userId who connected
  connectedAt: v.number(),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_isPlatformAccount", ["isPlatformAccount"])
  .index("by_tenantId_platform", ["tenantId", "platform"])
  .index("by_accountId", ["accountId"]),

// Posts — the core content unit
social_posts: defineTable({
  // Scope
  tenantId: v.optional(v.string()),
  isPlatformPost: v.optional(v.boolean()),

  title: v.string(),                    // internal reference title (not published)
  status: v.union(
    v.literal("draft"),
    v.literal("pending_approval"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("scheduled"),
    v.literal("publishing"),            // in-flight — being sent to platforms
    v.literal("published"),
    v.literal("partially_published"),   // some platforms succeeded, some failed
    v.literal("failed"),
    v.literal("cancelled"),
  ),
  scheduledAt: v.optional(v.number()),  // null = post immediately on approve
  publishedAt: v.optional(v.number()),

  // Which accounts to post to
  targetAccountIds: v.array(v.id("social_accounts")),

  // Platform-specific content variants (one per platform in targetAccountIds)
  platformVariants: v.array(v.object({
    platform: v.string(),
    accountId: v.id("social_accounts"),
    // Content (platform-specific)
    textContent: v.optional(v.string()),    // DOMPurify sanitised
    mediaUrls: v.array(v.string()),         // UploadThing URLs
    mediaType: v.optional(v.string()),      // "image" | "video" | "carousel" | "reel"
    linkUrl: v.optional(v.string()),
    linkTitle: v.optional(v.string()),
    linkDescription: v.optional(v.string()),
    // Platform-specific extras
    tweetThreadParts: v.optional(v.array(v.string())), // for X threads
    pollOptions: v.optional(v.array(v.string())),       // for polls
    pollDurationMinutes: v.optional(v.number()),
    youtubeTitle: v.optional(v.string()),
    youtubeDescription: v.optional(v.string()),
    youtubeTags: v.optional(v.array(v.string())),
    youtubeCategory: v.optional(v.string()),
    youtubePrivacy: v.optional(v.string()), // "public" | "unlisted" | "private"
    tiktokCaption: v.optional(v.string()),
    whatsappTemplateId: v.optional(v.string()),
    telegramChatId: v.optional(v.string()),
    // Result
    publishedPostId: v.optional(v.string()),  // platform post ID on success
    publishedPostUrl: v.optional(v.string()),
    publishStatus: v.optional(v.string()),    // per-platform status
    publishError: v.optional(v.string()),     // error message if failed
    publishedAt: v.optional(v.number()),
  })),

  // Approval
  approvalRequired: v.boolean(),
  approvedBy: v.optional(v.string()),
  approvedAt: v.optional(v.number()),
  rejectedBy: v.optional(v.string()),
  rejectedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),

  // Metadata
  tags: v.array(v.string()),             // internal tagging for filtering
  campaignId: v.optional(v.id("social_campaigns")),
  createdBy: v.string(),
  isDeleted: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_isPlatformPost", ["isPlatformPost"])
  .index("by_status", ["status"])
  .index("by_scheduledAt", ["scheduledAt"])
  .index("by_createdBy", ["createdBy"])
  .index("by_campaignId", ["campaignId"]),

// Analytics — pulled from each platform periodically
social_analytics: defineTable({
  tenantId: v.optional(v.string()),
  isPlatformAnalytics: v.optional(v.boolean()),

  accountId: v.id("social_accounts"),
  platform: v.string(),
  postId: v.optional(v.id("social_posts")),     // null = account-level analytics
  platformPostId: v.optional(v.string()),        // ID on the platform itself

  // Universal metrics (all platforms)
  impressions: v.optional(v.number()),
  reach: v.optional(v.number()),
  engagements: v.optional(v.number()),
  likes: v.optional(v.number()),
  comments: v.optional(v.number()),
  shares: v.optional(v.number()),
  saves: v.optional(v.number()),
  clicks: v.optional(v.number()),
  followerGrowth: v.optional(v.number()),

  // Video-specific
  videoViews: v.optional(v.number()),
  videoWatchTimeSeconds: v.optional(v.number()),
  videoCompletionRate: v.optional(v.number()),

  // Platform-specific extras stored as JSON
  rawMetrics: v.optional(v.string()),

  periodStart: v.number(),              // analytics window start (epoch ms)
  periodEnd: v.number(),
  pulledAt: v.number(),                 // when we fetched from platform API
})
  .index("by_accountId", ["accountId"])
  .index("by_postId", ["postId"])
  .index("by_tenantId_platform", ["tenantId", "platform"])
  .index("by_periodStart", ["periodStart"]),

// Campaigns — group posts together
social_campaigns: defineTable({
  tenantId: v.optional(v.string()),
  isPlatformCampaign: v.optional(v.boolean()),

  name: v.string(),
  description: v.optional(v.string()),
  goal: v.optional(v.string()),         // "awareness" | "engagement" | "traffic" | "leads"
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  status: v.union(
    v.literal("planning"),
    v.literal("active"),
    v.literal("paused"),
    v.literal("completed"),
    v.literal("cancelled"),
  ),
  tags: v.array(v.string()),
  createdBy: v.string(),
  isDeleted: v.boolean(),
  createdAt: v.number(),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_status", ["status"]),

// Approval workflows
social_approval_flows: defineTable({
  tenantId: v.optional(v.string()),
  isPlatformFlow: v.optional(v.boolean()),

  name: v.string(),                     // "Standard Approval", "Emergency Post"
  isDefault: v.boolean(),
  requiresApproval: v.boolean(),        // false = auto-approve all drafts
  approverRoles: v.array(v.string()),   // school roles that can approve
  approverUserIds: v.array(v.string()), // specific users (optional)
  notifyOnSubmit: v.boolean(),
  autoPublishOnApproval: v.boolean(),   // true = publish immediately on approve
  allowSelfApproval: v.boolean(),       // can the creator also approve?
  createdAt: v.number(),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_isDefault", ["isDefault"]),

// Content library — reusable media assets
social_media_library: defineTable({
  tenantId: v.optional(v.string()),
  isPlatformLibrary: v.optional(v.boolean()),

  name: v.string(),
  description: v.optional(v.string()),
  fileUrl: v.string(),                  // UploadThing URL
  fileType: v.union(
    v.literal("image"), v.literal("video"), v.literal("gif"),
    v.literal("document"),
  ),
  fileSizeBytes: v.number(),
  mimeType: v.string(),
  dimensions: v.optional(v.object({
    width: v.number(),
    height: v.number(),
    durationSeconds: v.optional(v.number()),
  })),
  tags: v.array(v.string()),
  uploadedBy: v.string(),
  usageCount: v.number(),              // how many posts use this asset
  isDeleted: v.boolean(),
  createdAt: v.number(),
})
  .index("by_tenantId", ["tenantId"])
  .index("by_fileType", ["fileType"]),

// Recurring / scheduled content templates
social_content_templates: defineTable({
  tenantId: v.optional(v.string()),
  isPlatformTemplate: v.optional(v.boolean()),

  name: v.string(),
  description: v.optional(v.string()),
  platforms: v.array(v.string()),
  textTemplate: v.optional(v.string()), // can include {schoolName}, {date}, {term} vars
  mediaUrls: v.array(v.string()),
  tags: v.array(v.string()),
  createdBy: v.string(),
  usageCount: v.number(),
  isDeleted: v.boolean(),
  createdAt: v.number(),
})
  .index("by_tenantId", ["tenantId"]),

// Comment management — pulled from each platform
social_comments: defineTable({
  tenantId: v.optional(v.string()),
  isPlatformComment: v.optional(v.boolean()),

  postId: v.id("social_posts"),
  accountId: v.id("social_accounts"),
  platform: v.string(),
  platformCommentId: v.string(),
  platformPostId: v.string(),
  authorName: v.string(),
  authorHandle: v.optional(v.string()),
  authorProfileUrl: v.optional(v.string()),
  body: v.string(),
  likeCount: v.number(),
  isReply: v.boolean(),
  parentCommentId: v.optional(v.string()),
  status: v.union(
    v.literal("new"),
    v.literal("read"),
    v.literal("replied"),
    v.literal("hidden"),
    v.literal("deleted_on_platform"),
  ),
  repliedAt: v.optional(v.number()),
  repliedBy: v.optional(v.string()),
  replyText: v.optional(v.string()),
  pulledAt: v.number(),
})
  .index("by_postId", ["postId"])
  .index("by_accountId", ["accountId"])
  .index("by_status", ["status"])
  .index("by_platform", ["platform"]),
```

---

# SECTION 3 — PLATFORM OAUTH CONNECTIONS

---

## 3.1 OAuth Connection Flow (Per Platform)

All connections use the same pattern: redirect to platform OAuth → callback → exchange code for token → store encrypted in Convex.

```typescript
// convex/modules/social/oauth.ts

export const getOAuthUrl = query({
  args: {
    platform: v.string(),
    tenantId: v.optional(v.string()),
    isPlatformAccount: v.optional(v.boolean()),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    // Returns the platform-specific OAuth URL to redirect the user to
    const state = crypto.randomUUID(); // CSRF token — store in session
    const urls: Record<string, string> = {
      facebook: buildFacebookOAuthUrl(state, args.redirectUri),
      instagram: buildFacebookOAuthUrl(state, args.redirectUri), // same flow
      twitter: buildTwitterOAuthUrl(state, args.redirectUri),
      linkedin: buildLinkedInOAuthUrl(state, args.redirectUri),
      youtube: buildGoogleOAuthUrl(state, args.redirectUri),
      tiktok: buildTikTokOAuthUrl(state, args.redirectUri),
      // WhatsApp and Telegram: no OAuth — handled separately
    };
    return { url: urls[args.platform], state };
  }
});

// Called by the OAuth callback page
export const completeOAuthConnection = action({
  args: {
    platform: v.string(),
    code: v.string(),
    state: v.string(),
    redirectUri: v.string(),
    tenantId: v.optional(v.string()),
    isPlatformAccount: v.optional(v.boolean()),
    connectedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Exchange code for access token
    const tokens = await exchangeCodeForTokens(args.platform, args.code, args.redirectUri);

    // 2. Fetch account details from platform
    const accountDetails = await fetchAccountDetails(args.platform, tokens.accessToken);

    // 3. Encrypt tokens (AES-256 using SOCIAL_ENCRYPTION_KEY env var)
    const encryptedAccess = await encrypt(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? await encrypt(tokens.refreshToken) : undefined;
    const encryptedPage = tokens.pageToken ? await encrypt(tokens.pageToken) : undefined;

    // 4. Store in Convex
    await ctx.runMutation(internal.social.accounts.upsertSocialAccount, {
      tenantId: args.tenantId,
      isPlatformAccount: args.isPlatformAccount,
      platform: args.platform,
      accountName: accountDetails.name,
      accountHandle: accountDetails.handle,
      accountId: accountDetails.id,
      profileImageUrl: accountDetails.profileImageUrl,
      followerCount: accountDetails.followerCount,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      pageToken: encryptedPage,
      tokenExpiresAt: tokens.expiresAt,
      pageId: accountDetails.pageId,
      igUserId: accountDetails.igUserId,
      wabaId: accountDetails.wabaId,
      phoneNumberId: accountDetails.phoneNumberId,
      accountType: accountDetails.type,
      status: "active",
      connectedBy: args.connectedBy,
      connectedAt: Date.now(),
    });
  }
});
```

## 3.2 Per-Platform OAuth Scopes Required

**Facebook** — `pages_manage_posts, pages_read_engagement, pages_show_list, pages_messaging, instagram_basic, instagram_content_publish, instagram_manage_comments, instagram_manage_insights, read_insights`

**Instagram** — handled via Facebook OAuth above (Instagram Business connected to a Facebook Page)

**X / Twitter** — `tweet.read, tweet.write, tweet.moderate.write, users.read, offline.access`

**LinkedIn** — `r_organization_social, w_organization_social, r_organization_admin, r_basicprofile`

**YouTube** — `https://www.googleapis.com/auth/youtube.upload, https://www.googleapis.com/auth/youtube, https://www.googleapis.com/auth/youtubepartner, https://www.googleapis.com/auth/yt-analytics.readonly`

**TikTok** — `video.publish, video.list, business.account.info.basic`

**WhatsApp Business** — No OAuth. School enters their WABA Token and Phone Number ID directly from Meta Business Suite. Stored encrypted. Sending uses WhatsApp Cloud API.

**Telegram** — No OAuth. School creates a Bot via @BotFather, adds the bot to their channel as admin, enters the bot token. We call the Telegram Bot API using that token.

## 3.3 Token Refresh (Automated Cron)

```typescript
// convex/modules/social/oauth.ts

export const refreshExpiredTokens = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const soon = now + 24 * 60 * 60 * 1000; // tokens expiring in 24 hours

    const expiringAccounts = await ctx.db
      .query("social_accounts")
      .withIndex("by_status", q => q.eq("status", "active"))
      .filter(q =>
        q.and(
          q.neq(q.field("refreshToken"), undefined),
          q.lt(q.field("tokenExpiresAt"), soon),
        )
      )
      .collect();

    for (const account of expiringAccounts) {
      try {
        const refreshToken = await decrypt(account.refreshToken!);
        const newTokens = await ctx.runAction(
          internal.social.publish.refreshPlatformToken,
          { platform: account.platform, refreshToken }
        );

        await ctx.db.patch(account._id, {
          accessToken: await encrypt(newTokens.accessToken),
          refreshToken: newTokens.refreshToken ? await encrypt(newTokens.refreshToken) : account.refreshToken,
          tokenExpiresAt: newTokens.expiresAt,
          status: "active",
          lastErrorMessage: undefined,
        });
      } catch (e: any) {
        await ctx.db.patch(account._id, {
          status: "token_expired",
          lastErrorMessage: e.message,
        });
        // Notify the account owner
        await notifyTokenExpired(ctx, account);
      }
    }
  }
});
```

---

# SECTION 4 — CONTENT COMPOSER & POST CREATION

---

## 4.1 Multi-Platform Composer Architecture

The composer is the core UI. It allows creating one piece of content and customising it per platform simultaneously.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Create New Post                           [Save Draft] [Schedule]  │
│                                                                     │
│  ─── Target Platforms ─────────────────────────────────────────────  │
│  ✅ Facebook — Nairobi Academy Page                                  │
│  ✅ Instagram — @nairobiacademy                                      │
│  ✅ X/Twitter — @NairobiAcademy                                      │
│  ☐  LinkedIn — Nairobi Academy                                      │
│  ☐  YouTube — Nairobi Academy                                       │
│  ✅ WhatsApp — School Status                                         │
│  ☐  Telegram — Nairobi Academy Channel                              │
│  ☐  TikTok — @nairobiacademy                                        │
│                                                                     │
│  ─── Compose ───────────────────────────────────────────────────── │
│                                                                     │
│  [All Platforms] [Facebook] [Instagram] [X] [WhatsApp]              │
│  ← Switch tabs to customise per platform                            │
│                                                                     │
│  ALL PLATFORMS:                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Form 4A students crushed their Chemistry mock exams today!   │  │
│  │ Proud of every single one of you. KCSE prep is going well.   │  │
│  │                                                              │  │
│  │ #NairobiAcademy #KCSE2026 #Chemistry #KenyanSchools           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  Characters: 164 / ∞  (X: 164/280 ✅  LinkedIn: 164/3000 ✅)        │
│                                                                     │
│  [🤖 AI Generate Caption]  [+ Add from Library]  [+ Upload Media]  │
│                                                                     │
│  Media:  [photo1.jpg ✅] [photo2.jpg ✅]                             │
│  Platform checks: FB ✅  IG ✅  X ✅ (max 4 images)  WA ✅            │
│                                                                     │
│  ─── Scheduling ─────────────────────────────────────────────────  │
│  ○ Post immediately after approval                                  │
│  ● Schedule for:  [22 Apr 2026 📅] [4:30 PM 🕓] [Africa/Nairobi ▾] │
│                                                                     │
│  Best times to post (based on account analytics):                  │
│  Tue 4pm ★★★  Wed 7pm ★★★  Fri 12pm ★★                            │
│                                                                     │
│  ─── Approval ────────────────────────────────────────────────── ─  │
│  Approval required: ✅ (Standard Approval Flow)                     │
│  Will notify: Principal Wanjiru, Admin Alice                        │
│                                                                     │
│  [Cancel]   [Save Draft]   [Submit for Approval]                    │
└─────────────────────────────────────────────────────────────────────┘
```

## 4.2 Platform-Specific Constraints (Enforced in Composer)

```typescript
// convex/modules/social/platformLimits.ts

export const PLATFORM_LIMITS = {
  facebook: {
    textMaxChars: 63206,
    imageMaxCount: 10,
    imageMaxSizeMb: 4,
    videoMaxSizeMb: 4000,
    videoMaxDurationSeconds: 14400, // 4 hours
    supportedImageFormats: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"],
    supportedVideoFormats: ["mp4", "mov", "avi"],
    supportsScheduling: true,
    postTypes: ["text", "image", "video", "link", "story", "reel"],
  },
  instagram: {
    textMaxChars: 2200,
    hashtagMax: 30,
    imageMaxCount: 10, // carousel
    imageMaxSizeMb: 8,
    videoMaxSizeMb: 100,
    videoMaxDurationSeconds: 60,       // Feed video
    reelMaxDurationSeconds: 900,       // 15 min
    storyMaxDurationSeconds: 60,
    supportedImageFormats: ["jpg", "jpeg", "png"],
    supportedVideoFormats: ["mp4", "mov"],
    aspectRatioMin: 4/5,
    aspectRatioMax: 1.91,
    supportsScheduling: true,
    postTypes: ["image", "carousel", "video", "reel", "story"],
  },
  twitter: {
    textMaxChars: 280,
    imageMaxCount: 4,
    imageMaxSizeMb: 5,
    videoMaxSizeMb: 512,
    videoMaxDurationSeconds: 140,
    supportedImageFormats: ["jpg", "jpeg", "png", "gif", "webp"],
    supportedVideoFormats: ["mp4", "mov"],
    supportsPoll: true,
    pollMinOptions: 2,
    pollMaxOptions: 4,
    supportsThreads: true,
    supportsScheduling: true,
    postTypes: ["tweet", "thread", "poll", "media"],
  },
  linkedin: {
    textMaxChars: 3000,
    imageMaxCount: 20,
    imageMaxSizeMb: 5,
    videoMaxSizeMb: 5120,
    videoMaxDurationSeconds: 600,
    documentMaxSizeMb: 100,
    supportsScheduling: true,
    postTypes: ["text", "image", "video", "document", "article"],
  },
  youtube: {
    titleMaxChars: 100,
    descriptionMaxChars: 5000,
    tagsMax: 500,
    videoMaxSizeMb: 256000, // 256 GB
    supportedVideoFormats: ["mp4", "mov", "avi", "wmv", "flv", "webm", "mkv"],
    supportsScheduling: true,
    privacyOptions: ["public", "unlisted", "private"],
    postTypes: ["video", "short", "community_post"],
  },
  tiktok: {
    textMaxChars: 2200,
    videoMaxSizeMb: 287,
    videoMinDurationSeconds: 3,
    videoMaxDurationSeconds: 600,
    supportedVideoFormats: ["mp4", "mov", "webm"],
    aspectRatioRequired: "9:16",
    supportsScheduling: true,
    postTypes: ["video", "photo_slideshow"],
  },
  whatsapp: {
    textMaxChars: 4096,
    imageMaxSizeMb: 5,
    videoMaxSizeMb: 16,
    documentMaxSizeMb: 100,
    supportedImageFormats: ["jpg", "jpeg", "png"],
    supportedVideoFormats: ["mp4", "3gpp"],
    supportsStatusUpdate: true,
    supportsTemplates: true,
    postTypes: ["text", "image", "video", "document", "status", "template"],
  },
  telegram: {
    textMaxChars: 4096,
    captionMaxChars: 1024,
    imageMaxSizeMb: 10,
    videoMaxSizeMb: 2000,
    documentMaxSizeMb: 2000,
    supportsPolls: true,
    supportsScheduling: true,
    postTypes: ["text", "image", "video", "document", "poll", "channel_post"],
  },
} as const;
```

## 4.3 Create Post Mutation

```typescript
// convex/modules/social/posts.ts

export const createPost = mutation({
  args: {
    tenantId: v.optional(v.string()),
    isPlatformPost: v.optional(v.boolean()),
    title: v.string(),
    targetAccountIds: v.array(v.id("social_accounts")),
    platformVariants: v.array(v.object({
      platform: v.string(),
      accountId: v.id("social_accounts"),
      textContent: v.optional(v.string()),
      mediaUrls: v.array(v.string()),
      mediaType: v.optional(v.string()),
      linkUrl: v.optional(v.string()),
      tweetThreadParts: v.optional(v.array(v.string())),
      pollOptions: v.optional(v.array(v.string())),
      pollDurationMinutes: v.optional(v.number()),
      youtubeTitle: v.optional(v.string()),
      youtubeDescription: v.optional(v.string()),
      youtubeTags: v.optional(v.array(v.string())),
      youtubePrivacy: v.optional(v.string()),
      tiktokCaption: v.optional(v.string()),
      telegramChatId: v.optional(v.string()),
      whatsappTemplateId: v.optional(v.string()),
    })),
    scheduledAt: v.optional(v.number()),
    campaignId: v.optional(v.id("social_campaigns")),
    tags: v.array(v.string()),
    submitForApproval: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get context (tenant or platform)
    const { userId, userRole } = args.tenantId
      ? await requireTenantContext(ctx)
      : await requirePermission(ctx, "communications.send_broadcast");

    // Sanitize all text content
    const sanitizedVariants = args.platformVariants.map(v => ({
      ...v,
      textContent: v.textContent ? sanitizeHtml(v.textContent) : undefined,
      publishedPostId: undefined,
      publishedPostUrl: undefined,
      publishStatus: "pending",
      publishError: undefined,
      publishedAt: undefined,
    }));

    // Validate platform limits per variant
    for (const variant of sanitizedVariants) {
      validatePlatformLimits(variant);
    }

    // Determine if approval is needed
    const approvalFlow = await getDefaultApprovalFlow(ctx,
      args.tenantId ?? null, args.isPlatformPost ?? false);
    const needsApproval = approvalFlow?.requiresApproval ?? true;

    const status = args.submitForApproval && needsApproval
      ? "pending_approval"
      : args.submitForApproval && !needsApproval
      ? "approved"
      : "draft";

    const postId = await ctx.db.insert("social_posts", {
      tenantId: args.tenantId,
      isPlatformPost: args.isPlatformPost,
      title: args.title,
      status,
      scheduledAt: args.scheduledAt,
      targetAccountIds: args.targetAccountIds,
      platformVariants: sanitizedVariants,
      approvalRequired: needsApproval,
      tags: args.tags,
      campaignId: args.campaignId,
      createdBy: userId,
      isDeleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Notify approvers if submitted
    if (status === "pending_approval" && approvalFlow) {
      await notifyApprovers(ctx, postId, approvalFlow, userId);
    }

    // If auto-approved and has scheduled time: schedule publishing
    if (status === "approved" && args.scheduledAt) {
      await ctx.scheduler.runAt(args.scheduledAt,
        internal.social.publish.publishPost, { postId });
    }

    // If approved and no scheduled time: publish immediately
    if (status === "approved" && !args.scheduledAt) {
      await ctx.scheduler.runAfter(0,
        internal.social.publish.publishPost, { postId });
    }

    await logAudit(ctx, {
      action: "social_post.created",
      entity: postId,
      after: JSON.stringify({ title: args.title, status, platforms: args.platformVariants.map(v => v.platform) }),
      performedBy: userId,
    });

    return postId;
  }
});

export const approvePost = mutation({
  args: { postId: v.id("social_posts"), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.status !== "pending_approval") throw new Error("Post not awaiting approval");

    // Get approver identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    // Check if approver has permission
    const approvalFlow = await getDefaultApprovalFlow(ctx, post.tenantId ?? null, post.isPlatformPost ?? false);
    const canApprove = await checkApprovalPermission(ctx, userId, approvalFlow, post);
    if (!canApprove) throw new Error("You don't have permission to approve this post");

    // Can't approve your own post unless allowSelfApproval
    if (post.createdBy === userId && !approvalFlow?.allowSelfApproval) {
      throw new Error("You cannot approve your own post");
    }

    await ctx.db.patch(args.postId, {
      status: post.scheduledAt ? "scheduled" : "approved",
      approvedBy: userId,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Schedule or immediately publish
    if (post.scheduledAt) {
      await ctx.scheduler.runAt(post.scheduledAt,
        internal.social.publish.publishPost, { postId: args.postId });
    } else {
      await ctx.scheduler.runAfter(0,
        internal.social.publish.publishPost, { postId: args.postId });
    }

    // Notify creator
    await createSocialNotification(ctx, {
      targetUserId: post.createdBy,
      title: `"${post.title}" approved`,
      body: post.scheduledAt
        ? `Scheduled for ${formatDate(post.scheduledAt)}`
        : "Publishing now to all selected platforms",
      type: "post_approved",
    });

    await logAudit(ctx, {
      action: "social_post.approved",
      entity: args.postId,
      performedBy: userId,
    });
  }
});

export const rejectPost = mutation({
  args: { postId: v.id("social_posts"), reason: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.postId, {
      status: "rejected",
      rejectedBy: identity.subject,
      rejectedAt: Date.now(),
      rejectionReason: args.reason,
      updatedAt: Date.now(),
    });

    await createSocialNotification(ctx, {
      targetUserId: post.createdBy,
      title: `"${post.title}" was not approved`,
      body: args.reason,
      type: "post_rejected",
    });

    await logAudit(ctx, {
      action: "social_post.rejected",
      entity: args.postId,
      after: JSON.stringify({ reason: args.reason }),
      performedBy: identity.subject,
    });
  }
});
```

---

# SECTION 5 — PUBLISHING ENGINE

---

## 5.1 Publish Post Action (Core Engine)

```typescript
// convex/modules/social/publish.ts

export const publishPost = internalAction({
  args: { postId: v.id("social_posts") },
  handler: async (ctx, args) => {
    const post = await ctx.runQuery(internal.social.posts.getPost, { postId: args.postId });
    if (!post) return;
    if (!["approved", "scheduled"].includes(post.status)) return;

    // Mark as publishing
    await ctx.runMutation(internal.social.posts.updateStatus, {
      postId: args.postId,
      status: "publishing",
    });

    const results: Array<{ platform: string; success: boolean; postId?: string; postUrl?: string; error?: string }> = [];

    // Publish to each platform in parallel (with individual error handling)
    await Promise.all(post.platformVariants.map(async (variant) => {
      const account = await ctx.runQuery(internal.social.accounts.getAccount,
        { accountId: variant.accountId });
      if (!account || account.status !== "active") {
        results.push({ platform: variant.platform, success: false, error: "Account not connected or token expired" });
        return;
      }

      try {
        const accessToken = await decrypt(account.accessToken);
        const pageToken = account.pageToken ? await decrypt(account.pageToken) : undefined;

        let publishResult: { postId: string; postUrl: string };

        switch (variant.platform) {
          case "facebook":
            publishResult = await publishToFacebook(variant, account, accessToken, pageToken!);
            break;
          case "instagram":
            publishResult = await publishToInstagram(variant, account, accessToken, pageToken!);
            break;
          case "twitter":
            publishResult = await publishToTwitter(variant, account, accessToken);
            break;
          case "linkedin":
            publishResult = await publishToLinkedIn(variant, account, accessToken);
            break;
          case "youtube":
            publishResult = await publishToYouTube(variant, account, accessToken);
            break;
          case "tiktok":
            publishResult = await publishToTikTok(variant, account, accessToken);
            break;
          case "whatsapp":
            publishResult = await publishToWhatsApp(variant, account);
            break;
          case "telegram":
            publishResult = await publishToTelegram(variant, account);
            break;
          default:
            throw new Error(`Unknown platform: ${variant.platform}`);
        }

        results.push({
          platform: variant.platform,
          success: true,
          postId: publishResult.postId,
          postUrl: publishResult.postUrl,
        });
      } catch (e: any) {
        results.push({ platform: variant.platform, success: false, error: e.message });
      }
    }));

    // Determine overall status
    const allSucceeded = results.every(r => r.success);
    const allFailed = results.every(r => !r.success);
    const finalStatus = allSucceeded ? "published"
      : allFailed ? "failed"
      : "partially_published";

    // Update post with results
    await ctx.runMutation(internal.social.posts.recordPublishResults, {
      postId: args.postId,
      status: finalStatus,
      results,
    });

    // Notify creator
    const post2 = await ctx.runQuery(internal.social.posts.getPost, { postId: args.postId });
    await createSocialNotification(ctx, {
      targetUserId: post2.createdBy,
      title: allSucceeded
        ? `"${post.title}" published successfully`
        : allFailed
        ? `"${post.title}" failed to publish`
        : `"${post.title}" partially published`,
      body: allFailed
        ? results.map(r => `${r.platform}: ${r.error}`).join(", ")
        : `Published to ${results.filter(r => r.success).map(r => r.platform).join(", ")}`,
      type: allSucceeded ? "post_published" : "post_failed",
    });

    // Schedule analytics pull 1 hour after publishing (for initial metrics)
    if (finalStatus !== "failed") {
      await ctx.scheduler.runAt(
        Date.now() + 60 * 60 * 1000,
        internal.social.analytics.pullPostAnalytics,
        { postId: args.postId }
      );
    }
  }
});
```

## 5.2 Per-Platform Publishing Functions

```typescript
// convex/modules/social/platforms/facebook.ts

async function publishToFacebook(
  variant: PostVariant,
  account: SocialAccount,
  accessToken: string,
  pageToken: string
): Promise<{ postId: string; postUrl: string }> {
  const pageId = account.pageId!;

  if (variant.mediaType === "video") {
    // Video upload to Facebook — two-step: upload then publish
    const videoId = await uploadFacebookVideo(variant.mediaUrls[0], pageToken);
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: variant.textContent,
          object_attachment: videoId,
          access_token: pageToken,
        }),
      }
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return {
      postId: data.id,
      postUrl: `https://facebook.com/${data.id}`,
    };
  }

  // Photo post
  if (variant.mediaUrls.length === 1) {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: variant.mediaUrls[0],
          message: variant.textContent,
          access_token: pageToken,
        }),
      }
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return { postId: data.id, postUrl: `https://facebook.com/${data.id}` };
  }

  // Multiple photos (album post)
  const photoIds = await Promise.all(
    variant.mediaUrls.map(url =>
      uploadFacebookPhotoUnpublished(url, pageId, pageToken)
    )
  );
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: variant.textContent,
        attached_media: photoIds.map(id => ({ media_fbid: id })),
        access_token: pageToken,
      }),
    }
  );
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return { postId: data.id, postUrl: `https://facebook.com/${data.id}` };
}

// convex/modules/social/platforms/instagram.ts

async function publishToInstagram(
  variant: PostVariant,
  account: SocialAccount,
  accessToken: string,
  pageToken: string
): Promise<{ postId: string; postUrl: string }> {
  const igUserId = account.igUserId!;
  const graphUrl = `https://graph.facebook.com/v19.0`;

  if (variant.mediaType === "reel") {
    // Instagram Reel — upload video then publish
    const uploadResponse = await fetch(`${graphUrl}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_url: variant.mediaUrls[0],
        caption: variant.textContent,
        media_type: "REELS",
        access_token: pageToken,
      }),
    });
    const container = await uploadResponse.json();
    if (container.error) throw new Error(container.error.message);

    // Wait for processing (poll status)
    await waitForInstagramProcessing(container.id, pageToken);

    const publishResponse = await fetch(`${graphUrl}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: container.id, access_token: pageToken }),
    });
    const published = await publishResponse.json();
    if (published.error) throw new Error(published.error.message);
    return {
      postId: published.id,
      postUrl: `https://instagram.com/p/${published.id}`,
    };
  }

  if (variant.mediaUrls.length > 1) {
    // Carousel post
    const childIds = await Promise.all(
      variant.mediaUrls.map(url =>
        createInstagramCarouselItem(igUserId, url, pageToken, graphUrl)
      )
    );
    const containerResponse = await fetch(`${graphUrl}/${igUserId}/media`, {
      method: "POST",
      body: JSON.stringify({
        media_type: "CAROUSEL",
        caption: variant.textContent,
        children: childIds.join(","),
        access_token: pageToken,
      }),
    });
    const container = await containerResponse.json();
    const publishResponse = await fetch(`${graphUrl}/${igUserId}/media_publish`, {
      method: "POST",
      body: JSON.stringify({ creation_id: container.id, access_token: pageToken }),
    });
    const published = await publishResponse.json();
    return { postId: published.id, postUrl: `https://instagram.com/p/${published.id}` };
  }

  // Single image
  const containerResponse = await fetch(`${graphUrl}/${igUserId}/media`, {
    method: "POST",
    body: JSON.stringify({
      image_url: variant.mediaUrls[0],
      caption: variant.textContent,
      access_token: pageToken,
    }),
  });
  const container = await containerResponse.json();
  if (container.error) throw new Error(container.error.message);

  const publishResponse = await fetch(`${graphUrl}/${igUserId}/media_publish`, {
    method: "POST",
    body: JSON.stringify({ creation_id: container.id, access_token: pageToken }),
  });
  const published = await publishResponse.json();
  return { postId: published.id, postUrl: `https://instagram.com/p/${published.id}` };
}

// convex/modules/social/platforms/twitter.ts

async function publishToTwitter(
  variant: PostVariant,
  account: SocialAccount,
  accessToken: string
): Promise<{ postId: string; postUrl: string }> {
  // Handle threads
  if (variant.tweetThreadParts && variant.tweetThreadParts.length > 1) {
    let replyToId: string | undefined;
    let firstTweetId: string | undefined;

    for (const part of variant.tweetThreadParts) {
      const body: any = { text: part };
      if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId };

      const response = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0].detail);
      if (!firstTweetId) firstTweetId = data.data.id;
      replyToId = data.data.id;
    }
    return {
      postId: firstTweetId!,
      postUrl: `https://x.com/i/web/status/${firstTweetId}`,
    };
  }

  // Single tweet with optional media
  const body: any = { text: variant.textContent };
  if (variant.pollOptions && variant.pollOptions.length >= 2) {
    body.poll = {
      options: variant.pollOptions.map(o => ({ label: o })),
      duration_minutes: variant.pollDurationMinutes ?? 1440,
    };
  }
  if (variant.mediaUrls.length > 0) {
    const mediaIds = await uploadTwitterMedia(variant.mediaUrls, accessToken);
    body.media = { media_ids: mediaIds };
  }

  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0].detail);
  return {
    postId: data.data.id,
    postUrl: `https://x.com/i/web/status/${data.data.id}`,
  };
}

// convex/modules/social/platforms/whatsapp.ts

async function publishToWhatsApp(
  variant: PostVariant,
  account: SocialAccount
): Promise<{ postId: string; postUrl: string }> {
  // WhatsApp uses the Cloud API — no OAuth, uses WABA token
  const wabaToken = await decrypt(account.accessToken);
  const phoneNumberId = account.phoneNumberId!;

  const body: any = { messaging_product: "whatsapp", to: "status" };

  if (variant.mediaUrls.length > 0) {
    const mediaType = variant.mediaType === "video" ? "video" : "image";
    body.type = mediaType;
    body[mediaType] = { link: variant.mediaUrls[0], caption: variant.textContent };
  } else {
    body.type = "text";
    body.text = { body: variant.textContent, preview_url: !!variant.linkUrl };
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${wabaToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return { postId: data.messages[0].id, postUrl: "" };
}

// convex/modules/social/platforms/telegram.ts

async function publishToTelegram(
  variant: PostVariant,
  account: SocialAccount
): Promise<{ postId: string; postUrl: string }> {
  const botToken = await decrypt(account.accessToken);
  const chatId = variant.telegramChatId ?? account.accountId;
  const apiBase = `https://api.telegram.org/bot${botToken}`;

  let endpoint: string;
  let body: Record<string, any> = { chat_id: chatId };

  if (variant.mediaUrls.length > 0) {
    if (variant.mediaType === "video") {
      endpoint = "/sendVideo";
      body.video = variant.mediaUrls[0];
      body.caption = variant.textContent;
      body.parse_mode = "HTML";
    } else if (variant.mediaUrls.length > 1) {
      // Media group (album)
      endpoint = "/sendMediaGroup";
      body.media = variant.mediaUrls.map((url, i) => ({
        type: "photo",
        media: url,
        caption: i === 0 ? variant.textContent : undefined,
      }));
    } else {
      endpoint = "/sendPhoto";
      body.photo = variant.mediaUrls[0];
      body.caption = variant.textContent;
      body.parse_mode = "HTML";
    }
  } else if (variant.pollOptions) {
    endpoint = "/sendPoll";
    body.question = variant.textContent;
    body.options = variant.pollOptions;
    body.is_anonymous = false;
  } else {
    endpoint = "/sendMessage";
    body.text = variant.textContent;
    body.parse_mode = "HTML";
  }

  const response = await fetch(`${apiBase}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.description);
  return {
    postId: String(data.result.message_id),
    postUrl: `https://t.me/${account.accountHandle}/${data.result.message_id}`,
  };
}
```

---

# SECTION 6 — ANALYTICS ENGINE

---

## 6.1 Analytics Pulling (Per Platform)

```typescript
// convex/modules/social/analytics.ts

export const pullAllAccountAnalytics = internalMutation({
  handler: async (ctx) => {
    const accounts = await ctx.db
      .query("social_accounts")
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    for (const account of accounts) {
      await ctx.scheduler.runAfter(0, internal.social.analytics.pullAccountAnalytics, {
        accountId: account._id,
      });
    }
  }
});

export const pullAccountAnalytics = internalAction({
  args: { accountId: v.id("social_accounts") },
  handler: async (ctx, args) => {
    const account = await ctx.runQuery(internal.social.accounts.getAccount, { accountId: args.accountId });
    if (!account || account.status !== "active") return;

    const accessToken = await decrypt(account.accessToken);
    const pageToken = account.pageToken ? await decrypt(account.pageToken) : undefined;
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000;

    let metrics: AccountMetrics;

    switch (account.platform) {
      case "facebook":
        metrics = await fetchFacebookInsights(account.pageId!, pageToken!, yesterday, now);
        break;
      case "instagram":
        metrics = await fetchInstagramInsights(account.igUserId!, pageToken!, yesterday, now);
        break;
      case "twitter":
        metrics = await fetchTwitterMetrics(account.accountId, accessToken, yesterday, now);
        break;
      case "linkedin":
        metrics = await fetchLinkedInAnalytics(account.accountId, accessToken, yesterday, now);
        break;
      case "youtube":
        metrics = await fetchYouTubeAnalytics(account.accountId, accessToken, yesterday, now);
        break;
      default:
        return; // TikTok, WhatsApp, Telegram have limited analytics APIs
    }

    await ctx.runMutation(internal.social.analytics.storeAnalytics, {
      accountId: args.accountId,
      tenantId: account.tenantId,
      isPlatformAnalytics: account.isPlatformAccount,
      platform: account.platform,
      metrics,
      periodStart: yesterday,
      periodEnd: now,
    });

    // Update follower count on account
    if (metrics.followerCount !== undefined) {
      await ctx.runMutation(internal.social.accounts.updateFollowerCount, {
        accountId: args.accountId,
        followerCount: metrics.followerCount,
      });
    }
  }
});
```

---

# SECTION 7 — AI CONTENT GENERATION

---

## 7.1 AI Caption Generator

```typescript
// convex/modules/social/ai.ts

export const generateSocialCaption = action({
  args: {
    tenantId: v.optional(v.string()),
    isPlatformPost: v.optional(v.boolean()),
    context: v.string(),           // what the post is about
    platforms: v.array(v.string()),
    tone: v.string(),              // "formal" | "casual" | "celebratory" | "informational"
    schoolName: v.optional(v.string()),
    includeHashtags: v.boolean(),
    language: v.union(v.literal("en"), v.literal("sw"), v.literal("both")),
  },
  handler: async (ctx, args): Promise<Record<string, string>> => {
    const platformConstraints = args.platforms.map(p => {
      const limits = PLATFORM_LIMITS[p as keyof typeof PLATFORM_LIMITS];
      return `${p}: max ${limits.textMaxChars} characters`;
    }).join(", ");

    const languageInstruction = args.language === "sw"
      ? "Write entirely in Swahili."
      : args.language === "both"
      ? "Write in English with a Swahili translation below, separated by a divider line."
      : "Write in English.";

    const response = await callOpenRouter<Record<string, string>>({
      model: "anthropic/claude-haiku-4-5",
      maxTokens: 800,
      jsonMode: true,
      systemPrompt: `You are a social media expert for African schools. 
Write engaging, authentic captions for school social media. 
Never use generic AI phrases. Keep it real, warm, and proud.
School context: Kenya-based educational institution.`,
      prompt: `Create social media captions for this school post.

Context: ${args.context}
School: ${args.schoolName ?? "the school"}
Tone: ${args.tone}
Platforms: ${args.platforms.join(", ")}
Platform limits: ${platformConstraints}
Include hashtags: ${args.includeHashtags}
Language: ${languageInstruction}

Return ONLY a JSON object where keys are platform names and values are captions.
Each caption must respect that platform's character limit.
Example: {"facebook": "Full caption here...", "instagram": "Caption with hashtags...", "twitter": "Short 280 char version"}`,
    });

    return response;
  }
});

export const generateHashtags = action({
  args: {
    content: v.string(),
    schoolName: v.optional(v.string()),
    platform: v.string(),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const response = await callOpenRouter<{ hashtags: string[] }>({
      model: "anthropic/claude-haiku-4-5",
      maxTokens: 200,
      jsonMode: true,
      prompt: `Generate ${args.count} relevant hashtags for a school social media post about: "${args.content}".
Platform: ${args.platform}
School name: ${args.schoolName ?? "a Kenyan school"}
Include: Kenya-specific tags, education tags, local community tags.
Return ONLY JSON: {"hashtags": ["#tag1", "#tag2"]}`,
    });
    return response.hashtags;
  }
});

export const suggestBestPostTime = action({
  args: {
    accountId: v.id("social_accounts"),
    platform: v.string(),
    targetAudience: v.string(), // "parents" | "students" | "staff" | "public"
  },
  handler: async (ctx, args) => {
    // Pull last 30 days of analytics
    const analytics = await ctx.runQuery(internal.social.analytics.getRecentAnalytics, {
      accountId: args.accountId,
      days: 30,
    });

    if (!analytics || analytics.length === 0) {
      // No data yet — use Kenya education sector benchmarks
      const benchmarks: Record<string, string[]> = {
        parents: ["07:00", "13:00", "19:00", "21:00"],
        students: ["15:30", "19:00", "21:00"],
        staff: ["08:00", "13:00", "17:00"],
        public: ["09:00", "12:00", "18:00", "20:00"],
      };
      return {
        suggested: benchmarks[args.targetAudience] ?? benchmarks.public,
        source: "benchmark",
        note: "Based on Kenyan school audience patterns. Connect analytics for personalised suggestions.",
      };
    }

    // Analyse real engagement data
    const response = await callOpenRouter<{ suggestedTimes: string[]; reasoning: string }>({
      model: "anthropic/claude-haiku-4-5",
      maxTokens: 300,
      jsonMode: true,
      prompt: `Analyse this social media engagement data and suggest the 3 best posting times for a Kenyan school.
Platform: ${args.platform}
Target audience: ${args.targetAudience}
Analytics: ${JSON.stringify(analytics.slice(0, 20))}
Timezone: Africa/Nairobi (EAT, UTC+3)
Return JSON: {"suggestedTimes": ["09:00", "16:00", "20:00"], "reasoning": "..."}`,
    });

    return { ...response, source: "analytics" };
  }
});
```

---

# SECTION 8 — COMMENT MANAGEMENT

---

## 8.1 Comment Pulling & Response

```typescript
// convex/modules/social/comments.ts

export const pullPostComments = internalAction({
  args: { postId: v.id("social_posts") },
  handler: async (ctx, args) => {
    const post = await ctx.runQuery(internal.social.posts.getPost, { postId: args.postId });
    if (!post || post.status !== "published") return;

    for (const variant of post.platformVariants) {
      if (!variant.publishedPostId) continue;
      const account = await ctx.runQuery(internal.social.accounts.getAccount,
        { accountId: variant.accountId });
      if (!account) continue;

      const accessToken = await decrypt(account.accessToken);
      const pageToken = account.pageToken ? await decrypt(account.pageToken) : undefined;

      let comments: RawComment[] = [];

      switch (variant.platform) {
        case "facebook":
          comments = await fetchFacebookComments(variant.publishedPostId, pageToken!);
          break;
        case "instagram":
          comments = await fetchInstagramComments(variant.publishedPostId, pageToken!);
          break;
        case "twitter":
          comments = await fetchTwitterReplies(variant.publishedPostId, accessToken);
          break;
        case "linkedin":
          comments = await fetchLinkedInComments(variant.publishedPostId, accessToken);
          break;
        case "youtube":
          comments = await fetchYouTubeComments(variant.publishedPostId, accessToken);
          break;
        case "telegram":
          // Telegram requires webhook for comments — polling not supported
          break;
      }

      // Store comments in Convex
      await ctx.runMutation(internal.social.comments.storeComments, {
        postId: args.postId,
        accountId: variant.accountId,
        platform: variant.platform,
        comments,
      });
    }
  }
});

export const replyToComment = action({
  args: {
    commentId: v.id("social_comments"),
    replyText: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.runQuery(internal.social.comments.getComment,
      { commentId: args.commentId });
    if (!comment) throw new Error("Comment not found");

    const account = await ctx.runQuery(internal.social.accounts.getAccount,
      { accountId: comment.accountId });
    if (!account) throw new Error("Account not found");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const accessToken = await decrypt(account.accessToken);
    const pageToken = account.pageToken ? await decrypt(account.pageToken) : undefined;

    switch (comment.platform) {
      case "facebook":
        await replyFacebookComment(comment.platformCommentId, args.replyText, pageToken!);
        break;
      case "instagram":
        await replyInstagramComment(comment.platformCommentId, args.replyText, pageToken!);
        break;
      case "twitter":
        await replyTwitterComment(comment.platformCommentId, args.replyText, accessToken);
        break;
      case "linkedin":
        await replyLinkedInComment(comment.platformCommentId, comment.platformPostId, args.replyText, accessToken);
        break;
      case "youtube":
        await replyYouTubeComment(comment.platformCommentId, args.replyText, accessToken);
        break;
      case "telegram":
        const botToken = await decrypt(account.accessToken);
        await replyTelegramComment(comment.telegramChatId!, parseInt(comment.platformCommentId), args.replyText, botToken);
        break;
    }

    await ctx.runMutation(internal.social.comments.markReplied, {
      commentId: args.commentId,
      replyText: args.replyText,
      repliedBy: identity.subject,
      repliedAt: Date.now(),
    });
  }
});

export const generateCommentReply = action({
  args: {
    commentBody: v.string(),
    postContext: v.string(),
    accountName: v.string(),
    tone: v.string(),
  },
  handler: async (ctx, args) => {
    return await callOpenRouter<string>({
      model: "anthropic/claude-haiku-4-5",
      maxTokens: 150,
      prompt: `You are a social media manager for a Kenyan school called "${args.accountName}".
Draft a short, professional reply to this comment on one of the school's posts.

Post context: ${args.postContext}
Comment: "${args.commentBody}"
Tone: ${args.tone}

Rules:
- Keep it under 100 words
- Be warm and genuine — not corporate
- If the comment is negative/complaint: acknowledge and offer to help privately
- Never make promises on behalf of the school
- Return only the reply text, no labels or JSON`,
    });
  }
});
```

---

# SECTION 9 — FRONTEND PAGES & COMPONENTS

---

## 9.1 Pages for Tenant Module (`mod_social`)

```
/admin/social                          — Social dashboard (overview)
/admin/social/posts                    — All posts (list view with filters)
/admin/social/posts/create             — Compose new post
/admin/social/posts/[postId]           — Post detail (status, analytics, comments)
/admin/social/posts/[postId]/edit      — Edit draft or rejected post
/admin/social/calendar                 — Content calendar (month/week view)
/admin/social/accounts                 — Connected accounts (connect/disconnect)
/admin/social/accounts/connect/[platform] — OAuth connect page per platform
/admin/social/analytics                — Analytics dashboard
/admin/social/analytics/[platform]     — Per-platform analytics deep dive
/admin/social/comments                 — Comment inbox (all platforms unified)
/admin/social/campaigns                — Campaign list
/admin/social/campaigns/[id]           — Campaign detail + posts
/admin/social/library                  — Media library
/admin/social/templates                — Content templates
/admin/social/settings                 — Approval flow config, posting schedule
```

## 9.2 Pages for MylesCorp Internal (`/platform/social`)

```
/platform/social                       — Social dashboard (overview)
/platform/social/posts                 — All posts
/platform/social/posts/create          — Compose
/platform/social/posts/[postId]        — Post detail
/platform/social/calendar              — Content calendar
/platform/social/accounts              — EduMyles/MylesCorp brand accounts
/platform/social/accounts/connect/[platform]
/platform/social/analytics             — MylesCorp brand analytics
/platform/social/comments              — Unified comment inbox
/platform/social/campaigns             — Campaign management
/platform/social/library               — MylesCorp media library
/platform/social/templates             — Templates
/platform/social/settings              — Settings
```

## 9.3 Dashboard Page

```
┌──────────────────────────────────────────────────────────────────────┐
│  Social Media                   [+ Create Post]   [⚙️ Settings]      │
│                                                                      │
│  CONNECTED ACCOUNTS (all 8 platforms shown with status)              │
│  [FB ✅] [IG ✅] [𝕏 ✅] [in ✅] [▶ ✅] [TT ✅] [WA ✅] [TG ✅]         │
│  Token warning: Instagram token expires in 3 days [Reconnect]        │
│                                                                      │
│  QUICK STATS (last 30 days — recharts)                               │
│  Reach: 24,500 (+12%)  Engagement: 3.4%  Followers: +234  Posts: 18  │
│                                                                      │
│  PENDING APPROVAL (teacher-submitted, awaiting admin)                │
│  "Form 4A Chemistry results..." — submitted by Ms Njeri — 2hrs ago   │
│  [Review] [Approve] [Reject]                                         │
│  "Sports Day photos..." — submitted by Mr Kamau — 1hr ago            │
│  [Review] [Approve] [Reject]                                         │
│                                                                      │
│  UPCOMING SCHEDULED POSTS                                            │
│  Tomorrow 4pm — FB + IG + 𝕏 — "Term 2 exam timetable"              │
│  Friday 10am — FB + WA — "Parent meeting reminder"                   │
│                                                                      │
│  RECENT POSTS PERFORMANCE (recharts BarChart)                        │
│  [Chart showing reach and engagement per post, last 7 days]          │
│                                                                      │
│  UNREAD COMMENTS                                                     │
│  FB: 4 new  IG: 2 new  𝕏: 1 new  [Go to comment inbox]             │
└──────────────────────────────────────────────────────────────────────┘
```

## 9.4 Content Calendar

```
┌──────────────────────────────────────────────────────────────────────┐
│  Content Calendar   April 2026   [← Month →]  [Month] [Week]        │
│  Filter: [All Platforms ▾] [All Statuses ▾] [All Staff ▾]           │
│                                                                      │
│  MON 20    TUE 21    WED 22    THU 23    FRI 24    SAT 25  SUN 26   │
│  ─────────────────────────────────────────────────────────────────── │
│            [FB+IG]             [All]                                 │
│            "Sports                      "Term 2                     │
│            Day"                          notice"                    │
│            ✅ Pub              📅 Sched  ⏳ Pending                  │
│                                                                      │
│  [+ Add post to any day by clicking it]                              │
│                                                                      │
│  Colour coding:                                                      │
│  ✅ Green = Published  📅 Blue = Scheduled  ⏳ Yellow = Pending       │
│  ❌ Red = Failed  📝 Grey = Draft                                     │
└──────────────────────────────────────────────────────────────────────┘
```

## 9.5 Comment Inbox (Unified All Platforms)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Comment Inbox                          Filter: [All Platforms ▾]   │
│  4 unread • 12 total                   [All Posts ▾] [Unread only]  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ [FB] "Sports Day photos..." post                   2 mins ago   │ │
│  │ 👤 Mary Kamau:  "My son James looks so happy! Thank you for    │ │
│  │ capturing these moments 💙"                                      │ │
│  │ [🤖 Generate Reply] [Type reply...] [Send]  [Mark Read] [Hide]  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ [IG] "Sports Day photos..." post                  15 mins ago   │ │
│  │ 👤 @john_parent_ke:  "Is there a way to get the high res       │ │
│  │ photos? We'd love to print them"                                │ │
│  │ [🤖 Generate Reply] [Type reply...] [Send]  [Mark Read] [Hide]  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 10 — CRON JOBS

---

## 10.1 All Social Crons

Add to `convex/crons.ts`:

```typescript
// Token refresh — daily 3:00 AM EAT (00:00 UTC)
crons.daily("refresh social oauth tokens",
  { hourUTC: 0, minuteUTC: 0 },
  internal.social.oauth.refreshExpiredTokens
);

// Pull post-level analytics — every 4 hours
crons.interval("pull social post analytics",
  { hours: 4 },
  internal.social.analytics.pullAllPostAnalytics
);

// Pull account-level analytics — daily 6:00 AM EAT (03:00 UTC)
crons.daily("pull social account analytics",
  { hourUTC: 3, minuteUTC: 0 },
  internal.social.analytics.pullAllAccountAnalytics
);

// Pull new comments — every 30 minutes
crons.interval("pull social comments",
  { minutes: 30 },
  internal.social.comments.pullAllCommentsForPublishedPosts
);

// Check scheduled posts and trigger publishing — every 5 minutes
crons.interval("process scheduled social posts",
  { minutes: 5 },
  internal.social.publish.processScheduledPosts
);

// Alert on expiring tokens (7 days before) — daily 8:00 AM EAT
crons.daily("alert on expiring social tokens",
  { hourUTC: 5, minuteUTC: 0 },
  internal.social.oauth.alertExpiringTokens
);
```

---

# SECTION 11 — MODULE SPEC (mod_social)

---

## 11.1 Module Metadata

```typescript
// convex/modules/mod_social/index.ts

export const MODULE_METADATA = {
  slug: "mod_social",
  displayName: "Social Media Manager",
  version: "1.0.0",
  category: "Communications",
  description: "Manage all school social media accounts from EduMyles. Create, schedule, approve and publish posts to Facebook, Instagram, X, LinkedIn, YouTube, TikTok, WhatsApp Business, and Telegram. Unified analytics and comment inbox.",
  tagline: "One dashboard. All platforms. Zero context-switching.",
  minimumPlan: "starter",
  dependencies: ["core_sis", "core_notifications"],
  baseRateKes: 15,
};

export const NAV_CONFIG = {
  moduleSlug: "mod_social",
  adminNav: [
    {
      label: "Social Media",
      icon: "Share2",
      href: "/admin/social",
      children: [
        { label: "Dashboard", href: "/admin/social" },
        { label: "Create Post", href: "/admin/social/posts/create", requiredFeature: "create_posts" },
        { label: "All Posts", href: "/admin/social/posts" },
        { label: "Content Calendar", href: "/admin/social/calendar" },
        { label: "Comments", href: "/admin/social/comments" },
        { label: "Analytics", href: "/admin/social/analytics", requiredFeature: "view_analytics" },
        { label: "Campaigns", href: "/admin/social/campaigns" },
        { label: "Media Library", href: "/admin/social/library" },
        { label: "Connected Accounts", href: "/admin/social/accounts", requiredFeature: "manage_accounts" },
        { label: "Settings", href: "/admin/social/settings", requiredFeature: "manage_settings" },
      ],
    },
  ],
  teacherNav: [
    {
      label: "Social Media",
      icon: "Share2",
      href: "/portal/teacher/social",
      children: [
        { label: "Create Draft", href: "/portal/teacher/social/create", requiredFeature: "create_posts" },
        { label: "My Drafts", href: "/portal/teacher/social/drafts" },
        { label: "Post Status", href: "/portal/teacher/social/status" },
      ],
    },
  ],
  dashboardWidgets: [
    { widgetId: "social-pending-approval", size: "small", defaultOrder: 8 },
    { widgetId: "social-quick-stats", size: "medium", defaultOrder: 9 },
  ],
};
```

## 11.2 Module Features & Default Access

```typescript
// convex/modules/mod_social/features.ts

export const SOCIAL_FEATURES = {
  create_posts: {
    key: "create_posts",
    label: "Create Posts",
    description: "Draft and submit social media posts for approval",
    defaultRoles: ["school_admin", "teacher"],
  },
  approve_posts: {
    key: "approve_posts",
    label: "Approve & Publish Posts",
    description: "Review, approve, reject, and directly publish posts",
    defaultRoles: ["school_admin"],
  },
  manage_accounts: {
    key: "manage_accounts",
    label: "Manage Connected Accounts",
    description: "Connect and disconnect social media accounts via OAuth",
    defaultRoles: ["school_admin"],
    riskyPermission: true, // stores OAuth tokens
  },
  view_analytics: {
    key: "view_analytics",
    label: "View Analytics",
    description: "View post and account-level analytics for all platforms",
    defaultRoles: ["school_admin"],
  },
  reply_comments: {
    key: "reply_comments",
    label: "Reply to Comments",
    description: "Reply to and manage comments across all platforms",
    defaultRoles: ["school_admin"],
  },
  manage_campaigns: {
    key: "manage_campaigns",
    label: "Manage Campaigns",
    description: "Create and manage content campaigns",
    defaultRoles: ["school_admin"],
  },
  manage_settings: {
    key: "manage_settings",
    label: "Manage Settings",
    description: "Configure approval workflows and posting schedules",
    defaultRoles: ["school_admin"],
  },
};

export const SOCIAL_DEFAULT_ROLE_ACCESS = [
  { role: "school_admin", accessLevel: "full", allowedFeatures: [] },
  { role: "principal", accessLevel: "restricted",
    allowedFeatures: ["view_analytics", "reply_comments"] },
  { role: "teacher", accessLevel: "restricted",
    allowedFeatures: ["create_posts"] },
  { role: "student", accessLevel: "none", allowedFeatures: [] },
  { role: "parent", accessLevel: "none", allowedFeatures: [] },
];
```

## 11.3 onInstall

```typescript
// convex/modules/mod_social/onInstall.ts

export const onInstall = internalMutation({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    // Create default approval flow
    await ctx.db.insert("social_approval_flows", {
      tenantId: args.tenantId,
      name: "Standard Approval",
      isDefault: true,
      requiresApproval: true,
      approverRoles: ["school_admin"],
      approverUserIds: [],
      notifyOnSubmit: true,
      autoPublishOnApproval: true,
      allowSelfApproval: false,
      createdAt: Date.now(),
    });

    // Create default access config
    await ctx.db.insert("module_access_config", {
      moduleSlug: "mod_social",
      tenantId: args.tenantId,
      roleAccess: SOCIAL_DEFAULT_ROLE_ACCESS,
      config: JSON.stringify({}),
      updatedBy: "system",
      updatedAt: Date.now(),
    });
  }
});
```

---

# SECTION 12 — PLATFORM-SPECIFIC SETUP GUIDES (UI)

---

## 12.1 Per-Platform Connection Guide UI

Each platform has a guided connection page at `/admin/social/accounts/connect/[platform]`. Here is what each shows:

**Facebook:**
```
Connect Facebook Page
1. You need: Facebook account + admin access to a Facebook Page
2. Click "Connect with Facebook" → approves in your Facebook account
3. Select which Page(s) to connect (multi-page schools supported)
4. Done — we store only the Page Access Token (not your personal token)
```

**Instagram:**
```
Connect Instagram Business
⚠️ IMPORTANT: Instagram Business accounts must be linked to a Facebook Page.
If your school Instagram is a Personal account, switch it to Business first in
Instagram Settings → Account type.
1. Connect via Facebook above first
2. Instagram will appear automatically once Facebook Page is connected
```

**WhatsApp Business:**
```
Connect WhatsApp Business
WhatsApp uses a different setup (Cloud API, no OAuth button).
1. Go to Meta Business Suite → WhatsApp → API Setup
2. Copy your WABA (WhatsApp Business Account ID)
3. Copy your Phone Number ID
4. Generate a Permanent System User Token in Meta Business Suite
5. Paste all three values below:

WABA ID:          [________________________]
Phone Number ID:  [________________________]
System User Token:[________________________]    [Verify & Connect]
```

**Telegram:**
```
Connect Telegram Channel
1. Open Telegram → search for @BotFather
2. Send: /newbot → give it a name → get your Bot Token
3. Add the bot as an admin of your school channel
4. Copy your channel username (e.g. @NairobiAcademyKE)
5. Paste below:

Bot Token:          [________________________]
Channel Username:   [@_______________________]   [Verify & Connect]
```

---

# SECTION 13 — MCP SERVER

---

## 13.1 `edumyles-social-mcp`

```typescript
// mcp-servers/social/src/index.ts
// Add to .claude/mcp.json alongside other EduMyles MCP servers

// Tools:
// social_get_posts(tenantId, status?, platform?) → posts[]
// social_get_analytics(accountId, days?) → metrics
// social_get_pending_approvals(tenantId) → posts[]
// social_approve_post(postId) → void
// social_reject_post(postId, reason) → void
// social_get_comments(postId) → comments[]
// social_get_accounts(tenantId) → accounts[]
// social_get_scheduled_posts(tenantId) → posts[]
```

---

# SECTION 14 — IMPLEMENTATION AGENT PROMPT

---

```
=======================================================================
EDUMYLES SOCIAL MEDIA MANAGEMENT — IMPLEMENTATION PROMPT
Version 1.0 | April 2026
=======================================================================

Implement the Social Media Management system for EduMyles.
Two systems: mod_social (tenant marketplace module) + /platform/social (MylesCorp internal).

=======================================================================
READ FIRST (mandatory before any code)
=======================================================================

1. docs/edumyles-social-spec.md           — this specification
2. docs/edumyles-master-spec-v2.md        — platform rules
3. docs/edumyles-marketplace-spec.md      — module system (mod_social installs like any module)
4. convex/schema.ts                        — existing tables
5. convex/lib/openrouter.ts               — callOpenRouter helper
6. opensrc/workos-authkit-nextjs/         — auth patterns

=======================================================================
ABSOLUTE RULES (same as all EduMyles — plus these social-specific ones)
=======================================================================

SOC-1: ALL OAuth tokens encrypted with AES-256 before storage
  — Never store a raw access token in Convex plaintext
  — Decrypt only inside internalAction/internalMutation — never in query results
  — Use crypto env var: SOCIAL_ENCRYPTION_KEY (AES-256)

SOC-2: ALL publishing via Convex internalAction — never from client
  — No client-side API calls to Facebook, Twitter, etc.
  — All HTTP calls to platform APIs happen server-side

SOC-3: requireModuleAccess(ctx, "mod_social", tenantId) on every module function

SOC-4: requireModuleFeatureAccess for every sensitive operation
  — create_posts: teachers can create, cannot publish
  — approve_posts: school_admin only
  — manage_accounts: school_admin only — protects OAuth tokens

SOC-5: DOMPurify on all textContent before storage and before rendering
  — Posts from teachers go through DOMPurify before saving

SOC-6: Platform API rate limits — respect per-platform limits
  — Never call platform APIs in tight loops without delays
  — Failed publishes: retry max 3 times with exponential backoff

SOC-7: Token refresh must run BEFORE publishing, not just on cron
  — Check tokenExpiresAt before every publish call
  — If expired: return clear error "Reconnect your [Platform] account"

SOC-8: Soft delete on social_posts (isDeleted flag)
  — Never hard-delete posts — analytics references depend on them

=======================================================================
PHASE 1 — SCHEMA
=======================================================================

Add to convex/schema.ts:
  social_accounts, social_posts, social_analytics, social_campaigns,
  social_approval_flows, social_media_library, social_content_templates,
  social_comments

All with correct indexes from spec Section 2.
Run: npx convex dev — zero errors

=======================================================================
PHASE 2 — ENCRYPTION UTILITY
=======================================================================

Create convex/lib/encryption.ts:
  encrypt(plaintext: string): Promise<string>  — AES-256-GCM
  decrypt(ciphertext: string): Promise<string>  — AES-256-GCM
  Uses process.env.SOCIAL_ENCRYPTION_KEY (32-byte hex string)
  Returns base64-encoded ciphertext with IV prepended

=======================================================================
PHASE 3 — OAUTH INFRASTRUCTURE
=======================================================================

Create convex/modules/social/oauth.ts:
  getOAuthUrl (query) — returns OAuth URL per platform
  completeOAuthConnection (action) — exchanges code, encrypts, stores
  disconnectAccount (mutation) — removes account + tokens
  refreshExpiredTokens (internalMutation — cron handler)
  alertExpiringTokens (internalMutation — cron handler)
  getConnectedAccounts (query) — returns accounts for tenant (no tokens in result)

Create per-platform OAuth URL builders:
  buildFacebookOAuthUrl, buildTwitterOAuthUrl, buildLinkedInOAuthUrl,
  buildGoogleOAuthUrl (YouTube), buildTikTokOAuthUrl

Create convex/actions/auth/social/facebook.ts — token exchange + account fetch
Create convex/actions/auth/social/twitter.ts — token exchange + account fetch
Create convex/actions/auth/social/linkedin.ts
Create convex/actions/auth/social/google.ts (YouTube)
Create convex/actions/auth/social/tiktok.ts

WhatsApp and Telegram: manual token entry mutation (no OAuth)
  connectWhatsApp(wabaId, phoneNumberId, systemUserToken)
  connectTelegram(botToken, channelUsername) — calls Telegram API to verify

Create frontend pages:
  /admin/social/accounts — shows all 8 platforms, connect/disconnect buttons
  /admin/social/accounts/connect/[platform] — per-platform guided setup
  /admin/social/accounts/oauth-callback — handles OAuth return

=======================================================================
PHASE 4 — POST CREATION & MANAGEMENT
=======================================================================

Create convex/modules/social/posts.ts:
  createPost (mutation) — with DOMPurify sanitization
  updatePost (mutation) — draft/rejected only
  deletePost (mutation) — soft delete
  submitForApproval (mutation)
  approvePost (mutation)
  rejectPost (mutation)
  cancelPost (mutation)
  getPosts (query) — with filters: status, platform, creator, campaign, date range
  getPost (query) — full detail including variants and analytics

Create platform limit validation:
  validatePlatformLimits(variant) — throws clear errors per platform

Create frontend:
  /admin/social/posts — list view with all filters + bulk actions
  /admin/social/posts/create — full composer (spec Section 4.1)
  /admin/social/posts/[postId] — detail view
  /admin/social/posts/[postId]/edit — edit form

Composer component (the most complex UI piece):
  Platform selector (toggle which accounts to post to)
  Tab navigation: All Platforms | Facebook | Instagram | X | etc
  Text area with real-time character counter per platform
  Media upload (UploadThing) with platform-specific validation
  X thread builder (split text into thread parts)
  Poll creator (for X and Telegram)
  YouTube-specific fields (title, description, tags, privacy)
  TikTok-specific fields (caption)
  Schedule picker with timezone (Africa/Nairobi default)
  Best time suggestions
  AI caption generator button
  Hashtag generator
  Approval flow indicator

Teacher portal composer (/portal/teacher/social/create):
  Simpler version — no scheduling, no approval control
  Creates draft → submits for approval → done

=======================================================================
PHASE 5 — PUBLISHING ENGINE
=======================================================================

Create convex/modules/social/publish.ts:
  publishPost (internalAction) — orchestrates all platform publishing
  processScheduledPosts (internalMutation — every 5min cron)

Create per-platform publishers:
  convex/modules/social/platforms/facebook.ts
  convex/modules/social/platforms/instagram.ts
  convex/modules/social/platforms/twitter.ts
  convex/modules/social/platforms/linkedin.ts
  convex/modules/social/platforms/youtube.ts
  convex/modules/social/platforms/tiktok.ts
  convex/modules/social/platforms/whatsapp.ts
  convex/modules/social/platforms/telegram.ts

Each publisher must:
  1. Decrypt token inside the action
  2. Handle media upload if required (Facebook, Instagram need media upload step)
  3. Handle platform-specific payload construction
  4. Return { postId, postUrl } on success
  5. Throw meaningful error on failure (not just "API error")
  6. Retry up to 3 times with 1s, 3s, 9s backoff on 5xx errors

=======================================================================
PHASE 6 — ANALYTICS
=======================================================================

Create convex/modules/social/analytics.ts:
  pullPostAnalytics (internalAction) — pulls per-post metrics
  pullAllPostAnalytics (internalMutation — 4hr cron)
  pullAccountAnalytics (internalAction) — pulls account-level metrics
  pullAllAccountAnalytics (internalMutation — daily cron)
  getAnalytics (query) — for frontend dashboard

Create per-platform analytics fetchers:
  fetchFacebookInsights, fetchInstagramInsights, fetchTwitterMetrics,
  fetchLinkedInAnalytics, fetchYouTubeAnalytics
  (TikTok, WhatsApp, Telegram: limited analytics — store what's available)

Create frontend:
  /admin/social/analytics — dashboard with recharts BarChart/AreaChart/PieChart
  Summary: reach, engagement, follower growth, best-performing post
  Per-platform breakdown tabs

=======================================================================
PHASE 7 — COMMENT MANAGEMENT
=======================================================================

Create convex/modules/social/comments.ts:
  pullPostComments (internalAction)
  pullAllCommentsForPublishedPosts (internalMutation — 30min cron)
  replyToComment (action) — publishes reply to platform
  markCommentRead (mutation)
  hideComment (action) — hides on Facebook/Instagram
  deleteComment (action) — deletes from platform (where supported)
  getComments (query) — unified inbox with filters

Create convex/modules/social/ai.ts:
  generateSocialCaption (action) — per-platform caption generation
  generateHashtags (action) — hashtag suggestions
  suggestBestPostTime (action) — analytics-based timing
  generateCommentReply (action) — draft reply to specific comment

Create frontend:
  /admin/social/comments — unified comment inbox (spec Section 9.5)

=======================================================================
PHASE 8 — CONTENT CALENDAR
=======================================================================

Create frontend:
  /admin/social/calendar — month/week toggle
  Month view: shows posts as coloured chips per day
  Week view: shows detailed post timeline
  Click day: opens create post modal pre-filled with that date
  Drag post to different day: reschedules (updates scheduledAt)
  
Data: useQuery(api.social.posts.getPostsForCalendar, { month, year })

=======================================================================
PHASE 9 — MODULE FILES + PLATFORM ADMIN
=======================================================================

Create all module files:
  convex/modules/mod_social/index.ts — MODULE_METADATA, NAV_CONFIG
  convex/modules/mod_social/onInstall.ts — creates default approval flow
  convex/modules/mod_social/onUninstall.ts — deregisters crons
  convex/modules/mod_social/configSchema.ts — approval flow config
  convex/modules/mod_social/features.ts — SOCIAL_FEATURES
  convex/modules/mod_social/notifications.ts — post approved/rejected/published
  convex/modules/mod_social/publicApi.ts — (minimal — no cross-module reads needed)

Create /platform/social pages — identical to /admin/social
  but using requirePermission instead of requireModuleAccess
  and scoped to isPlatformPost: true

Add to convex/crons.ts — all 6 social crons from spec Section 10.1

=======================================================================
PHASE 10 — FINAL VERIFICATION
=======================================================================

Integration tests:
  FLOW 1: Connect Facebook → create post → teacher submits → admin approves
           → publishes → post appears on Facebook → analytics pulled
  FLOW 2: Schedule post for future → cron fires → post published → notification
  FLOW 3: Token expires → cron alerts → admin reconnects → next post works
  FLOW 4: Teacher creates X thread → submits → admin approves → thread published
  FLOW 5: Comment appears → pulled in 30min → admin replies from inbox
  FLOW 6: Platform admin creates post for EduMyles brand accounts → publishes

Security checks:
  - Access token never appears in query results (only in internalAction)
  - Teacher cannot publish (only draft/submit)
  - Teacher cannot see/manage connected accounts
  - School A cannot access School B's posts or accounts
  - Soft delete: deleted posts not returned in any list query

Final:
  npx convex dev — zero errors
  npm run type-check — zero errors
  All platform publishers tested in sandbox mode

=======================================================================
END
=======================================================================
```
