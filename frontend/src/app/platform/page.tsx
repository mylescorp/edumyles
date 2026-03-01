"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Building2, Users, GraduationCap, Activity, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/formatters";

function ActionLabel({ action }: { action: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    "tenant.created": { label: "Tenant Created", color: "bg-green-500/10 text-green-700" },
    "tenant.suspended": { label: "Tenant Suspended", color: "bg-red-500/10 text-red-700" },
    "user.created": { label: "User Created", color: "bg-blue-500/10 text-blue-700" },
    "user.updated": { label: "User Updated", color: "bg-yellow-500/10 text-yellow-700" },
    "user.deleted": { label: "User Deactivated", color: "bg-red-500/10 text-red-700" },
    "module.installed": { label: "Module Installed", color: "bg-purple-500/10 text-purple-700" },
    "module.uninstalled": { label: "Module Removed", color: "bg-orange-500/10 text-orange-700" },
    "settings.updated": { label: "Settings Updated", color: "bg-gray-500/10 text-gray-700" },
    "impersonation.started": { label: "Impersonation Started", color: "bg-amber-500/10 text-amber-700" },
    "impersonation.ended": { label: "Impersonation Ended", color: "bg-amber-500/10 text-amber-700" },
  };
  const config = labels[action] ?? { label: action, color: "bg-gray-500/10 text-gray-700" };
  return <Badge variant="secondary" className={config.color}>{config.label}</Badge>;
}

export default function PlatformDashboardPage() {
  const { isLoading } = useAuth();
  const stats = useQuery(api.platform.tenants.queries.getPlatformStats);
  const activity = useQuery(api.platform.tenants.queries.getRecentActivity, { limit: 10 });

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Platform Dashboard"
        description="Overview of all tenants and platform metrics"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Tenants"
          value={stats?.totalTenants ?? "--"}
          icon={Building2}
        />
        <StatCard
          label="Active Users"
          value={stats?.activeUsers ?? "--"}
          icon={Users}
        />
        <StatCard
          label="Total Students"
          value={stats?.totalStudents ?? "--"}
          icon={GraduationCap}
        />
        <StatCard
          label="Trial Tenants"
          value={stats?.trialTenants ?? "--"}
          icon={Clock}
        />
      </div>

      {/* Secondary Stats */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Tenants"
          value={stats?.activeTenants ?? "--"}
          icon={Activity}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          label="Suspended Tenants"
          value={stats?.suspendedTenants ?? "--"}
          icon={AlertTriangle}
          className="border-l-4 border-l-red-500"
        />
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? "--"}
          icon={Users}
          className="border-l-4 border-l-blue-500"
        />
      </div>

      {/* Plan Distribution and Recent Activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.planCounts ? (
              <div className="space-y-3">
                {Object.entries(stats.planCounts).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${plan === "enterprise" ? "bg-purple-500" :
                        plan === "growth" ? "bg-blue-500" :
                          plan === "starter" ? "bg-green-500" :
                            "bg-gray-400"
                        }`} />
                      <span className="text-sm font-medium capitalize">{plan}</span>
                    </div>
                    <span className="text-sm font-bold">{count as number}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading plan data...</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity ? (
              activity.length > 0 ? (
                <div className="space-y-3">
                  {activity.map((item) => (
                    <div key={item._id} className="flex items-start gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <ActionLabel action={item.action} />
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground truncate">
                          {item.tenantName}
                          {item.targetType && item.targetId && (
                            <span> · {item.targetType}: {item.targetId}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity logged yet.</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Loading activity...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
