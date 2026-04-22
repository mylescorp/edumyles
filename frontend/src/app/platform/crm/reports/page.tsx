"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/convex/_generated/api";
import { CrmAdminRail } from "@/components/platform/CrmAdminRail";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { BarChart3 } from "lucide-react";

type CRMReports = {
  totals: {
    leads: number;
    pipelineValueKes: number;
    wonValueKes: number;
  };
  stageBreakdown: Array<{ name: string; value: number }>;
  countryBreakdown: Array<{ name: string; value: number }>;
  ownerValueBreakdown: Array<{ name: string; value: number }>;
  monthlyLeadCreation: Array<{ month: string; value: number }>;
};

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CRMReportsPage() {
  const { sessionToken } = useAuth();
  const reports = usePlatformQuery(
    api.modules.platform.crm.getCRMReports,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as CRMReports | undefined;

  const hasData = useMemo(
    () => Boolean((reports?.stageBreakdown.length ?? 0) || (reports?.monthlyLeadCreation.length ?? 0)),
    [reports]
  );

  if (!sessionToken || reports === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Reports"
        description="Commercial visibility from live Convex data only: stages, geography, ownership, and creation velocity."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM", href: "/platform/crm" },
          { label: "Reports" },
        ]}
      />
      <CrmAdminRail currentHref="/platform/crm/reports" />

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Lead volume" value={reports.totals.leads} />
        <Metric label="Pipeline value" value={formatKes(reports.totals.pipelineValueKes)} />
        <Metric label="Won value" value={formatKes(reports.totals.wonValueKes)} />
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState icon={BarChart3} title="Not enough CRM data yet" description="Reports will populate as leads and proposals move through the pipeline." />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard title="Leads by stage" data={reports.stageBreakdown} dataKey="value" />
          <ChartCard title="Lead creation by month" data={reports.monthlyLeadCreation} dataKey="value" xKey="month" />
          <ChartCard title="Lead distribution by country" data={reports.countryBreakdown} dataKey="value" />
          <ChartCard title="Pipeline value by owner" data={reports.ownerValueBreakdown} dataKey="value" />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  data,
  dataKey,
  xKey = "name",
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  xKey?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey={dataKey} fill="#0f766e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
