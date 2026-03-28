"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { BookOpen, ClipboardList, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TeacherDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  const classes = useQuery(
    api.modules.academics.queries.getTeacherClasses,
    {}
  );

  const dashboardStats = useQuery(
    api.modules.academics.queries.getTeacherDashboardStats,
    {}
  );

  if (authLoading || classes === undefined || dashboardStats === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const totalStudents = classes.reduce((sum, cls: any) => sum + (cls.studentCount || 0), 0);
  const activeAssignments = dashboardStats?.assignmentCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.email?.split('@')[0] || 'Teacher'}!`}
        description="Here's what's happening with your teaching today."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">Active classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments}</div>
            <p className="text-xs text-muted-foreground">Active assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">Total classes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes assigned yet</p>
            ) : (
              classes.slice(0, 3).map((cls: any) => (
                <div key={cls._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">Grade {cls.grade}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/portal/teacher/classes/${cls._id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))
            )}
            {classes.length > 3 && (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/portal/teacher/classes">
                  View All Classes
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href="/portal/teacher/attendance">
                <Calendar className="h-4 w-4 mr-2" />
                Record Attendance
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/teacher/assignments/create">
                <FileText className="h-4 w-4 mr-2" />
                Create Assignment
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/teacher/classes">
                <BookOpen className="h-4 w-4 mr-2" />
                View Classes
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/teacher/assignments">
                <ClipboardList className="h-4 w-4 mr-2" />
                Manage Assignments
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
