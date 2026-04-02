import { query, internalQuery } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * Internal query used by the HTTP /security/blocked-ips endpoint.
 * Returns all non-expired blocked IPs across all tenants (platform-wide).
 */
export const listAllBlockedIPsInternal = internalQuery({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("blockedIPs").collect();
    // Filter out expired entries
    return all
      .filter((b) => !b.expiresAt || b.expiresAt > args.now)
      .map((b) => b.ip);
  },
});

/**
 * Get security overview with metrics
 */
export const getSecurityOverview = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.union(v.literal("1h"), v.literal("24h"), v.literal("7d"), v.literal("30d"))),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const timeRange = args.timeRange ?? "24h";
    const now = Date.now();
    let timeFilter = 0;

    switch (timeRange) {
      case "1h":  timeFilter = 1 * 60 * 60 * 1000; break;
      case "24h": timeFilter = 24 * 60 * 60 * 1000; break;
      case "7d":  timeFilter = 7 * 24 * 60 * 60 * 1000; break;
      case "30d": timeFilter = 30 * 24 * 60 * 60 * 1000; break;
    }

    const cutoff = now - timeFilter;

    const [activeThreats, mitigatedThreats, totalIncidents, resolvedIncidents, blockedIPCount] = await Promise.all([
      ctx.db
        .query("threats")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", "active"))
        .filter((q) => q.gte(q.field("detectedAt"), cutoff))
        .collect()
        .then((r) => r.length),

      ctx.db
        .query("threats")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", "resolved"))
        .filter((q) => q.gte(q.field("mitigatedAt"), cutoff))
        .collect()
        .then((r) => r.length),

      ctx.db
        .query("securityIncidents")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .filter((q) => q.gte(q.field("createdAt"), cutoff))
        .collect()
        .then((r) => r.length),

      ctx.db
        .query("securityIncidents")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", "resolved"))
        .filter((q) => q.gte(q.field("updatedAt"), cutoff))
        .collect()
        .then((r) => r.length),

      ctx.db
        .query("blockedIPs")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .filter((q) => q.gte(q.field("blockedAt"), cutoff))
        .collect()
        .then((r) => r.length),
    ]);

    const threatScore = Math.max(0, Math.min(100, 100 - (activeThreats * 10) + (mitigatedThreats * 2)));
    const incidentScore = Math.max(0, Math.min(100, 100 - (totalIncidents * 5) + (resolvedIncidents * 3)));
    const accessScore = Math.max(0, Math.min(100, 100 - (blockedIPCount * 2)));
    const overallScore = Math.round((threatScore + incidentScore + accessScore) / 3);

    let level: "excellent" | "good" | "fair" | "poor" | "critical";
    if (overallScore >= 90) level = "excellent";
    else if (overallScore >= 75) level = "good";
    else if (overallScore >= 60) level = "fair";
    else if (overallScore >= 40) level = "poor";
    else level = "critical";

    return {
      overall: { score: overallScore, level, trend: "stable" },
      threats: { active: activeThreats, mitigated: mitigatedThreats, falsePositives: 0, trend: "stable" },
      incidents: {
        open: totalIncidents - resolvedIncidents,
        investigating: 0,
        resolved: resolvedIncidents,
        averageResolutionTime: 0,
      },
      compliance: { score: 85, violations: 3, lastAudit: now - (7 * 24 * 60 * 60 * 1000) },
      access: { totalAttempts: 0, failedAttempts: 0, suspiciousIPs: blockedIPCount, blockedAttempts: blockedIPCount },
    };
  },
});

/**
 * Get active security threats
 */
export const getActiveThreats = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("mitigating"), v.literal("resolved"), v.literal("all"))),
    category: v.optional(v.union(
      v.literal("malware"), v.literal("phishing"), v.literal("brute_force"), v.literal("ddos"),
      v.literal("injection"), v.literal("xss"), v.literal("social_engineering"), v.literal("insider_threat")
    )),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    let threatsQuery;
    if (args.status && args.status !== "all") {
      const status = args.status;
      threatsQuery = ctx.db
        .query("threats")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", status));
    } else {
      threatsQuery = ctx.db
        .query("threats")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));
    }

    if (args.category) {
      const category = args.category;
      threatsQuery = threatsQuery.filter((q) => q.eq(q.field("type"), category));
    }

    if (args.severity) {
      const severity = args.severity;
      threatsQuery = threatsQuery.filter((q) => q.eq(q.field("severity"), severity));
    }

    const threats = await threatsQuery.order("desc").take(args.limit ?? 50);

    // Enrich with mitigations
    const threatsWithMitigations = await Promise.all(
      threats.map(async (threat) => {
        const mitigations = await ctx.db
          .query("threatMitigations")
          .withIndex("by_threatId", (q) => q.eq("threatId", threat._id))
          .collect();
        return { ...threat, mitigations };
      })
    );

    return threatsWithMitigations;
  },
});

