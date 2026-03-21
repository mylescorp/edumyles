"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminRecentActivity } from "@/components/admin/AdminRecentActivity";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  DollarSign,
  UserCheck,
  FileText,
  Clock,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { isLoading, user, sessionToken } = useAuth();

  // — Real data from Convex ——————————————————————————————
  const students = useQuery(
    api.modules.sis.queries.listStudents,
    sessionToken ? { sessionToken } : "skip"
  );

  const staffStats = useQuery(
    api.modules.hr.queries.getStaffStats,
    sessionToken ? { sessionToken } : "skip"
  );

  const pendingAdmissions = useQuery(
    api.modules.admissions.queries.listApplications,
    sessionToken ? { sessionToken, status: "pending" } : "skip"
  );

  const paidInvoices = useQuery(
    api.modules.finance.queries.listInvoices,
    sessionToken ? { sessionToken, status: "paid" } : "skip"
  );

  const pendingInvoices = useQuery(
    api.modules.finance.queries.listInvoices,
    sessionToken ? { sessionToken, status: "pending" } : "skip"
  );

  const recentAdmissions = useQuery(
    api.modules.admissions.queries.listApplications,
    sessionToken ? { sessionToken } : "skip"
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  // — Derived stats ————————————————————————————————————
  const studentList = (students as any[]) ?? [];
  const activeStudents = studentList.filter((s) => s.status === "active").length;
  const totalStudents = studentList.length;

  const totalStaff = staffStats?.active ?? 0;
  const onLeaveStaff = staffStats?.on_leave ?? 0;

  const paidInvoiceList = (paidInvoices as any[]) ?? [];
  const pendingInvoiceList = (pendingInvoices as any[]) ?? [];

  // Revenue: sum of paid invoices this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlyRevenue = paidInvoiceList
    .filter((inv) => inv.paidAt && inv.paidAt >= startOfMonth.getTime())
    .reduce((sum: number, inv: any) => sum + (inv.amount ?? 0), 0);
  const totalRevenue = paidInvoiceList.reduce(
    (sum: number, inv: any) => sum + (inv.amount ?? 0),
    0
  );
  const pendingFees = pendingInvoiceList.reduce(
    (sum: number, inv: any) => sum + (inv.amount ?? 0),
    0
  );

  const pendingApplicationCount = (pendingAdmissions as any[])?.length ?? 0;

  // Recent applications for activity feed
  const recentAppList = ((recentAdmissions as any[]) ?? []).slice(0, 5);

  const activities = recentAppList.map((app: any) => ({
    id: app._id,
    type: "application_submitted" as const,
    title: `Admission: ${app.firstName ?? ""} ${app.lastName ?? ""}`.trim() || "New Application",
    description: app.grade ? `Grade ${app.grade} application` : "Application received",
    timestamp: app.createdAt ?? Date.now(),
    href: `/admin/admissions/${app._id}`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here&apos;s what&apos;s happening with your school today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Live
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Active Students"
          value={activeStudents}
          description={`${totalStudents} total enrolled`}
          icon={GraduationCap}
          variant="default"
        />
        <AdminStatsCard
          title="Active Staff"
          value={totalStaff}
          description={onLeaveStaff > 0 ? `${onLeaveStaff} on leave` : "All present"}
          icon={UserCheck}
          variant={onLeaveStaff > 0 ? "warning" : "success"}
        />
        <AdminStatsCard
          title="Revenue This Month"
          value={
            monthlyRevenue > 0
              ? `KSh ${monthlyRevenue.toLocaleString()}`
              : totalRevenue > 0
              ? `KSh ${totalRevenue.toLocaleString()}`
              : "—"
          }
          description={
            pendingFees > 0 ? `KSh ${pendingFees.toLocaleString()} pending` : "All fees cleared"
          }
          icon={DollarSign}
          variant={pendingFees > 0 ? "warning" : "success"}
        />
        <AdminStatsCard
          title="Pending Admissions"
          value={pendingApplicationCount}
          description={pendingApplicationCount > 0 ? "Awaiting review" : "No pending applications"}
          icon={FileText}
          variant={pendingApplicationCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <AdminRecentActivity
            activities={activities}
            showViewAll={true}
            viewAllHref="/admin/admissions"
          />

          {/* Pending Fee Summary */}
          {pendingInvoiceList.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Outstanding Invoices
                </CardTitle>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/admin/finance/invoices" className="inline-flex items-center gap-1">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingInvoiceList.slice(0, 5).map((inv: any) => (
                    <div
                      key={inv._id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm"
                    >
                      <div>
                        <span className="font-medium">{inv.invoiceNumber ?? inv._id.slice(-6)}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {inv.dueDate
                            ? `Due ${new Date(inv.dueDate).toLocaleDateString()}`
                            : "Due date not set"}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        KSh {(inv.amount ?? 0).toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                  {pendingInvoiceList.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{pendingInvoiceList.length - 5} more outstanding invoices
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state when no data at all */}
          {activities.length === 0 && pendingInvoiceList.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-medium text-foreground mb-1">No activity yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by enrolling students or adding staff members.
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link href="/admin/students/create">Enroll Student</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/staff/create">Add Staff</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — Quick Actions + Student breakdown */}
        <div className="space-y-6">
          <AdminQuickActions />

          {/* Student breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-muted-foreground" />
                Student Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalStudents === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students enrolled yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {[
                    {
                      label: "Active",
                      count: studentList.filter((s) => s.status === "active").length,
                      color: "bg-green-500",
                    },
                    {
                      label: "Graduated",
                      count: studentList.filter((s) => s.status === "graduated").length,
                      color: "bg-blue-500",
                    },
                    {
                      label: "Suspended",
                      count: studentList.filter((s) => s.status === "suspended").length,
                      color: "bg-red-500",
                    },
                    {
                      label: "Transferred",
                      count: studentList.filter((s) => s.status === "transferred").length,
                      color: "bg-gray-400",
                    },
                  ]
                    .filter((row) => row.count > 0)
                    .map((row) => (
                      <div key={row.label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${row.color}`} />
                          <span className="text-muted-foreground">{row.label}</span>
                        </div>
                        <span className="font-semibold">{row.count}</span>
                      </div>
                    ))}
                  <div className="pt-2 border-t">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/admin/students">View all students</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
