"use client";

import { useAuth } from "./useAuth";

type Permission =
  | "students:read" | "students:write" | "students:delete"
  | "finance:read" | "finance:write" | "finance:approve"
  | "staff:read" | "staff:write"
  | "grades:read" | "grades:write"
  | "attendance:read" | "attendance:write"
  | "payroll:read" | "payroll:write" | "payroll:approve"
  | "library:read" | "library:write"
  | "transport:read" | "transport:write"
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

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  master_admin: ["platform:admin", "users:manage", "settings:write", "students:read", "students:write", "students:delete", "finance:read", "finance:write", "finance:approve", "staff:read", "staff:write", "grades:read", "grades:write", "attendance:read", "attendance:write", "payroll:read", "payroll:write", "payroll:approve", "library:read", "library:write", "transport:read", "transport:write", "reports:read", "settings:read", "platform:users:read", "platform:users:write", "platform:users:invite", "platform:users:suspend", "platform:users:delete", "platform:billing:read", "platform:billing:write", "platform:marketplace:read", "platform:marketplace:moderate", "platform:security:read", "platform:analytics:read"],
  super_admin: ["platform:admin", "users:manage", "settings:write", "settings:read", "reports:read", "platform:users:read", "platform:users:write", "platform:users:invite", "platform:users:suspend", "platform:billing:read", "platform:marketplace:read", "platform:marketplace:moderate", "platform:security:read", "platform:analytics:read"],
  platform_manager: ["platform:users:read", "platform:users:invite", "platform:marketplace:read", "platform:analytics:read", "reports:read"],
  support_agent: ["platform:users:read"],
  billing_admin: ["platform:users:read", "platform:billing:read", "platform:billing:write", "reports:read", "finance:read", "finance:write", "finance:approve"],
  marketplace_reviewer: ["platform:users:read", "platform:marketplace:read", "platform:marketplace:moderate", "reports:read"],
  content_moderator: ["platform:users:read", "platform:marketplace:read", "platform:marketplace:moderate"],
  analytics_viewer: ["platform:users:read", "platform:analytics:read", "reports:read"],
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
  partner: ["students:read", "finance:read", "reports:read"],
};

export function usePermissions() {
  const { role } = useAuth();

  const permissions = role ? (ROLE_PERMISSIONS[role] ?? []) : [];

  function hasPermission(permission: Permission): boolean {
    return permissions.includes(permission);
  }

  function hasAnyPermission(...perms: Permission[]): boolean {
    return perms.some((p) => permissions.includes(p));
  }

  function hasAllPermissions(...perms: Permission[]): boolean {
    return perms.every((p) => permissions.includes(p));
  }

  function hasRole(...roles: string[]): boolean {
    return role ? roles.includes(role) : false;
  }

  const isPlatformAdmin = hasRole(
    "master_admin",
    "super_admin",
    "platform_manager",
    "support_agent",
    "billing_admin",
    "marketplace_reviewer",
    "content_moderator",
    "analytics_viewer"
  );
  const isSchoolAdmin = hasRole("school_admin", "principal");
  const isStaff = hasRole("school_admin", "principal", "teacher", "bursar", "hr_manager", "librarian", "transport_manager");

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isPlatformAdmin,
    isSchoolAdmin,
    isStaff,
  };
}
