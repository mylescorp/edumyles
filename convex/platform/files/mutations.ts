import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

export const generateUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFileMetadata = mutation({
  args: {
    sessionToken: v.string(),
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) throw new Error("Failed to get file URL from storage");

    const fileId = await ctx.db.insert("platformFiles", {
      tenantId: session.tenantId,
      uploadedBy: session.userId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      storageId: args.storageId,
      fileUrl,
      category: args.category,
      createdAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "user.updated",
      entityType: "file",
      entityId: fileId,
      after: { fileName: args.fileName, category: args.category },
    });

    return { id: fileId, url: fileUrl };
  },
});

export const deleteFile = mutation({
  args: {
    sessionToken: v.string(),
    fileId: v.id("platformFiles"),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");

    // Delete from storage
    try {
      await ctx.storage.delete(file.storageId as any);
    } catch {
      // Storage deletion may fail if already deleted
    }

    await ctx.db.delete(args.fileId);

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "user.updated",
      entityType: "file",
      entityId: args.fileId,
      before: { fileName: file.fileName },
    });
  },
});
