import { TenantContext } from "./tenantGuard";

export type Role =
  | "master_admin"
  | "super_admin"
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
  | "partner";

export type Permission =
  | "students:read" | "students:write" | "students:delete"
  | "finance:read" | "finance:write" | "finance:approve"
  | "staff:read" | "staff:write"
  | "grades:read" | "grades:write"
  | "attendance:read" | "attendance:write"
  | "payroll:read" | "payroll:write" | "payroll:approve"
  | "library:read" | "library:write"
  | "transport:read" | "transport:write"
  | "timetable:read" | "timetable:write"
  | "communications:read" | "communications:write"
  | "ewallet:read" | "ewallet:write"
  | "ecommerce:read" | "ecommerce:write"
  | "reports:read"
  | "settings:read" | "settings:write"
  | "users:manage"
  | "platform:admin";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  master_admin: ["platform:admin", "users:manage", "settings:write", "students:read", "students:write", "students:delete", "finance:read", "finance:write", "finance:approve", "staff:read", "staff:write", "grades:read", "grades:write", "attendance:read", "attendance:write", "payroll:read", "payroll:write", "payroll:approve", "library:read", "library:write", "transport:read", "transport:write", "reports:read", "settings:read"],
  super_admin: ["platform:admin", "users:manage", "settings:write", "settings:read", "reports:read"],
  school_admin: ["users:manage", "settings:write", "settings:read", "students:read", "students:write", "staff:read", "staff:write", "finance:read", "reports:read", "attendance:read", "grades:read"],
  principal: ["students:read", "staff:read", "grades:read", "grades:write", "attendance:read", "attendance:write", "reports:read", "settings:read", "finance:read"],
  teacher: ["students:read", "grades:read", "grades:write", "attendance:read", "attendance:write"],
  parent: ["students:read", "grades:read", "attendance:read", "finance:read"],
  student: ["grades:read", "attendance:read"],
  bursar: ["finance:read", "finance:write", "finance:approve", "reports:read"],
  hr_manager: ["staff:read", "staff:write", "payroll:read", "payroll:write", "reports:read"],
  librarian: ["library:read", "library:write", "students:read"],
  transport_manager: ["transport:read", "transport:write", "students:read"],
  board_member: ["reports:read", "finance:read", "students:read"],
  alumni: ["grades:read", "reports:read", "attendance:read"],
  partner: ["students:read", "finance:read", "reports:read", "communications:read"],
};

export function requirePermission(
  ctx: TenantContext,
  permission: Permission
): void {
  const permissions = ROLE_PERMISSIONS[ctx.role as Role] ?? [];
  if (!permissions.includes(permission)) {
    throw new Error(
      `FORBIDDEN: Role '${ctx.role}' lacks permission '${permission}'`
    );
  }
}

export function requireRole(
  ctx: TenantContext,
  ...roles: Role[]
): void {
  if (!roles.includes(ctx.role as Role)) {
    throw new Error(
      `FORBIDDEN: Required role(s) [${roles.join(", ")}], got '${ctx.role}'`
    );
  }
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
