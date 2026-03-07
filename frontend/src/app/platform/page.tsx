"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import {
  Activity,
  AlertTriangle,
  Building2,
  Clock,
  DollarSign,
  FileText,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/formatters";

const PLAN_PRICES_USD: Record<string, number> = {
  starter: 49,
  growth: 129,
  premium: 249,
  enterprise: 499,
};

function getActionBadgeClass(action: string) {
  if (action.includes("suspended") || action.includes("deleted")) return "bg-red-500/10 text-red-700";
  if (action.includes("created") || action.includes("installed")) return "bg-green-500/10 text-green-700";
  if (action.includes("updated")) return "bg-amber-500/10 text-amber-700";
  if (action.includes("impersonation")) return "bg-orange-500/10 text-orange-700";
  return "bg-slate-500/10 text-slate-700";
}

export default function PlatformDashboardPage() {
  const { isLoading } = useAuth();
  const { hasRole } = usePermissions();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const isPlatformAdmin = hasRole("master_admin", "super_admin");
  const isMasterAdmin = hasRole("master_admin");

  const stats = useQuery(
    api.platform.tenants.queries.getPlatformStats,
    isPlatformAdmin ? {} : "skip"
  );
  const activityRaw = useQuery(
    api.platform.tenants.queries.getRecentActivity,
    isPlatformAdmin ? { limit: 30 } : "skip"
  );
  const subscriptions = useQuery(
    api.platform.billing.queries.listSubscriptions,
    isPlatformAdmin ? {} : "skip"
  );
  const auditLogs = useQuery(
    api.platform.audit.queries.listAuditLogs,
    isPlatformAdmin ? { limit: 200 } : "skip"
  );
  const allUsers = useQuery(
    api.platform.users.queries.listAllUsers,
    isMasterAdmin ? {} : "skip"
  ) as Array<{ createdAt?: number }> | undefined;

  const rangeStart = useMemo(() => {
    const now = Date.now();
    const ms = timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 : timeRange === "30d" ? 30 * 24 * 60 * 60 * 1000 : 90 * 24 * 60 * 60 * 1000;
    return now - ms;
  }, [timeRange]);

  const derived = useMemo(() => {
    const activeSubscriptions = (subscriptions ?? []).filter((s) => s.status === "active" || s.status === "trial");
    const estimatedMrr = activeSubscriptions.reduce((total, s) => {
      const key = String(s.plan || "").toLowerCase();
      return total + (PLAN_PRICES_USD[key] ?? 0);
    }, 0);

    const newUsers = (allUsers ?? []).filter((u) => (u.createdAt ?? 0) >= rangeStart).length;
    const recentActivity = (activityRaw ?? []).filter((a) => (a.timestamp ?? 0) >= rangeStart);
    const securityEvents = (auditLogs ?? []).filter((l) =>
      /(suspend|deleted|impersonation|unauthorized|failed)/i.test(String(l.action))
    ).length;

    return {
      estimatedMrr,
      newUsers,
      recentActivity,
      securityEvents,
    };
  }, [subscriptions, allUsers, rangeStart, activityRaw, auditLogs]);

  if (isLoading) return <LoadingSkeleton variant="page" />;

  if (!isPlatformAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Master Admin Dashboard" description="Platform-wide operations and controls" breadcrumbs={[{ label: "Dashboard", href: "/platform" }]} />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">You do not have permission to view platform-wide metrics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Admin Dashboard"
        description="Live platform metrics and cross-tenant activity"
        breadcrumbs={[{ label: "Dashboard", href: "/platform" }]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Time Range:</span>
          <div className="flex space-x-1">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs"
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </Button>
            ))}
          </div>
        </div>
        <Link href="/platform/analytics">
          <Button className="bg-[#056C40] hover:bg-[#023c24]">
            <FileText className="h-4 w-4 mr-2" />
            Open Analytics
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tenants" value={stats?.totalTenants ?? 0} icon={Building2} />
        <StatCard label="Total Users" value={(stats?.totalUsers ?? 0).toLocaleString()} icon={Users} />
        <StatCard label="New Users (Range)" value={derived.newUsers.toLocaleString()} icon={UserCheck} />
        <StatCard label="Estimated MRR (USD)" value={`$${derived.estimatedMrr.toLocaleString()}`} icon={DollarSign} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Tenants" value={stats?.activeTenants ?? 0} icon={Building2} />
        <StatCard label="Suspended Tenants" value={stats?.suspendedTenants ?? 0} icon={AlertTriangle} />
        <StatCard label="Security Events" value={derived.securityEvents} icon={Shield} />
        <StatCard label="Activity Records" value={derived.recentActivity.length} icon={Activity} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
            <Badge variant="secondary" className="text-xs">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {derived.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity in this time range.</p>
          ) : (
            derived.recentActivity.map((item) => (
              <div key={String(item._id)} className="flex items-start justify-between rounded-lg border p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getActionBadgeClass(item.action)}>
                      {item.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.tenantName}</span>
                  </div>
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.actorEmail || item.actorId}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeTime(item.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
