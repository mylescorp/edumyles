"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, DollarSign, FileText, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerDashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Partner Dashboard"
        description="Monitor your sponsored students and track reports"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sponsored Students" value="--" icon={GraduationCap} />
        <StatCard label="Total Invested" value="--" icon={DollarSign} />
        <StatCard label="Reports Available" value="--" icon={FileText} />
        <StatCard label="Messages" value="--" icon={MessageSquare} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Student Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aggregated performance data for your sponsored students will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Recent updates about your sponsored students will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
