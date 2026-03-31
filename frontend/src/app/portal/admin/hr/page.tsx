"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  FileText,
  ArrowRight,
  UserCheck,
  Calculator,
  LayoutDashboard,
} from "lucide-react";

const SECTIONS = [
  {
    title: "HR Dashboard",
    description: "Overview of all staff, active contracts, payroll summaries and leave status.",
    icon: LayoutDashboard,
    href: "/portal/admin/hr/dashboard",
    color: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
    cta: "Open Dashboard",
  },
  {
    title: "Payroll",
    description: "Manage payroll runs, approve payslips and process staff salary payments.",
    icon: Calculator,
    href: "/portal/admin/hr/payroll",
    color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    cta: "Manage Payroll",
  },
  {
    title: "Contracts",
    description: "View and manage employment contracts, renewals and terminations.",
    icon: FileText,
    href: "/portal/admin/hr/contracts",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    cta: "View Contracts",
  },
];

export default function HRIndexPage() {
  const { isLoading, sessionToken } = useAuth();

  const staff = useQuery(
    api.modules.hr.queries.listStaff,
    sessionToken ? { sessionToken } : "skip"
  );

  const contracts = useQuery(
    api.modules.hr.queries.listContracts,
    sessionToken ? {} : "skip"
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const staffList = (staff ?? []) as any[];
  const contractList = (contracts ?? []) as any[];
  const activeStaff = staffList.filter((s: any) => s.status === "active").length;
  const activeContracts = contractList.filter((c: any) => c.status === "active").length;
  const expiringContracts = contractList.filter((c: any) => {
    if (!c.endDate) return false;
    const diff = new Date(c.endDate).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR & Payroll"
        description="Manage staff, payroll and employment contracts"
        breadcrumbs={[
          { label: "Admin Portal", href: "/portal/admin" },
          { label: "HR & Payroll" },
        ]}
        actions={
          <Link href="/admin/hr">
            <Button variant="outline" size="sm" className="gap-1.5">
              Full HR Panel <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
              <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeStaff}</p>
              <p className="text-sm text-muted-foreground">Active Staff</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeContracts}</p>
              <p className="text-sm text-muted-foreground">Active Contracts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-2xl font-bold">{expiringContracts}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
              {expiringContracts > 0 && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                  Action needed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${section.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{section.description}</p>
                <Link href={section.href}>
                  <Button className="w-full gap-2">
                    {section.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
