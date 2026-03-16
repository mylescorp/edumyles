import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * Create a new knowledge base article
 */
export const createArticle = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const articleId = await ctx.db.insert("knowledgeBaseArticles", {
      title: args.title,
      content: args.content,
      category: args.category,
      tags: args.tags,
      status: args.status,
      author: userId,
      authorName: email,
      viewCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      tenantId: args.tenantId,
      deleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Increment article count on the category
    const categories = await ctx.db
      .query("knowledgeBaseCategories")
      .filter((q) => q.eq(q.field("name"), args.category))
      .collect();

    if (categories.length > 0) {
      await ctx.db.patch(categories[0]._id, {
        articleCount: categories[0].articleCount + 1,
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      articleId,
      message: "Article created successfully",
    };
  },
});

/**
 * Update an existing article
 */
export const updateArticle = mutation({
  args: {
    sessionToken: v.string(),
    articleId: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const article = await ctx.db.get(args.articleId as Id<"knowledgeBaseArticles">);
    if (!article || article.deleted) {
      throw new Error("Article not found");
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updateData.title = args.title;
    if (args.content !== undefined) updateData.content = args.content;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.tenantId !== undefined) updateData.tenantId = args.tenantId;

    // Handle category change: update counts
    if (args.category !== undefined && args.category !== article.category) {
      updateData.category = args.category;

      // Decrement old category
      const oldCats = await ctx.db
        .query("knowledgeBaseCategories")
        .filter((q) => q.eq(q.field("name"), article.category))
        .collect();
      if (oldCats.length > 0) {
        await ctx.db.patch(oldCats[0]._id, {
          articleCount: Math.max(0, oldCats[0].articleCount - 1),
          updatedAt: Date.now(),
        });
      }

      // Increment new category
      const newCats = await ctx.db
        .query("knowledgeBaseCategories")
        .filter((q) => q.eq(q.field("name"), args.category))
        .collect();
      if (newCats.length > 0) {
        await ctx.db.patch(newCats[0]._id, {
          articleCount: newCats[0].articleCount + 1,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(args.articleId as Id<"knowledgeBaseArticles">, updateData);

    return {
      success: true,
      message: "Article updated successfully",
    };
  },
});

/**
 * Delete an article (soft delete)
 */
export const deleteArticle = mutation({
  args: {
    sessionToken: v.string(),
    articleId: v.string(),
    hard: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const article = await ctx.db.get(args.articleId as Id<"knowledgeBaseArticles">);
    if (!article) {
      throw new Error("Article not found");
    }

    if (args.hard) {
      await ctx.db.delete(args.articleId as Id<"knowledgeBaseArticles">);
    } else {
      await ctx.db.patch(args.articleId as Id<"knowledgeBaseArticles">, {
        deleted: true,
        updatedAt: Date.now(),
      });
    }

    // Decrement category count
    const cats = await ctx.db
      .query("knowledgeBaseCategories")
      .filter((q) => q.eq(q.field("name"), article.category))
      .collect();
    if (cats.length > 0) {
      await ctx.db.patch(cats[0]._id, {
        articleCount: Math.max(0, cats[0].articleCount - 1),
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      message: args.hard ? "Article permanently deleted" : "Article moved to trash",
    };
  },
});

/**
 * Publish a draft article
 */
export const publishArticle = mutation({
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

    if (article.status === "published") {
      return { success: true, message: "Article is already published" };
    }

    await ctx.db.patch(args.articleId as Id<"knowledgeBaseArticles">, {
      status: "published",
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Article published successfully",
    };
  },
});

/**
 * Create a new knowledge base category
 */
export const createCategory = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
    parentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    // Determine order if not provided
    let order = args.order;
    if (order === undefined) {
      const existing = await ctx.db
        .query("knowledgeBaseCategories")
        .withIndex("by_order")
        .order("desc")
        .first();
      order = existing ? existing.order + 1 : 0;
    }

    const categoryId = await ctx.db.insert("knowledgeBaseCategories", {
      name: args.name,
      description: args.description,
      icon: args.icon,
      order,
      parentId: args.parentId,
      articleCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      categoryId,
      message: "Category created successfully",
    };
  },
});

/**
 * Update an existing category
 */
export const updateCategory = mutation({
  args: {
    sessionToken: v.string(),
    categoryId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
    parentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const category = await ctx.db.get(args.categoryId as Id<"knowledgeBaseCategories">);
    if (!category) {
      throw new Error("Category not found");
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.icon !== undefined) updateData.icon = args.icon;
    if (args.order !== undefined) updateData.order = args.order;
    if (args.parentId !== undefined) updateData.parentId = args.parentId;

    await ctx.db.patch(args.categoryId as Id<"knowledgeBaseCategories">, updateData);

    return {
      success: true,
      message: "Category updated successfully",
    };
  },
});

/**
 * Record article feedback (helpful / not helpful)
 */
export const recordArticleFeedback = mutation({
  args: {
    sessionToken: v.string(),
    articleId: v.string(),
    helpful: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const article = await ctx.db.get(args.articleId as Id<"knowledgeBaseArticles">);
    if (!article || article.deleted) {
      throw new Error("Article not found");
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.helpful) {
      updateData.helpfulCount = article.helpfulCount + 1;
    } else {
      updateData.notHelpfulCount = article.notHelpfulCount + 1;
    }

    await ctx.db.patch(args.articleId as Id<"knowledgeBaseArticles">, updateData);

    return {
      success: true,
      message: "Feedback recorded",
    };
  },
});

/**
 * Increment view count on an article
 */
export const recordArticleView = mutation({
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

    await ctx.db.patch(args.articleId as Id<"knowledgeBaseArticles">, {
      viewCount: article.viewCount + 1,
    });

    return { success: true };
  },
});
