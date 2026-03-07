"use client";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSkeleton } from "./LoadingSkeleton";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!user || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Authentication Required</h2>
          <p className="mt-2 text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You do not have permission to access this page.</p>
          <p className="mt-1 text-sm text-gray-500">Required roles: {allowedRoles.join(", ")}</p>
          <p className="mt-1 text-sm text-gray-500">Your role: {role}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
