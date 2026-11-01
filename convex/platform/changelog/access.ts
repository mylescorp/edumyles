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
  if (PLATFORM_ROLES.includes(normalizedRole) || session.tenantId === "PLATFORM" || platformUser) {
    const platform = await requirePlatformSession(ctx, { sessionToken });
    return { ...platform, workspaceId: "PLATFORM", panel: "platform", canSeeAllPanels: true };
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
          (entry.status === "scheduled" &&
            !!entry.scheduledAt &&
            entry.scheduledAt <= Date.now())) &&
        isVisibleTo(entry, context)
    )
    .sort((a: any, b: any) => b.date - a.date || b.createdAt - a.createdAt);
}

export async function visibleHistoryPage(
  ctx: any,
  context: any,
  paginationOpts: any,
  filters: { search?: string; types?: string[]; fromDate?: number; toDate?: number }
) {
  const result = await ctx.db
    .query("whatsNewGitHubHistory")
    .withIndex("by_kind_mergedAt", (q: any) => q.eq("kind", "pull_request"))
    .order("desc")
    .paginate(paginationOpts);
  return {
    ...result,
    page: result.page
      .filter(
        (record: any) =>
          !!record.displayTitle &&
          !!record.displayDescription &&
          !!record.type &&
          (!filters.types?.length || filters.types.includes(record.type)) &&
          (filters.fromDate === undefined || record.mergedAt >= filters.fromDate) &&
          (filters.toDate === undefined || record.mergedAt <= filters.toDate) &&
          (!filters.search ||
            [record.displayTitle, record.displayDescription, ...(record.tags ?? [])].some((value) =>
              value?.toLowerCase().includes(filters.search!.toLowerCase())
            )) &&
          isVisibleTo({ panels: record.panels?.length ? record.panels : ["platform"] }, context)
      )
      .map((record: any) => ({
        _id: record._id,
        groupKey: `history:${record._id}`,
        isRelease: false,
        version: "",
        title: record.displayTitle,
        description: record.displayDescription,
        type: record.type,
        tags: record.tags ?? [],
        date: record.mergedAt,
      })),
  };
}

export async function historyVisibleCount(ctx: any, context: any) {
  const key = context.canSeeAllPanels ? "all" : `panel:${context.panel}`;
  const stats = await ctx.db
    .query("whatsNewGitHubHistoryStats")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .unique();
  return stats?.count ?? 0;
}
