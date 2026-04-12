"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe2, MousePointerClick, TrendingUp, Users, Wallet } from "lucide-react";

type ReferralAnalytics = {
  summary: {
    totalClicks: number;
    totalConversions: number;
    totalValue: number;
    conversionRate: number;
  };
  dailyData: Array<{
    date: string;
    clicks: number;
    conversions: number;
    conversionValue: number;
  }>;
  bySource: Record<string, { clicks: number; conversions: number; value: number }>;
};

export default function AffiliateAnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const analytics = useQuery(api.modules.reseller.mutations.marketing.getReferralAnalytics, {
    period,
  }) as ReferralAnalytics | undefined;

  const topSources = useMemo(
    () =>
      Object.entries(analytics?.bySource ?? {})
        .map(([source, value]) => ({ source, ...value }))
        .sort((a, b) => b.value - a.value),
    [analytics]
  );

  const performanceTrend = useMemo(() => {
    const data = analytics?.dailyData ?? [];
    if (data.length === 0) return [];
    return data.slice(-10);
  }, [analytics]);

  if (!analytics) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate Analytics"
        description="Live referral analytics, source attribution, and conversion value."
        actions={
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="flex items-center gap-3 p-4"><MousePointerClick className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Clicks</p><p className="text-2xl font-semibold">{analytics.summary.totalClicks}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Users className="h-8 w-8 text-emerald-500" /><div><p className="text-sm text-muted-foreground">Conversions</p><p className="text-2xl font-semibold">{analytics.summary.totalConversions}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Wallet className="h-8 w-8 text-amber-500" /><div><p className="text-sm text-muted-foreground">Conversion Value</p><p className="text-2xl font-semibold">KES {analytics.summary.totalValue.toLocaleString()}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><TrendingUp className="h-8 w-8 text-sky-500" /><div><p className="text-sm text-muted-foreground">Rate</p><p className="text-2xl font-semibold">{analytics.summary.conversionRate.toFixed(1)}%</p></div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Sources</CardTitle></CardHeader>
          <CardContent>
            {topSources.length === 0 ? <EmptyState icon={Globe2} title="No source data" description="Traffic sources will appear once referrals are tracked." /> : (
              <div className="space-y-3">
                {topSources.map((source) => (
                  <div key={source.source} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <p className="font-medium">{source.source}</p>
                      <p className="text-muted-foreground">{source.clicks} clicks · {source.conversions} conversions</p>
                    </div>
                    <p className="font-medium">KES {source.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Trend</CardTitle></CardHeader>
          <CardContent>
            {performanceTrend.length === 0 ? <EmptyState icon={TrendingUp} title="No trend data" description="Trend data appears as referral traffic is recorded." /> : (
              <div className="space-y-3">
                {performanceTrend.map((day) => (
                  <div key={day.date} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <p className="font-medium">{day.date}</p>
                      <p className="text-muted-foreground">{day.clicks} clicks · {day.conversions} conversions</p>
                    </div>
                    <p className="font-medium">KES {day.conversionValue.toLocaleString()}</p>
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
