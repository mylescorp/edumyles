"use client";

import { useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Globe, Package, Users, Wallet } from "lucide-react";

type RevenueAnalytics = {
  period: "7d" | "30d" | "90d" | "1y";
  granularity: "daily" | "weekly" | "monthly";
  data: Array<{ date: string; revenue: number; installs: number }>;
  totalRevenue: number;
  totalInstalls: number;
};

type GeographicAnalytics = {
  totalInstallations: number;
  geographicData: Array<{
    country: string;
    count: number;
    tenants: Array<{ tenantId: string; name?: string; country?: string }>;
  }>;
};

type DashboardStats = {
  modulePerformance: Array<{
    moduleId: string;
    name: string;
    status: string;
    installs: number;
    activeInstalls: number;
    revenue: number;
    rating: number;
    reviewCount: number;
  }>;
};

function money(value: number) {
  return `KES ${value.toLocaleString()}`;
}

export default function DeveloperAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const granularity = timeRange === "1y" ? "monthly" : timeRange === "90d" ? "weekly" : "daily";

  const revenue = useQuery(api.modules.publisher.mutations.analytics.getRevenueAnalytics, {
    period: timeRange,
    granularity,
  }) as RevenueAnalytics | undefined;
  const geography = useQuery(
    api.modules.publisher.mutations.analytics.getGeographicAnalytics,
    {}
  ) as GeographicAnalytics | undefined;
  const dashboard = useQuery(
    api.modules.publisher.mutations.analytics.getDashboardStats,
    {}
  ) as DashboardStats | undefined;

  if (!revenue || !geography || !dashboard) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer Analytics"
        description="Live revenue, install, and market distribution analytics for your published modules."
      />

      <div className="flex items-center gap-3">
        <select
          value={timeRange}
          onChange={(event) => setTimeRange(event.target.value as typeof timeRange)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
        <Badge variant="outline">{granularity}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wallet className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-semibold">{money(revenue.totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Installs</p>
              <p className="text-2xl font-semibold">{revenue.totalInstalls}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Globe className="h-8 w-8 text-sky-500" />
            <div>
              <p className="text-sm text-muted-foreground">Countries</p>
              <p className="text-2xl font-semibold">{geography.geographicData.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Tracked Modules</p>
              <p className="text-2xl font-semibold">{dashboard.modulePerformance.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.data.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No analytics yet"
                description="Revenue and install activity will appear here once schools begin transacting."
              />
            ) : (
              <div className="space-y-3">
                {revenue.data.map((bucket) => (
                  <div
                    key={bucket.date}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{bucket.date}</p>
                      <p className="text-muted-foreground">{bucket.installs} installs</p>
                    </div>
                    <p className="font-medium">{money(bucket.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {geography.geographicData.length === 0 ? (
              <EmptyState
                icon={Globe}
                title="No geographic data"
                description="Tenant installation geography will appear here as live installs accumulate."
              />
            ) : (
              <div className="space-y-3">
                {geography.geographicData.map((country) => (
                  <div
                    key={country.country}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{country.country}</p>
                      <p className="text-muted-foreground">
                        {country.tenants.length} tenant accounts
                      </p>
                    </div>
                    <p className="font-medium">{country.count} installs</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.modulePerformance.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No modules found"
              description="Published modules will appear here with install, review, and revenue performance."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Module</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Installs</th>
                    <th className="py-3 pr-4 font-medium">Active</th>
                    <th className="py-3 pr-4 font-medium">Revenue</th>
                    <th className="py-3 pr-4 font-medium">Rating</th>
                    <th className="py-3 font-medium">Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.modulePerformance.map((module) => (
                    <tr key={module.moduleId} className="border-b last:border-0">
                      <td className="py-4 pr-4 font-medium">{module.name}</td>
                      <td className="py-4 pr-4">
                        <Badge variant="outline">{module.status.replaceAll("_", " ")}</Badge>
                      </td>
                      <td className="py-4 pr-4">{module.installs}</td>
                      <td className="py-4 pr-4">{module.activeInstalls}</td>
                      <td className="py-4 pr-4">{money(module.revenue)}</td>
                      <td className="py-4 pr-4">
                        {module.rating > 0 ? module.rating.toFixed(1) : "No ratings"}
                      </td>
                      <td className="py-4">{module.reviewCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
