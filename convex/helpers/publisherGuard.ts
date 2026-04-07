import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "../_generated/server";

export interface PublisherContext {
  userId: string;
  email: string;
  publisherId: string;
  businessName: string;
  status: string;
  tier: "indie" | "verified" | "enterprise";
  publisher: any; // Full publisher document
}

export async function requirePublisherContext(
  ctx: QueryCtx | MutationCtx
): Promise<PublisherContext> {
  const identity = await ctx.auth.getUserIdentity();
  const tokenIdentifier = identity?.tokenIdentifier;

  if (!tokenIdentifier) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "No active session" });
  }

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("sessionToken", tokenIdentifier))
    .first();

  if (!session) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session not found" });
  }

  if (session.expiresAt < Date.now()) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session expired" });
  }

  const publisher = await ctx.db
    .query("publishers")
    .withIndex("by_userId", (q) => q.eq("userId", session.userId))
    .first();

  if (!publisher) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Publisher account not found" });
  }

  if (publisher.status !== "active") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Publisher account is ${publisher.status}`,
    });
  }

  return {
    userId: session.userId,
    email: session.email || "",
    publisherId: String(publisher._id),
    businessName: publisher.businessName,
    status: publisher.status,
    tier: publisher.tier,
    publisher,
  };
}

export function requireTier(publisher: any, minimumTier: "indie" | "verified" | "enterprise") {
  const tierOrder = ["indie", "verified", "enterprise"];
  if (tierOrder.indexOf(publisher.tier) < tierOrder.indexOf(minimumTier)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `This feature requires ${minimumTier} tier or above`,
    });
  }
}

export async function requirePublisherApplication(ctx: QueryCtx | MutationCtx): Promise<any> {
  const identity = await ctx.auth.getUserIdentity();
  const tokenIdentifier = identity?.tokenIdentifier;

  if (!tokenIdentifier) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "No active session" });
  }

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("sessionToken", tokenIdentifier))
    .first();

  if (!session) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session not found" });
  }

  const application = await ctx.db
    .query("publisherApplications")
    .withIndex("by_applicant", q => q.eq("applicantId", session.userId))
    .first();

  if (!application) {
    throw new ConvexError({ code: "NOT_FOUND", message: "No publisher application found" });
  }

  return application;
}