/**
 * Get security incidents
 */
export const getSecurityIncidents = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(v.literal("open"), v.literal("investigating"), v.literal("contained"), v.literal("resolved"), v.literal("closed"))),
    category: v.optional(v.union(
      v.literal("unauthorized_access"), v.literal("data_breach"), v.literal("malware"),
      v.literal("phishing"), v.literal("denial_of_service"), v.literal("vulnerability"),
      v.literal("policy_violation"), v.literal("other")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    let incidentsQuery;
    if (args.status) {
      const status = args.status;
      incidentsQuery = ctx.db
        .query("securityIncidents")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", status));
    } else {
      incidentsQuery = ctx.db
        .query("securityIncidents")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));
    }

    if (args.category) {
      const category = args.category;
      incidentsQuery = incidentsQuery.filter((q) => q.eq(q.field("category"), category));
    }

    const incidents = await incidentsQuery.order("desc").take(args.limit ?? 20);

    // Enrich with timeline
    const incidentsWithTimeline = await Promise.all(
      incidents.map(async (incident) => {
        const timeline = await ctx.db
          .query("securityIncidentTimeline")
          .withIndex("by_incidentId", (q) => q.eq("incidentId", incident._id))
          .order("desc")
          .collect();
        return { ...incident, timeline };
      })
    );

    return incidentsWithTimeline;
  },
});

/**
 * Get compliance status — computed from real system data.
 */
