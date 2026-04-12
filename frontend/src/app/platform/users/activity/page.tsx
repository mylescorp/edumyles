"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { UsersAdminRail } from "@/components/platform/UsersAdminRail";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { UserActivityLogs } from "@/components/platform/UserActivityLogs";
import { Activity } from "lucide-react";

export default function ActivityLogsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { can, isLoaded } = usePlatformPermissions();
  const canViewActivity = can("platform_users.view_activity");

  if (isLoading || !isLoaded) return <LoadingSkeleton variant="page" />;

  if (!canViewActivity || !sessionToken) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view activity logs.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        description="View activity logs and audit trails for platform users."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: "Activity Logs" },
        ]}
      />

      <div className="mb-6">
        <UsersAdminRail />
      </div>

      <UserActivityLogs />
    </div>
  );
}
