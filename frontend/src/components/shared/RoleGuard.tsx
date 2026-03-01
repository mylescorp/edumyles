"use client";


import { useAuth } from "@/hooks/useAuth";
import { getRoleDashboard, getRoleLabel } from "@/lib/routes";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { Shield } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { role, isLoading, isAuthenticated } = useAuth();


  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    return <LoadingSkeleton variant="page" />;
  }

  if (role && !allowedRoles.includes(role)) {
    const correctDashboard = getRoleDashboard(role);
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Your role ({getRoleLabel(role)}) does not have permission to access this area.
          You will be redirected to your dashboard.
        </p>
        <a
          href={correctDashboard}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to My Dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
