"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Package, Users, Wallet } from "lucide-react";

type DashboardStats = {
  stats: {
    totalModules: number;
    activeModules: number;
    totalInstalls: number;
    activeInstalls: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  recentInstallations: Array<{
    _id: string;
    tenantId: string;
    moduleId: string;
    status: string;
    installedAt?: number;
  }>;
  modulePerformance: Array<{
    moduleId: string;
    slug: string;
    name: string;
    status: string;
    installs: number;
    activeInstalls: number;
    revenue: number;
    rating: number;
    reviewCount: number;
    lastUpdated: number;
  }>;
};

type PublisherProfile = {
  companyName: string;
  status: "pending" | "approved" | "rejected" | "suspended" | "banned";
  tier: "indie" | "verified" | "enterprise";
};

function money(value: number) {
  return `KES ${value.toLocaleString()}`;
}

export default function DeveloperDashboardPage() {
  const dashboard = useQuery(
    api.modules.publisher.mutations.analytics.getDashboardStats,
    {}
  ) as DashboardStats | undefined;
  const profile = useQuery(api.modules.publisher.mutations.profile.getMyProfile, {}) as
    | PublisherProfile
    | undefined;

  const topModules = useMemo(
    () =>
      [...(dashboard?.modulePerformance ?? [])]
        .sort((a, b) => b.revenue - a.revenue || b.installs - a.installs)
        .slice(0, 5),
    [dashboard]
  );

  if (!dashboard || !profile) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer Dashboard"
        description="Live marketplace performance for your publisher account, modules, installs, and earnings."
        badge={<Badge variant="outline">{profile.tier} tier</Badge>}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/portal/developer/modules">Manage Modules</Link>
            </Button>
            <Button asChild>
              <Link href="/portal/developer/analytics">Open Analytics</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Modules</p>
              <p className="text-2xl font-semibold">
                {dashboard.stats.activeModules}/{dashboard.stats.totalModules}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active Installs</p>
              <p className="text-2xl font-semibold">{dashboard.stats.activeInstalls}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wallet className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <p className="text-2xl font-semibold">{money(dashboard.stats.monthlyRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BarChart3 className="h-8 w-8 text-sky-500" />
            <div>
              <p className="text-sm text-muted-foreground">Lifetime Revenue</p>
              <p className="text-2xl font-semibold">{money(dashboard.stats.totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Top Modules</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/portal/developer/modules">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topModules.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No modules yet"
                description="Create your first marketplace module to start tracking installs and revenue."
              />
            ) : (
              <div className="space-y-3">
                {topModules.map((module) => (
                  <div
                    key={module.moduleId}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="text-muted-foreground">
                        {module.installs} installs · {module.reviewCount} reviews
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{money(module.revenue)}</p>
                      <p className="text-muted-foreground">
                        {module.rating > 0 ? `${module.rating.toFixed(1)} rating` : "No ratings yet"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Installations</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentInstallations.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No recent installs"
                description="New installations will appear here as schools activate your modules."
              />
            ) : (
              <div className="space-y-3">
                {dashboard.recentInstallations.map((installation) => (
                  <div
                    key={installation._id}
                    className="rounded-md border p-3 text-sm"
                  >
                    <p className="font-medium">{installation.moduleId}</p>
                    <p className="text-muted-foreground">
                      Tenant {installation.tenantId} · {installation.status}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {installation.installedAt
                        ? new Date(installation.installedAt).toLocaleString()
                        : "Install time unavailable"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
