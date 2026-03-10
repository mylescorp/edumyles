/**
 * RBAC Guard Components
 * 
 * These components provide route protection and conditional rendering
 * based on user roles and permissions
 */

import { ReactNode } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { ROLES, PERMISSIONS } from '@/lib/rbac';

interface RBACGuardProps {
  children: ReactNode;
  permissions?: string[];
  roles?: (keyof typeof ROLES)[];
  fallback?: ReactNode;
  requireAll?: boolean; // Require all permissions/roles vs any
}

/**
 * Main RBAC Guard Component
 * Protects content based on permissions and/or roles
 */
export function RBACGuard({ 
  children, 
  permissions, 
  roles, 
  fallback = null, 
  requireAll = true 
}: RBACGuardProps) {
  const { user, isAuthenticated, hasPermission, hasRole } = useRBAC();

  // Not authenticated
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check permissions
  if (permissions && permissions.length > 0) {
    const permissionCheck = requireAll
      ? permissions.every(perm => hasPermission(perm))
      : permissions.some(perm => hasPermission(perm));
    
    if (!permissionCheck) {
      return <>{fallback}</>;
    }
  }

  // Check roles
  if (roles && roles.length > 0) {
    const roleCheck = requireAll
      ? roles.every(role => hasRole(role))
      : roles.some(role => hasRole(role));
    
    if (!roleCheck) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Permission Guard - Checks only permissions
 */
interface PermissionGuardProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const { hasPermission } = useRBAC();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Role Guard - Checks only roles
 */
interface RoleGuardProps {
  children: ReactNode;
  role: keyof typeof ROLES;
  fallback?: ReactNode;
}

export function RoleGuard({ children, role, fallback = null }: RoleGuardProps) {
  const { hasRole } = useRBAC();
  
  if (!hasRole(role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Super Admin Guard - Only allows super admins
 */
interface SuperAdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SuperAdminGuard({ children, fallback = null }: SuperAdminGuardProps) {
  const { hasRole } = useRBAC();
  
  if (!hasRole(ROLES.SUPER_ADMIN)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Admin Guard - Allows admins and super admins
 */
interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminGuard({ children, fallback = null }: AdminGuardProps) {
  const { hasRole } = useRBAC();
  
  if (!hasRole(ROLES.ADMIN) && !hasRole(ROLES.SUPER_ADMIN)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Manager Guard - Allows managers, admins, and super admins
 */
interface ManagerGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ManagerGuard({ children, fallback = null }: ManagerGuardProps) {
  const { hasRole } = useRBAC();
  
  if (!hasRole(ROLES.MANAGER) && !hasRole(ROLES.ADMIN) && !hasRole(ROLES.SUPER_ADMIN)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * User Management Guard - For user management operations
 */
interface UserManagementGuardProps {
  children: ReactNode;
  action?: 'read' | 'create' | 'update' | 'delete' | 'manage';
  fallback?: ReactNode;
}

export function UserManagementGuard({ children, action = 'read', fallback = null }: UserManagementGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    read: PERMISSIONS.USER_READ,
    create: PERMISSIONS.USER_CREATE,
    update: PERMISSIONS.USER_UPDATE,
    delete: PERMISSIONS.USER_DELETE,
    manage: PERMISSIONS.USER_MANAGE,
  };
  
  if (!hasPermission(permissionMap[action])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Tenant Management Guard - For tenant management operations
 */
interface TenantManagementGuardProps {
  children: ReactNode;
  action?: 'read' | 'create' | 'update' | 'delete' | 'manage' | 'provision';
  fallback?: ReactNode;
}

export function TenantManagementGuard({ children, action = 'read', fallback = null }: TenantManagementGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    read: PERMISSIONS.TENANT_READ,
    create: PERMISSIONS.TENANT_CREATE,
    update: PERMISSIONS.TENANT_UPDATE,
    delete: PERMISSIONS.TENANT_DELETE,
    manage: PERMISSIONS.TENANT_MANAGE,
    provision: PERMISSIONS.TENANT_PROVISION,
  };
  
  if (!hasPermission(permissionMap[action])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Ticket Management Guard - For ticket operations
 */
interface TicketManagementGuardProps {
  children: ReactNode;
  action?: 'read' | 'create' | 'update' | 'delete' | 'assign' | 'escalate' | 'manage';
  fallback?: ReactNode;
}

export function TicketManagementGuard({ children, action = 'read', fallback = null }: TicketManagementGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    read: PERMISSIONS.TICKET_READ,
    create: PERMISSIONS.TICKET_CREATE,
    update: PERMISSIONS.TICKET_UPDATE,
    delete: PERMISSIONS.TICKET_DELETE,
    assign: PERMISSIONS.TICKET_ASSIGN,
    escalate: PERMISSIONS.TICKET_ESCALATE,
    manage: PERMISSIONS.TICKET_MANAGE,
  };
  
  if (!hasPermission(permissionMap[action])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * CRM Management Guard - For CRM operations
 */
interface CRMManagementGuardProps {
  children: ReactNode;
  action?: 'read' | 'create' | 'update' | 'delete' | 'manage';
  fallback?: ReactNode;
}

export function CRMManagementGuard({ children, action = 'read', fallback = null }: CRMManagementGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    read: PERMISSIONS.CRM_READ,
    create: PERMISSIONS.CRM_CREATE,
    update: PERMISSIONS.CRM_UPDATE,
    delete: PERMISSIONS.CRM_DELETE,
    manage: PERMISSIONS.CRM_MANAGE,
  };
  
  if (!hasPermission(permissionMap[action])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Communication Guard - For communication operations
 */
interface CommunicationGuardProps {
  children: ReactNode;
  action?: 'read' | 'create' | 'update' | 'delete' | 'send' | 'manage';
  fallback?: ReactNode;
}

export function CommunicationGuard({ children, action = 'read', fallback = null }: CommunicationGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    read: PERMISSIONS.COMMUNICATION_READ,
    create: PERMISSIONS.COMMUNICATION_CREATE,
    update: PERMISSIONS.COMMUNICATION_UPDATE,
    delete: PERMISSIONS.COMMUNICATION_DELETE,
    send: PERMISSIONS.COMMUNICATION_SEND,
    manage: PERMISSIONS.COMMUNICATION_MANAGE,
  };
  
  if (!hasPermission(permissionMap[action])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Billing Guard - For billing operations
 */
interface BillingGuardProps {
  children: ReactNode;
  action?: 'read' | 'create' | 'update' | 'manage' | 'process' | 'refund';
  fallback?: ReactNode;
}

export function BillingGuard({ children, action = 'read', fallback = null }: BillingGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    read: PERMISSIONS.BILLING_READ,
    create: PERMISSIONS.BILLING_CREATE,
    update: PERMISSIONS.BILLING_UPDATE,
    manage: PERMISSIONS.BILLING_MANAGE,
    process: PERMISSIONS.PAYMENT_PROCESS,
    refund: PERMISSIONS.PAYMENT_REFUND,
  };
  
  if (!hasPermission(permissionMap[action])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Analytics Guard - For analytics and reporting
 */
interface AnalyticsGuardProps {
  children: ReactNode;
  action?: 'read' | 'create' | 'export';
  type?: 'analytics' | 'reporting';
  fallback?: ReactNode;
}

export function AnalyticsGuard({ children, action = 'read', type = 'analytics', fallback = null }: AnalyticsGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    analytics: {
      read: PERMISSIONS.ANALYTICS_READ,
      create: PERMISSIONS.ANALYTICS_CREATE,
      export: PERMISSIONS.REPORTING_EXPORT,
    },
    reporting: {
      read: PERMISSIONS.REPORTING_READ,
      create: PERMISSIONS.REPORTING_CREATE,
      export: PERMISSIONS.REPORTING_EXPORT,
    },
  };
  
  if (!hasPermission(permissionMap[type][action as keyof typeof permissionMap.analytics])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Feature Flag Guard - For feature flag operations
 */
interface FeatureFlagGuardProps {
  children: ReactNode;
  action?: 'read' | 'update' | 'manage';
  fallback?: ReactNode;
}

export function FeatureFlagGuard({ children, action = 'read', fallback = null }: FeatureFlagGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    read: PERMISSIONS.FEATURE_FLAG_READ,
    update: PERMISSIONS.FEATURE_FLAG_UPDATE,
    manage: PERMISSIONS.FEATURE_FLAG_MANAGE,
  };
  
  if (!hasPermission(permissionMap[action])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Marketplace Guard - For marketplace operations
 */
interface MarketplaceGuardProps {
  children: ReactNode;
  action?: 'read' | 'manage' | 'approve';
  fallback?: ReactNode;
}

export function MarketplaceGuard({ children, action = 'read', fallback = null }: MarketplaceGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    read: PERMISSIONS.MARKETPLACE_READ,
    manage: PERMISSIONS.MARKETPLACE_MANAGE,
    approve: PERMISSIONS.MARKETPLACE_APPROVE,
  };
  
  if (!hasPermission(permissionMap[action])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Staff Performance Guard - For staff performance operations
 */
interface StaffPerformanceGuardProps {
  children: ReactNode;
  action?: 'read' | 'manage' | 'assess';
  fallback?: ReactNode;
}

export function StaffPerformanceGuard({ children, action = 'read', fallback = null }: StaffPerformanceGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    read: PERMISSIONS.STAFF_PERFORMANCE_READ,
    manage: PERMISSIONS.STAFF_PERFORMANCE_MANAGE,
    assess: PERMISSIONS.STAFF_PERFORMANCE_ASSESS,
  };
  
  if (!hasPermission(permissionMap[action])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Impersonation Guard - For impersonation operations
 */
interface ImpersonationGuardProps {
  children: ReactNode;
  action?: 'user' | 'tenant';
  fallback?: ReactNode;
}

export function ImpersonationGuard({ children, action = 'user', fallback = null }: ImpersonationGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    user: PERMISSIONS.IMPERSONATE_USER,
    tenant: PERMISSIONS.IMPERSONATE_TENANT,
  };
  
  if (!hasPermission(permissionMap[action])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * System Settings Guard - For system configuration
 */
interface SystemSettingsGuardProps {
  children: ReactNode;
  action?: 'config' | 'settings' | 'monitor' | 'audit';
  fallback?: ReactNode;
}

export function SystemSettingsGuard({ children, action = 'settings', fallback = null }: SystemSettingsGuardProps) {
  const { hasPermission } = useRBAC();
  
  const permissionMap = {
    config: PERMISSIONS.SYSTEM_CONFIG,
    settings: PERMISSIONS.SYSTEM_SETTINGS,
    monitor: PERMISSIONS.SYSTEM_MONITOR,
    audit: PERMISSIONS.SYSTEM_AUDIT,
  };
  
  if (!hasPermission(permissionMap[action])) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Access Denied Component
 */
interface AccessDeniedProps {
  message?: string;
  showBackButton?: boolean;
}

export function AccessDenied({ message = "Access Denied", showBackButton = true }: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">{message}</p>
        {showBackButton && (
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Unauthorized Page Component
 */
export function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Unauthorized</h1>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
        </p>
        <button
          onClick={() => window.location.href = '/platform'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
