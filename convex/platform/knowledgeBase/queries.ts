import { query } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * List knowledge base articles with optional filtering and pagination
 */
export const listArticles = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("all"))),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;

    let articlesQuery;

    if (args.status && args.status !== "all") {
      if (args.category) {
        const status = args.status;
        const category = args.category;
        articlesQuery = ctx.db
          .query("knowledgeBaseArticles")
          .withIndex("by_status_category", (q) =>
            q.eq("status", status).eq("category", category)
          );
      } else {
        const status = args.status;
        articlesQuery = ctx.db
          .query("knowledgeBaseArticles")
          .withIndex("by_status", (q) => q.eq("status", status));
      }
    } else if (args.category) {
      const category = args.category;
      articlesQuery = ctx.db
        .query("knowledgeBaseArticles")
        .withIndex("by_category", (q) => q.eq("category", category));
    } else {
      articlesQuery = ctx.db.query("knowledgeBaseArticles");
    }

    // Filter out deleted articles
    articlesQuery = articlesQuery.filter((q) =>
      q.neq(q.field("deleted"), true)
    );

    const allArticles = await articlesQuery.order("desc").collect();

    // Apply text search in JS if provided
    let filtered = allArticles;
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filtered = allArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          a.content.toLowerCase().includes(searchLower) ||
          a.tags.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      articles: paginated,
      total,
      hasMore: offset + limit < total,
    };
  },
});

/**
 * Get a single article by ID
 */
export const getArticleById = query({
  args: {
    sessionToken: v.string(),
    articleId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const article = await ctx.db.get(args.articleId as Id<"knowledgeBaseArticles">);
    if (!article || article.deleted) {
      throw new Error("Article not found");
    }

    return article;
  },
});

/**
 * List all knowledge base categories
 */
export const listCategories = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const categories = await ctx.db
      .query("knowledgeBaseCategories")
      .withIndex("by_order")
      .collect();

    return categories;
  },
});

/**
 * Get popular (most viewed) articles
 */
export const getPopularArticles = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const articles = await ctx.db
      .query("knowledgeBaseArticles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.neq(q.field("deleted"), true))
      .collect();

    // Sort by viewCount descending in JS
    articles.sort((a, b) => b.viewCount - a.viewCount);

    return articles.slice(0, args.limit ?? 10);
  },
});

/**
 * Search articles across title, content, and tags
 */
export const searchArticles = query({
  args: {
    sessionToken: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    if (!args.query.trim()) return [];

    const searchLower = args.query.toLowerCase();

    const articles = await ctx.db
      .query("knowledgeBaseArticles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.neq(q.field("deleted"), true))
      .collect();

    const matched = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(searchLower) ||
        a.content.toLowerCase().includes(searchLower) ||
        a.tags.some((t) => t.toLowerCase().includes(searchLower))
    );

    return matched.slice(0, args.limit ?? 20);
  },
});

/**
 * Get knowledge base overview stats
 */
export const getStats = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const allArticles = await ctx.db
      .query("knowledgeBaseArticles")
      .filter((q) => q.neq(q.field("deleted"), true))
      .collect();

    const published = allArticles.filter((a) => a.status === "published");
    const drafts = allArticles.filter((a) => a.status === "draft");
    const totalViews = allArticles.reduce((sum, a) => sum + a.viewCount, 0);
    const totalHelpful = allArticles.reduce((sum, a) => sum + a.helpfulCount, 0);
    const totalNotHelpful = allArticles.reduce((sum, a) => sum + a.notHelpfulCount, 0);
    const totalFeedback = totalHelpful + totalNotHelpful;
    const helpfulRate = totalFeedback > 0 ? Math.round((totalHelpful / totalFeedback) * 100) : 0;

    const categories = await ctx.db
      .query("knowledgeBaseCategories")
      .collect();

    return {
      totalArticles: allArticles.length,
      publishedCount: published.length,
      draftCount: drafts.length,
      totalViews,
      totalHelpful,
      totalNotHelpful,
      helpfulRate,
      categoryCount: categories.length,
    };
  },
});
