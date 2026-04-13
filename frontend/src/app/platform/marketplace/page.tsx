"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, BarChart3, ClipboardList, Flag, Package, Wallet } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useRouter } from "next/navigation";

const marketplacePlatformApi =
  (api as any).modules?.marketplace?.platformDashboard ??
  (api as any)["modules/marketplace/platformDashboard"];

const CHART_COLORS = ["#0f6b3e", "#1f8b56", "#46a56f", "#7cbf96"];

function formatKes(value: number) {
  return `KES ${Math.round(value).toLocaleString()}`;
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-emerald-700">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartFrame({
  children,
  className,
}: {
  children: (size: { width: number; height: number }) => React.ReactNode;
  className: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateSize = () => {
      const nextWidth = node.clientWidth;
      const nextHeight = node.clientHeight;
      setSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight }
      );
    };

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const isReady = size.width > 0 && size.height > 0;

  return (
    <div ref={containerRef} className={className}>
      {isReady ? children(size) : <div className="h-full rounded-xl bg-muted/40" />}
    </div>
  );
}

export default function PlatformMarketplaceOverviewPage() {
  const router = useRouter();
  const { sessionToken, isLoading } = useAuth();

  const data = usePlatformQuery(
    marketplacePlatformApi.getPlatformMarketplaceOverview,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as any;

  if (isLoading || data === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const stats = data.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        description="Platform-wide marketplace health, billing momentum, moderation load, and module adoption."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/platform/marketplace/modules")}>
              Modules
            </Button>
            <Button onClick={() => router.push("/platform/marketplace/billing")}>Billing</Button>
          </div>
        }
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Published Modules" value={stats.publishedModules.toLocaleString()} icon={<Package className="h-5 w-5" />} />
        <StatCard label="Active Installs" value={stats.activeInstalls.toLocaleString()} icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard label="MRR MTD" value={formatKes(stats.mrrKesMtd)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Pending Reviews" value={stats.pendingReviews.toLocaleString()} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Active Flags" value={stats.activeFlags.toLocaleString()} icon={<Flag className="h-5 w-5" />} />
        <StatCard label="Module Requests" value={stats.moduleRequests.toLocaleString()} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Install Growth</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartFrame className="h-[260px] min-w-0">
              {({ width, height }) => (
                <AreaChart width={width} height={height} data={data.installGrowth}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#0f6b3e" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0f6b3e" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="installs" stroke="#0f6b3e" fill="url(#growthGradient)" />
                </AreaChart>
              )}
            </ChartFrame>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Billing Period Mix</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartFrame className="h-[260px] min-w-0">
              {({ width, height }) => (
                <PieChart width={width} height={height}>
                  <Pie data={data.billingPeriodDistribution} dataKey="count" nameKey="billingPeriod" innerRadius={55} outerRadius={90}>
                    {data.billingPeriodDistribution.map((_: any, index: number) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              )}
            </ChartFrame>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Revenue by Module</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartFrame className="h-[280px] min-w-0">
              {({ width, height }) => (
                <BarChart width={width} height={height} data={data.revenueByModule} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatKes(Number(value ?? 0))} />
                  <Bar dataKey="revenueKes" radius={[8, 8, 8, 8]}>
                    {data.revenueByModule.map((_: any, index: number) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ChartFrame>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Module Churn</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartFrame className="h-[280px] min-w-0">
              {({ width, height }) => (
                <BarChart width={width} height={height} data={data.churn.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="installs" fill="#0f6b3e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="uninstalls" fill="#d97706" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ChartFrame>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Published Module Catalog</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/platform/marketplace/modules")}>
              View All Modules
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topModules.length > 0 ? data.topModules.slice(0, 6).map((module: any) => (
              <div key={module.moduleId} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                <div>
                  <p className="font-medium">{module.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {module.category} · {module.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={module.status === "published" ? "default" : "outline"}>
                    {module.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/platform/marketplace/${module.moduleId}`)}
                  >
                    Open
                  </Button>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No published marketplace modules are available yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Pending Reviews</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/platform/marketplace/reviews")}>
              Open Queue
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendingReviewItems.length > 0 ? data.pendingReviewItems.map((review: any) => (
              <div key={review.reviewId} className="rounded-xl border px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{review.moduleName}</p>
                    <p className="text-sm text-muted-foreground">{review.title}</p>
                  </div>
                  <Badge variant="secondary">{review.rating}/5</Badge>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No pending reviews right now.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Active Flags</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/platform/marketplace/flags")}>
              Open Flags
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activeFlagItems.length > 0 ? data.activeFlagItems.map((flag: any) => (
              <div key={flag.flagId} className="rounded-xl border px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{flag.moduleName}</p>
                    <p className="text-sm text-muted-foreground">{flag.reason.replace(/_/g, " ")}</p>
                  </div>
                  <Badge variant="outline">{flag.status.replace(/_/g, " ")}</Badge>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No active flags right now.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
