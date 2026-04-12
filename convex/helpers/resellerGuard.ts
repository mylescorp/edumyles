import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "../_generated/server";

export interface ResellerContext {
  userId: string;
  email: string;
  resellerId: string;
  businessName: string;
  status: string;
  tier: "starter" | "silver" | "gold" | "platinum";
  applicantType: "reseller" | "affiliate";
  reseller: any; // Full reseller document
}

export async function requireResellerContext(
  ctx: QueryCtx | MutationCtx
): Promise<ResellerContext> {
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

  const reseller = await ctx.db
    .query("resellers")
    .withIndex("by_userId", (q) => q.eq("userId", session.userId))
    .first();

  if (!reseller) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Reseller account not found" });
  }

  if (reseller.applicantType !== "reseller") {
    throw new ConvexError({ code: "FORBIDDEN", message: "Not a reseller account" });
  }

  if (reseller.status !== "active") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Reseller account is ${reseller.status}`,
    });
  }

  return {
    userId: session.userId,
    email: session.email || "",
    resellerId: reseller.resellerId,
    businessName: reseller.businessName,
    status: reseller.status,
    tier: reseller.tier,
    applicantType: reseller.applicantType,
    reseller,
  };
}

export async function requireAffiliateContext(
  ctx: QueryCtx | MutationCtx
): Promise<ResellerContext> {
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

  const reseller = await ctx.db
    .query("resellers")
    .withIndex("by_userId", (q) => q.eq("userId", session.userId))
    .first();

  if (!reseller) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Account not found" });
  }

  if (reseller.status !== "active") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Account is ${reseller.status}`,
    });
  }

  return {
    userId: session.userId,
    email: session.email || "",
    resellerId: reseller.resellerId,
    businessName: reseller.businessName,
    status: reseller.status,
    tier: reseller.tier,
    applicantType: reseller.applicantType,
    reseller,
  };
}

export function requireTier(reseller: any, minimumTier: "starter" | "silver" | "gold" | "platinum") {
  const tierOrder = ["starter", "silver", "gold", "platinum"];
  if (tierOrder.indexOf(reseller.tier) < tierOrder.indexOf(minimumTier)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `This feature requires ${minimumTier} tier or above`,
    });
  }
}

export function requireCreationLimit(reseller: any, currentSchools: number) {
  const limits = {
    starter: 5,
    silver: 15,
    gold: 30,
    platinum: null,
  };

  const limit = limits[reseller.tier as keyof typeof limits];
  if (limit !== null && currentSchools >= limit) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Creation limit reached for ${reseller.tier} tier (${limit} schools)`,
    });
  }
}

export async function requireResellerApplication(ctx: QueryCtx | MutationCtx): Promise<any> {
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
    .query("resellerApplications")
    .withIndex("by_applicant", q => q.eq("applicantId", session.userId))
    .first();

  if (!application) {
    throw new ConvexError({ code: "NOT_FOUND", message: "No reseller application found" });
  }

  return application;
}
