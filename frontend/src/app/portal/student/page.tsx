"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { GraduationCap, FileText, CalendarCheck, Wallet, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const calculateGPA = (grades: any[]) => {
    if (grades.length === 0) return "--";
    const totalPoints = grades.reduce((sum, grade) => sum + (grade.score || 0), 0);
    const maxPoints = grades.reduce((sum, grade) => sum + (grade.maxScore || 100), 0);
    const gpa = (totalPoints / maxPoints) * 4.0;
    return gpa.toFixed(2);
  };

  const calculateAttendanceRate = (attendance: any[]) => {
    if (attendance.length === 0) return "--";
    const presentDays = attendance.filter(record => record.status === "present").length;
    const rate = (presentDays / attendance.length) * 100;
    return `${rate.toFixed(1)}%`;
  };

  const assignmentList = myAssignments ?? [];
  const gradeList = myGrades ?? [];
  const attendanceList = myAttendance ?? [];
  const wallet = myWallet ?? { balanceCents: 0, currency: "KES" };
  const gpa = academicsEnabled ? calculateGPA(gradeList) : "N/A";
  const attendanceRate = academicsEnabled ? calculateAttendanceRate(attendanceList) : "N/A";

  const getGradePercent = (score: number, max: number) => ((score / (max || 100)) * 100).toFixed(1);
  const getGradeBadgeVariant = (pct: number) =>
    pct >= 80 ? "text-[#26A65B] bg-[rgba(38,166,91,0.1)] border-[#26A65B]/30"
    : pct >= 60 ? "text-[#E8A020] bg-[rgba(232,160,32,0.1)] border-[#E8A020]/30"
    : "text-[#DC2626] bg-[rgba(220,38,38,0.1)] border-[#DC2626]/30";

  const anyUser = user as any;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${anyUser?.firstName ? `, ${anyUser.firstName}` : ""}`}
        description="Your academic overview and upcoming activities"
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="GPA"
          value={gpa}
          icon={GraduationCap}
          variant="default"
        />
        <StatCard
          label="Pending Assignments"
          value={assignmentList.length}
          icon={FileText}
          variant={assignmentList.length > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Attendance Rate"
          value={attendanceRate}
          icon={CalendarCheck}
          variant="info"
        />
        <StatCard
          label="Wallet Balance"
          value={walletEnabled ? `${(wallet.balanceCents / 100).toLocaleString()} ${wallet.currency}` : "Module Off"}
          icon={Wallet}
          variant={walletEnabled ? "default" : "danger"}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Assignments */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-[#E8A020]" />
              Upcoming Assignments
            </CardTitle>
            {academicsEnabled && (
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                <Link href="/portal/student/assignments" className="flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {!academicsEnabled ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Assignments module is not active for this school.
              </p>
            ) : assignmentList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No pending assignments. Great job!
              </p>
            ) : (
              <div className="space-y-2">
                {assignmentList.slice(0, 3).map((assignment: any) => (
                  <div
                    key={assignment._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium text-sm truncate">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{assignment.subject}</p>
                    </div>
                    <Button size="sm" asChild className="flex-shrink-0 h-7 text-xs">
                      <Link href={`/portal/student/assignments/${assignment._id}`}>View</Link>
                    </Button>
                  </div>
                ))}
                {assignmentList.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{assignmentList.length - 3} more pending
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <GraduationCap className="h-4 w-4 text-[#0F4C2A]" />
              Recent Grades
            </CardTitle>
            {academicsEnabled && gradeList.length > 0 && (
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                <Link href="/portal/student/grades" className="flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {!academicsEnabled ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Grades module is not active for this school.
              </p>
            ) : gradeList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No grades available yet.
              </p>
            ) : (
              <div className="space-y-2">
                {gradeList.slice(0, 3).map((grade: any) => {
                  const pct = parseFloat(getGradePercent(grade.score, grade.maxScore));
                  return (
                    <div
                      key={grade._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium text-sm truncate">{grade.subject || grade.assignmentTitle}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{grade.term}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold tabular-nums">
                          {grade.score}/{grade.maxScore || 100}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${getGradeBadgeVariant(pct)}`}
                        >
                          {pct}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {gradeList.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{gradeList.length - 3} more grades
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {academicsEnabled && (
              <Button variant="outline" className="w-full justify-start h-9 text-sm" asChild>
                <Link href="/portal/student/assignments">
                  <FileText className="h-4 w-4 mr-2 text-[#E8A020]" />
                  View All Assignments
                </Link>
              </Button>
            )}
            {walletEnabled && (
              <>
                <Button variant="outline" className="w-full justify-start h-9 text-sm" asChild>
                  <Link href="/portal/student/wallet/transactions">
                    <Wallet className="h-4 w-4 mr-2 text-[#1565C0]" />
                    View Transactions
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start h-9 text-sm" asChild>
                  <Link href="/portal/student/wallet">
                    <Wallet className="h-4 w-4 mr-2 text-[#1565C0]" />
                    Open Wallet
                  </Link>
                </Button>
              </>
            )}
            <Button variant="outline" className="w-full justify-start h-9 text-sm" asChild>
              <Link href="/portal/student/profile">
                <GraduationCap className="h-4 w-4 mr-2 text-[#0F4C2A]" />
                View Profile
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Profile Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Student ID", value: myProfile.admissionNumber || "N/A" },
                { label: "Class", value: myProfile.classId || "N/A" },
                { label: "Stream", value: myProfile.streamId || "N/A" },
                { label: "Enrolled", value: new Date(myProfile.enrolledAt).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
