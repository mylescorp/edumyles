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
import { BarChart3, Building2, Globe, School, Users, Wallet } from "lucide-react";

type ResellerAnalytics = {
  period: "7d" | "30d" | "90d" | "1y";
  summary: {
    totalPartners: number;
    activePartners: number;
    totalSchools: number;
    convertedSchools: number;
    totalCommissionKes: number;
    availableCommissionKes: number;
    totalPayoutKes: number;
    pipelineValueKes: number;
  };
  tierPerformance: Array<{
    tier: "starter" | "silver" | "gold" | "platinum";
    partners: number;
    activePartners: number;
    schools: number;
    convertedSchools: number;
    commissionKes: number;
  }>;
  topPartners: Array<{
    resellerId: string;
    businessName: string;
    applicantType: "reseller" | "affiliate";
    tier: string;
    status: string;
    country: string;
    schools: number;
    convertedSchools: number;
    commissionKes: number;
  }>;
  geographicPerformance: Array<{
    country: string;
    partners: number;
    activePartners: number;
    schools: number;
    convertedSchools: number;
    commissionKes: number;
  }>;
  applicationFunnel: {
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
    onHold: number;
  };
  performanceSeries: Array<{
    date: string;
    commissionKes: number;
    schoolsAssigned: number;
    convertedSchools: number;
  }>;
};

function formatMoney(amount: number) {
  return `KES ${amount.toLocaleString()}`;
}

export default function PlatformResellerAnalytics() {
  const { isLoading, sessionToken } = useAuth();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  const analytics = useQuery(
    api.platform.resellers.queries.getResellerAnalytics,
    sessionToken ? { sessionToken, period } : "skip"
  ) as ResellerAnalytics | undefined;

  if (isLoading || !analytics) {
    return <LoadingSkeleton variant="page" />;
  }

  const { summary } = analytics;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reseller Analytics"
        description="Live reseller and affiliate program analytics aggregated from Convex schools, commissions, payouts, and applications."
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
        <AdminStatsCard title="Partners" value={summary.totalPartners} icon={Users} />
        <AdminStatsCard title="Active" value={summary.activePartners} icon={Building2} />
        <AdminStatsCard title="Schools" value={summary.totalSchools} icon={School} />
        <AdminStatsCard title="Converted" value={summary.convertedSchools} icon={BarChart3} />
        <AdminStatsCard title="Commission" value={formatMoney(summary.totalCommissionKes)} icon={Wallet} />
        <AdminStatsCard title="Pipeline" value={formatMoney(summary.pipelineValueKes)} icon={Wallet} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tier Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.tierPerformance.map((tier) => (
              <div key={tier.tier} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium capitalize">{tier.tier}</p>
                  <p className="text-sm text-muted-foreground">
                    {tier.partners} partners · {tier.schools} schools
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{formatMoney(tier.commissionKes)}</p>
                  <p className="text-muted-foreground">{tier.convertedSchools} converted</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Funnel</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="mt-2 text-2xl font-semibold">{analytics.applicationFunnel.submitted}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Under review</p>
              <p className="mt-2 text-2xl font-semibold">{analytics.applicationFunnel.underReview}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="mt-2 text-2xl font-semibold">{analytics.applicationFunnel.approved}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Rejected / On hold</p>
              <p className="mt-2 text-2xl font-semibold">
                {analytics.applicationFunnel.rejected + analytics.applicationFunnel.onHold}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Partners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topPartners.map((partner, index) => (
              <div key={partner.resellerId} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <p className="font-medium">{partner.businessName}</p>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {partner.country} · {partner.tier} · {partner.applicantType}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{formatMoney(partner.commissionKes)}</p>
                  <p className="text-muted-foreground">{partner.convertedSchools} converted schools</p>
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
                      {region.partners} partners · {region.schools} schools
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p>{formatMoney(region.commissionKes)}</p>
                  <p className="text-muted-foreground">{region.convertedSchools} converted</p>
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
                <th className="py-3 pr-4 font-medium">Commission</th>
                <th className="py-3 pr-4 font-medium">Schools Assigned</th>
                <th className="py-3 font-medium">Converted</th>
              </tr>
            </thead>
            <tbody>
              {analytics.performanceSeries.slice(-14).map((entry) => (
                <tr key={entry.date} className="border-b last:border-0">
                  <td className="py-3 pr-4">{entry.date}</td>
                  <td className="py-3 pr-4">{formatMoney(entry.commissionKes)}</td>
                  <td className="py-3 pr-4">{entry.schoolsAssigned}</td>
                  <td className="py-3">{entry.convertedSchools}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
