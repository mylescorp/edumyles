"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  Clock3,
  Download,
  Package,
  PieChart as PieChartIcon,
  ShieldAlert,
  Sparkles,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { MarketplaceErrorBoundary } from "./MarketplaceErrorBoundary";

const CATEGORY_LABELS: Record<string, string> = {
  academic_tools: "Academic",
  communication: "Communication",
  finance_fees: "Finance",
  analytics_bi: "Analytics",
  content_packs: "Content",
  integrations: "Integrations",
  ai_automation: "AI",
  accessibility: "Accessibility",
  administration: "Administration",
  security_compliance: "Security",
};

const CHART_COLORS = ["#0F6B3E", "#2A8A57", "#52A77A", "#7FC29E", "#A8D9BE"];

function formatKes(value: number) {
  return `KES ${Math.round(value).toLocaleString()}`;
}

function formatDateLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-KE", { month: "short", day: "numeric" });
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

function EmptyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200/70 bg-emerald-50/30 px-6 py-8 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{body}</p>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-600">{description}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-2.5 text-emerald-700 shadow-sm">
          <div className="h-5 w-5">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketplaceTooltip({
  active,
  payload,
  label,
  currency = false,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      {label ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p> : null}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color || "#0F6B3E" }}
              />
              <span>{entry.name}</span>
            </div>
            <span className="font-semibold text-slate-950">
              {currency ? formatKes(entry.value || 0) : (entry.value || 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <MarketplaceErrorBoundary>
      <MarketplaceDashboardContent />
    </MarketplaceErrorBoundary>
  );
}

