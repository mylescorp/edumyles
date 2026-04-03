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
  | "platform:admin"
  | "communications:read"
  | "communications:write"
  | "communications:broadcast"
  | "communications:campaigns"
  | "communications:templates"
  | "communications:messaging"
  | "communications:analytics"
  | "communications:platform_broadcast";

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
    "communications:read",
    "communications:write",
    "communications:broadcast",
    "communications:campaigns",
    "communications:templates",
    "communications:messaging",
    "communications:analytics",
    "communications:platform_broadcast",
  ],
  super_admin: [
    "platform:admin",
    "users:manage",
    "settings:write",
    "settings:read",
    "reports:read",
    "communications:read",
    "communications:write",
    "communications:broadcast",
    "communications:campaigns",
    "communications:templates",
    "communications:messaging",
    "communications:analytics",
    "communications:platform_broadcast",
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
    "communications:read",
    "communications:write",
    "communications:broadcast",
    "communications:campaigns",
    "communications:templates",
    "communications:messaging",
    "communications:analytics",
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
    "communications:read",
    "communications:write",
    "communications:broadcast",
    "communications:messaging",
  ],
  teacher: [
    "students:read",
    "grades:read",
    "grades:write",
    "attendance:read",
    "attendance:write",
    "communications:read",
    "communications:messaging",
  ],
  parent: [
    "students:read",
    "grades:read",
    "attendance:read",
    "finance:read",
    "communications:read",
    "communications:messaging",
  ],
  student: [
    "grades:read",
    "attendance:read",
    "communications:read",
    "communications:messaging",
  ],
  bursar: [
    "finance:read",
    "finance:write",
    "finance:approve",
    "reports:read",
    "communications:read",
    "communications:messaging",
  ],
  hr_manager: [
    "staff:read",
    "staff:write",
    "payroll:read",
    "payroll:write",
    "reports:read",
    "communications:read",
    "communications:write",
    "communications:messaging",
  ],
  librarian: [
    "library:read",
    "library:write",
    "students:read",
    "communications:read",
    "communications:messaging",
  ],
  transport_manager: [
    "transport:read",
    "transport:write",
    "students:read",
    "communications:read",
    "communications:messaging",
  ],
  board_member: [
    "reports:read",
    "finance:read",
    "students:read",
    "communications:read",
  ],
  alumni: [
    "grades:read",
    "reports:read",
    "attendance:read",
    "communications:read",
  ],
  partner: [
    "students:read",
    "finance:read",
    "reports:read",
    "communications:read",
    "communications:messaging",
  ],
};

function normalizeRole(role: string): Role | null {
  if (role === "platform_admin") {
    return "super_admin";
  }
  return role in ROLE_PERMISSIONS ? (role as Role) : null;
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string, permission: string): boolean {
  const normalizedRole = normalizeRole(role);
  const permissions = normalizedRole ? ROLE_PERMISSIONS[normalizedRole] : undefined;
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
  const normalizedRole = normalizeRole(role);
  return normalizedRole ? ROLE_PERMISSIONS[normalizedRole] ?? [] : [];
}
