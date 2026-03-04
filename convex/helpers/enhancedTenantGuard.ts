/**
 * Enhanced Tenant Isolation Enforcement
 * Comprehensive security controls for multi-tenant architecture
 */

import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { requireTenantContext } from "./tenantGuard";
import { requirePermission } from "./authorize";
import { requireModule } from "./moduleGuard";

// Enhanced tenant context validation
export async function requireEnhancedTenantContext(ctx: QueryCtx | MutationCtx) {
  const tenant = await requireTenantContext(ctx);
  
  // Validate tenant is active
  if (tenant.status !== 'active') {
    throw new Error("Tenant is not active");
  }
  
  // Validate tenant subscription
  if (tenant.subscription && tenant.subscription.status !== 'active') {
    throw new Error("Tenant subscription is not active");
  }
  
  // Check tenant rate limits
  await checkTenantRateLimits(ctx, tenant.tenantId);
  
  return tenant;
}

// Tenant isolation enforcement for queries
export function enforceTenantIsolation<T extends Record<string, any>>(
  ctx: QueryCtx,
  query: any,
  tenantId: string
) {
  // Ensure query is filtered by tenant
  const filteredQuery = query.filter((q: any) => 
    q.eq(q.field("tenantId"), tenantId)
  );
  
  return filteredQuery;
}

// Tenant isolation enforcement for mutations
export function enforceTenantDataIsolation(
  ctx: MutationCtx,
  data: any,
  tenantId: string
) {
  // Ensure tenantId matches current tenant
  if (data.tenantId && data.tenantId !== tenantId) {
    throw new Error("Cross-tenant data access detected");
  }
  
  // Add tenantId to data if not present
  if (!data.tenantId) {
    data.tenantId = tenantId;
  }
  
  return data;
}

// Cross-tenant access prevention
export function preventCrossTenantAccess(
  ctx: QueryCtx | MutationCtx,
  targetTenantId: string,
  currentTenantId: string
) {
  if (targetTenantId !== currentTenantId) {
    // Log security violation
    logSecurityViolation(ctx, {
      type: "cross_tenant_access",
      targetTenantId,
      currentTenantId,
      timestamp: Date.now(),
    });
    
    throw new Error("Cross-tenant access not allowed");
  }
}

// Enhanced permission checking with tenant isolation
export async function requireTenantPermission(
  ctx: QueryCtx | MutationCtx,
  permission: string,
  resourceType?: string,
  resourceId?: string
) {
  const tenant = await requireEnhancedTenantContext(ctx);
  
  // Check basic permission
  requirePermission(tenant, permission);
  
  // Additional tenant-specific checks
  if (resourceType && resourceId) {
    await checkResourceOwnership(ctx, tenant.tenantId, resourceType, resourceId);
  }
  
  return tenant;
}

// Resource ownership validation
export async function checkResourceOwnership(
  ctx: QueryCtx | MutationCtx,
  tenantId: string,
  resourceType: string,
  resourceId: string
) {
  let resource;
  
  switch (resourceType) {
    case "student":
      resource = await ctx.db.get(resourceId as any);
      break;
    case "teacher":
      resource = await ctx.db.get(resourceId as any);
      break;
    case "assignment":
      resource = await ctx.db.get(resourceId as any);
      break;
    case "payment":
      resource = await ctx.db.get(resourceId as any);
      break;
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }
  
  if (!resource || resource.tenantId !== tenantId) {
    throw new Error("Resource not found or access denied");
  }
  
  return resource;
}

// Tenant rate limiting
export async function checkTenantRateLimits(ctx: QueryCtx | MutationCtx, tenantId: string) {
  const now = Date.now();
  const windowStart = now - (60 * 1000); // 1 minute window
  
  // Count requests in the last minute
  const recentRequests = await ctx.db
    .query("tenantRateLimits")
    .withIndex("by_tenant_time", (q) =>
      q.eq("tenantId", tenantId).gte("timestamp", windowStart)
    )
    .collect();
  
  const requestCount = recentRequests.length;
  const maxRequests = 1000; // Configurable per tenant
  
  if (requestCount >= maxRequests) {
    throw new Error("Rate limit exceeded");
  }
  
  // Record this request
  await ctx.db.insert("tenantRateLimits", {
    tenantId,
    timestamp: now,
    endpoint: ctx.request?.url || "unknown",
  });
}

