import { ConvexError } from "convex/values";
import { TenantContext } from "./tenantGuard";

export type Role =
  | "master_admin"
  | "super_admin"
  | "platform_manager"
  | "support_agent"
  | "billing_admin"
  | "marketplace_reviewer"
  | "content_moderator"
  | "analytics_viewer"
  | "school_admin"
  | "principal"
  | "teacher"
  | "parent"
  | "student"
  | "bursar"
  | "hr_manager"
  | "librarian"
  | "transport_manager"
  | "board_member"
  | "alumni"
  | "partner"
  | "receptionist";

export type Permission =
  | "students:read" | "students:write" | "students:delete"
  | "finance:read" | "finance:write" | "finance:approve"
  | "staff:read" | "staff:write"
  | "grades:read" | "grades:write"
  | "attendance:read" | "attendance:write"
  | "payroll:read" | "payroll:write" | "payroll:approve"
  | "library:read" | "library:write" | "library:delete"
  | "transport:read" | "transport:write" | "transport:delete"
  | "timetable:read" | "timetable:write"
  | "communications:read" | "communications:write"
  | "communications:broadcast" | "communications:campaigns"
  | "communications:templates" | "communications:messaging"
  | "communications:analytics" | "communications:platform_broadcast"
  | "ewallet:read" | "ewallet:write" | "ewallet:approve"
  | "ecommerce:read" | "ecommerce:write" | "ecommerce:approve"
  | "reports:read"
  | "settings:read" | "settings:write"
  | "users:manage"
  | "platform:admin"
  | "platform:users:read"
  | "platform:users:write"
  | "platform:users:invite"
  | "platform:users:suspend"
  | "platform:users:delete"
  | "platform:billing:read"
  | "platform:billing:write"
  | "platform:marketplace:read"
  | "platform:marketplace:moderate"
  | "platform:security:read"
  | "platform:analytics:read";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  master_admin: ["platform:admin", "users:manage", "settings:write", "students:read", "students:write", "students:delete", "finance:read", "finance:write", "finance:approve", "staff:read", "staff:write", "grades:read", "grades:write", "attendance:read", "attendance:write", "payroll:read", "payroll:write", "payroll:approve", "library:read", "library:write", "library:delete", "transport:read", "transport:write", "transport:delete", "ewallet:read", "ewallet:write", "ewallet:approve", "ecommerce:read", "ecommerce:write", "ecommerce:approve", "reports:read", "settings:read", "communications:read", "communications:write", "communications:broadcast", "communications:campaigns", "communications:templates", "communications:messaging", "communications:analytics", "communications:platform_broadcast"],
  super_admin: ["platform:admin", "users:manage", "settings:write", "settings:read", "reports:read", "communications:read", "communications:write", "communications:broadcast", "communications:campaigns", "communications:templates", "communications:messaging", "communications:analytics", "communications:platform_broadcast", "ewallet:approve", "ecommerce:approve", "platform:users:read", "platform:users:write", "platform:users:invite", "platform:users:suspend", "platform:billing:read", "platform:marketplace:read", "platform:marketplace:moderate", "platform:security:read", "platform:analytics:read"],
  platform_manager: ["platform:users:read", "platform:users:invite", "platform:marketplace:read", "platform:analytics:read", "reports:read", "communications:read", "communications:write", "communications:broadcast"],
  support_agent: ["platform:users:read", "communications:read", "communications:write", "communications:messaging"],
  billing_admin: ["platform:users:read", "platform:billing:read", "platform:billing:write", "reports:read", "finance:read", "finance:write", "finance:approve"],
  marketplace_reviewer: ["platform:users:read", "platform:marketplace:read", "platform:marketplace:moderate", "reports:read"],
  content_moderator: ["platform:users:read", "platform:marketplace:read", "platform:marketplace:moderate"],
  analytics_viewer: ["platform:users:read", "platform:analytics:read", "reports:read"],
  school_admin: ["users:manage", "settings:write", "settings:read", "students:read", "students:write", "staff:read", "staff:write", "finance:read", "reports:read", "attendance:read", "grades:read", "communications:read", "communications:write", "communications:broadcast", "communications:campaigns", "communications:templates", "communications:messaging", "communications:analytics", "ewallet:approve", "ecommerce:approve"],
  principal: ["students:read", "staff:read", "grades:read", "grades:write", "attendance:read", "attendance:write", "reports:read", "settings:read", "finance:read", "communications:read", "communications:write", "communications:broadcast", "communications:messaging"],
  teacher: ["students:read", "grades:read", "grades:write", "attendance:read", "attendance:write", "communications:read", "communications:messaging"],
  parent: ["students:read", "grades:read", "attendance:read", "finance:read", "communications:read", "communications:messaging"],
  student: ["grades:read", "attendance:read", "communications:read", "communications:messaging"],
  bursar: ["finance:read", "finance:write", "finance:approve", "ewallet:read", "ewallet:write", "ewallet:approve", "ecommerce:read", "ecommerce:approve", "reports:read", "communications:read", "communications:messaging"],
  hr_manager: ["staff:read", "staff:write", "payroll:read", "payroll:write", "reports:read", "communications:read", "communications:write", "communications:messaging"],
  librarian: ["library:read", "library:write", "library:delete", "students:read", "communications:read", "communications:messaging"],
  transport_manager: ["transport:read", "transport:write", "transport:delete", "students:read", "communications:read", "communications:messaging"],
  board_member: ["reports:read", "finance:read", "students:read", "communications:read"],
  alumni: ["grades:read", "reports:read", "attendance:read", "communications:read"],
  partner: ["students:read", "finance:read", "reports:read", "communications:read", "communications:messaging"],
  receptionist: ["students:read", "communications:read", "communications:messaging"],
};

function normalizeRole(role: string): Role | null {
  if (role === "platform_admin") {
    return "super_admin";
  }
  return role in ROLE_PERMISSIONS ? (role as Role) : null;
}

export function requirePermission(
  ctx: TenantContext,
  permission: Permission
): void {
  if (ctx.permissions.includes("*")) {
    return;
  }
  const normalizedRole = normalizeRole(ctx.role);
  const permissions = normalizedRole ? ROLE_PERMISSIONS[normalizedRole] ?? [] : [];
  if (!permissions.includes(permission)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Role '${ctx.role}' lacks permission '${permission}'`,
    });
  }
}

export function requireRole(
  ctx: TenantContext,
  ...roles: Role[]
): void {
  const normalizedRole = normalizeRole(ctx.role);
  if (!normalizedRole || !roles.includes(normalizedRole)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Required role(s) [${roles.join(", ")}], got '${ctx.role}'`,
    });
  }
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
