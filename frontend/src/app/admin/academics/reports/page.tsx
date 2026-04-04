"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, TrendingUp, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";

export default function AdminAcademicReportsPage() {
  const { isLoading, sessionToken } = useAuth();
  const stats = usePlatformQuery(
    api.modules.academics.queries.getAcademicsStats,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );
  const recentExams = usePlatformQuery(
    api.modules.academics.queries.getRecentExams,
    sessionToken ? { sessionToken, limit: 10 } : "skip",
    !!sessionToken
  ) as any[] | null;

  if (isLoading || !stats || !recentExams) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Academic Reports" description="Snapshot of current academic performance and activity" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard title="Classes" value={stats.totalClasses} description="Tracked classes" icon={BookOpen} />
        <AdminStatsCard title="Subjects" value={stats.totalSubjects} description="Configured subjects" icon={FileText} />
        <AdminStatsCard title="Teachers" value={stats.activeTeachers} description="Teaching staff" icon={Users} />
        <AdminStatsCard title="Avg Performance" value={`${stats.avgPerformance}%`} description="Current average" icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Examination Activity</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/academics/exams">Open Exams</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentExams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent examinations found.</p>
          ) : (
            recentExams.map((exam) => (
              <div key={exam._id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{exam.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {exam.className} • {exam.date}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {exam.submissions}/{exam.total} submissions
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
