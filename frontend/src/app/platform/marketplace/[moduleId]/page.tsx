"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { MarketplaceErrorBoundary } from "../MarketplaceErrorBoundary";
import { toast } from "sonner";
import { AlertTriangle, Building, CheckCircle2, ExternalLink, Star, ThumbsDown, ThumbsUp } from "lucide-react";

function formatDate(ts?: number) {
  if (!ts) return "N/A";
  return new Date(ts).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

function formatKes(amount?: number) {
  return `KES ${(amount ?? 0).toLocaleString()}`;
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
  return (
    <MarketplaceErrorBoundary>
      <ModuleAdminPageContent />
    </MarketplaceErrorBoundary>
  );
}

function ModuleAdminPageContent() {
  const params = useParams();
  const router = useRouter();
  const { sessionToken, isLoading } = useAuth();
  const moduleId = params.moduleId as string;

  const [tab, setTab] = useState("overview");
  const [adminNotes, setAdminNotes] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [priceOverrideKes, setPriceOverrideKes] = useState("");
  const [priceReason, setPriceReason] = useState("");
  const [reviewToModerate, setReviewToModerate] = useState<any>(null);

  const detail = usePlatformQuery(
    api.platform.marketplace.queries.getModuleDetail,
    sessionToken ? { sessionToken, moduleId } : "skip"
  ) as any;

  const disputes = usePlatformQuery(
    api.platform.marketplace.queries.getDisputes,
    sessionToken ? { sessionToken } : "skip"
  ) as any[] | undefined;

  const pricingHistory = usePlatformQuery(
    api.modules.platform.ops.getMarketplaceModulePricingHistory,
    sessionToken ? { sessionToken, moduleId } : "skip"
  ) as any[] | undefined;

  const reviewModule = useMutation(api.platform.marketplace.mutations.reviewModule);
  const publishModule = useMutation(api.platform.marketplace.mutations.publishModule);
  const suspendModule = useMutation(api.platform.marketplace.mutations.suspendModule);
  const moderateReview = useMutation(api.platform.marketplace.mutations.moderateReview);
  const upsertMarketplaceModulePricingOverride = useMutation(api.modules.platform.ops.upsertMarketplaceModulePricingOverride);
  const deleteMarketplaceModulePricingOverride = useMutation(api.modules.platform.ops.deleteMarketplaceModulePricingOverride);

  const moduleFlags = useMemo(() => (disputes ?? []).filter((entry) => entry.moduleId === moduleId), [disputes, moduleId]);

  if (!detail || disputes === undefined || pricingHistory === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const moduleRecord = detail.module;
  const publisher = detail.publisher;
  const versions = detail.versions ?? [];
  const reviews = detail.reviews ?? [];
  const installStats = detail.installStats ?? { total: 0, active: 0 };
  const priceKes =
    typeof moduleRecord.effectivePriceKes === "number"
      ? moduleRecord.effectivePriceKes
      : Math.round((moduleRecord.priceCents ?? 0) / 100);

  const handleModuleDecision = async (decision: "approved" | "rejected" | "requires_changes") => {
    if (!sessionToken) return;
    try {
      await reviewModule({ sessionToken, moduleId, decision, notes: adminNotes || undefined });
      toast.success(`Module ${decision.replace(/_/g, " ")}`);
      setAdminNotes("");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to update module status");
    }
  };

  const handlePublish = async () => {
    if (!sessionToken) return;
    try {
      await publishModule({ sessionToken, moduleId });
      toast.success("Module published");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to publish module");
    }
  };

  const handleSuspend = async () => {
    if (!sessionToken || !suspendReason.trim()) return;
    try {
      await suspendModule({ sessionToken, moduleId, reason: suspendReason.trim() });
      toast.success("Module suspended");
      setSuspendReason("");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to suspend module");
    }
  };

  const handleSaveOverride = async () => {
    if (!sessionToken || !priceOverrideKes) return;
    try {
      await upsertMarketplaceModulePricingOverride({
        sessionToken,
        moduleId,
        priceKes: Number(priceOverrideKes),
        reason: priceReason || undefined,
      });
      toast.success("Price override saved");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to save override");
    }
  };

  const handleClearOverride = async () => {
    if (!sessionToken) return;
    try {
      await deleteMarketplaceModulePricingOverride({ sessionToken, moduleId });
      toast.success("Price override removed");
      setPriceOverrideKes("");
      setPriceReason("");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to clear override");
    }
  };

  const handleModerateReview = async (decision: "approved" | "rejected") => {
    if (!sessionToken || !reviewToModerate) return;
    try {
      await moderateReview({
        sessionToken,
        reviewId: reviewToModerate._id,
        decision,
        rejectionReason: decision === "rejected" ? adminNotes || "Rejected by platform admin" : undefined,
      });
      toast.success(`Review ${decision}`);
      setReviewToModerate(null);
      setAdminNotes("");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to moderate review");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={moduleRecord.name}
        description="Marketplace module operations, pricing, moderation, and install governance."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: moduleRecord.name },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push("/platform/marketplace/admin")}>Back to Queue</Button>
            {publisher ? (
              <Button variant="outline" onClick={() => router.push(`/platform/marketplace/publishers/${publisher._id}`)}>
                Publisher
              </Button>
            ) : null}
          </div>
        }
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/module" />

      <Card className="border-slate-200/80 shadow-sm">
        <CardContent className="flex flex-col gap-4 pt-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">{moduleRecord.category.replace(/_/g, " ")}</Badge>
              <Badge variant="secondary">{moduleRecord.status || "published"}</Badge>
              <Badge variant="outline">v{moduleRecord.version}</Badge>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">{moduleRecord.name}</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">{moduleRecord.shortDescription}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border bg-slate-50/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Price</p>
                <p className="mt-1 font-semibold">{formatKes(priceKes)}</p>
              </div>
              <div className="rounded-xl border bg-slate-50/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active Installs</p>
                <p className="mt-1 font-semibold">{installStats.active.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border bg-slate-50/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Approved Reviews</p>
                <p className="mt-1 font-semibold">{reviews.length.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border bg-slate-50/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Open Flags</p>
                <p className="mt-1 font-semibold">{moduleFlags.length.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => handleModuleDecision("approved")}>Approve</Button>
            <Button variant="outline" onClick={() => handleModuleDecision("requires_changes")}>Request Changes</Button>
            <Button onClick={handlePublish}>Publish</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-sm text-slate-700">{moduleRecord.fullDescription}</p>
            {moduleRecord.featureHighlights?.length ? (
              <div className="grid gap-2 md:grid-cols-2">
                {moduleRecord.featureHighlights.map((feature: string) => (
                  <div key={feature} className="flex items-start gap-2 rounded-xl border px-3 py-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {moduleRecord.documentationUrl ? (
              <Button variant="outline" asChild>
                <a href={moduleRecord.documentationUrl} target="_blank" rel="noreferrer">
                  Documentation
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Admin Controls</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Reviewer Notes</Label>
              <Textarea rows={4} value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Suspend Reason</Label>
              <Input value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)} />
              <Button variant="outline" className="w-full" onClick={handleSuspend} disabled={!suspendReason.trim()}>
                Suspend Module
              </Button>
            </div>
            {publisher ? (
              <div className="rounded-xl border bg-slate-50/70 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{publisher.legalName}</p>
                    <p className="text-sm text-muted-foreground">{publisher.contactEmail}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="flags">Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Published</p><p className="text-xl font-semibold">{formatDate(moduleRecord.publishedAt)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pricing model</p><p className="text-xl font-semibold capitalize">{moduleRecord.pricingModel.replace(/_/g, " ")}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Security reviewed</p><p className="text-xl font-semibold">{moduleRecord.isSecurityReviewed ? "Yes" : "No"}</p></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Version Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {versions.length > 0 ? versions.map((version: any) => (
                <div key={String(version._id)} className="rounded-xl border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">v{version.version}</p>
                    <Badge variant="outline">{version.status}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(version.publishedAt || version.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{version.releaseNotes}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No versions recorded yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader><CardTitle>Pricing Override</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-slate-50/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Effective price</p>
                  <p className="mt-1 text-2xl font-semibold">{formatKes(priceKes)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Override Price (KES)</Label>
                  <Input value={priceOverrideKes} onChange={(event) => setPriceOverrideKes(event.target.value)} placeholder={String(priceKes)} />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea rows={3} value={priceReason} onChange={(event) => setPriceReason(event.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSaveOverride} disabled={!priceOverrideKes}>Save Override</Button>
                  <Button variant="outline" onClick={handleClearOverride}>Clear Override</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Price History</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {pricingHistory.length > 0 ? pricingHistory.map((entry) => (
                  <div key={String(entry._id)} className="rounded-xl border px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{entry.reason || "Platform override"}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(entry.changedAt)}</p>
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
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div>
                  <p className="text-4xl font-semibold">{moduleRecord.averageRating.toFixed(1)}</p>
                  <div className="mt-1"><StarRating rating={moduleRecord.averageRating} /></div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{moduleRecord.totalReviews} approved reviews</p>
                  <p>Moderate review quality and protect trust.</p>
                </div>
              </CardContent>
            </Card>
            {reviews.length > 0 ? reviews.map((review: any) => (
              <Card key={String(review._id)}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} />
                      <span className="text-sm text-muted-foreground">{review.reviewerEmail}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="text-sm">{review.content}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setReviewToModerate(review)}>Moderate</Button>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground"><ThumbsUp className="h-3 w-3" /> {review.helpfulVotes}</button>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground"><ThumbsDown className="h-3 w-3" /> {review.unhelpfulVotes}</button>
                  </div>
                </CardContent>
              </Card>
            )) : <Card><CardContent className="pt-6 text-sm text-muted-foreground">No approved reviews yet.</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="flags" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Flags & Disputes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {moduleFlags.length > 0 ? moduleFlags.map((flag: any) => (
                <div key={String(flag._id)} className="flex items-start justify-between rounded-xl border px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{flag.moduleName || moduleRecord.name}</p>
                        <Badge variant="outline">{flag.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{flag.filedByEmail || "Unknown reporter"}</p>
                    <p className="text-muted-foreground">{formatDate(flag.createdAt)}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No active flags or disputes for this module.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(reviewToModerate)} onOpenChange={(open) => !open && setReviewToModerate(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Moderate Review</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border bg-slate-50/70 px-4 py-3 text-sm">
              <p className="font-medium">{reviewToModerate?.reviewerEmail}</p>
              <p className="mt-1 text-muted-foreground">{reviewToModerate?.content}</p>
            </div>
            <div className="space-y-2">
              <Label>Moderation Notes</Label>
              <Textarea rows={4} value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewToModerate(null)}>Cancel</Button>
            <Button variant="outline" onClick={() => handleModerateReview("approved")}>Approve</Button>
            <Button variant="destructive" onClick={() => handleModerateReview("rejected")}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
