import { requirePlatformSession } from "../../helpers/platformGuard";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { isVisibleTo } from "./visibility";
export { isVisibleTo } from "./visibility";

const PLATFORM_ROLES = [
  "master_admin",
  "super_admin",
  "platform_admin",
  "platform_manager",
  "support_agent",
  "billing_admin",
  "marketplace_reviewer",
  "content_moderator",
  "analytics_viewer",
];

export async function getFeedContext(ctx: any, sessionToken: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("sessionToken", sessionToken))
    .first();
  if (!session || session.expiresAt < Date.now())
    throw new Error("UNAUTHENTICATED: Invalid session");
  const user = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q: any) => q.eq("eduMylesUserId", session.userId))
    .first();
  const platformUserId = user?.workosUserId ?? session.userId;
  const platformUser = await ctx.db
    .query("platform_users")
    .withIndex("by_userId", (q: any) => q.eq("userId", platformUserId))
    .first();
  const normalizedRole = session.role === "platform_admin" ? "super_admin" : session.role;
  if (PLATFORM_ROLES.includes(normalizedRole) || platformUser) {
    const platform = await requirePlatformSession(ctx, { sessionToken });
    return { ...platform, workspaceId: "PLATFORM", panel: "platform", canSeeAllPanels: true };
  }
  // A WorkOS organization membership alone does not grant EduMyles platform access.
  // Older callbacks could nevertheless create a PLATFORM session with a tenant role;
  // keep shared shell queries safe for those sessions without exposing platform entries.
  if (session.tenantId === "PLATFORM") {
    return {
      userId: session.userId,
      email: session.email ?? "",
      role: normalizedRole,
      tenantId: "PLATFORM",
      workspaceId: "PLATFORM",
      panel: "unauthorized",
      canSeeAllPanels: false,
    };
  }
  const tenant = await requireTenantSession(ctx, { sessionToken });
  const panel =
    (
      {
        teacher: "teacher",
        student: "student",
        parent: "parent",
        alumni: "alumni",
        partner: "partner",
        developer: "developer",
        affiliate: "affiliate",
        reseller: "reseller",
      } as Record<string, string>
    )[tenant.role] ?? "admin";
  return { ...tenant, workspaceId: tenant.tenantId, panel, canSeeAllPanels: false };
}

export async function visibleEntries(ctx: any, context: any) {
  const entries = await ctx.db.query("changelogEntries").order("desc").collect();
  return entries
    .filter(
      (entry: any) =>
        (entry.status === undefined ||
          entry.status === "published" ||
          (entry.status === "scheduled" && !!entry.scheduledAt && entry.scheduledAt <= Date.now())) &&
        isVisibleTo(entry, context)
    )
    .sort((a: any, b: any) => b.date - a.date || b.createdAt - a.createdAt);
}
