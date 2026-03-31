"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { GraduationCap, FileText, CalendarCheck, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StudentDashboardPage() {
  const { user, isLoading } = useAuth();
  const { isModuleInstalled, isLoading: modulesLoading } = useInstalledModules();
  const academicsEnabled = isModuleInstalled("academics");
  const walletEnabled = isModuleInstalled("ewallet");

  const myProfile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    {}
  );

  const myAssignments = useQuery(
    api.modules.portal.student.queries.getMyAssignments,
    academicsEnabled ? { status: "pending" } : "skip"
  );

  const myGrades = useQuery(
    api.modules.portal.student.queries.getMyGrades,
    academicsEnabled ? {} : "skip"
  );

  const myAttendance = useQuery(
    api.modules.portal.student.queries.getMyAttendance,
    academicsEnabled ? {} : "skip"
  );

  const myWallet = useQuery(
    api.modules.portal.student.queries.getMyWalletBalance,
    walletEnabled ? {} : "skip"
  );

  if (
    isLoading ||
    modulesLoading ||
    myProfile === undefined ||
    (academicsEnabled && (myAssignments === undefined || myGrades === undefined || myAttendance === undefined)) ||
    (walletEnabled && myWallet === undefined)
  ) {
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

  const assignmentList = myAssignments ?? [];
  const gradeList = myGrades ?? [];
  const attendanceList = myAttendance ?? [];
  const wallet = myWallet ?? { balanceCents: 0, currency: "KES" };
  const gpa = academicsEnabled ? calculateGPA(gradeList) : "N/A";
  const attendanceRate = academicsEnabled ? calculateAttendanceRate(attendanceList) : "N/A";

  return (
    <div>
      <PageHeader
        title="Student Dashboard"
        description="Your academic overview and upcoming activities"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="GPA" value={gpa} icon={GraduationCap} />
        <StatCard label="Pending Assignments" value={assignmentList.length.toString()} icon={FileText} />
        <StatCard label="Attendance Rate" value={attendanceRate} icon={CalendarCheck} />
        <StatCard label="Wallet Balance" value={walletEnabled ? `${wallet.balanceCents / 100} ${wallet.currency}` : "Module Off"} icon={Wallet} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {!academicsEnabled ? (
              <p className="text-sm text-muted-foreground">
                Assignments are unavailable because the Academics module is not active for this tenant.
              </p>
            ) : assignmentList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You have no pending assignments. Great job!
              </p>
            ) : (
              <div className="space-y-3">
                {assignmentList.slice(0, 3).map((assignment: any) => (
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
                {assignmentList.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    And {assignmentList.length - 3} more...
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
            {!academicsEnabled ? (
              <p className="text-sm text-muted-foreground">
                Grades are unavailable because the Academics module is not active for this tenant.
              </p>
            ) : gradeList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No grades available yet.
              </p>
            ) : (
              <div className="space-y-3">
                {gradeList.slice(0, 3).map((grade: any) => (
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
                {gradeList.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    And {gradeList.length - 3} more...
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
            {academicsEnabled && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/portal/student/assignments">
                  <FileText className="h-4 w-4 mr-2" />
                  View All Assignments
                </Link>
              </Button>
            )}
            {walletEnabled && (
              <>
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
              </>
            )}
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/student/profile">
                <GraduationCap className="h-4 w-4 mr-2" />
                View Profile
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
