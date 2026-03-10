/**
 * React Hooks for RBAC (Role-Based Access Control)
 * 
 * This module provides React hooks for:
 * - Permission checking
 * - Role-based rendering
 * - Route protection
 * - WorkOS integration
 */

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  rbac, 
  PERMISSIONS, 
  ROLES, 
  PermissionContext, 
  WorkOSUser,
  hasPermission,
  hasRole,
  canAccessRoute
} from '@/lib/rbac';
import { workos, getCurrentWorkOSUser, isWorkOSAuthenticated } from '@/lib/workos';

// Context for RBAC
interface RBACContextType {
  user: WorkOSUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string, resource?: any) => boolean;
  hasRole: (role: keyof typeof ROLES) => boolean;
  canAccessRoute: (route: string) => boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const RBACContextValue = createContext<RBACContextType | undefined>(undefined);

// Props for RBAC Provider
interface RBACProviderProps {
  children: ReactNode;
  workOSConfig?: {
    clientId: string;
    apiKey: string;
    redirectUri: string;
    organizationId?: string;
    environment: 'production' | 'development';
  };
}

/**
 * RBAC Provider Component
 */
export function RBACProvider({ children, workOSConfig }: RBACProviderProps) {
  const [user, setUser] = useState<WorkOSUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize WorkOS if config provided
    if (workOSConfig) {
      workos.initialize(workOSConfig);
    }

    // Check authentication status
    const checkAuth = async () => {
      try {
        if (isWorkOSAuthenticated()) {
          const currentUser = getCurrentWorkOSUser();
          if (currentUser) {
            setUser(currentUser);
            // Sync user with database
            await workos.syncUserWithDatabase(currentUser);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [workOSConfig]);

  const hasPermission = (permission: string, resource?: any): boolean => {
    if (!user) return false;
    return rbac.hasPermission({
      user: {
        id: user.id,
        role: user.role as keyof typeof ROLES,
        permissions: user.permissions,
        tenantId: user.organizations[0]?.id,
      },
      action: permission,
      resource,
    });
  };

  const hasRole = (role: keyof typeof ROLES): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const canAccessRoute = (route: string): boolean => {
    if (!user) return false;
    return rbac.canAccessRoute(user, route);
  };

  const logout = () => {
    workos.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const currentUser = getCurrentWorkOSUser();
      if (currentUser) {
        setUser(currentUser);
        await workos.syncUserWithDatabase(currentUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: RBACContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    hasPermission,
    hasRole,
    canAccessRoute,
    logout,
    refreshUser,
  };

  return (
    <RBACContextValue.Provider value={value}>
      {children}
    </RBACContextValue.Provider>
  );
}

/**
 * Hook to use RBAC context
 */
export function useRBAC(): RBACContextType {
  const context = useContext(RBACContextValue);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
}

/**
 * Hook for permission-based rendering
 */
export function usePermission(permission: string, resource?: any) {
  const { hasPermission } = useRBAC();
  return hasPermission(permission, resource);
}

/**
 * Hook for role-based rendering
 */
export function useRole(role: keyof typeof ROLES) {
  const { hasRole } = useRBAC();
  return hasRole(role);
}

/**
 * Hook for route protection
 */
export function useRouteProtection(requiredPermissions?: string[], requiredRole?: keyof typeof ROLES) {
  const { user, isAuthenticated, hasPermission, hasRole } = useRBAC();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      router.push('/unauthorized');
      return;
    }

    if (requiredPermissions && !requiredPermissions.every(perm => hasPermission(perm))) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, requiredRole, requiredPermissions, hasPermission, hasRole, router]);

  return {
    user,
    isAuthenticated,
    isAuthorized: isAuthenticated && 
      (!requiredRole || hasRole(requiredRole)) && 
      (!requiredPermissions || requiredPermissions.every(perm => hasPermission(perm))),
  };
}

/**
 * Hook for WorkOS authentication
 */
export function useWorkOSAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const authenticate = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await workos.exchangeCodeForTokens(code);
      
      // Redirect to dashboard or intended page
      const returnUrl = sessionStorage.getItem('workos_return_url') || '/platform';
      sessionStorage.removeItem('workos_return_url');
      
      router.push(returnUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    // Store current URL for redirect after auth
    sessionStorage.setItem('workos_return_url', window.location.pathname);
    
    const authUrl = workos.getAuthorizationUrl();
    window.location.href = authUrl;
  };

  const logout = () => {
    workos.logout();
    router.push('/login');
  };

  return {
    authenticate,
    login,
    logout,
    isLoading,
    error,
  };
}

/**
 * Higher-order component for permission-based rendering
 */
export function withPermission<P extends object>(
  permission: string,
  resource?: any,
  fallback?: ReactNode
) {
  return function Component: React.ComponentType<P> {
    return function PermissionWrapper(props: P) {
      const { hasPermission } = useRBAC();
      
      if (!hasPermission(permission, resource)) {
        return <>{fallback || <div>Access Denied</div>}</>;
      }
      
      return <Component {...props} />;
    };
  };
}

/**
 * Higher-order component for role-based rendering
 */
export function withRole<P extends object>(
  role: keyof typeof ROLES,
  fallback?: ReactNode
) {
  return function Component: React.ComponentType<P> {
    return function RoleWrapper(props: P) {
      const { hasRole } = useRBAC();
      
      if (!hasRole(role)) {
        return <>{fallback || <div>Access Denied</div>}</>;
      }
      
      return <Component {...props} />;
    };
  };
}

/**
 * Component for conditional rendering based on permissions
 */
interface PermissionGateProps {
  permission: string;
  resource?: any;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ permission, resource, fallback, children }: PermissionGateProps) {
  const { hasPermission } = useRBAC();
  
  if (!hasPermission(permission, resource)) {
    return <>{fallback || null}</>;
  }
  
  return <>{children}</>;
}

