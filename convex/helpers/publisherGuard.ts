import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "../_generated/server";

export interface PublisherContext {
  userId: string;
  email: string;
  publisherId: string;
  companyName: string;
  status: string;
  tier: string;
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

  if (publisher.status === "banned" || publisher.status === "suspended") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Publisher account is ${publisher.status}`,
    });
  }

  return {
    userId: session.userId,
    email: session.email || "",
    publisherId: String(publisher._id),
    companyName: publisher.companyName,
    status: publisher.status,
    tier: publisher.tier,
  };
}
