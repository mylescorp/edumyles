"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { AlertTriangle, CheckCircle2, Package, Star } from "lucide-react";

const marketplacePlatformApi =
  (api as any).modules?.marketplace?.platformDashboard ??
  (api as any)["modules/marketplace/platformDashboard"];

function formatKes(amount?: number) {
  return `KES ${(amount ?? 0).toLocaleString()}`;
}

function formatDate(ts?: number) {
  if (!ts) return "N/A";
  return new Date(ts).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= Math.round(rating) ? "fill-yellow-500 text-yellow-500" : "text-slate-300"}`} />
      ))}
    </div>
  );
}

export default function PlatformMarketplaceModulePage() {
  const params = useParams();
  const router = useRouter();
  const { sessionToken, isLoading } = useAuth();
  const moduleId = params.moduleId as string;

  const detail = usePlatformQuery(
    marketplacePlatformApi.getPlatformMarketplaceModuleDetail,
    sessionToken ? { sessionToken, moduleId: moduleId as any } : "skip",
    !!sessionToken
  ) as any;

  if (isLoading || detail === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const moduleRecord = detail.module;

  return (
    <div className="space-y-6">
      <PageHeader
        title={moduleRecord.name}
        description="Marketplace module operations, pricing, versions, reviews, and install governance."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: moduleRecord.name },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push("/platform/marketplace/modules")}>Back to Modules</Button>
          </div>
        }
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/modules" />

      <Card className="border-slate-200/80 shadow-sm">
        <CardContent className="flex flex-col gap-4 pt-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">{moduleRecord.category.replace(/_/g, " ")}</Badge>
              <Badge variant={moduleRecord.status === "published" ? "default" : "secondary"}>{moduleRecord.status}</Badge>
              <Badge variant="outline">v{moduleRecord.version}</Badge>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">{moduleRecord.name}</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">{moduleRecord.description}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border bg-slate-50/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Base Rate</p>
                <p className="mt-1 font-semibold">{detail.pricing ? formatKes(detail.pricing.baseRateKes) : "Not set"}</p>
              </div>
              <div className="rounded-xl border bg-slate-50/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active Installs</p>
                <p className="mt-1 font-semibold">{detail.stats.activeInstalls.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border bg-slate-50/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Average Rating</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-semibold">{detail.stats.averageRating.toFixed(1)}</p>
                  <StarRating rating={detail.stats.averageRating} />
                </div>
              </div>
              <div className="rounded-xl border bg-slate-50/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Open Flags</p>
                <p className="mt-1 font-semibold">
                  {detail.flags.filter((flag: any) => ["flagged", "under_investigation"].includes(flag.status)).length.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="flags">Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Published</p><p className="text-xl font-semibold">{formatDate(moduleRecord.publishedAt)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Install Count</p><p className="text-xl font-semibold">{detail.stats.totalInstalls.toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Module Type</p><p className="text-xl font-semibold">{moduleRecord.isCore ? "Core" : "Marketplace"}</p></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Version Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {detail.versions.length > 0 ? detail.versions.map((version: any) => (
                <div key={String(version._id)} className="rounded-xl border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">v{version.version}</p>
                    <Badge variant="outline">{version.status}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(version.releasedAt || version.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{version.changelog || "No changelog provided."}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No versions recorded yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader><CardTitle>Pricing Bands</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {detail.pricing ? (
                  <>
                    <div className="rounded-xl border px-4 py-3"><p className="font-medium">Base</p><p className="text-sm text-muted-foreground">{formatKes(detail.pricing.baseRateKes)}</p></div>
                    <div className="rounded-xl border px-4 py-3"><p className="font-medium">Band 1</p><p className="text-sm text-muted-foreground">{formatKes(detail.pricing.band1Rate)}</p></div>
                    <div className="rounded-xl border px-4 py-3"><p className="font-medium">Band 2</p><p className="text-sm text-muted-foreground">{formatKes(detail.pricing.band2Rate)}</p></div>
                    <div className="rounded-xl border px-4 py-3"><p className="font-medium">Band 3</p><p className="text-sm text-muted-foreground">{formatKes(detail.pricing.band3Rate)}</p></div>
                  </>
                ) : <p className="text-sm text-muted-foreground">No pricing record yet.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Price History</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {detail.priceHistory.length > 0 ? detail.priceHistory.map((entry: any) => (
                  <div key={String(entry._id)} className="rounded-xl border px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{entry.reason || entry.changeType || "Platform update"}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(entry.changedAt || entry.createdAt)}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{formatKes(entry.oldPriceKes)} {"->"} {formatKes(entry.newPriceKes)}</p>
                      </div>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No pricing history recorded yet.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <div className="space-y-4">
            {detail.reviews.length > 0 ? detail.reviews.map((review: any) => (
              <Card key={String(review._id)}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} />
                      <span className="text-sm text-muted-foreground">{review.tenantId}</span>
                    </div>
                    <Badge variant="secondary">{review.status}</Badge>
                  </div>
                  <p className="text-sm font-medium">{review.title}</p>
                  <p className="text-sm">{review.body}</p>
                </CardContent>
              </Card>
            )) : <Card><CardContent className="pt-6 text-sm text-muted-foreground">No reviews yet.</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="flags" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Flags & Disputes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {detail.flags.length > 0 ? detail.flags.map((flag: any) => (
                <div key={String(flag._id)} className="flex items-start justify-between rounded-xl border px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{moduleRecord.name}</p>
                        <Badge variant="outline">{flag.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{flag.resolution || flag.reason}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{flag.tenantId}</p>
                    <p className="text-muted-foreground">{formatDate(flag.createdAt)}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No active flags or disputes for this module.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
