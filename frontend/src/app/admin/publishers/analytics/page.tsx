"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Building2,
  DollarSign,
  Globe,
  Package,
  Star,
  Wallet,
} from "lucide-react";

type PublisherAnalytics = {
  period: "7d" | "30d" | "90d" | "1y";
  summary: {
    totalRevenueCents: number;
    totalCommissionCents: number;
    totalModules: number;
    publishedModules: number;
    totalPublishers: number;
    activePublishers: number;
    totalInstalls: number;
    activeInstalls: number;
    averageRating: number;
    totalPendingPayoutCents: number;
  };
  verificationPerformance: Array<{
    level: "basic" | "verified" | "featured_partner";
    publishers: number;
    activePublishers: number;
    modules: number;
    revenueCents: number;
    averageRating: number;
  }>;
  topPublishers: Array<{
    publisherId: string;
    legalName: string;
    verificationLevel: string;
    country: string;
    totalModules: number;
    totalInstalls: number;
    totalEarningsCents: number;
    averageRating: number;
    pendingPayoutCents: number;
  }>;
  geographicPerformance: Array<{
    country: string;
    publishers: number;
    activePublishers: number;
    modules: number;
    installs: number;
    revenueCents: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    slug: string;
    moduleCount: number;
    installs: number;
    revenueCents: number;
  }>;
  topModules: Array<{
    moduleId: string;
    name: string;
    category: string;
    publisherName: string;
    totalInstalls: number;
    activeInstalls: number;
    averageRating: number;
    revenueCents: number;
  }>;
  transactionSeries: Array<{
    date: string;
    revenueCents: number;
    commissionsCents: number;
    transactions: number;
    installs: number;
  }>;
  payoutSummary: {
    totalPayoutCents: number;
    pendingPayoutCents: number;
    completedCount: number;
  };
  reviewSummary: {
    approved: number;
    pending: number;
    rejected: number;
  };
};

function formatCurrency(cents: number) {
  return `KES ${(cents / 100).toLocaleString()}`;
}

function formatVerificationLevel(level: string) {
  return level.replaceAll("_", " ");
}

export default function PlatformPublisherAnalytics() {
  const { isLoading, sessionToken } = useAuth();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  const analytics = useQuery(
    api.platform.marketplace.queries.getPublisherAnalytics,
    sessionToken ? { sessionToken, period } : "skip"
  ) as PublisherAnalytics | undefined;

  if (isLoading || !analytics) {
    return <LoadingSkeleton variant="page" />;
  }

  const { summary } = analytics;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publisher Analytics"
        description="Live marketplace publisher analytics aggregated from Convex transactions, modules, installs, and payouts."
        actions={
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as typeof period)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminStatsCard title="Revenue" value={formatCurrency(summary.totalRevenueCents)} icon={DollarSign} />
        <AdminStatsCard title="Commission" value={formatCurrency(summary.totalCommissionCents)} icon={Wallet} />
        <AdminStatsCard title="Publishers" value={summary.totalPublishers} icon={Building2} />
        <AdminStatsCard title="Modules" value={summary.totalModules} icon={Package} />
        <AdminStatsCard title="Installs" value={summary.totalInstalls} icon={BarChart3} />
        <AdminStatsCard title="Avg Rating" value={summary.averageRating.toFixed(1)} icon={Star} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verification Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.verificationPerformance.map((level) => (
              <div key={level.level} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium capitalize">{formatVerificationLevel(level.level)}</p>
                  <p className="text-sm text-muted-foreground">
                    {level.publishers} publishers, {level.modules} modules
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{formatCurrency(level.revenueCents)}</p>
                  <p className="text-muted-foreground">{level.averageRating.toFixed(1)} rating</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout And Review Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Completed payouts</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(analytics.payoutSummary.totalPayoutCents)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {analytics.payoutSummary.completedCount} payout runs completed
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Pending payouts</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(analytics.payoutSummary.pendingPayoutCents)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {analytics.reviewSummary.pending} reviews awaiting moderation
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Approved reviews</p>
              <p className="mt-2 text-2xl font-semibold">{analytics.reviewSummary.approved}</p>
              <p className="mt-1 text-sm text-muted-foreground">Rejected: {analytics.reviewSummary.rejected}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Active installs</p>
              <p className="mt-2 text-2xl font-semibold">{summary.activeInstalls}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {summary.activePublishers} active publishers this period
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Publishers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topPublishers.map((publisher, index) => (
              <div key={publisher.publisherId} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <p className="font-medium">{publisher.legalName}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {publisher.country} · {publisher.totalModules} modules · {publisher.totalInstalls} installs
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{formatCurrency(publisher.totalEarningsCents)}</p>
                  <p className="text-muted-foreground capitalize">
                    {formatVerificationLevel(publisher.verificationLevel)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.geographicPerformance.slice(0, 8).map((region) => (
              <div key={region.country} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{region.country}</p>
                    <p className="text-sm text-muted-foreground">
                      {region.publishers} publishers · {region.modules} modules
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p>{formatCurrency(region.revenueCents)}</p>
                  <p className="text-muted-foreground">{region.installs} installs</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.categoryPerformance.slice(0, 8).map((category) => (
              <div key={category.slug} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{category.category}</p>
                  <p className="text-sm text-muted-foreground">
                    {category.moduleCount} modules · {category.installs} installs
                  </p>
                </div>
                <p className="text-sm">{formatCurrency(category.revenueCents)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Modules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topModules.slice(0, 8).map((module) => (
              <div key={module.moduleId} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{module.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {module.publisherName} · {module.totalInstalls} installs
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{formatCurrency(module.revenueCents)}</p>
                  <p className="text-muted-foreground">{module.averageRating.toFixed(1)} rating</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Trend</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="py-3 pr-4 font-medium">Date</th>
                <th className="py-3 pr-4 font-medium">Revenue</th>
                <th className="py-3 pr-4 font-medium">Commission</th>
                <th className="py-3 pr-4 font-medium">Transactions</th>
                <th className="py-3 font-medium">Installs</th>
              </tr>
            </thead>
            <tbody>
              {analytics.transactionSeries.slice(-14).map((entry) => (
                <tr key={entry.date} className="border-b last:border-0">
                  <td className="py-3 pr-4">{entry.date}</td>
                  <td className="py-3 pr-4">{formatCurrency(entry.revenueCents)}</td>
                  <td className="py-3 pr-4">{formatCurrency(entry.commissionsCents)}</td>
                  <td className="py-3 pr-4">{entry.transactions}</td>
                  <td className="py-3">{entry.installs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
