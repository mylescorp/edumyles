"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Package, Star, Download, Shield, CheckCircle, ExternalLink,
  Users, BookOpen, Video, ThumbsUp, ThumbsDown, Lock, Cpu,
  MessageSquare, Sparkles, CreditCard, Building,
  GraduationCap, BarChart3, Plug, Heart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { MarketplaceErrorBoundary } from "../MarketplaceErrorBoundary";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  academic_tools: <GraduationCap className="h-5 w-5" />,
  communication: <MessageSquare className="h-5 w-5" />,
  finance_fees: <CreditCard className="h-5 w-5" />,
  analytics_bi: <BarChart3 className="h-5 w-5" />,
  content_packs: <BookOpen className="h-5 w-5" />,
  integrations: <Plug className="h-5 w-5" />,
  ai_automation: <Cpu className="h-5 w-5" />,
  accessibility: <Heart className="h-5 w-5" />,
  administration: <Building className="h-5 w-5" />,
  security_compliance: <Shield className="h-5 w-5" />,
};

const PRICING_LABELS: Record<string, string> = {
  free: "Free", freemium: "Freemium", one_time: "One-Time Purchase",
  monthly: "Monthly Subscription", annual: "Annual Subscription",
  per_student: "Per Student", per_user: "Per User", free_trial: "Free Trial + Subscription",
};

