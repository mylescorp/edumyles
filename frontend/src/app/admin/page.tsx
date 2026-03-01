"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Users, GraduationCap, DollarSign, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="School Dashboard"
        description="Overview of your school's key metrics"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value="--"
          icon={GraduationCap}
        />
        <StatCard
          label="Total Staff"
          value="--"
          icon={Users}
        />
        <StatCard
          label="Fee Collection"
          value="--"
          icon={DollarSign}
        />
        <StatCard
          label="Attendance Rate"
          value="--"
          icon={CalendarCheck}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed will appear here once modules are installed and active.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Manage students, staff, and school settings from the sidebar navigation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
