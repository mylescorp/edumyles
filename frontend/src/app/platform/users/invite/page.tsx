"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { PlatformAdminInviteForm } from "../PlatformAdminInviteForm";

export default function InviteAdminPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasRole } = usePermissions();
  const isMasterAdmin = hasRole("master_admin");

  if (isLoading) return <LoadingSkeleton variant="page" />;

  if (!isMasterAdmin || !sessionToken) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Only Master Admins can invite new platform administrators.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Invite Platform Admin"
        description="Create a platform admin account and send the onboarding link through the same flow used in user management."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: "Invite" },
        ]}
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Admin Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PlatformAdminInviteForm
            mode="page"
            sessionToken={sessionToken}
            onCancel={() => window.history.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