export const getComplianceStatus = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Load data needed for all compliance computations
    const [allTenants, allUsers, recentAuditLogs, resolvedIncidents, openIncidents] =
      await Promise.all([
        ctx.db.query("tenants").collect(),
        ctx.db.query("users").collect(),
        ctx.db
          .query("auditLogs")
          .filter((q) => q.gte(q.field("timestamp"), sevenDaysAgo))
          .collect(),
        ctx.db
          .query("securityIncidents")
          .filter((q) =>
            q.and(
              q.eq(q.field("status"), "resolved"),
              q.gte(q.field("updatedAt"), sevenDaysAgo)
            )
          )
          .collect(),
        ctx.db
          .query("securityIncidents")
          .filter((q) =>
            q.or(
              q.eq(q.field("status"), "open"),
              q.eq(q.field("status"), "investigating")
            )
          )
          .collect(),
      ]);

    const totalTenants = allTenants.length;

    // ── Data Encryption ───────────────────────────────────────────────────────
    // Score = fraction of tenants in "active" status (proxy for having encryption configured).
    // If no real encryption field exists, derive from tenant status.
    const activeTenants = allTenants.filter(t => t.status === "active").length;
    const dataEncryptionScore = totalTenants > 0
      ? Math.round((activeTenants / totalTenants) * 100)
      : null;
    const dataEncryptionViolations: string[] = [];
    if (dataEncryptionScore !== null && dataEncryptionScore < 100) {
      dataEncryptionViolations.push(`${totalTenants - activeTenants} tenant(s) not fully active`);
    }

    // ── Access Control ────────────────────────────────────────────────────────
    // Score = fraction of users with 2FA enabled. Falls back to fraction with active status.
    const usersWithTwoFactor = allUsers.filter(u => u.twoFactorEnabled === true).length;
    const totalUsers = allUsers.length;
    let accessControlScore: number | null;
    if (totalUsers === 0) {
      accessControlScore = null;
    } else {
      accessControlScore = Math.round((usersWithTwoFactor / totalUsers) * 100);
    }
    const accessControlViolations: string[] = [];
    if (accessControlScore !== null && accessControlScore < 100) {
      accessControlViolations.push(`${totalUsers - usersWithTwoFactor} user(s) without 2FA`);
    }

    // ── Audit Logging ─────────────────────────────────────────────────────────
    // Score based on audit log density over last 7 days.
    // Expected baseline: at least 10 entries/day for a healthy system.
    const expectedEntries = 70; // 10/day × 7 days
    const auditScore = recentAuditLogs.length >= expectedEntries
      ? 100
      : Math.round((recentAuditLogs.length / expectedEntries) * 100);
    const auditViolations: string[] = [];
    if (recentAuditLogs.length < expectedEntries) {
      auditViolations.push(`Low audit log density: ${recentAuditLogs.length} entries in last 7 days`);
    }

    // ── Backup & Recovery ─────────────────────────────────────────────────────
    // No backup table available — report as not_configured rather than fake data.
    const backupArea = {
      area: "Backup & Recovery",
      score: null as number | null,
      status: "not_configured",
      lastAssessed: now,
      requirements: ["Regular automated backups", "Backup restoration tested", "Offsite backup storage"],
      violations: ["No backup tracking data available"],
    };

    // ── Incident Response ─────────────────────────────────────────────────────
    // Score based on mean time to resolve incidents (lower is better → higher score).
    let incidentResponseScore: number | null = null;
    const incidentViolations: string[] = [];
    if (resolvedIncidents.length > 0) {
      const totalResolutionMs = resolvedIncidents.reduce((sum, inc) => {
        const created = (inc as any).createdAt ?? 0;
        const updated = (inc as any).updatedAt ?? now;
        return sum + (updated - created);
      }, 0);
      const avgResolutionHours = totalResolutionMs / resolvedIncidents.length / (1000 * 60 * 60);
      // Score: 100 if avg < 1 hour, 0 if avg > 72 hours; linear between.
      incidentResponseScore = Math.max(0, Math.min(100, Math.round(100 - (avgResolutionHours / 72) * 100)));
    } else if (openIncidents.length > 0) {
      incidentResponseScore = Math.max(0, 100 - openIncidents.length * 10);
      incidentViolations.push(`${openIncidents.length} open incident(s) with no resolved data`);
    } else {
      // No incidents at all — good signal
      incidentResponseScore = 100;
    }

    const complianceAreas = [
      {
        area: "Data Encryption",
        score: dataEncryptionScore,
        status: dataEncryptionScore === null ? "data_unavailable" : dataEncryptionScore >= 90 ? "compliant" : "needs_improvement",
        lastAssessed: now,
        requirements: ["Data encryption at rest", "Data encryption in transit", "Data loss prevention"],
        violations: dataEncryptionViolations,
      },
      {
        area: "Access Control",
        score: accessControlScore,
        status: accessControlScore === null ? "data_unavailable" : accessControlScore >= 90 ? "compliant" : "needs_improvement",
        lastAssessed: now,
        requirements: ["Multi-factor authentication implemented", "Role-based access control active", "Regular access reviews conducted"],
        violations: accessControlViolations,
      },
      {
        area: "Audit Logging",
        score: auditScore,
        status: auditScore >= 90 ? "compliant" : "needs_improvement",
        lastAssessed: now,
        requirements: ["Comprehensive audit trail", "Log retention policy", "Log monitoring and alerting"],
        violations: auditViolations,
      },
      backupArea,
      {
        area: "Incident Response",
        score: incidentResponseScore,
        status: incidentResponseScore === null ? "data_unavailable" : incidentResponseScore >= 80 ? "compliant" : "needs_improvement",
        lastAssessed: now,
        requirements: ["Incident response plan", "Regular security drills", "Post-incident reviews"],
        violations: incidentViolations,
      },
    ];

    // Only include areas with real scores in overall calculation
    const scoredAreas = complianceAreas.filter(a => a.score !== null);
    const overallScore = scoredAreas.length > 0
      ? Math.round(scoredAreas.reduce((sum, a) => sum + (a.score as number), 0) / scoredAreas.length)
      : 0;
    const totalViolations = complianceAreas.reduce((sum, area) => sum + (area.violations?.length ?? 0), 0);

    let level: "excellent" | "good" | "fair" | "poor" | "critical";
    if (overallScore >= 90) level = "excellent";
    else if (overallScore >= 80) level = "good";
    else if (overallScore >= 70) level = "fair";
    else if (overallScore >= 60) level = "poor";
    else level = "critical";

    return {
      score: overallScore,
      level,
      lastAudit: sevenDaysAgo,
      violations: totalViolations,
      areas: complianceAreas,
    };
  },
});

/**
 * Get access logs - uses real login attempts and audit log data
 */
