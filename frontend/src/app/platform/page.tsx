"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Users, DollarSign, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformDashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Platform Dashboard"
        description="Overview of all tenants and platform metrics"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Tenants"
          value="--"
          icon={Building2}
        />
        <StatCard
          label="Active Users"
          value="--"
          icon={Users}
        />
        <StatCard
          label="Monthly Revenue"
          value="--"
          icon={DollarSign}
        />
        <StatCard
          label="Active Sessions"
          value="--"
          icon={Activity}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tenant Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Recent tenant signups, module installs, and support requests will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Platform health metrics and alerts will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
