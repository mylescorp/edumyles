import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * Acknowledge a security threat
 */
export const acknowledgeThreat = mutation({
  args: {
    sessionToken: v.string(),
    threatId: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const threat = await ctx.db.get(args.threatId as Id<"threats">);
    if (!threat) {
      throw new Error("Threat not found");
    }

    await ctx.db.insert("threatAcknowledgements", {
      threatId: args.threatId,
      userId,
      notes: args.notes ?? "",
      acknowledgedAt: Date.now(),
      tenantId,
    });

    await ctx.db.patch(args.threatId as Id<"threats">, {
      status: "mitigating",
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Threat acknowledged successfully",
    };
  },
});

/**
 * Mitigate a security threat
 */
export const mitigateThreat = mutation({
  args: {
    sessionToken: v.string(),
    threatId: v.string(),
    mitigation: v.string(),
    preventRecurrence: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const threat = await ctx.db.get(args.threatId as Id<"threats">);
    if (!threat) {
      throw new Error("Threat not found");
    }

    await ctx.db.insert("threatMitigations", {
      threatId: args.threatId,
      action: args.mitigation,
      implementedBy: userId,
      implementedAt: Date.now(),
      effectiveness: "high",
      verified: false,
      tenantId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.threatId as Id<"threats">, {
      status: args.mitigation === "block_ip" ? "mitigating" : "resolved",
      mitigatedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // If blocking IP, add to blocked IPs list
    if (args.mitigation === "block_ip" && threat.source?.ip) {
      await ctx.db.insert("blockedIPs", {
        ip: threat.source.ip,
        reason: "Security threat mitigation",
        blockedBy: userId,
        blockedAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        threatId: args.threatId,
        tenantId,
      });
    }

    return {
      success: true,
      message: "Threat mitigated successfully",
    };
  },
});

/**
 * Block an IP address
 */
export const blockIP = mutation({
  args: {
    sessionToken: v.string(),
    ip: v.string(),
    reason: v.string(),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    await ctx.db.insert("blockedIPs", {
      ip: args.ip,
      reason: args.reason,
      blockedBy: userId,
      blockedAt: Date.now(),
      expiresAt: Date.now() + (args.duration ?? (24 * 60 * 60 * 1000)),
      tenantId,
    });

    return {
      success: true,
      message: "IP blocked successfully",
    };
  },
});

/**
 * Create a security incident
 */
export const createSecurityIncident = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    category: v.union(
      v.literal("unauthorized_access"),
      v.literal("data_breach"),
      v.literal("malware"),
      v.literal("phishing"),
      v.literal("denial_of_service"),
      v.literal("vulnerability"),
      v.literal("policy_violation"),
      v.literal("other")
    ),
    affectedSystems: v.array(v.string()),
    affectedTenants: v.optional(v.array(v.string())),
    assignee: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const incidentId = await ctx.db.insert("securityIncidents", {
      title: args.title,
      description: args.description,
      severity: args.severity,
      category: args.category,
      status: "open",
      affectedSystems: args.affectedSystems,
      affectedTenants: args.affectedTenants ?? [],
      discoveredAt: Date.now(),
      reportedAt: Date.now(),
      reportedBy: userId,
      assignee: args.assignee,
      tags: args.tags ?? [],
      tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      startTime: Date.now(),
      impactAssessment: {
        affectedUsers: 0,
        dataExposed: false,
        systemIntegrity: "unknown",
        businessImpact: "unknown",
      },
      mitigations: [],
    });

    await ctx.db.insert("securityIncidentTimeline", {
      incidentId,
      type: "status_change",
      message: "Security incident created and assigned to investigation team",
      metadata: {
        severity: args.severity,
        category: args.category,
      },
      createdBy: userId,
      tenantId,
      createdAt: Date.now(),
    });

    // Trigger automated response for critical incidents
    if (args.severity === "critical") {
      await ctx.db.insert("securityNotifications", {
        type: "critical_incident",
        title: `Critical Security Incident: ${args.title}`,
        message: `Critical security incident requires immediate attention`,
        incidentId,
        severity: "critical",
        status: "unread",
        sentTo: "security-team@edumyles.com",
        sentBy: userId,
        tenantId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("securityIncidentTimeline", {
        incidentId,
        type: "action",
        message: "Automated containment procedures initiated",
        metadata: {
          automated: true,
          procedures: ["account_lockout", "ip_blocking", "session_invalidation"],
        },
        createdBy: "security-system",
        tenantId,
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      incidentId,
      message: "Security incident created successfully",
    };
  },
});

/**
 * Update security incident
 */
export const updateSecurityIncident = mutation({
  args: {
    sessionToken: v.string(),
    incidentId: v.string(),
    updates: v.object({
      status: v.optional(v.union(v.literal("open"), v.literal("investigating"), v.literal("contained"), v.literal("resolved"), v.literal("closed"))),
      assignee: v.optional(v.string()),
      resolution: v.optional(v.string()),
      impactAssessment: v.optional(v.object({
        affectedUsers: v.number(),
        dataExposed: v.boolean(),
        systemIntegrity: v.string(),
        businessImpact: v.string(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const incident = await ctx.db.get(args.incidentId as Id<"securityIncidents">);
    if (!incident) {
      throw new Error("Security incident not found");
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.updates.status) {
      updateData.status = args.updates.status;
      if (args.updates.status === "resolved") {
        updateData.resolvedBy = userId;
      }
    }

    Object.keys(args.updates).forEach(key => {
      if (args.updates[key as keyof typeof args.updates] !== undefined) {
        updateData[key] = args.updates[key as keyof typeof args.updates];
      }
    });

    await ctx.db.patch(args.incidentId as Id<"securityIncidents">, updateData);

    await ctx.db.insert("securityIncidentTimeline", {
      incidentId: args.incidentId,
      type: "status_change",
      message: `Incident updated to ${args.updates.status ?? "modified"}`,
      metadata: args.updates,
      createdBy: userId,
      tenantId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: "Security incident updated successfully",
    };
  },
});

/**
 * Run vulnerability scan
 */
export const runVulnerabilityScan = mutation({
  args: {
    sessionToken: v.string(),
    scanType: v.union(v.literal("quick"), v.literal("standard"), v.literal("comprehensive")),
    targets: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const scanId = await ctx.db.insert("vulnerabilityScans", {
      type: args.scanType,
      status: "running",
      targets: args.targets ?? ["all"],
      initiatedBy: userId,
      startedAt: Date.now(),
      tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      vulnerabilitiesFound: 0,
      highRiskVulnerabilities: 0,
      mediumRiskVulnerabilities: 0,
      lowRiskVulnerabilities: 0,
    });

    // Simulated vulnerability detection results
    const vulnerabilities = [
      {
        id: "vuln_1",
        severity: "high" as const,
        category: "injection",
        title: "SQL Injection Vulnerability",
        description: "Potential SQL injection in user authentication endpoint",
        affectedSystem: "API Server",
        cveId: "CVE-2024-1234",
        riskScore: 8.5,
        recommendation: "Implement parameterized queries and input validation",
      },
      {
        id: "vuln_2",
        severity: "medium" as const,
        category: "xss",
        title: "Cross-Site Scripting (XSS)",
        description: "Reflected XSS vulnerability in search functionality",
        affectedSystem: "Web Application",
        cveId: "CVE-2024-1235",
        riskScore: 6.2,
        recommendation: "Implement input sanitization and output encoding",
      },
      {
        id: "vuln_3",
        severity: "low" as const,
        category: "configuration",
        title: "Weak Password Policy",
        description: "Password policy does not meet security best practices",
        affectedSystem: "Authentication System",
        riskScore: 3.1,
        recommendation: "Implement stronger password requirements and MFA",
      },
    ];

    await ctx.db.patch(scanId, {
      status: "completed",
      completedAt: Date.now(),
      vulnerabilitiesFound: vulnerabilities.length,
      highRiskVulnerabilities: vulnerabilities.filter(v => v.severity === "high").length,
      mediumRiskVulnerabilities: vulnerabilities.filter(v => v.severity === "medium").length,
      lowRiskVulnerabilities: vulnerabilities.filter(v => v.severity === "low").length,
      updatedAt: Date.now(),
    });

    for (const vulnerability of vulnerabilities) {
      await ctx.db.insert("vulnerabilities", {
        scanId,
        ...vulnerability,
        tenantId,
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      scanId,
      vulnerabilities: vulnerabilities.length,
      message: "Vulnerability scan completed successfully",
    };
  },
});
