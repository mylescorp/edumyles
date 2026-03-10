/**
 * Role-Based Access Control (RBAC) System with WorkOS Integration
 * 
 * This module provides comprehensive RBAC functionality including:
 * - Permission definitions and checking
 * - Role-based route protection
 * - WorkOS SSO integration
 * - Resource-level access control
 * - Dynamic permission evaluation
 */

// Permission definitions
export const PERMISSIONS = {
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'user:manage',
  
  // Tenant Management
  TENANT_CREATE: 'tenant:create',
  TENANT_READ: 'tenant:read',
  TENANT_UPDATE: 'tenant:update',
  TENANT_DELETE: 'tenant:delete',
  TENANT_MANAGE: 'tenant:manage',
  TENANT_PROVISION: 'tenant:provision',
  
  // Ticket Management
  TICKET_CREATE: 'ticket:create',
  TICKET_READ: 'ticket:read',
  TICKET_UPDATE: 'ticket:update',
  TICKET_DELETE: 'ticket:delete',
  TICKET_ASSIGN: 'ticket:assign',
  TICKET_ESCALATE: 'ticket:escalate',
  TICKET_MANAGE: 'ticket:manage',
  
  // CRM Management
  CRM_READ: 'crm:read',
  CRM_CREATE: 'crm:create',
  CRM_UPDATE: 'crm:update',
  CRM_DELETE: 'crm:delete',
  CRM_MANAGE: 'crm:manage',
  PROPOSAL_CREATE: 'proposal:create',
  PROPOSAL_UPDATE: 'proposal:update',
  PROPOSAL_DELETE: 'proposal:delete',
  
  // Communications
  COMMUNICATION_CREATE: 'communication:create',
  COMMUNICATION_READ: 'communication:read',
  COMMUNICATION_UPDATE: 'communication:update',
  COMMUNICATION_DELETE: 'communication:delete',
  COMMUNICATION_SEND: 'communication:send',
  COMMUNICATION_MANAGE: 'communication:manage',
  
  // Billing & Payments
  BILLING_READ: 'billing:read',
  BILLING_CREATE: 'billing:create',
  BILLING_UPDATE: 'billing:update',
  BILLING_MANAGE: 'billing:manage',
  PAYMENT_PROCESS: 'payment:process',
  PAYMENT_REFUND: 'payment:refund',
  
  // Analytics & Reporting
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_CREATE: 'analytics:create',
  REPORTING_READ: 'reporting:read',
  REPORTING_CREATE: 'reporting:create',
  REPORTING_EXPORT: 'reporting:export',
  
  // Feature Flags
  FEATURE_FLAG_READ: 'feature_flag:read',
  FEATURE_FLAG_UPDATE: 'feature_flag:update',
  FEATURE_FLAG_MANAGE: 'feature_flag:manage',
  
  // System Administration
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_MONITOR: 'system:monitor',
  SYSTEM_AUDIT: 'system:audit',
  
  // Marketplace
  MARKETPLACE_READ: 'marketplace:read',
  MARKETPLACE_MANAGE: 'marketplace:manage',
  MARKETPLACE_APPROVE: 'marketplace:approve',
  
  // Staff Performance
  STAFF_PERFORMANCE_READ: 'staff_performance:read',
  STAFF_PERFORMANCE_MANAGE: 'staff_performance:manage',
  STAFF_PERFORMANCE_ASSESS: 'staff_performance:assess',
  
  // Impersonation
  IMPERSONATE_USER: 'impersonate:user',
  IMPERSONATE_TENANT: 'impersonate:tenant',
  
  // Super Admin
  ALL_ACCESS: 'all:access',
} as const;

// Role definitions with permissions
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  SUPPORT: 'support',
  VIEWER: 'viewer',
} as const;

