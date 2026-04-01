"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";
import { AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
  | "platform:admin";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: Permission;
  fallbackPath?: string;
  showUnauthorizedMessage?: boolean;
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallbackPath = "/auth/login/api",
  showUnauthorizedMessage = true 
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { hasRole, hasPermission } = usePermissions();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth to load
      if (isLoading) return;

      // If not authenticated, replace history entry so back button cannot return
      if (!isAuthenticated) {
        const currentPath = window.location.pathname;
        const returnUrl = encodeURIComponent(currentPath);
        router.replace(`${fallbackPath}?returnUrl=${returnUrl}`);
        return;
      }

      // Check role requirements
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const hasRequiredRole = roles.some(role => hasRole(role));
        
        if (!hasRequiredRole) {
          console.warn(`Access denied. Required roles: ${roles.join(", ")}, User role: ${user?.role}`);
          if (showUnauthorizedMessage) {
            setIsChecking(false);
            return;
          } else {
            router.replace("/unauthorized");
            return;
          }
        }
      }

      // Check permission requirements
      if (requiredPermission) {
        if (!hasPermission(requiredPermission)) {
          console.warn(`Access denied. Required permission: ${requiredPermission}`);
          if (showUnauthorizedMessage) {
            setIsChecking(false);
            return;
          } else {
            router.replace("/unauthorized");
            return;
          }
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isLoading, isAuthenticated, user, requiredRole, requiredPermission, hasRole, hasPermission, router, fallbackPath, showUnauthorizedMessage]);

  // Show loading while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user doesn't have required permissions
  if (requiredRole || requiredPermission) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = !requiredRole || roles.some(role => hasRole(role));
    const hasRequiredPermission = !requiredPermission || hasPermission(requiredPermission);

    if (!hasRequiredRole || !hasRequiredPermission) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="max-w-md w-full mx-4">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold">Access Denied</h1>
                <p className="text-muted-foreground">
                  You do not have permission to access this page.
                </p>
              </div>

              {requiredRole && (
                <Alert className="w-full">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This page requires one of the following roles:{" "}
                    <span className="font-medium">
                      {Array.isArray(requiredRole) ? requiredRole.join(", ") : requiredRole}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {requiredPermission && (
                <Alert className="w-full">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This page requires the following permission:{" "}
                    <span className="font-medium">{requiredPermission}</span>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col space-y-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="w-full"
                >
                  Go Back
                </Button>
                <Button 
                  onClick={() => router.push("/platform")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={logout}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}

// Higher-order component for easier usage
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

// Hook for programmatic auth checking
export function useAuthGuard() {
  const { user, isAuthenticated, logout } = useAuth();
  const { hasRole, hasPermission } = usePermissions();
  const router = useRouter();

  const checkAccess = (requiredRole?: string | string[], requiredPermission?: Permission) => {
    if (!isAuthenticated) {
      return false;
    }

    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.some(role => hasRole(role))) {
        return false;
      }
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return false;
    }

    return true;
  };

  const requireAccess = (requiredRole?: string | string[], requiredPermission?: Permission, fallbackPath?: string) => {
    if (!checkAccess(requiredRole, requiredPermission)) {
      if (fallbackPath) {
        router.replace(fallbackPath);
      } else {
        const currentPath = window.location.pathname;
        const returnUrl = encodeURIComponent(currentPath);
        router.replace(`/auth/login/api?returnUrl=${returnUrl}`);
      }
      return false;
    }
    return true;
  };

  return {
    checkAccess,
    requireAccess,
    isAuthenticated,
    user,
    logout
  };
}
