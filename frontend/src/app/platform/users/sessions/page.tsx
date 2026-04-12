"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { UsersAdminRail } from "@/components/platform/UsersAdminRail";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { SessionManagement } from "@/components/platform/SessionManagement";
import { Shield } from "lucide-react";

export default function SessionManagementPage() {
  const { isLoading, sessionToken } = useAuth();
  const { can, isLoaded } = usePlatformPermissions();
  const canManageSessions = can("platform_users.view_activity");

  if (isLoading || !isLoaded) return <LoadingSkeleton variant="page" />;

  if (!canManageSessions || !sessionToken) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to manage sessions.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Session Management"
        description="View and manage your active sessions across all devices."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: "Sessions" },
        ]}
      />

      <div className="mb-6">
        <UsersAdminRail />
      </div>

      <SessionManagement />
    </div>
  );
}