/**
 * Component for conditional rendering based on roles
 */
interface RoleGateProps {
  role: keyof typeof ROLES;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ role, fallback, children }: RoleGateProps) {
  const { hasRole } = useRBAC();
  
  if (!hasRole(role)) {
    return <>{fallback || null}</>;
  }
  
  return <>{children}</>;
}

/**
 * Hook for checking multiple permissions
 */
export function usePermissions(permissions: string[], resource?: any) {
  const { hasPermission } = useRBAC();
  
  return {
    all: permissions.every(perm => hasPermission(perm, resource)),
    any: permissions.some(perm => hasPermission(perm, resource)),
    none: permissions.every(perm => !hasPermission(perm, resource)),
    permissions: permissions.map(perm => ({
      permission: perm,
      has: hasPermission(perm, resource),
    })),
  };
}

/**
 * Hook for user role hierarchy
 */
export function useRoleHierarchy() {
  const { user } = useRBAC();
  
  const getRoleLevel = (role: keyof typeof ROLES): number => {
    const hierarchy = {
      [ROLES.SUPER_ADMIN]: 5,
      [ROLES.ADMIN]: 4,
      [ROLES.MANAGER]: 3,
      [ROLES.AGENT]: 2,
      [ROLES.SUPPORT]: 2,
      [ROLES.VIEWER]: 1,
    };
    return hierarchy[role] || 0;
  };
  
  const canManageRole = (targetRole: keyof typeof ROLES): boolean => {
    if (!user) return false;
    
    const userLevel = getRoleLevel(user.role as keyof typeof ROLES);
    const targetLevel = getRoleLevel(targetRole);
    
    return userLevel > targetLevel;
  };
  
  const getManageableRoles = (): (keyof typeof ROLES)[] => {
    if (!user) return [];
    
    const userLevel = getRoleLevel(user.role as keyof typeof ROLES);
    
    return Object.values(ROLES).filter(role => 
      getRoleLevel(role) < userLevel
    ) as (keyof typeof ROLES)[];
  };
  
  return {
    getRoleLevel,
    canManageRole,
    getManageableRoles,
    isHigherRole: (role: keyof typeof ROLES) => 
      getRoleLevel(user?.role as keyof typeof ROLES) > getRoleLevel(role),
    isLowerRole: (role: keyof typeof ROLES) => 
      getRoleLevel(user?.role as keyof typeof ROLES) < getRoleLevel(role),
  };
}

