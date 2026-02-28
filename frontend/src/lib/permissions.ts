// ============================================================
// EduMyles — Client-Side Permission Mirror
// Mirrors the server-side RBAC from convex/helpers/authorize.ts
// ============================================================

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
  | "students:read"
  | "students:write"
  | "students:delete"
  | "finance:read"
  | "finance:write"
  | "finance:approve"
  | "staff:read"
  | "staff:write"
  | "grades:read"
  | "grades:write"
  | "attendance:read"
  | "attendance:write"
  | "payroll:read"
  | "payroll:write"
  | "payroll:approve"
  | "library:read"
  | "library:write"
  | "transport:read"
  | "transport:write"
  | "reports:read"
  | "settings:read"
  | "settings:write"
  | "users:manage"
  | "platform:admin";

/**
 * Role-to-permission mapping. Kept in sync with the server-side
 * ROLE_PERMISSIONS in convex/helpers/authorize.ts.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  master_admin: [
    "platform:admin",
    "users:manage",
    "settings:write",
    "settings:read",
    "students:read",
    "students:write",
    "students:delete",
    "finance:read",
    "finance:write",
    "finance:approve",
    "staff:read",
    "staff:write",
    "grades:read",
    "grades:write",
    "attendance:read",
    "attendance:write",
    "payroll:read",
    "payroll:write",
    "payroll:approve",
    "library:read",
    "library:write",
    "transport:read",
    "transport:write",
    "reports:read",
  ],
  super_admin: [
    "platform:admin",
    "users:manage",
    "settings:write",
    "settings:read",
    "reports:read",
  ],
  school_admin: [
    "users:manage",
    "settings:write",
    "settings:read",
    "students:read",
    "students:write",
    "staff:read",
    "staff:write",
    "finance:read",
    "reports:read",
    "attendance:read",
    "grades:read",
  ],
  principal: [
    "students:read",
    "staff:read",
    "grades:read",
    "grades:write",
    "attendance:read",
    "attendance:write",
    "reports:read",
    "settings:read",
    "finance:read",
  ],
  teacher: [
    "students:read",
    "grades:read",
    "grades:write",
    "attendance:read",
    "attendance:write",
  ],
  parent: [
    "students:read",
    "grades:read",
    "attendance:read",
    "finance:read",
  ],
  student: [
    "grades:read",
    "attendance:read",
  ],
  bursar: [
    "finance:read",
    "finance:write",
    "finance:approve",
    "reports:read",
  ],
  hr_manager: [
    "staff:read",
    "staff:write",
    "payroll:read",
    "payroll:write",
    "reports:read",
  ],
  librarian: [
    "library:read",
    "library:write",
    "students:read",
  ],
  transport_manager: [
    "transport:read",
    "transport:write",
    "students:read",
  ],
  board_member: [
    "reports:read",
    "finance:read",
    "students:read",
  ],
  alumni: [
    "grades:read",
    "reports:read",
    "attendance:read",
  ],
  partner: [
    "students:read",
    "finance:read",
    "reports:read",
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role as Role];
  if (!permissions) return false;
  return permissions.includes(permission as Permission);
}

/**
 * Check if a role has at least one of the given permissions.
 */
export function hasAnyPermission(role: string, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role.
 * Returns an empty array for unknown roles.
 */
export function getAllPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as Role] ?? [];
}
