"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp,
  Plus,
  BarChart3,
  Clock,
  Award
} from "lucide-react";
import Link from "next/link";

export default function AcademicsPage() {
  const { isLoading, sessionToken } = useAuth();

  // Fetch real data from Convex — guard against null sessionToken
  const stats = usePlatformQuery(api.modules.academics.queries.getAcademicsStats, sessionToken ? { sessionToken } : "skip", !!sessionToken);
  const recentExams = usePlatformQuery(api.modules.academics.queries.getRecentExams, sessionToken ? { sessionToken, limit: 5 } : "skip", !!sessionToken);
  const upcomingEvents = usePlatformQuery(api.modules.academics.queries.getUpcomingEvents, sessionToken ? { sessionToken, limit: 5 } : "skip", !!sessionToken);

  if (isLoading || !stats || !recentExams || !upcomingEvents) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academics"
        description="Manage curriculum, classes, examinations, and academic performance"
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Class
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Total Classes"
          value={stats.totalClasses}
          description="Active classes this term"
          icon={BookOpen}
          trend={{ value: 8, isPositive: true }}
        />
        <AdminStatsCard
          title="Subjects"
          value={stats.totalSubjects}
          description="Subjects being taught"
          icon={FileText}
          trend={{ value: 3, isPositive: true }}
        />
        <AdminStatsCard
          title="Teachers"
          value={stats.activeTeachers}
          description="Active teaching staff"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <AdminStatsCard
          title="Avg Performance"
          value={`${stats.avgPerformance}%`}
          description="School-wide average"
          icon={TrendingUp}
          variant="success"
          trend={{ value: 4, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Examinations */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Examinations
              </CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/academics/exams">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentExams.map((exam) => (
                  <div key={exam._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{exam.name}</h4>
                        <Badge 
                          variant={
                            exam.status === "completed" ? "default" :
                            exam.status === "ongoing" ? "secondary" : "outline"
                          }
                        >
                          {exam.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {exam.className}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {exam.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {exam.submissions}/{exam.total} submitted
                        </span>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/academics/exams/${exam._id}`}>Manage</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Upcoming Events */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/academics/classes/create">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <BookOpen className="h-4 w-4" />
                  Create Class
                </Button>
              </Link>
              <Link href="/admin/academics/exams/create">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  Schedule Exam
                </Button>
              </Link>
              <Link href="/admin/academics/assignments/create">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Award className="h-4 w-4" />
                  Create Assignment
                </Button>
              </Link>
              <Link href="/admin/academics/reports">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Generate Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event._id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="p-2 bg-success-bg rounded-full">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <div className="text-xs text-muted-foreground mt-1">
                        <div>{event.date}</div>
                        <div>{event.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