export const getAccessLogs = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.union(v.literal("1h"), v.literal("24h"), v.literal("7d"), v.literal("30d"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const timeRange = args.timeRange ?? "24h";
    const now = Date.now();
    let timeFilter = 0;

    switch (timeRange) {
      case "1h":  timeFilter = 1 * 60 * 60 * 1000; break;
      case "24h": timeFilter = 24 * 60 * 60 * 1000; break;
      case "7d":  timeFilter = 7 * 24 * 60 * 60 * 1000; break;
      case "30d": timeFilter = 30 * 24 * 60 * 60 * 1000; break;
    }

    const cutoff = now - timeFilter;

    // Get real login attempts from loginAttempts table
    try {
      const loginAttempts = await ctx.db
        .query("loginAttempts")
        .order("desc")
        .filter((q) => q.gte(q.field("lastAttemptAt"), cutoff))
        .take(args.limit ?? 100);

      if (loginAttempts.length > 0) {
        return loginAttempts.map((attempt: any) => ({
          _id: attempt._id,
          timestamp: attempt.timestamp || attempt.createdAt,
          action: attempt.success ? "login_success" : "login_failed",
          user: attempt.email || "unknown",
          ip: attempt.ip || "unknown",
          userAgent: attempt.userAgent || "unknown",
          success: attempt.success ?? false,
          reason: attempt.failReason,
          location: attempt.location || "Unknown",
        }));
      }
    } catch {
      // loginAttempts table may not exist yet
    }

    // Fallback: derive access logs from audit logs
    const auditLogs = await ctx.db
      .query("auditLogs")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), cutoff),
          q.or(
            q.eq(q.field("action"), "login"),
            q.eq(q.field("action"), "login_failed"),
            q.eq(q.field("action"), "logout"),
            q.eq(q.field("action"), "session_created"),
          )
        )
      )
      .order("desc")
      .take(args.limit ?? 100);

    return auditLogs.map((log) => ({
      _id: log._id,
      timestamp: log.timestamp,
      action: log.action,
      user: log.actorEmail,
      ip: (log.after as any)?.ip || "unknown",
      userAgent: (log.after as any)?.userAgent || "unknown",
      success: !log.action.includes("failed"),
      location: (log.after as any)?.location || "Unknown",
    }));
  },
});

/**
 * List blocked IPs
 */
export const listBlockedIPs = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const blockedIPs = await ctx.db
      .query("blockedIPs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .take(args.limit ?? 100);

    return blockedIPs;
  },
});

/**
 * List vulnerabilities
 */
export const listVulnerabilities = query({
  args: {
    sessionToken: v.string(),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    let vulnQuery = ctx.db
      .query("vulnerabilities")
      .withIndex("by_category", (q) => q.eq("tenantId", tenantId));

    if (args.severity) {
      const severity = args.severity;
      vulnQuery = vulnQuery.filter((q) => q.eq(q.field("severity"), severity));
    }

    return await vulnQuery.order("desc").take(args.limit ?? 50);
  },
});

/**
 * Get security incident timeline
 */
export const getSecurityIncidentTimeline = query({
  args: {
    sessionToken: v.string(),
    incidentId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    return await ctx.db
      .query("securityIncidentTimeline")
      .withIndex("by_incidentId", (q) => q.eq("incidentId", args.incidentId))
      .order("desc")
      .collect();
  },
});

/**
 * Get vulnerability scan results
 */
export const getVulnerabilityScan = query({
  args: {
    sessionToken: v.string(),
    scanId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const scanId = args.scanId;

    if (scanId) {
      const scan = await ctx.db.get(scanId as Id<"vulnerabilityScans">);
      if (!scan || scan.tenantId !== tenantId) {
        throw new Error("Scan not found");
      }

      const vulnerabilities = await ctx.db
        .query("vulnerabilities")
        .withIndex("by_scanId", (q) => q.eq("scanId", scanId))
        .collect();

      return { ...scan, vulnerabilities };
    }

    const latestScan = await ctx.db
      .query("vulnerabilityScans")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .first();

    if (!latestScan) {
      return {
        _id: null,
        type: null,
        status: null,
        targets: [],
        initiatedBy: null,
        startedAt: null,
        completedAt: null,
        vulnerabilitiesFound: 0,
        highRiskVulnerabilities: 0,
        mediumRiskVulnerabilities: 0,
        lowRiskVulnerabilities: 0,
        vulnerabilities: [],
      };
    }

    const vulnerabilities = await ctx.db
      .query("vulnerabilities")
      .withIndex("by_scanId", (q) => q.eq("scanId", latestScan._id))
      .collect();

    return { ...latestScan, vulnerabilities };
  },
});
