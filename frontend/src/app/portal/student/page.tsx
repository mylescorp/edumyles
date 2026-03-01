"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, FileText, CalendarCheck, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentDashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Student Dashboard"
        description="Your academic overview and upcoming activities"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="GPA" value="--" icon={GraduationCap} />
        <StatCard label="Pending Assignments" value="--" icon={FileText} />
        <StatCard label="Attendance Rate" value="--" icon={CalendarCheck} />
        <StatCard label="Wallet Balance" value="--" icon={Wallet} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your pending assignments will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your latest grades will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
