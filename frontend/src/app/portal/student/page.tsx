"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { GraduationCap, FileText, CalendarCheck, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StudentDashboardPage() {
  const { user, isLoading } = useAuth();

  const myProfile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    {}
  );

  const myAssignments = useQuery(
    api.modules.portal.student.queries.getMyAssignments,
    { status: "pending" }
  );

  const myGrades = useQuery(
    api.modules.portal.student.queries.getMyGrades,
    {}
  );

  const myAttendance = useQuery(
    api.modules.portal.student.queries.getMyAttendance,
    {}
  );

  const myWallet = useQuery(
    api.modules.portal.student.queries.getMyWalletBalance,
    {}
  );

  if (isLoading || myProfile === undefined || myAssignments === undefined || myGrades === undefined || myAttendance === undefined || myWallet === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  // Calculate GPA from grades
  const calculateGPA = (grades: any[]) => {
    if (grades.length === 0) return "--";
    const totalPoints = grades.reduce((sum, grade) => sum + (grade.score || 0), 0);
    const maxPoints = grades.reduce((sum, grade) => sum + (grade.maxScore || 100), 0);
    const gpa = (totalPoints / maxPoints) * 4.0;
    return gpa.toFixed(2);
  };

  // Calculate attendance rate
  const calculateAttendanceRate = (attendance: any[]) => {
    if (attendance.length === 0) return "--";
    const presentDays = attendance.filter(record => record.status === "present").length;
    const totalDays = attendance.length;
    const rate = (presentDays / totalDays) * 100;
    return `${rate.toFixed(1)}%`;
  };

  const gpa = calculateGPA(myGrades);
  const attendanceRate = calculateAttendanceRate(myAttendance);

  return (
    <div>
      <PageHeader
        title="Student Dashboard"
        description="Your academic overview and upcoming activities"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="GPA" value={gpa} icon={GraduationCap} />
        <StatCard label="Pending Assignments" value={myAssignments.length.toString()} icon={FileText} />
        <StatCard label="Attendance Rate" value={attendanceRate} icon={CalendarCheck} />
        <StatCard label="Wallet Balance" value={`${myWallet.balanceCents / 100} ${myWallet.currency}`} icon={Wallet} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {myAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You have no pending assignments. Great job!
              </p>
            ) : (
              <div className="space-y-3">
                {myAssignments.slice(0, 3).map((assignment: any) => (
                  <div key={assignment._id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/portal/student/assignments/${assignment._id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
                {myAssignments.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    And {myAssignments.length - 3} more...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
          </CardHeader>
          <CardContent>
            {myGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No grades available yet.
              </p>
            ) : (
              <div className="space-y-3">
                {myGrades.slice(0, 3).map((grade: any) => (
                  <div key={grade._id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{grade.subject || grade.assignmentTitle}</p>
                      <p className="text-xs text-muted-foreground">{grade.term}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{grade.score}/{grade.maxScore || 100}</p>
                      <p className="text-xs text-muted-foreground">
                        {((grade.score / (grade.maxScore || 100)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
                {myGrades.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    And {myGrades.length - 3} more...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/student/assignments">
                <FileText className="h-4 w-4 mr-2" />
                View All Assignments
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/student/wallet/transactions">
                <GraduationCap className="h-4 w-4 mr-2" />
                View Transactions
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/student/wallet">
                <CalendarCheck className="h-4 w-4 mr-2" />
                Open Wallet
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                <p className="text-sm">{myProfile.admissionNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class</p>
                <p className="text-sm">{myProfile.classId || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stream</p>
                <p className="text-sm">{myProfile.streamId || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enrolled</p>
                <p className="text-sm">{new Date(myProfile.enrolledAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
