"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Building2, DollarSign, Download, Shield, Users } from "lucide-react";

const PLAN_PRICES_USD: Record<string, number> = {
  starter: 49,
  growth: 129,
  premium: 249,
  enterprise: 499,
};

type PlatformStats = {
  totalTenants: number;
  totalUsers: number;
  planCounts: Record<string, number>;
};

type Subscription = {
  status?: string;
  plan?: string;
  createdAt?: number;
};

type AuditLog = {
  action?: string;
  timestamp?: number;
};

export default function AnalyticsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasRole } = usePermissions();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const isPlatformAdmin = hasRole("master_admin", "super_admin");
  const isMasterAdmin = hasRole("master_admin");

  const stats = usePlatformQuery(
    api.platform.tenants.queries.getPlatformStats,
    { sessionToken },
    isPlatformAdmin && !!sessionToken
  ) as PlatformStats | undefined;
  const subscriptions = usePlatformQuery(
    api.platform.billing.queries.listSubscriptions,
    { sessionToken },
    isPlatformAdmin && !!sessionToken
  ) as Subscription[] | undefined;
  const auditLogs = usePlatformQuery(
    api.platform.audit.queries.listAuditLogs,
    { sessionToken, limit: 500 },
    isPlatformAdmin && !!sessionToken
  ) as AuditLog[] | undefined;
  const allUsers = usePlatformQuery(
    api.platform.users.queries.listAllUsers,
    { sessionToken },
    isMasterAdmin && !!sessionToken
  ) as Array<{ createdAt?: number; tenantId?: string }> | undefined;

  const rangeStart = useMemo(() => {
    const now = Date.now();
    const ms =
      timeRange === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : timeRange === "30d"
          ? 30 * 24 * 60 * 60 * 1000
          : timeRange === "90d"
            ? 90 * 24 * 60 * 60 * 1000
            : 365 * 24 * 60 * 60 * 1000;
    return now - ms;
  }, [timeRange]);

  const derived = useMemo(() => {
    const activeSubscriptions = (subscriptions ?? []).filter((s) => s.status === "active" || s.status === "trial");
    const estimatedRevenue = activeSubscriptions.reduce((sum, s) => {
      const key = String(s.plan || "").toLowerCase();
      return sum + (PLAN_PRICES_USD[key] ?? 0);
    }, 0);

    const logsInRange = (auditLogs ?? []).filter((l) => (l.timestamp ?? 0) >= rangeStart);
    const usersInRange = (allUsers ?? []).filter((u) => (u.createdAt ?? 0) >= rangeStart);
    const tenantGrowth = (subscriptions ?? []).filter((s) => (s.createdAt ?? 0) >= rangeStart).length;

    const actionCounts: Record<string, number> = {};
    for (const log of logsInRange) {
      const action = log.action || "unknown";
      actionCounts[action] = (actionCounts[action] ?? 0) + 1;
    }
    const topActions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const tenantUserCounts: Record<string, number> = {};
    for (const user of allUsers ?? []) {
      const tenantKey = user.tenantId || "platform";
      tenantUserCounts[tenantKey] = (tenantUserCounts[tenantKey] ?? 0) + 1;
    }
    const usersByTenant = Object.entries(tenantUserCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const securityEvents = logsInRange.filter((l) =>
      /(suspend|deleted|impersonation|unauthorized|failed)/i.test(String(l.action))
    ).length;

    return {
      estimatedRevenue,
      logsInRange,
      usersInRange,
      tenantGrowth,
      topActions,
      usersByTenant,
      securityEvents,
    };
  }, [subscriptions, auditLogs, allUsers, rangeStart]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics & Monitoring"
          description="Platform performance and tenant analytics"
          breadcrumbs={[
            { label: "Dashboard", href: "/platform" },
            { label: "Analytics", href: "/platform/analytics" },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">You do not have permission to view platform analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Monitoring"
        description="Live analytics from platform tenants, users, and audit events"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform" },
          { label: "Analytics", href: "/platform/analytics" },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={(value: "7d" | "30d" | "90d" | "1y") => setTimeRange(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Tenants</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{stats?.totalTenants ?? 0}</div>
            <Building2 className="h-5 w-5 text-blue-600" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{(stats?.totalUsers ?? 0).toLocaleString()}</div>
            <Users className="h-5 w-5 text-green-600" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Estimated MRR</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">${derived.estimatedRevenue.toLocaleString()}</div>
            <DollarSign className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Security Events</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{derived.securityEvents}</div>
            <Shield className="h-5 w-5 text-red-600" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Growth Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">New users ({timeRange})</span>
              <Badge variant="secondary">{derived.usersInRange.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">New tenants ({timeRange})</span>
              <Badge variant="secondary">{derived.tenantGrowth}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Audit events ({timeRange})</span>
              <Badge variant="secondary">{derived.logsInRange.length}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries((stats?.planCounts ?? {}) as Record<string, number>).length === 0 ? (
              <p className="text-sm text-muted-foreground">No plan distribution data available.</p>
            ) : (
              Object.entries((stats?.planCounts ?? {}) as Record<string, number>)
                .sort((a, b) => b[1] - a[1])
                .map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{plan}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Audit Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {derived.topActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit actions in selected range.</p>
            ) : (
              derived.topActions.map(([action, count]) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-sm">{action}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users By Tenant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {derived.usersByTenant.length === 0 ? (
              <p className="text-sm text-muted-foreground">No user distribution data available.</p>
            ) : (
              derived.usersByTenant.map(([tenantId, count]) => (
                <div key={tenantId} className="flex items-center justify-between">
                  <span className="text-sm">{tenantId}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
