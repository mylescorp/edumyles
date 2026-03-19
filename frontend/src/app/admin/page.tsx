"use client";

import { useState } from "react";
import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { AdminWidgetGrid } from "@/components/admin/AdminWidgetGrid";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import {
  Users,
  DollarSign,
  BookOpen,
  Clock,
  FileText,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function AdminDashboard() {
  const { isLoading, sessionToken } = useAuth();
  const [widgets, setWidgets] = useState<any[]>([]);

  // Real data queries
  const studentStats = useQuery(
    api.modules.sis.queries.getStudentStats,
    sessionToken ? { sessionToken } : "skip"
  );
  const financialReport = useQuery(
    api.modules.finance.queries.getFinancialReport,
    sessionToken ? { sessionToken } : "skip"
  );
  const classes = useQuery(
    api.modules.sis.queries.listClasses,
    sessionToken ? { sessionToken } : "skip"
  );
  const auditLogs = useQuery(
    api.platform.audit.queries.listTenantAuditLogs,
    sessionToken ? { sessionToken, limit: 5 } : "skip"
  );

  const handleAddWidget = () => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      title: "New Widget",
      content: (
        <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
          Widget content coming soon
        </div>
      ),
      isMinimized: false,
    };
    setWidgets((prev) => [...prev, newWidget]);
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleToggleMinimize = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: !w.isMinimized } : w))
    );
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  // Derive stats from real data (fall back to "—" while loading)
  const totalStudents = (studentStats as any)?.total ?? null;
  const activeStudents = (studentStats as any)?.active ?? null;
  const totalClasses = classes ? (classes as any[]).length : null;
  const revenueCollected = (financialReport as any)?.totalPaid ?? null;
  const outstandingFees = (financialReport as any)?.outstanding ?? null;

  const quickStats = [
    {
      title: "Total Students",
      value: totalStudents !== null ? totalStudents.toLocaleString() : "—",
      sub: activeStudents !== null ? `${activeStudents} active` : "Loading…",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/admin/students",
    },
    {
      title: "Fees Collected",
      value:
        revenueCollected !== null
          ? `KES ${Number(revenueCollected / 100).toLocaleString()}`
          : "—",
      sub:
        outstandingFees !== null
          ? `KES ${Number(outstandingFees / 100).toLocaleString()} outstanding`
          : "Loading…",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/admin/finance",
    },
    {
      title: "Active Classes",
      value: totalClasses !== null ? totalClasses.toString() : "—",
      sub: "This academic year",
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/admin/classes",
    },
    {
      title: "Audit Events",
      value: (auditLogs as any[])?.length?.toString() ?? "—",
      sub: "Last 200 recorded actions",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/admin/audit",
    },
  ];

  const recentActivities = (auditLogs as any[]) ?? [];

  const getActivityColor = (action: string) => {
    if (action.includes("created") || action.includes("enrolled")) return "bg-green-500";
    if (action.includes("deleted") || action.includes("suspended")) return "bg-red-500";
    if (action.includes("updated") || action.includes("status")) return "bg-blue-500";
    return "bg-gray-400";
  };

  const formatAction = (action: string) =>
    action
      .replace(/\./g, " ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <AdminDashboardHeader
        title="My Dashboard"
        subtitle="Welcome back! Here's what's happening with your school today."
        showAddWidget={true}
        onAddWidget={handleAddWidget}
        widgetCount={widgets.length}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
                    </div>
                    <div className={cn("p-3 rounded-lg", stat.bgColor)}>
                      <Icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Widget Grid */}
      <AdminWidgetGrid
        widgets={widgets}
        onAddWidget={handleAddWidget}
        onRemoveWidget={handleRemoveWidget}
        onToggleMinimize={handleToggleMinimize}
      />

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity — real data from audit log */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/audit" className="flex items-center gap-1 text-sm">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent activity recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((log: any, index: number) => (
                    <div
                      key={log._id ?? index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            getActivityColor(log.action)
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatAction(log.action)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.userName ?? log.actorEmail ?? log.actorId} •{" "}
                            {formatDistanceToNow(new Date(log.timestamp), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {log.entityType ?? "system"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <AdminQuickActions />
      </div>
    </div>
  );
}
