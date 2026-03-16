"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  DollarSign,
  FileClock,
  GraduationCap,
  Megaphone,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { chartColors } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { AdminRecentActivity } from "@/components/admin/AdminRecentActivity";
import { AdminCharts } from "@/components/admin/AdminCharts";

export default function AdminDashboardPage() {
  const { isLoading, sessionToken } = useAuth();

  const students = usePlatformQuery(api.modules.sis.queries.listStudents, { sessionToken }, !!sessionToken);
  const staff = usePlatformQuery(api.modules.hr.queries.listStaff, { sessionToken }, !!sessionToken);
  const applications = usePlatformQuery(api.modules.admissions.queries.listApplications, { sessionToken }, !!sessionToken);
  const invoices = usePlatformQuery(api.modules.finance.queries.listInvoices, { sessionToken }, !!sessionToken);

  if (isLoading || students === undefined || staff === undefined || applications === undefined || invoices === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const studentCount = students.length;
  const staffCount = staff.length;
  const pendingAdmissions = applications.filter((a: any) => ["submitted", "under_review", "waitlisted"].includes(a.status)).length;
  const outstandingInvoices = invoices.filter((inv: any) => inv.status !== "paid" && inv.status !== "cancelled").length;
  const totalReceivables = invoices
    .filter((inv: any) => inv.status !== "paid" && inv.status !== "cancelled")
    .reduce((sum: number, inv: any) => sum + (inv.amount ?? 0), 0);

  const recentAdmissions = applications.slice(0, 5);

  // Mock data for charts - in real app, this would come from API
  const admissionsData = [
    { name: "Jan", value: 12, color: chartColors.categorical[0] },
    { name: "Feb", value: 19, color: chartColors.categorical[0] },
    { name: "Mar", value: 15, color: chartColors.categorical[0] },
    { name: "Apr", value: 25, color: chartColors.categorical[0] },
    { name: "May", value: 22, color: chartColors.categorical[0] },
    { name: "Jun", value: 30, color: chartColors.categorical[0] },
  ];

  const revenueData = [
    { name: "Tuition", value: 450000, color: chartColors.categorical[1] },
    { name: "Fees", value: 125000, color: chartColors.categorical[1] },
    { name: "Transport", value: 45000, color: chartColors.categorical[1] },
    { name: "Library", value: 15000, color: chartColors.categorical[1] },
  ];

  const enrollmentData = [
    { name: "Grade 1", value: 45, color: chartColors.categorical[2] },
    { name: "Grade 2", value: 42, color: chartColors.categorical[2] },
    { name: "Grade 3", value: 38, color: chartColors.categorical[2] },
    { name: "Grade 4", value: 40, color: chartColors.categorical[2] },
    { name: "Grade 5", value: 35, color: chartColors.categorical[2] },
  ];

  // Mock recent activity data
  const recentActivity = [
    {
      id: "1",
      type: "student_enrolled" as const,
      title: "New Student Enrolled",
      description: "John Doe was successfully enrolled in Grade 3",
      user: { name: "Admin User" },
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      href: "/admin/students/123",
    },
    {
      id: "2",
      type: "invoice_paid" as const,
      title: "Invoice Payment Received",
      description: "KES 15,000 payment received for tuition fees",
      user: { name: "Finance Team" },
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      href: "/admin/finance/invoices/456",
    },
    {
      id: "3",
      type: "application_submitted" as const,
      title: "New Admission Application",
      description: "Application received for Grade 1 admission",
      user: { name: "Parent Portal" },
      timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
      href: "/admin/admissions/789",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-gradient-to-r from-primary-dark to-primary p-6 text-white">
        <p className="text-sm text-white/70">School Operations Center</p>
        <h1 className="mt-1 text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Live overview of admissions, academics, people, and finance. Use quick actions to jump into daily workflows.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-white text-primary-dark hover:bg-white/90">
            <Link href="/admin/students/create">Enroll Student</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/15">
            <Link href="/admin/admissions">Review Admissions</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/15">
            <Link href="/admin/finance">Open Finance</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatsCard
          title="Students"
          value={studentCount}
          description="Active records in SIS"
          icon={GraduationCap}
          trend={{ value: 12, isPositive: true }}
        />

        <AdminStatsCard
          title="Staff"
          value={staffCount}
          description="Total team members"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />

        <AdminStatsCard
          title="Pending Admissions"
          value={pendingAdmissions}
          description="Require review and decisions"
          icon={FileClock}
          variant="warning"
          trend={{ value: -8, isPositive: false }}
        />

        <AdminStatsCard
          title="Outstanding Invoices"
          value={outstandingInvoices}
          description={`KES ${(totalReceivables / 100).toLocaleString()} receivable`}
          icon={DollarSign}
          variant="danger"
          trend={{ value: 3, isPositive: false }}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Admissions Queue</CardTitle>
              <Button asChild size="sm" variant="ghost">
                <Link href="/admin/admissions" className="inline-flex items-center gap-1">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAdmissions.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  No admission applications yet.
                </div>
              ) : (
                recentAdmissions.map((app: any) => (
                  <div key={app._id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{app.firstName} {app.lastName}</p>
                      <p className="text-xs text-muted-foreground">{app.requestedGrade} • {app.guardianName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{String(app.status).replaceAll("_", " ")}</Badge>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/admissions/${app._id}`}>Review</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <AdminCharts 
            admissionsData={admissionsData}
            revenueData={revenueData}
            enrollmentData={enrollmentData}
          />
        </div>

        <div className="space-y-6">
          <AdminQuickActions />
          
          <AdminRecentActivity activities={recentActivity} />
        </div>
      </section>
    </div>
  );
}
