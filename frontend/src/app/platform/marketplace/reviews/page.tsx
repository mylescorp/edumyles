"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { CheckCircle2, Clock3, Search, Star, XCircle } from "lucide-react";
import { toast } from "sonner";

const marketplacePlatformApi =
  (api as any).modules?.marketplace?.platformDashboard ??
  (api as any)["modules/marketplace/platformDashboard"];

const STATUSES = ["all", "pending", "approved", "flagged", "deleted"] as const;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-yellow-500 text-yellow-500" : "text-slate-300"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewModerationPage() {
  const { sessionToken, isLoading } = useAuth();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("pending");
  const [search, setSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [moderationStatus, setModerationStatus] = useState<"approved" | "flagged" | "deleted">("deleted");

  const reviews = usePlatformQuery(
    marketplacePlatformApi.getPlatformMarketplaceReviews,
    sessionToken
      ? {
          sessionToken,
          ...(status !== "all" ? { status } : {}),
        }
      : "skip",
    !!sessionToken
  ) as any[] | undefined;

  const moderateReview = useMutation(api.modules.marketplace.reviews.moderateReview);

  const filteredReviews = useMemo(() => {
    const rows = reviews ?? [];
    if (!search.trim()) return rows;
    const query = search.toLowerCase();
    return rows.filter((review) =>
      [review.moduleName, review.tenantId, review.body ?? "", review.title ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [reviews, search]);

  const stats = useMemo(() => {
    const rows = reviews ?? [];
    return {
      total: rows.length,
      pending: rows.filter((review) => review.status === "pending").length,
      approved: rows.filter((review) => review.status === "approved").length,
      flagged: rows.filter((review) => review.status === "flagged").length,
    };
  }, [reviews]);

  async function handleModeration() {
    if (!sessionToken || !selectedReview) return;
    try {
      await moderateReview({
        sessionToken,
        reviewId: selectedReview._id,
        status: moderationStatus,
      });
      toast.success(`Review ${moderationStatus}`);
      setSelectedReview(null);
    } catch (error: any) {
      toast.error(error.message || "Unable to moderate review");
    }
  }

  if (isLoading || reviews === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Moderation"
        description="Moderate marketplace reviews from the new marketplace review store."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Reviews", href: "/platform/marketplace/reviews" },
        ]}
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/reviews" />

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Total reviews</p><p className="text-3xl font-semibold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Pending</p><p className="text-3xl font-semibold">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Approved</p><p className="text-3xl font-semibold">{stats.approved}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Flagged</p><p className="text-3xl font-semibold">{stats.flagged}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search module, tenant, or review text"
            />
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as (typeof STATUSES)[number])}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry === "all" ? "All statuses" : entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">
            <Clock3 className="mr-1 h-3 w-3" />
            {filteredReviews.length} visible
          </Badge>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="space-y-4 pt-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{review.moduleName}</h3>
                      <Badge variant="secondary">{review.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <StarRating rating={review.rating} />
                      <span>{review.tenantId}</span>
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => {
                      setSelectedReview(review);
                      setModerationStatus("approved");
                    }}>
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Moderate
                    </Button>
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-900">{review.title}</p>
                <p className="text-sm text-slate-700">{review.body}</p>

                {review.publisherReply ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                    <p className="font-medium text-slate-900">Publisher reply</p>
                    <p className="mt-1 text-slate-600">{review.publisherReply}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-700" />
              <p className="mt-4 text-base font-semibold text-slate-900">No reviews in this queue</p>
              <p className="mt-1 max-w-sm text-sm text-slate-600">
                Adjust the status filter or search term to find marketplace reviews to moderate.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={Boolean(selectedReview)} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderate Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
              <p className="font-medium text-slate-900">{selectedReview?.moduleName}</p>
              <p className="mt-1 text-slate-600">{selectedReview?.body}</p>
            </div>
            <div className="space-y-2">
              <Label>Moderation outcome</Label>
              <Select value={moderationStatus} onValueChange={(value) => setModerationStatus(value as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="flagged">Flag</SelectItem>
                  <SelectItem value="deleted">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>Cancel</Button>
            <Button
              variant={moderationStatus === "deleted" ? "destructive" : "default"}
              onClick={handleModeration}
            >
              {moderationStatus === "approved" ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
