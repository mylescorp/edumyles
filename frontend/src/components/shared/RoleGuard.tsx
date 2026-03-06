"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSkeleton } from "./LoadingSkeleton";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && (!user || !role)) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth/login?next=${returnUrl}`;
    }
  }, [isLoading, user, role]);

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!user || !role) {
    // Show brief loading state while redirect happens
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don&apos;t have permission to access this page.</p>
          <p className="mt-1 text-sm text-gray-500">Required roles: {allowedRoles.join(", ")}</p>
          <p className="mt-1 text-sm text-gray-500">Your role: {role}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
