"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RolesSettingsPage() {
  const { isLoading, sessionToken } = useAuth();
  const roles = useQuery(
    (api as any).users.getRoleDefinitions,
    sessionToken ? { sessionToken } : "skip"
  );

  if (isLoading || !roles) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="View role hierarchy and permission assignments"
      />

      <div className="mt-6 space-y-4">
        {(roles as Array<{ role: string; level: number; permissions: string[] }>).map(
          ({ role, level, permissions }) => (
            <Card key={role}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base capitalize">{role.replace("_", " ")}</CardTitle>
                  <Badge variant="outline">Level {level}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((perm: string) => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
