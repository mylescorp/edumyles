"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import {
  BookOpen,
  ClipboardList,
  Calendar,
  FileText,
  Users,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { label: "Record Attendance", href: "/portal/teacher/attendance", icon: Calendar, iconBg: "bg-[rgba(38,166,91,0.1)]", iconColor: "text-[#26A65B]", module: "sis" },
  { label: "View Classes", href: "/portal/teacher/classes", icon: BookOpen, iconBg: "bg-[rgba(15,76,42,0.1)]", iconColor: "text-[#0F4C2A]", module: "sis" },
  { label: "Create Assignment", href: "/portal/teacher/assignments/create", icon: Plus, iconBg: "bg-[rgba(232,160,32,0.1)]", iconColor: "text-[#E8A020]", module: "academics" },
  { label: "Manage Assignments", href: "/portal/teacher/assignments", icon: ClipboardList, iconBg: "bg-[rgba(21,101,192,0.1)]", iconColor: "text-[#1565C0]", module: "academics" },
  { label: "View Timetable", href: "/portal/teacher/timetable", icon: Calendar, iconBg: "bg-[rgba(124,58,237,0.1)]", iconColor: "text-[#7C3AED]", module: "timetable" },
];

export default function TeacherDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { isModuleInstalled, isLoading: modulesLoading } = useInstalledModules();
  const sisEnabled = isModuleInstalled("sis");
  const academicsEnabled = isModuleInstalled("academics");
  const timetableEnabled = isModuleInstalled("timetable");

  const classes = useQuery(
    api.modules.academics.queries.getTeacherClasses,
    sisEnabled ? {} : "skip"
  );

  const activeAssignmentsCount = useQuery(
    api.modules.academics.queries.getTeacherActiveAssignmentsCount,
    academicsEnabled ? {} : "skip"
  );

  const todayClassesCount = useQuery(
    api.modules.academics.queries.getTeacherTodayClassesCount,
    timetableEnabled ? {} : "skip"
  );

  if (
    authLoading ||
    modulesLoading ||
    (sisEnabled && classes === undefined) ||
    (academicsEnabled && activeAssignmentsCount === undefined) ||
    (timetableEnabled && todayClassesCount === undefined)
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  const teacherClasses = classes ?? [];
  const totalStudents = teacherClasses.reduce((sum: number, cls: any) => sum + (cls.studentCount || 0), 0);
  const activeAssignments = academicsEnabled ? (activeAssignmentsCount ?? 0) : 0;

  const availableActions = QUICK_ACTIONS.filter((a) => {
    if (a.module === "sis") return sisEnabled;
    if (a.module === "academics") return academicsEnabled;
    if (a.module === "timetable") return timetableEnabled;
    return true;
  });

  const anyUser = user as any;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${anyUser?.firstName || anyUser?.email?.split("@")[0] || "Teacher"}`}
        description="Here's an overview of your teaching activity today."
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My Classes"
          value={sisEnabled ? teacherClasses.length : "—"}
          icon={BookOpen}
          variant="default"
        />
        <StatCard
          label="Total Students"
          value={sisEnabled ? totalStudents : "—"}
          icon={Users}
          variant="info"
        />
        <StatCard
          label="Active Assignments"
          value={academicsEnabled ? activeAssignments : "—"}
          icon={ClipboardList}
          variant={activeAssignments > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Today's Classes"
          value={timetableEnabled ? (todayClassesCount ?? 0) : "—"}
          icon={Calendar}
          variant="default"
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* My Classes */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-[#0F4C2A]" />
              My Classes
            </CardTitle>
            {sisEnabled && teacherClasses.length > 3 && (
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                <Link href="/portal/teacher/classes" className="flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {!sisEnabled ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Class data unavailable — SIS module is not active.
              </p>
            ) : teacherClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No classes assigned to you yet.
              </p>
            ) : (
              <div className="space-y-2">
                {teacherClasses.slice(0, 4).map((cls: any) => (
                  <div
                    key={cls._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(15,76,42,0.1)] flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-[#0F4C2A]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Grade {cls.grade}
                          {cls.studentCount != null && (
                            <span className="ml-1.5">· {cls.studentCount} students</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {cls.status && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs hidden sm:flex",
                            cls.status === "active"
                              ? "text-[#26A65B] border-[#26A65B]/30 bg-[rgba(38,166,91,0.07)]"
                              : "text-muted-foreground"
                          )}
                        >
                          {cls.status}
                        </Badge>
                      )}
                      <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                        <Link href={`/portal/teacher/classes/${cls._id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {teacherClasses.length > 4 && (
                  <Button variant="outline" className="w-full h-8 text-xs" asChild>
                    <Link href="/portal/teacher/classes">View all {teacherClasses.length} classes</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {availableActions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Enable SIS or Academics module to unlock actions.
              </p>
            ) : (
              <div className="space-y-1.5">
                {availableActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 border border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-border transition-colors duration-150"
                    >
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0", action.iconBg)}>
                        <Icon className={cn("h-4 w-4", action.iconColor)} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{action.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