// Role permission mapping
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Super Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],
  
  [ROLES.ADMIN]: [
    // User Management
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_MANAGE,
    
    // Tenant Management
    PERMISSIONS.TENANT_CREATE,
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.TENANT_UPDATE,
    PERMISSIONS.TENANT_MANAGE,
    PERMISSIONS.TENANT_PROVISION,
    
    // Ticket Management
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_UPDATE,
    PERMISSIONS.TICKET_ASSIGN,
    PERMISSIONS.TICKET_MANAGE,
    
    // CRM Management
    PERMISSIONS.CRM_READ,
    PERMISSIONS.CRM_CREATE,
    PERMISSIONS.CRM_UPDATE,
    PERMISSIONS.CRM_MANAGE,
    PERMISSIONS.PROPOSAL_CREATE,
    PERMISSIONS.PROPOSAL_UPDATE,
    
    // Communications
    PERMISSIONS.COMMUNICATION_CREATE,
    PERMISSIONS.COMMUNICATION_READ,
    PERMISSIONS.COMMUNICATION_UPDATE,
    PERMISSIONS.COMMUNICATION_SEND,
    PERMISSIONS.COMMUNICATION_MANAGE,
    
    // Billing & Payments
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_UPDATE,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.PAYMENT_PROCESS,
    
    // Analytics & Reporting
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_CREATE,
    PERMISSIONS.REPORTING_READ,
    PERMISSIONS.REPORTING_CREATE,
    PERMISSIONS.REPORTING_EXPORT,
    
    // Feature Flags
    PERMISSIONS.FEATURE_FLAG_READ,
    PERMISSIONS.FEATURE_FLAG_UPDATE,
    PERMISSIONS.FEATURE_FLAG_MANAGE,
    
    // Marketplace
    PERMISSIONS.MARKETPLACE_READ,
    PERMISSIONS.MARKETPLACE_MANAGE,
    
    // Staff Performance
    PERMISSIONS.STAFF_PERFORMANCE_READ,
    PERMISSIONS.STAFF_PERFORMANCE_MANAGE,
    PERMISSIONS.STAFF_PERFORMANCE_ASSESS,
    
    // System
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_MONITOR,
    PERMISSIONS.IMPERSONATE_USER,
  ],
  
  [ROLES.MANAGER]: [
    // User Management (limited)
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    
    // Tenant Management
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.TENANT_UPDATE,
    
    // Ticket Management
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_UPDATE,
    PERMISSIONS.TICKET_ASSIGN,
    PERMISSIONS.TICKET_ESCALATE,
    
    // CRM Management
    PERMISSIONS.CRM_READ,
    PERMISSIONS.CRM_CREATE,
    PERMISSIONS.CRM_UPDATE,
    PERMISSIONS.PROPOSAL_CREATE,
    PERMISSIONS.PROPOSAL_UPDATE,
    
    // Communications
    PERMISSIONS.COMMUNICATION_CREATE,
    PERMISSIONS.COMMUNICATION_READ,
    PERMISSIONS.COMMUNICATION_UPDATE,
    PERMISSIONS.COMMUNICATION_SEND,
    
    // Analytics & Reporting
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTING_READ,
    PERMISSIONS.REPORTING_EXPORT,
    
    // Staff Performance
    PERMISSIONS.STAFF_PERFORMANCE_READ,
    PERMISSIONS.STAFF_PERFORMANCE_ASSESS,
  ],
  
  [ROLES.AGENT]: [
    // Ticket Management
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_UPDATE,
    
    // CRM Management (limited)
    PERMISSIONS.CRM_READ,
    PERMISSIONS.CRM_CREATE,
    PERMISSIONS.PROPOSAL_CREATE,
    
    // Communications
    PERMISSIONS.COMMUNICATION_CREATE,
    PERMISSIONS.COMMUNICATION_READ,
    PERMISSIONS.COMMUNICATION_SEND,
    
    // Analytics & Reporting (limited)
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTING_READ,
  ],
  
  [ROLES.SUPPORT]: [
    // Ticket Management
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_UPDATE,
    PERMISSIONS.TICKET_ASSIGN,
    
    // Communications
    PERMISSIONS.COMMUNICATION_CREATE,
    PERMISSIONS.COMMUNICATION_READ,
    PERMISSIONS.COMMUNICATION_SEND,
    
    // Analytics & Reporting (limited)
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTING_READ,
  ],
  
  [ROLES.VIEWER]: [
    // Read-only permissions
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.CRM_READ,
    PERMISSIONS.COMMUNICATION_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTING_READ,
    PERMISSIONS.STAFF_PERFORMANCE_READ,
  ],
} as const;

