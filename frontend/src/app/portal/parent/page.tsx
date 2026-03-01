"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Users, GraduationCap, DollarSign, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentDashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Parent Dashboard"
        description="Monitor your children's progress and manage fees"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Children" value="--" icon={Users} />
        <StatCard label="Average Grade" value="--" icon={GraduationCap} />
        <StatCard label="Fee Balance" value="--" icon={DollarSign} />
        <StatCard label="Notifications" value="--" icon={Bell} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Children Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Overview of your children&apos;s performance will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              School announcements will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
