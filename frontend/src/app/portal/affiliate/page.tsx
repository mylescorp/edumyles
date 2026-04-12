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
import { ArrowRight, MousePointerClick, TrendingUp, Users, Wallet } from "lucide-react";

type ResellerStats = {
  leads: { total: number; closedWon: number };
  commissions: { totalAmount: number; available: number };
  conversionRate?: number;
};

type CommissionBalance = {
  availableAmount: number;
  pendingAmount: number;
};

type ReferralAnalytics = {
  summary: {
    totalClicks: number;
    totalConversions: number;
    totalValue: number;
    conversionRate: number;
  };
  recentConversions: Array<{
    clickId: string;
    source: string;
    campaign?: string;
    conversionValue?: number;
    timestamp: number;
  }>;
};

export default function AffiliateDashboardPage() {
  const stats = useQuery(api.modules.reseller.mutations.profile.getStats, {}) as
    | ResellerStats
    | undefined;
  const balance = useQuery(
    api.modules.reseller.mutations.profile.getCommissionBalance,
    {}
  ) as CommissionBalance | undefined;
  const analytics = useQuery(api.modules.reseller.mutations.marketing.getReferralAnalytics, {
    period: "30d",
  }) as ReferralAnalytics | undefined;

  const recentConversions = useMemo(
    () => analytics?.recentConversions.slice(0, 5) ?? [],
    [analytics]
  );

  if (!stats || !balance || !analytics) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate Dashboard"
        description="Live affiliate performance from referral clicks, conversions, and commission records."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/portal/affiliate/referrals">View Referrals</Link>
            </Button>
            <Button asChild>
              <Link href="/portal/affiliate/marketing">Marketing Materials</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MousePointerClick className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Referral Clicks</p>
              <p className="text-2xl font-semibold">{analytics.summary.totalClicks}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-semibold">{analytics.summary.totalConversions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wallet className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Available Commission</p>
              <p className="text-2xl font-semibold">KES {balance.availableAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-8 w-8 text-sky-500" />
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-semibold">{analytics.summary.conversionRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Conversions</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/portal/affiliate/referrals">
                Open referrals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentConversions.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No conversions yet"
                description="Converted referral clicks will appear here as affiliate traffic starts converting."
              />
            ) : (
              <div className="space-y-3">
                {recentConversions.map((conversion) => (
                  <div key={conversion.clickId} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <p className="font-medium">{conversion.source}</p>
                      <p className="text-muted-foreground">
                        {conversion.campaign ?? "No campaign"} · {new Date(conversion.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-medium">
                      KES {(conversion.conversionValue ?? 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Pending</p>
              <p className="mt-1 text-xl font-semibold">KES {balance.pendingAmount.toLocaleString()}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Lifetime commission</p>
              <p className="mt-1 text-xl font-semibold">KES {stats.commissions.totalAmount.toLocaleString()}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Closed referrals</p>
              <p className="mt-1 text-xl font-semibold">{stats.leads.closedWon}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