/**
 * Hook for resource-based permissions
 */
export function useResourcePermissions(resourceType: string, resourceId?: string) {
  const { user, hasPermission } = useRBAC();
  
  const canCreate = hasPermission(`${resourceType}:create`);
  const canRead = hasPermission(`${resourceType}:read`);
  const canUpdate = hasPermission(`${resourceType}:update`);
  const canDelete = hasPermission(`${resourceType}:delete`);
  const canManage = hasPermission(`${resourceType}:manage`);
  
  // Check if user owns the resource (for self-service permissions)
  const isOwner = resourceId === user?.id;
  
  return {
    canCreate,
    canRead: canRead || isOwner,
    canUpdate: canUpdate || isOwner,
    canDelete: canDelete || isOwner,
    canManage,
    isOwner,
    all: canCreate && canRead && canUpdate && canDelete,
    any: canCreate || canRead || canUpdate || canDelete,
  };
}

/**
 * Hook for organization-based permissions
 */
export function useOrganizationPermissions() {
  const { user } = useRBAC();
  
  const canManageOrganization = () => {
    if (!user) return false;
    
    const organization = user.organizations[0];
    if (!organization) return false;
    
    return organization.role === 'admin' || organization.role === 'owner';
  };
  
  const canViewOrganization = () => {
    if (!user) return false;
    return user.organizations.length > 0;
  };
  
  const getOrganizationRole = () => {
    if (!user) return null;
    return user.organizations[0]?.role || null;
  };
  
  const getOrganizationPermissions = () => {
    if (!user) return [];
    return user.organizations[0]?.permissions || [];
  };
  
  return {
    canManageOrganization,
    canViewOrganization,
    getOrganizationRole,
    getOrganizationPermissions,
    organizations: user?.organizations || [],
  };
}

// Export commonly used permission groups
export const USER_PERMISSIONS = {
  READ: PERMISSIONS.USER_READ,
  CREATE: PERMISSIONS.USER_CREATE,
  UPDATE: PERMISSIONS.USER_UPDATE,
  DELETE: PERMISSIONS.USER_DELETE,
  MANAGE: PERMISSIONS.USER_MANAGE,
};

export const TENANT_PERMISSIONS = {
  READ: PERMISSIONS.TENANT_READ,
  CREATE: PERMISSIONS.TENANT_CREATE,
  UPDATE: PERMISSIONS.TENANT_UPDATE,
  DELETE: PERMISSIONS.TENANT_DELETE,
  MANAGE: PERMISSIONS.TENANT_MANAGE,
  PROVISION: PERMISSIONS.TENANT_PROVISION,
};

export const TICKET_PERMISSIONS = {
  READ: PERMISSIONS.TICKET_READ,
  CREATE: PERMISSIONS.TICKET_CREATE,
  UPDATE: PERMISSIONS.TICKET_UPDATE,
  DELETE: PERMISSIONS.TICKET_DELETE,
  ASSIGN: PERMISSIONS.TICKET_ASSIGN,
  ESCALATE: PERMISSIONS.TICKET_ESCALATE,
  MANAGE: PERMISSIONS.TICKET_MANAGE,
};

export const CRM_PERMISSIONS = {
  READ: PERMISSIONS.CRM_READ,
  CREATE: PERMISSIONS.CRM_CREATE,
  UPDATE: PERMISSIONS.CRM_UPDATE,
  DELETE: PERMISSIONS.CRM_DELETE,
  MANAGE: PERMISSIONS.CRM_MANAGE,
};

export const COMMUNICATION_PERMISSIONS = {
  READ: PERMISSIONS.COMMUNICATION_READ,
  CREATE: PERMISSIONS.COMMUNICATION_CREATE,
  UPDATE: PERMISSIONS.COMMUNICATION_UPDATE,
  DELETE: PERMISSIONS.COMMUNICATION_DELETE,
  SEND: PERMISSIONS.COMMUNICATION_SEND,
  MANAGE: PERMISSIONS.COMMUNICATION_MANAGE,
};
