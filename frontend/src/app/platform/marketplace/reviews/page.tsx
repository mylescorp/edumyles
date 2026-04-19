"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { CheckCircle2, Clock3, Search, Star, XCircle } from "lucide-react";

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
          className={`h-4 w-4 ${i <= rating ? "fill-yellow-500 text-yellow-500" : "text-slate-300"}`}
        />
      ))}
    </div>
  );
}


function formatStatusLabel(value: (typeof STATUSES)[number]) {
  if (value === "all") return "All statuses";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ReviewModerationPage() {
  const { sessionToken, isLoading } = useAuth();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("pending");
  const [search, setSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [moderationStatus, setModerationStatus] = useState<"approved" | "flagged" | "deleted">("deleted");

  const reviews = usePlatformQuery(
    api.platform.marketplace.queries.getAllMarketplaceReviews,
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
      [review.moduleName, review.publisherName, review.reviewerEmail ?? "", review.content ?? "", review.title ?? ""]
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
      rejected: rows.filter((review) => review.status === "rejected").length,
    };
  }, [reviews]);

  async function handleModeration(review: any, decision: "approved" | "rejected") {
    if (!sessionToken) return;
    try {
      await moderateReview({
        sessionToken,
        reviewId: review._id,
        decision,
        rejectionReason: decision === "rejected" ? rejectionReason || "Rejected by moderator" : undefined,
      });
      setSelectedReview(null);
      setRejectionReason("");
      toast.success(decision === "approved" ? "Review approved" : "Review rejected");
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
        description="Moderate marketplace reviews, approve strong feedback, and reject low-quality submissions."
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
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Rejected</p><p className="text-3xl font-semibold">{stats.rejected}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Queue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search module, publisher, reviewer, or text"
            />
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as (typeof STATUSES)[number])}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
              <SelectContent>
                {STATUSES.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {formatStatusLabel(entry)}
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
                      <Badge variant="outline">{review.publisherName}</Badge>
                      <Badge variant="secondary">{review.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <StarRating rating={review.rating} />
                      <span>{review.reviewerEmail || "Anonymous reviewer"}</span>
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {review.status !== "approved" ? (
                      <Button size="sm" onClick={() => handleModeration(review, "approved")}>
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                    ) : null}
                    {review.status !== "rejected" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReview(review);
                          setRejectionReason(review.rejectionReason || "");
                        }}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    ) : null}
                  </div>
                </div>

                {review.title ? <p className="text-sm font-medium text-slate-900">{review.title}</p> : null}
                <p className="text-sm text-slate-700">{review.content}</p>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                    <p className="font-medium text-slate-900">Tenant</p>
                    <p className="mt-1 text-slate-600">{review.tenantId || "Unknown tenant"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                    <p className="font-medium text-slate-900">Moderation</p>
                    <p className="mt-1 text-slate-600">
                      {review.rejectionReason || review.publisherResponse || "No moderation notes recorded yet."}
                    </p>
                  </div>
                </div>
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
              <p className="mt-1 text-slate-600">{selectedReview?.reviewerEmail}</p>
            </div>
            <div className="space-y-2">
              <Label>Rejection reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={4}
                placeholder="Explain why this review should not be published."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedReview && handleModeration(selectedReview, "rejected")}
              disabled={!rejectionReason.trim()}
            >
              Reject Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
