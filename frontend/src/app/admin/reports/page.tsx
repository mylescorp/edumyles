"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FileText,
  Download,
  Users,
  DollarSign,
  BookOpen,
  TrendingUp,
  Calendar,
} from "lucide-react";
import Link from "next/link";

const REPORT_CATEGORIES = [
  {
    title: "Academic Reports",
    description: "Student performance, grades, and attendance summaries",
    icon: BookOpen,
    color: "bg-blue-50 text-blue-700",
    reports: [
      { name: "Student Performance Summary", href: "/admin/academics/reports" },
      { name: "Class Attendance Report", href: "/admin/academics/reports?type=attendance" },
      { name: "Examination Results", href: "/admin/academics/exams" },
      { name: "Report Cards", href: "/admin/academics/reports?type=report-cards" },
    ],
  },
  {
    title: "Financial Reports",
    description: "Fee collection, invoices, and payment analytics",
    icon: DollarSign,
    color: "bg-green-50 text-green-700",
    reports: [
      { name: "Fee Collection Summary", href: "/admin/finance" },
      { name: "Outstanding Invoices", href: "/admin/finance/invoices?status=pending" },
      { name: "Payment History", href: "/admin/finance/invoices?status=paid" },
      { name: "Revenue Analytics", href: "/admin/finance" },
    ],
  },
  {
    title: "Student Reports",
    description: "Enrolment, demographics, and student statistics",
    icon: Users,
    color: "bg-purple-50 text-purple-700",
    reports: [
      { name: "Enrolment Summary", href: "/admin/students" },
      { name: "Student Demographics", href: "/admin/students?report=demographics" },
      { name: "Admissions Pipeline", href: "/admin/admissions" },
      { name: "Graduation Tracker", href: "/admin/students?report=graduation" },
    ],
  },
  {
    title: "HR Reports",
    description: "Staff, payroll, and leave management reports",
    icon: TrendingUp,
    color: "bg-orange-50 text-orange-700",
    reports: [
      { name: "Staff Directory", href: "/admin/hr" },
      { name: "Leave Summary", href: "/admin/hr?report=leave" },
      { name: "Payroll Report", href: "/admin/hr?report=payroll" },
      { name: "Performance Reviews", href: "/admin/hr?report=performance" },
    ],
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and download reports across all school modules"
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export All
          </Button>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Reports Generated", value: "—", icon: FileText },
          { label: "This Month", value: "—", icon: Calendar },
          { label: "Scheduled", value: "—", icon: BarChart3 },
          { label: "Downloads", value: "—", icon: Download },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {REPORT_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-semibold">{category.title}</div>
                    <p className="text-sm font-normal text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {category.reports.map((report) => (
                  <Link key={report.name} href={report.href}>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-2 px-3"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{report.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        View
                      </Badge>
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
