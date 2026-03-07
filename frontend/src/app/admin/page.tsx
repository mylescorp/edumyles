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
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const { isLoading, sessionToken } = useAuth();

  const students = useQuery(api.modules.sis.queries.listStudents, sessionToken ? {} : "skip");
  const staff = useQuery(api.modules.hr.queries.listStaff, sessionToken ? {} : "skip");
  const applications = useQuery(api.modules.admissions.queries.listApplications, sessionToken ? {} : "skip");
  const invoices = useQuery(api.modules.finance.queries.listInvoices, sessionToken ? {} : "skip");

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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-gradient-to-r from-forest-800 to-forest-600 p-6 text-white">
        <p className="text-sm text-white/70">School Operations Center</p>
        <h1 className="mt-1 text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Live overview of admissions, academics, people, and finance. Use quick actions to jump into daily workflows.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-white text-forest-800 hover:bg-white/90">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-forest-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{studentCount}</p>
            <p className="text-xs text-muted-foreground">Active records in SIS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Staff</CardTitle>
            <Users className="h-4 w-4 text-zoho-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{staffCount}</p>
            <p className="text-xs text-muted-foreground">Total team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Pending Admissions</CardTitle>
            <FileClock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingAdmissions}</p>
            <p className="text-xs text-muted-foreground">Require review and decisions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Outstanding Invoices</CardTitle>
            <DollarSign className="h-4 w-4 text-crimson-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{outstandingInvoices}</p>
            <p className="text-xs text-muted-foreground">KES {(totalReceivables / 100).toLocaleString()} receivable</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/students/create"><UserCheck className="mr-2 h-4 w-4" /> Enroll New Student</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/staff/create"><Users className="mr-2 h-4 w-4" /> Add Staff Member</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/communications"><Megaphone className="mr-2 h-4 w-4" /> Send Announcement</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/finance/invoices"><DollarSign className="mr-2 h-4 w-4" /> Manage Invoices</Link>
            </Button>
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <p className="flex items-center gap-1 font-medium"><AlertCircle className="h-3.5 w-3.5" /> Operations tip</p>
              <p className="mt-1">Review pending admissions daily before finance posting to keep class rosters accurate.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