function formatPrice(priceCents: number | undefined, currency: string = "KES") {
  if (!priceCents) return "Free";
  return `${currency} ${(priceCents / 100).toLocaleString()}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const iconSize = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${iconSize} ${i <= Math.round(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function ModuleDetailPage() {
  return (
    <MarketplaceErrorBoundary>
      <ModuleDetailContent />
    </MarketplaceErrorBoundary>
  );
}

function ModuleDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { sessionToken } = useAuth();
  const moduleId = params.moduleId as string;
  const [activeTab, setActiveTab] = useState("overview");
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["school_admin"]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewTags, setReviewTags] = useState<string[]>([]);

  const detail = usePlatformQuery(
    api.platform.marketplace.getModuleDetail,
    { sessionToken: sessionToken || "", moduleId }
  ) as any;

  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    { sessionToken: sessionToken || "" }
  ) as any[] | undefined;

  const tenantInstallations = usePlatformQuery(
    api.platform.marketplace.getTenantInstallations,
    selectedTenantId
      ? { sessionToken: sessionToken || "", tenantId: selectedTenantId }
      : "skip"
  ) as any[] | undefined;

  const installModule = useMutation(api.platform.marketplace.installModule);
  const uninstallCatalogModule = useMutation(api.platform.marketplace.uninstallCatalogModule);
  const submitReview = useMutation(api.platform.marketplace.submitReview);
  const voteReview = useMutation(api.platform.marketplace.voteReview);

  if (!detail) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "Marketplace", href: "/platform/marketplace" },
            { label: "Module", href: "#" },
          ]}
        />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Loading module details...</div>
        </div>
      </div>
    );
  }

  const mod = detail.module;
  const publisher = detail.publisher;
  const versions = detail.versions || [];
  const reviews = detail.reviews || [];
  const otherModules = detail.otherModulesByPublisher || [];
  const currentInstallation = useMemo(
    () =>
      tenantInstallations?.find(
        (installation) =>
          installation.moduleId === moduleId && installation.status === "active"
      ) ?? null,
    [moduleId, tenantInstallations]
  );
  const isCoreModule = Boolean(mod.isCore);

  const REVIEW_TAGS = [
    "Easy to Use", "Good Support", "Great Value", "Well Documented",
    "Buggy", "Poor Documentation", "Feature Rich", "Reliable",
  ];

  useEffect(() => {
    if (!selectedTenantId && tenants && tenants.length > 0) {
      setSelectedTenantId(tenants[0].tenantId);
    }
  }, [selectedTenantId, tenants]);

  const handleInstallAction = async () => {
    if (!sessionToken || !selectedTenantId || isCoreModule) return;

    try {
      if (currentInstallation) {
        await uninstallCatalogModule({
          sessionToken,
          tenantId: selectedTenantId,
          moduleId,
          reason: "Removed from platform marketplace detail page",
        });
        toast.success("Module uninstalled for tenant");
      } else {
        await installModule({
          sessionToken,
          tenantId: selectedTenantId,
          moduleId,
          configuration: {},
          assignedRoles: selectedRoles,
        });
        toast.success("Module installed for tenant");
      }
      setIsInstallOpen(false);
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to update tenant installation");
    }
  };

  const handleSubmitReview = async () => {
    if (!sessionToken) return;

    try {
      await submitReview({
        sessionToken,
        moduleId,
        rating: reviewRating,
        content: reviewContent,
        tags: reviewTags,
      });
      toast.success("Review submitted for moderation");
      setIsReviewOpen(false);
      setReviewContent("");
      setReviewTags([]);
      setReviewRating(5);
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to submit review");
    }
  };

  const handleVoteReview = async (reviewId: string, helpful: boolean) => {
    if (!sessionToken) return;

    try {
      await voteReview({
        sessionToken,
        reviewId: reviewId as any,
        helpful,
      });
      toast.success(helpful ? "Marked as helpful" : "Marked as not helpful");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to record vote");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mod.name}
        description={mod.shortDescription}
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: mod.name, href: "#" },
        ]}
      />

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  {CATEGORY_ICONS[mod.category] || <Package className="h-8 w-8" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{mod.name}</h1>
                    {mod.isVerified && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <CheckCircle className="h-3 w-3 mr-1" />Verified
                      </Badge>
                    )}
                    {mod.isSecurityReviewed && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Shield className="h-3 w-3 mr-1" />Security Reviewed
                      </Badge>
                    )}
                    {mod.isGdprCompliant && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">GDPR/KDPA</Badge>
                    )}
                    {mod.isFeatured && (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        <Sparkles className="h-3 w-3 mr-1" />Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">by {mod.publisherName}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <StarRating rating={mod.averageRating} size="md" />
                      <span className="text-sm font-medium ml-1">{mod.averageRating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({mod.totalReviews} reviews)</span>
                    </div>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Download className="h-4 w-4" />{mod.totalInstalls.toLocaleString()} installs
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold">{mod.totalInstalls.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Installs</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{mod.averageRating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">v{mod.version}</div>
                  <p className="text-xs text-muted-foreground">Version</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{mod.totalReviews}</div>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Screenshots */}
          {mod.screenshots?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Screenshots</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {mod.screenshots.map((url: string, i: number) => (
                    <div key={i} className="aspect-video bg-muted rounded-lg flex items-center justify-center border">
                      <span className="text-xs text-muted-foreground">Screenshot {i + 1}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Install / Pricing Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center">
              <div className="text-3xl font-bold">{formatPrice(mod.priceCents, mod.currency)}</div>
              <p className="text-sm text-muted-foreground mt-1">{PRICING_LABELS[mod.pricingModel]}</p>
              {isCoreModule && (
                <p className="text-sm text-blue-600 mt-1">Included by default for every tenant</p>
              )}
              {mod.trialDays && (
                <p className="text-sm text-green-600 mt-1">{mod.trialDays}-day free trial available</p>
              )}
              </div>
              <Button className="w-full" size="lg" onClick={() => setIsInstallOpen(true)} disabled={isCoreModule}>
                <Download className="h-4 w-4 mr-2" />Install Module
              </Button>
              {mod.demoVideoUrl && (
                <Button variant="outline" className="w-full">
                  <Video className="h-4 w-4 mr-2" />Watch Demo
                </Button>
              )}

              {/* Pricing Tiers */}
              {mod.pricingTiers?.length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium">Pricing Tiers</p>
                  {mod.pricingTiers.map((tier: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{tier.name}</span>
                        <span className="text-sm font-bold">{formatPrice(tier.priceCents, mod.currency)}</span>
                      </div>
                      <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
                        {tier.features.map((f: string, j: number) => (
                          <li key={j} className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Module Info */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-sm">Module Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline" className="capitalize">{mod.category.replace(/_/g, " ")}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">v{mod.version}</span>
                </div>
                {mod.edumylesMinVersion && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Platform</span>
                    <span className="font-medium">{mod.edumylesMinVersion}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Offline</span>
                  <span className="font-medium">{mod.supportsOffline ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <span className="font-medium">{mod.publishedAt ? formatDate(mod.publishedAt) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-medium">{formatDate(mod.updatedAt)}</span>
                </div>
              </div>

              {mod.compatiblePlans?.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground mb-2">Compatible Plans</p>
                  <div className="flex flex-wrap gap-1">
                    {mod.compatiblePlans.map((plan: string) => (
                      <Badge key={plan} variant="secondary" className="capitalize text-xs">{plan}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {mod.dataResidency?.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground mb-2">Data Residency</p>
                  <div className="flex flex-wrap gap-1">
                    {mod.dataResidency.map((c: string) => (
                      <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-3 space-y-2">
                {mod.documentationUrl && (
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs" asChild>
                    <a href={mod.documentationUrl} target="_blank" rel="noopener noreferrer">
                      <BookOpen className="h-3.5 w-3.5 mr-2" />Documentation <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                )}
                {mod.supportUrl && (
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs" asChild>
                    <a href={mod.supportUrl} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="h-3.5 w-3.5 mr-2" />Support <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                )}
                {mod.privacyPolicyUrl && (
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs" asChild>
                    <a href={mod.privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
                      <Lock className="h-3.5 w-3.5 mr-2" />Privacy Policy <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Publisher Card */}
          {publisher && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{publisher.legalName}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {publisher.verificationLevel === "featured_partner" ? "Featured Partner"
                        : publisher.verificationLevel === "verified" ? "Verified" : "Basic"}
                    </Badge>
                  </div>
                </div>
                {publisher.bio && <p className="text-xs text-muted-foreground">{publisher.bio}</p>}
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Total Modules</span>
                    <span className="font-medium text-foreground">{publisher.totalModules}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Rating</span>
                    <span className="font-medium text-foreground">{publisher.averageRating.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Description</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({mod.totalReviews})</TabsTrigger>
          <TabsTrigger value="versions">Changelog</TabsTrigger>
          <TabsTrigger value="related">More by Publisher</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{mod.fullDescription}</p>
              </div>
              {mod.systemRequirements && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">System Requirements</h4>
                  <p className="text-sm text-muted-foreground">{mod.systemRequirements}</p>
                </div>
              )}
              {mod.tags?.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {mod.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Feature Highlights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mod.featureHighlights?.map((feature: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Permissions Required</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This module requires the following permissions. Review carefully before installing.
              </p>
              <div className="space-y-2">
                {mod.permissions?.map((perm: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Shield className="h-4 w-4 text-orange-600 shrink-0" />
                    <span className="text-sm">{perm}</span>
                  </div>
                ))}
                {(!mod.permissions || mod.permissions.length === 0) && (
                  <p className="text-sm text-muted-foreground">No special permissions required.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Reviews & Ratings</h3>
              <Button onClick={() => setIsReviewOpen(true)}>
                <Star className="h-4 w-4 mr-2" />Write a Review
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{mod.averageRating.toFixed(1)}</div>
                    <StarRating rating={mod.averageRating} size="md" />
                    <p className="text-sm text-muted-foreground mt-1">{mod.totalReviews} reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review: any) => (
                  <Card key={review._id}>
                    <CardContent className="pt-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} />
                          <span className="text-sm text-muted-foreground">by {review.reviewerEmail}</span>
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
                      {review.publisherResponse && (
                        <div className="bg-accent/50 rounded-lg p-3 mt-2">
                          <p className="text-xs font-medium mb-1">Publisher Response</p>
                          <p className="text-sm">{review.publisherResponse}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleVoteReview(review._id, true)}
                        >
                          <ThumbsUp className="h-3 w-3" /> Helpful ({review.helpfulVotes})
                        </button>
                        <button
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleVoteReview(review._id, false)}
                        >
                          <ThumbsDown className="h-3 w-3" /> ({review.unhelpfulVotes})
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <Star className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this module.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Version History</h3>
              {versions.length > 0 ? (
                <div className="space-y-4">
                  {versions.map((ver: any, i: number) => (
                    <div key={ver._id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${i === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        {i < versions.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">v{ver.version}</span>
                          <Badge variant={ver.status === "published" ? "default" : "secondary"} className="text-xs">
                            {ver.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(ver.publishedAt || ver.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{ver.releaseNotes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No version history available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related" className="mt-4">
          {otherModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherModules.map((m: any) => (
                <Card
                  key={m.moduleId}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/platform/marketplace/${m.moduleId}`)}
                >
                  <CardContent className="pt-5 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {CATEGORY_ICONS[m.category] || <Package className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{m.name}</h4>
                        <p className="text-xs text-muted-foreground">{m.shortDescription}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <StarRating rating={m.averageRating} />
                      <span>{m.totalInstalls} installs</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No other modules by this publisher.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Install Dialog */}
      <Dialog open={isInstallOpen} onOpenChange={setIsInstallOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Install {mod.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Install For Tenant</Label>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {(tenants || []).map((tenant: any) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.name} ({tenant.tenantId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold">Permissions Required</Label>
              <div className="mt-2 space-y-1">
                {mod.permissions?.map((perm: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    <span>{perm}</span>
                  </div>
                ))}
                {(!mod.permissions || mod.permissions.length === 0) && (
                  <p className="text-sm text-muted-foreground">No special permissions required.</p>
                )}
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Price</span>
                <span className="text-lg font-bold">{formatPrice(mod.priceCents, mod.currency)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{PRICING_LABELS[mod.pricingModel]}</p>
              {mod.trialDays && (
                <p className="text-xs text-green-600 mt-1">{mod.trialDays}-day free trial — no charge until trial ends</p>
              )}
            </div>
            <div className="border-t pt-3">
              <Label className="text-sm font-semibold">Assign to Roles</Label>
              <p className="text-xs text-muted-foreground mt-1">Choose which roles can access this module.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["school_admin", "principal", "teacher", "student", "parent"].map((role) => (
                  <Badge
                    key={role}
                    variant={selectedRoles.includes(role) ? "default" : "outline"}
                    className="cursor-pointer capitalize text-xs"
                    onClick={() => {
                      setSelectedRoles((current) =>
                        current.includes(role)
                          ? current.filter((entry) => entry !== role)
                          : [...current, role]
                      );
                    }}
                  >
                    {role.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
            {selectedTenantId && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                {currentInstallation ? (
                  <p>
                    Installed for this tenant on {formatDate(currentInstallation.installedAt)} as version {currentInstallation.installedVersion}.
                  </p>
                ) : (
                  <p>This module is not currently installed for the selected tenant.</p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsInstallOpen(false)}>Cancel</Button>
              <Button onClick={handleInstallAction} disabled={!selectedTenantId || selectedRoles.length === 0 || isCoreModule}>
                <Download className="h-4 w-4 mr-2" />
                {currentInstallation ? "Uninstall Module" : "Confirm Install"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} onClick={() => setReviewRating(i)}>
                    <Star
                      className={`h-7 w-7 cursor-pointer transition-colors ${
                        i <= reviewRating ? "text-yellow-500 fill-yellow-500" : "text-gray-300 hover:text-yellow-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Review (50-2000 characters)</Label>
              <Textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                rows={5}
                placeholder="Share your experience with this module..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">{reviewContent.length}/2000 characters</p>
            </div>
            <div>
              <Label>Tags (optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {REVIEW_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={reviewTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      setReviewTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
              <Button disabled={reviewContent.length < 50} onClick={handleSubmitReview}>Submit Review</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