// Resource types for fine-grained access control
export const RESOURCE_TYPES = {
  USER: 'user',
  TENANT: 'tenant',
  TICKET: 'ticket',
  CRM_DEAL: 'crm_deal',
  PROPOSAL: 'proposal',
  COMMUNICATION: 'communication',
  BILLING: 'billing',
  REPORT: 'report',
  FEATURE_FLAG: 'feature_flag',
  STAFF_PERFORMANCE: 'staff_performance',
} as const;

// Permission context interface
export interface PermissionContext {
  user: {
    id: string;
    role: keyof typeof ROLES;
    permissions: string[];
    tenantId?: string;
    department?: string;
    location?: string;
  };
  resource?: {
    type: keyof typeof RESOURCE_TYPES;
    id: string;
    ownerId?: string;
    tenantId?: string;
  };
  action: string;
}

// WorkOS integration types
export interface WorkOSUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  tenantId?: string;
  organizations: WorkOSOrganization[];
}

export interface WorkOSOrganization {
  id: string;
  name: string;
  domain: string;
  role: string;
}

export interface WorkOSConfig {
  clientId: string;
  apiKey: string;
  redirectUri: string;
  organizationId?: string;
}

/**
 * RBAC Service Class
 */
export class RBACService {
  private static instance: RBACService;
  private workOSConfig: WorkOSConfig | null = null;
  private userCache = new Map<string, WorkOSUser>();
  
