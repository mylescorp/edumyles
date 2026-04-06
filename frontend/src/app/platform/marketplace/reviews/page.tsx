"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Star, CheckCircle, XCircle, Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MarketplaceErrorBoundary } from "../MarketplaceErrorBoundary";
import { toast } from "sonner";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewModerationPage() {
  return (
    <MarketplaceErrorBoundary>
      <ReviewModerationContent />
    </MarketplaceErrorBoundary>
  );
}

function ReviewModerationContent() {
  const { sessionToken } = useAuth();
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const pendingReviews = usePlatformQuery(
    api.platform.marketplace.queries.getPendingReviews,
    { sessionToken: sessionToken || "" }
  ) as any[] | undefined;

  const moderateReview = useMutation(api.platform.marketplace.mutations.moderateReview);

  const handleApprove = async (reviewId: string) => {
    if (!sessionToken) return;
    try {
      await moderateReview({ sessionToken, reviewId: reviewId as any, decision: "approved" });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReject = async () => {
    if (!sessionToken || !selectedReview) return;
    try {
      await moderateReview({
        sessionToken,
        reviewId: selectedReview._id,
        decision: "rejected",
        rejectionReason,
      });
      setIsRejectOpen(false);
      setRejectionReason("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Moderation"
        description="Moderate user reviews before they are published on module listings"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Reviews", href: "#" },
        ]}
      />

      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />{pendingReviews?.length || 0} pending
        </Badge>
        <p className="text-sm text-muted-foreground">
          Reviews are moderated within 3 business days. Rejected reviews receive an explanatory note.
        </p>
      </div>

      {(pendingReviews || []).length > 0 ? (
        <div className="space-y-3">
          {(pendingReviews || []).map((review: any) => (
            <Card key={review._id}>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StarRating rating={review.rating} />
                    <span className="font-medium text-sm">{review.moduleName}</span>
                    <Badge variant="outline" className="text-xs">
                      {review.reviewerRole}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                </div>

                <p className="text-sm">{review.content}</p>

                {review.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {review.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  By {review.reviewerEmail} (Tenant: {review.tenantId})
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button size="sm" onClick={() => handleApprove(review._id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { setSelectedReview(review); setIsRejectOpen(true); }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-10 w-10 text-green-600 mb-3" />
            <h3 className="font-semibold mb-1">All reviews moderated</h3>
            <p className="text-sm text-muted-foreground">No pending reviews to moderate.</p>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide a reason for rejecting this review. The reviewer will be notified.
            </p>
            <div>
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Contains personal attacks, not relevant to the module..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