// Security violation logging
export async function logSecurityViolation(
  ctx: QueryCtx | MutationCtx,
  violation: {
    type: string;
    targetTenantId?: string;
    currentTenantId?: string;
    timestamp: number;
    details?: any;
  }
) {
  await ctx.db.insert("securityViolations", {
    ...violation,
    severity: "high",
    resolved: false,
    createdAt: Date.now(),
  });
  
  // Also log to audit trail
  await ctx.db.insert("auditLogs", {
    action: "security.violation",
    entityType: "security",
    entityId: violation.type,
    tenantId: violation.currentTenantId || "system",
    actorId: "system",
    actorEmail: "system@edumyles.com",
    before: {},
    after: violation,
    createdAt: Date.now(),
  });
}

// Data access validation
export function validateDataAccess(
  ctx: QueryCtx | MutationCtx,
  data: any,
  tenantId: string,
  operation: 'read' | 'write' | 'delete'
) {
  // Remove any tenantId from input data for security
  if (data.tenantId) {
    delete data.tenantId;
  }
  
  // Validate sensitive fields
  const sensitiveFields = ['password', 'ssn', 'creditCard', 'bankAccount'];
  sensitiveFields.forEach(field => {
    if (data[field] && operation === 'read') {
      delete data[field];
    }
  });
  
  // Add tenant context for write operations
  if (operation === 'write' || operation === 'delete') {
    data.tenantId = tenantId;
  }
  
  return data;
}

// Input sanitization for security
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS and injection attempts
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[\x00-\x1F\x7F]/g, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Enhanced query builder with tenant isolation
export function buildTenantQuery(
  ctx: QueryCtx,
  tableName: string,
  tenantId: string
) {
  const query = ctx.db.query(tableName as any);
  return enforceTenantIsolation(ctx, query, tenantId);
}

// File access validation
export async function validateFileAccess(
  ctx: QueryCtx | MutationCtx,
  fileId: string,
  tenantId: string,
  operation: 'read' | 'write' | 'delete'
) {
  const file = await ctx.db.get(fileId as any);
  
  if (!file) {
    throw new Error("File not found");
  }
  
  if (file.tenantId !== tenantId) {
    await logSecurityViolation(ctx, {
      type: "cross_tenant_file_access",
      currentTenantId: tenantId,
      timestamp: Date.now(),
      details: { fileId, operation },
    });
    
    throw new Error("File access denied");
  }
  
  return file;
}

// API endpoint validation
export function validateApiEndpoint(
  ctx: QueryCtx | MutationCtx,
  endpoint: string,
  method: string,
  tenantId: string
) {
  // Define allowed endpoints per tenant
  const allowedEndpoints = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/student/profile',
    '/api/teacher/classes',
    '/api/parent/payments',
    '/api/admin/students',
  ];
  
  // Check if endpoint is allowed
  if (!allowedEndpoints.some(allowed => endpoint.startsWith(allowed))) {
    throw new Error("Endpoint not allowed");
  }
  
  return true;
}

// Session security validation
export async function validateSession(
  ctx: QueryCtx | MutationCtx,
  sessionId: string,
  tenantId: string
) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_session_id", (q) => q.eq("sessionId", sessionId))
    .first();
  
  if (!session || session.tenantId !== tenantId) {
    throw new Error("Invalid session");
  }
  
  // Check session expiration
  if (session.expiresAt < Date.now()) {
    throw new Error("Session expired");
  }
  
  return session;
}

// Enhanced audit logging for security events
export async function logSecurityEvent(
  ctx: QueryCtx | MutationCtx,
  event: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    tenantId: string;
    userId?: string;
    details?: any;
  }
) {
  await ctx.db.insert("securityEvents", {
    ...event,
    timestamp: Date.now(),
    resolved: false,
  });
  
  // Also log to audit trail
  await ctx.db.insert("auditLogs", {
    action: `security.${event.type}`,
    entityType: "security",
    entityId: event.type,
    tenantId: event.tenantId,
    actorId: event.userId || "system",
    actorEmail: "system@edumyles.com",
    before: {},
    after: event.details || {},
    createdAt: Date.now(),
  });
}

// Tenant data export validation
export async function validateDataExport(
  ctx: QueryCtx | MutationCtx,
  tenantId: string,
  dataTypes: string[]
) {
  // Check if tenant has permission to export data
  const tenant = await requireEnhancedTenantContext(ctx);
  
  if (!tenant.permissions?.includes('data_export')) {
    throw new Error("Data export not permitted");
  }
  
  // Validate requested data types
  const allowedDataTypes = ['students', 'teachers', 'assignments', 'payments'];
  const invalidTypes = dataTypes.filter(type => !allowedDataTypes.includes(type));
  
  if (invalidTypes.length > 0) {
    throw new Error(`Invalid data types: ${invalidTypes.join(', ')}`);
  }
  
  // Log export request
  await logSecurityEvent(ctx, {
    type: 'data_export_request',
    severity: 'medium',
    tenantId,
    details: { dataTypes },
  });
  
  return true;
}
