"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { UsersAdminRail } from "@/components/platform/UsersAdminRail";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Upload } from "lucide-react";
import { PlatformAdminInviteForm } from "../PlatformAdminInviteForm";
import { BulkInviteUpload } from "@/components/platform/BulkInviteUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InviteAdminPage() {
  const { isLoading, sessionToken } = useAuth();
  const { can, isLoaded } = usePlatformPermissions();
  const canInvite = can("platform_users.invite");

  if (isLoading || !isLoaded) return <LoadingSkeleton variant="page" />;

  if (!canInvite || !sessionToken) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to invite platform staff.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Invite Platform Staff"
        description="Invite staff members individually or upload a CSV file for bulk invitations."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: "Invite" },
        ]}
      />

      <div className="mb-6">
        <UsersAdminRail />
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Single Invite
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Single Invitation
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
        </TabsContent>
        
        <TabsContent value="bulk" className="mt-6">
          <BulkInviteUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}