function MarketplaceDashboardContent() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [renderTimestamp] = useState(() => Date.now());

  const overview = usePlatformQuery(
    api.platform.marketplace.queries.getMarketplaceOverview,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  ) as any;

  const pendingModules = usePlatformQuery(
    api.platform.marketplace.queries.getPendingModules,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  ) as any[] | undefined;

  const disputes = usePlatformQuery(
    api.platform.marketplace.queries.getDisputes,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  ) as any[] | undefined;

  if (!overview || !pendingModules || !disputes) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Marketplace"
          description="Marketplace performance, review queue, module adoption, and publisher oversight."
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "Marketplace", href: "/platform/marketplace" },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-[360px] rounded-2xl xl:col-span-2" />
          <Skeleton className="h-[360px] rounded-2xl" />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-[360px] rounded-2xl" />
          <Skeleton className="h-[360px] rounded-2xl" />
        </div>
      </div>
    );
  }

  const admin = overview.overview ?? {};
  const topModules = overview.topModules ?? [];
  const recentActivity = overview.recentActivity ?? [];
  const categories = overview.categories ?? [];
  const openFlags = disputes.filter((item) => item.status === "open");

  const installsOverTime = Array.from({ length: 7 }).map((_, index) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (6 - index));
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const installs = recentActivity.filter(
      (item: any) =>
        item.type === "install" && item.createdAt >= start.getTime() && item.createdAt < end.getTime()
    ).length;

    return {
      day: formatDateLabel(start.getTime()),
      installs,
    };
  });

  const revenueByCategory = categories
    .map((category: any) => ({
      name: CATEGORY_LABELS[category.slug] || category.name,
      revenueKes: Math.round((category.installCount || 0) * 1250),
    }))
    .filter((category: any) => category.revenueKes > 0)
    .slice(0, 6);

  const installedModules = topModules.slice(0, 10).map((mod: any) => ({
    name: mod.name,
    installs: mod.totalInstalls || 0,
    reviews: mod.totalReviews || 0,
  }));

  const compactTopModules = topModules.slice(0, 5);

  const publishedThisWeek = topModules.filter((mod: any) => {
    if (!mod.publishedAt) return false;
    return renderTimestamp - mod.publishedAt <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        description="Marketplace performance, review queue, module adoption, and publisher oversight."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/platform/marketplace/publishers")}>
              Publishers
            </Button>
            <Button onClick={() => router.push("/platform/marketplace/admin")}>
              Review Queue
            </Button>
          </div>
        }
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace" />

      <div className="grid gap-4 lg:grid-cols-4">
        <StatsCard
          title="Published"
          value={(admin.publishedModules || 0).toLocaleString()}
          description="Live published catalog"
          icon={<Package className="h-5 w-5" />}
        />
        <StatsCard
          title="Installs"
          value={(admin.activeInstallations || 0).toLocaleString()}
          description="Active tenant installs"
          icon={<Download className="h-5 w-5" />}
        />
        <StatsCard
          title="Revenue"
          value={formatKes((admin.totalRevenueCents || 0) / 100)}
          description="Marketplace gross revenue"
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatsCard
          title="Platform Share"
          value={formatKes((admin.totalCommissionCents || 0) / 100)}
          description="Commission retained"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatsCard
          title="Pending Reviews"
          value={(pendingModules.length || 0).toLocaleString()}
          description="Awaiting moderation"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatsCard
          title="Active Flags"
          value={openFlags.length.toLocaleString()}
          description="Open disputes and flags"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <StatsCard
          title="New This Week"
          value={publishedThisWeek.toLocaleString()}
          description="Published in the last 7 days"
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Installs Over Time</CardTitle>
            <CardDescription>Last 7 days of recorded marketplace install activity.</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            {installsOverTime.some((point) => point.installs > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={installsOverTime}>
                  <defs>
                    <linearGradient id="installsGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#0F6B3E" stopOpacity={0.34} />
                      <stop offset="100%" stopColor="#0F6B3E" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip content={<MarketplaceTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="installs"
                    stroke="transparent"
                    fill="url(#installsGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="installs"
                    stroke="#0F6B3E"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#0F6B3E" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyBlock
                title="No install activity yet"
                body="Install trend lines will appear here once tenants start adding marketplace modules."
              />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Review Queue Preview</CardTitle>
              <CardDescription>Oldest pending submissions first.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/platform/marketplace/admin")}>
              See all
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingModules.length > 0 ? (
              pendingModules.slice(0, 5).map((module: any) => (
                <button
                  key={module._id}
                  className="flex w-full items-start justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  onClick={() => router.push("/platform/marketplace/admin")}
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{module.name}</p>
                    <p className="truncate text-xs text-slate-600">{module.publisherName}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {(module.category || "module").replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="secondary">{module.status.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                  <div className="ml-4 shrink-0 text-right text-xs text-slate-500">
                    <p>{formatRelativeTime(module.createdAt)}</p>
                    <p className="mt-1 font-medium text-amber-700">
                      {Math.max(0, Math.floor((renderTimestamp - module.createdAt) / 86400000))}d waiting
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <EmptyBlock
                title="No pending submissions"
                body="The review queue is clear right now."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Live category performance derived from current install demand.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {revenueByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByCategory} layout="vertical" margin={{ left: 16, right: 8 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<MarketplaceTooltip currency />} />
                  <Bar dataKey="revenueKes" radius={[8, 8, 8, 8]}>
                    {revenueByCategory.map((_: any, index: number) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyBlock
                title="Category revenue will appear here"
                body="Once paid installs begin to accumulate, category-level revenue trends will populate this chart."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Installed Modules</CardTitle>
            <CardDescription>Top tenant-adopted modules across the marketplace.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {installedModules.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={installedModules} layout="vertical" margin={{ left: 32, right: 8 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={130} />
                  <Tooltip content={<MarketplaceTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="installs" fill="#0F6B3E" radius={[8, 8, 8, 8]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyBlock
                title="No installed modules yet"
                body="Top adoption will appear here once modules are installed by tenant schools."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Flags Requiring Attention</CardTitle>
              <CardDescription>Open disputes and issue reports waiting on platform follow-up.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/platform/marketplace/flags")}>
              Open Flags
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {openFlags.length > 0 ? (
              openFlags.slice(0, 5).map((flag: any) => (
                <div
                  key={flag._id}
                  className="flex items-start justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <p className="truncate text-sm font-semibold text-slate-900">{flag.moduleName}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{flag.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {flag.type.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="secondary">{flag.status}</Badge>
                    </div>
                  </div>
                  <div className="ml-4 shrink-0 text-right text-xs text-slate-500">
                    <p>{formatRelativeTime(flag.createdAt)}</p>
                    <p className="mt-1">{flag.filedByEmail}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyBlock
                title="No active flags"
                body="Open publisher disputes or moderation flags will appear here."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Top Installed Modules</CardTitle>
              <CardDescription>Quick view of adoption and review strength.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/platform/marketplace/publishers")}>
              Publisher View
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {compactTopModules.length > 0 ? (
              compactTopModules.map((module: any) => (
                <button
                  key={module.moduleId}
                  type="button"
                  onClick={() => router.push(`/platform/marketplace/${module.moduleId}`)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2 text-emerald-700">
                      <PieChartIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{module.name}</p>
                      <p className="text-xs text-slate-600">{module.publisherName}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-slate-950">{(module.totalInstalls || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{(module.totalReviews || 0).toLocaleString()} reviews</p>
                  </div>
                </button>
              ))
            ) : (
              <EmptyBlock
                title="No installed modules yet"
                body="Top adoption and rating highlights will appear here once schools begin installing modules."
              />
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
