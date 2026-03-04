"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, ClipboardList, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function TeacherDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  const classes = useQuery(
    api.modules.academics.queries.getTeacherClasses,
    {}
  );

  if (authLoading || classes === undefined) return <LoadingSkeleton variant="page" />;

  const stats = [
    { label: "My Classes", value: classes?.length.toString() || "0", icon: BookOpen },
    { label: "Pending Grades", value: "0", icon: ClipboardList },
    { label: "Today's Classes", value: "0", icon: Calendar },
    { label: "Assignments Due", value: "0", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName || "Teacher"}`}
        description="Here's what's happening in your classes today."
      />

      <div className="grid gap-4理论 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your timetable for today will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Recent student submissions will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