  private constructor() {}
  
  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }
  
  /**
   * Initialize WorkOS configuration
   */
  initializeWorkOS(config: WorkOSConfig): void {
    this.workOSConfig = config;
  }
  
  /**
   * Check if user has specific permission
   */
  hasPermission(context: PermissionContext): boolean {
    const { user, action, resource } = context;
    
    // Super Admin has all permissions
    if (user.role === ROLES.SUPER_ADMIN) {
      return true;
    }
    
    // Check for ALL_ACCESS permission
    if (user.permissions.includes(PERMISSIONS.ALL_ACCESS)) {
      return true;
    }
    
    // Check direct permission
    if (user.permissions.includes(action)) {
      return true;
    }
    
    // Check role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    if (rolePermissions.includes(action)) {
      return true;
    }
    
    // Check resource-level permissions
    if (resource) {
      return this.checkResourcePermission(user, resource, action);
    }
    
    return false;
  }
  
  /**
   * Check resource-level permissions
   */
  private checkResourcePermission(
    user: PermissionContext['user'],
    resource: PermissionContext['resource'],
    action: string
  ): boolean {
    // User can access their own resources
    if (resource.type === RESOURCE_TYPES.USER && resource.ownerId === user.id) {
      return true;
    }
    
    // Tenant-based access control
    if (resource.tenantId && user.tenantId) {
      if (resource.tenantId === user.tenantId) {
        return this.checkTenantLevelPermission(user, action);
      }
    }
    
    return false;
  }
  
  /**
   * Check tenant-level permissions
   */
  private checkTenantLevelPermission(user: PermissionContext['user'], action: string): boolean {
    // Tenant admins have broader permissions within their tenant
    if (user.role === ROLES.ADMIN) {
      return true;
    }
    
    // Managers have moderate permissions
    if (user.role === ROLES.MANAGER) {
      const allowedActions = [
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_UPDATE,
        PERMISSIONS.TICKET_CREATE,
        PERMISSIONS.TICKET_READ,
        PERMISSIONS.TICKET_UPDATE,
        PERMISSIONS.CRM_READ,
        PERMISSIONS.CRM_CREATE,
        PERMISSIONS.COMMUNICATION_CREATE,
        PERMISSIONS.COMMUNICATION_READ,
        PERMISSIONS.ANALYTICS_READ,
      ];
      return allowedActions.includes(action as any);
    }
    
    return false;
  }
  
  /**
   * Get user permissions
   */
  getUserPermissions(userId: string): string[] {
    const user = this.userCache.get(userId);
    if (!user) {
      return [];
    }
    
    // Combine direct permissions with role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLES] || [];
    return [...new Set([...user.permissions, ...rolePermissions])];
  }
  
  /**
   * Cache user permissions
   */
  cacheUser(user: WorkOSUser): void {
    this.userCache.set(user.id, user);
  }
  
  /**
   * Clear user cache
   */
  clearUserCache(userId?: string): void {
    if (userId) {
      this.userCache.delete(userId);
    } else {
      this.userCache.clear();
    }
  }
  
  /**
   * WorkOS Authentication
   */
  async authenticateWithWorkOS(code: string): Promise<WorkOSUser> {
    if (!this.workOSConfig) {
      throw new Error('WorkOS not configured');
    }
    
    try {
      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);
      
      // Get user information from WorkOS
      const userInfo = await this.getWorkOSUserInfo(tokenResponse.access_token);
      
      // Map WorkOS user to our format
      const user: WorkOSUser = {
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.first_name,
        lastName: userInfo.last_name,
        role: this.mapWorkOSRole(userInfo.role),
        permissions: this.mapWorkOSPermissions(userInfo.permissions),
        organizations: userInfo.organizations,
      };
      
      // Cache user
      this.cacheUser(user);
      
      return user;
    } catch (error) {
      console.error('WorkOS authentication failed:', error);
      throw error;
    }
  }
  
  /**
   * Exchange authorization code for token
   */
  private async exchangeCodeForToken(code: string): Promise<{ access_token: string }> {
    const response = await fetch('https://api.workos.com/sso/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.workOSConfig!.apiKey}`,
      },
      body: JSON.stringify({
        client_id: this.workOSConfig!.clientId,
        client_secret: this.workOSConfig!.apiKey,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.workOSConfig!.redirectUri,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }
    
    return response.json();
  }
  
  /**
   * Get user info from WorkOS
   */
  private async getWorkOSUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://api.workos.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    return response.json();
  }
  
  /**
   * Map WorkOS role to our role system
   */
  private mapWorkOSRole(workOSRole: string): string {
    const roleMapping = {
      'admin': ROLES.ADMIN,
      'manager': ROLES.MANAGER,
      'agent': ROLES.AGENT,
      'support': ROLES.SUPPORT,
      'viewer': ROLES.VIEWER,
      'super_admin': ROLES.SUPER_ADMIN,
    };
    
    return roleMapping[workOSRole as keyof typeof roleMapping] || ROLES.VIEWER;
  }
  
  /**
   * Map WorkOS permissions to our permission system
   */
  private mapWorkOSPermissions(workOSPermissions: string[]): string[] {
    return workOSPermissions.map(perm => {
      const permissionMapping = {
        'user_management': PERMISSIONS.USER_MANAGE,
        'tenant_management': PERMISSIONS.TENANT_MANAGE,
        'ticket_management': PERMISSIONS.TICKET_MANAGE,
        'crm_management': PERMISSIONS.CRM_MANAGE,
        'communication_management': PERMISSIONS.COMMUNICATION_MANAGE,
        'billing_management': PERMISSIONS.BILLING_MANAGE,
        'analytics_access': PERMISSIONS.ANALYTICS_READ,
        'reporting_access': PERMISSIONS.REPORTING_READ,
        'system_administration': PERMISSIONS.SYSTEM_CONFIG,
      };
      
      return permissionMapping[perm as keyof typeof permissionMapping] || perm;
    });
  }
  
  /**
   * Create permission middleware
   */
  requirePermission(permission: string) {
    return (context: PermissionContext): boolean => {
      return this.hasPermission({
        ...context,
        action: permission,
      });
    };
  }
  
  /**
   * Create role middleware
   */
  requireRole(role: keyof typeof ROLES) {
    return (user: WorkOSUser): boolean => {
      return user.role === role;
    };
  }
  
  /**
   * Check if user can access route
   */
  canAccessRoute(user: WorkOSUser, route: string): boolean {
    const routePermissions = this.getRoutePermissions(route);
    
    return routePermissions.every(permission => 
      this.hasPermission({
        user: {
          id: user.id,
          role: user.role as keyof typeof ROLES,
          permissions: user.permissions,
        },
        action: permission,
      })
    );
  }
  
  /**
   * Get required permissions for route
   */
  private getRoutePermissions(route: string): string[] {
    const routePermissionMap = {
      '/platform/users': [PERMISSIONS.USER_READ],
      '/platform/users/create': [PERMISSIONS.USER_CREATE],
      '/platform/tenants': [PERMISSIONS.TENANT_READ],
      '/platform/tenants/create': [PERMISSIONS.TENANT_CREATE],
      '/platform/tickets': [PERMISSIONS.TICKET_READ],
      '/platform/tickets/create': [PERMISSIONS.TICKET_CREATE],
      '/platform/crm': [PERMISSIONS.CRM_READ],
      '/platform/crm/create': [PERMISSIONS.CRM_CREATE],
      '/platform/crm/proposals': [PERMISSIONS.PROPOSAL_CREATE],
      '/platform/communications': [PERMISSIONS.COMMUNICATION_READ],
      '/platform/communications/create': [PERMISSIONS.COMMUNICATION_CREATE],
      '/platform/billing': [PERMISSIONS.BILLING_READ],
      '/platform/analytics': [PERMISSIONS.ANALYTICS_READ],
      '/platform/feature-flags': [PERMISSIONS.FEATURE_FLAG_READ],
      '/platform/marketplace': [PERMISSIONS.MARKETPLACE_READ],
      '/platform/staff-performance': [PERMISSIONS.STAFF_PERFORMANCE_READ],
      '/platform/impersonation': [PERMISSIONS.IMPERSONATE_USER],
      '/platform/settings': [PERMISSIONS.SYSTEM_CONFIG],
    };
    
    return routePermissionMap[route] || [];
  }
}

// Export singleton instance
export const rbac = RBACService.getInstance();

// Utility functions
export const hasPermission = (permission: string, user?: WorkOSUser, resource?: any): boolean => {
  if (!user) return false;
  
  return rbac.hasPermission({
    user: {
      id: user.id,
      role: user.role as keyof typeof ROLES,
      permissions: user.permissions,
      tenantId: user.tenantId,
    },
    action: permission,
    resource,
  });
};

export const hasRole = (role: keyof typeof ROLES, user?: WorkOSUser): boolean => {
  if (!user) return false;
  return user.role === role;
};

export const canAccessRoute = (route: string, user?: WorkOSUser): boolean => {
  if (!user) return false;
  return rbac.canAccessRoute(user, route);
};

// React hook for RBAC
export const useRBAC = () => {
  const checkPermission = (permission: string, resource?: any) => {
    // This would typically get user from context
    // For now, return false as placeholder
    return false;
  };
  
  const checkRole = (role: keyof typeof ROLES) => {
    // This would typically get user from context
    // For now, return false as placeholder
    return false;
  };
  
  return {
    checkPermission,
    checkRole,
    hasPermission,
    hasRole,
    canAccessRoute,
  };
};
