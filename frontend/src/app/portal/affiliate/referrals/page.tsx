"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MousePointerClick, Search, Users, Wallet } from "lucide-react";

type ReferralClick = {
  clickId: string;
  source: string;
  campaign?: string;
  referrer?: string;
  landingPage: string;
  converted: boolean;
  conversionValue?: number;
  timestamp: number;
};

export default function AffiliateReferralsPage() {
  const [search, setSearch] = useState("");
  const clicks = useQuery((api as any)["modules/reseller/queries/referrals"].getReferralClicks, { limit: 200 }) as
    | ReferralClick[]
    | undefined;

  const filtered = useMemo(
    () =>
      (clicks ?? []).filter((click) =>
        [click.source, click.campaign ?? "", click.referrer ?? "", click.landingPage]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [clicks, search]
  );

  const stats = useMemo(
    () => ({
      total: (clicks ?? []).length,
      converted: (clicks ?? []).filter((click) => click.converted).length,
      value: (clicks ?? []).reduce((sum, click) => sum + (click.conversionValue ?? 0), 0),
    }),
    [clicks]
  );

  if (!clicks) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Referrals" description="Live affiliate referral click and conversion activity." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><MousePointerClick className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Clicks</p><p className="text-2xl font-semibold">{stats.total}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Users className="h-8 w-8 text-emerald-500" /><div><p className="text-sm text-muted-foreground">Converted</p><p className="text-2xl font-semibold">{stats.converted}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Wallet className="h-8 w-8 text-amber-500" /><div><p className="text-sm text-muted-foreground">Value</p><p className="text-2xl font-semibold">KES {stats.value.toLocaleString()}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Referral Activity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search referrals..." className="max-w-xl" />
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="No referrals found" description="Referral activity will appear here as traffic is tracked." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Source</th>
                    <th className="py-3 pr-4 font-medium">Campaign</th>
                    <th className="py-3 pr-4 font-medium">Landing Page</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Value</th>
                    <th className="py-3 pr-4 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((click) => (
                    <tr key={click.clickId} className="border-b last:border-0">
                      <td className="py-4 pr-4">{click.source}</td>
                      <td className="py-4 pr-4">{click.campaign ?? "No campaign"}</td>
                      <td className="py-4 pr-4">{click.landingPage}</td>
                      <td className="py-4 pr-4">
                        <Badge variant={click.converted ? "default" : "outline"}>
                          {click.converted ? "Converted" : "Tracked"}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4">KES {(click.conversionValue ?? 0).toLocaleString()}</td>
                      <td className="py-4 pr-4">{new Date(click.timestamp).toLocaleString()}</td>
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
