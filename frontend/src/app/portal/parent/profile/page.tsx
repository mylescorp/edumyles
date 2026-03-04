"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Manage your contact information and notification preferences"
      />

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Name: {user?.firstName} {user?.lastName}
          </p>
          <p>Email: {user?.email}</p>
          <p>Role: Parent</p>
        </CardContent>
      </Card>
    </div>
  );
}

