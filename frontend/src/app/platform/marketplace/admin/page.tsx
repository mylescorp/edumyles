"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Package, Star, Download, CheckCircle, XCircle,
  Shield, Users, Eye, Clock, AlertTriangle,
  DollarSign, Building, Award, Layers,
  Ban, Play, Trash2, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_review: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  deprecated: "bg-orange-100 text-orange-700",
  rejected: "bg-red-100 text-red-700",
};

export default function MarketplaceAdminPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSeedDialogOpen, setIsSeedDialogOpen] = useState(false);

  // Queries
  const pendingModules = usePlatformQuery(
    api.platform.marketplace.getPendingModules,
    { sessionToken: sessionToken || "" }
  ) as any[] | undefined;

  const allInstallations = usePlatformQuery(
    api.platform.marketplace.getAllInstallations,
    { sessionToken: sessionToken || "", limit: 50 }
  ) as any[] | undefined;

  const publishers = usePlatformQuery(
    api.platform.marketplace.getPublishers,
    { sessionToken: sessionToken || "" }
  ) as any[] | undefined;

  const disputes = usePlatformQuery(
    api.platform.marketplace.getDisputes,
    { sessionToken: sessionToken || "" }
  ) as any[] | undefined;

  const categories = usePlatformQuery(
    api.platform.marketplace.getCategories,
    { sessionToken: sessionToken || "" }
  ) as any[] | undefined;

  const featuredPlacements = usePlatformQuery(
    api.platform.marketplace.getFeaturedPlacements,
    { sessionToken: sessionToken || "" }
  ) as any[] | undefined;

  // Mutations
  const reviewModule = useMutation(api.platform.marketplace.reviewModule);
  const publishModule = useMutation(api.platform.marketplace.publishModule);
  const suspendModule = useMutation(api.platform.marketplace.suspendModule);
  const updatePublisherVerification = useMutation(api.platform.marketplace.updatePublisherVerification);
  const seedCategories = useMutation(api.platform.marketplace.seedCategories);

  const handleReview = async (decision: "approved" | "rejected" | "requires_changes") => {
    if (!sessionToken || !selectedModule) return;
    try {
      await reviewModule({
        sessionToken,
        moduleId: selectedModule.moduleId,
        decision,
        notes: reviewNotes,
      });
      if (decision === "approved") {
        await publishModule({ sessionToken, moduleId: selectedModule.moduleId });
      }
      setIsReviewOpen(false);
      setReviewNotes("");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSeedCategories = async () => {
    if (!sessionToken) return;
    try {
      await seedCategories({ sessionToken });
      setIsSeedDialogOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Administration"
        description="Manage modules, publishers, categories, and marketplace policies"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Admin", href: "#" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review
            {(pendingModules?.length || 0) > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 justify-center text-[10px]">
                {pendingModules?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="installations">Installations</TabsTrigger>
          <TabsTrigger value="publishers">Publishers</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="disputes">
            Disputes
            {(disputes?.filter((d: any) => d.status === "open").length || 0) > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 justify-center text-[10px]">
                {disputes?.filter((d: any) => d.status === "open").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        {/* Pending Review */}
        <TabsContent value="pending" className="mt-4 space-y-4">
          {(pendingModules || []).length > 0 ? (
            (pendingModules || []).map((mod: any) => (
              <Card key={mod._id}>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{mod.name}</h4>
                          <Badge className={STATUS_COLORS[mod.status]}>{mod.status.replace("_", " ")}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{mod.category.replace(/_/g, " ")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{mod.shortDescription}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Publisher: {mod.publisherName} ({mod.publisherVerification}) · v{mod.version} · Submitted {formatDate(mod.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/platform/marketplace/${mod.moduleId}`)}>
                        <Eye className="h-4 w-4 mr-1" />View
                      </Button>
                      <Button size="sm" onClick={() => { setSelectedModule(mod); setIsReviewOpen(true); }}>
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-10 w-10 text-green-600 mb-3" />
                <h3 className="font-semibold mb-1">All caught up</h3>
                <p className="text-sm text-muted-foreground">No modules pending review.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Installations */}
        <TabsContent value="installations" className="mt-4 space-y-4">
          {(allInstallations || []).length > 0 ? (
            <div className="space-y-2">
              {(allInstallations || []).map((inst: any) => (
                <Card key={inst._id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium text-sm">{inst.moduleName}</span>
                          <span className="text-muted-foreground text-sm"> → {inst.tenantName}</span>
                        </div>
                        <Badge className={STATUS_COLORS[inst.status] || "bg-gray-100"}>{inst.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>v{inst.installedVersion}</span>
                        <span>{formatDate(inst.installedAt)}</span>
                        <span>by {inst.installedBy}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Download className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No installations yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Publishers */}
        <TabsContent value="publishers" className="mt-4 space-y-4">
          {(publishers || []).map((pub: any) => (
            <Card key={pub._id}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{pub.legalName}</h4>
                        <Badge variant="outline" className="capitalize text-xs">{pub.verificationLevel.replace("_", " ")}</Badge>
                        {!pub.isActive && <Badge variant="destructive" className="text-xs">Suspended</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pub.contactEmail} · {pub.country} · {pub.entityType} · Since {formatDate(pub.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      defaultValue={pub.verificationLevel}
                      onValueChange={async (v: any) => {
                        if (!sessionToken) return;
                        await updatePublisherVerification({ sessionToken, publisherId: pub._id, verificationLevel: v });
                      }}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="featured_partner">Featured Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(publishers || []).length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No publishers registered yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Category Taxonomy</h3>
            <Button onClick={() => setIsSeedDialogOpen(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />Seed Default Categories
            </Button>
          </div>
          {(categories || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(categories || []).map((cat: any) => (
                <Card key={cat._id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{cat.name}</h4>
                        <p className="text-xs text-muted-foreground">{cat.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">{cat.moduleCount} modules</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Order: {cat.sortOrder}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Layers className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No categories configured</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Seed the default category taxonomy to get started.
                </p>
                <Button onClick={() => setIsSeedDialogOpen(true)}>Seed Categories</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Disputes */}
        <TabsContent value="disputes" className="mt-4 space-y-4">
          {(disputes || []).length > 0 ? (
            (disputes || []).map((dispute: any) => (
              <Card key={dispute._id}>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <h4 className="font-semibold text-sm">{dispute.moduleName}</h4>
                        <Badge className={
                          dispute.status === "open" ? "bg-red-100 text-red-700"
                          : dispute.status === "resolved" ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                        }>
                          {dispute.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">{dispute.type.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{dispute.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Filed by {dispute.filedByEmail} on {formatDate(dispute.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-10 w-10 text-green-600 mb-3" />
                <p className="text-sm text-muted-foreground">No disputes filed.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Featured Placements */}
        <TabsContent value="featured" className="mt-4 space-y-4">
          {(featuredPlacements || []).length > 0 ? (
            (featuredPlacements || []).map((fp: any) => (
              <Card key={fp._id}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{fp.title}</h4>
                        <Badge variant="outline" className="text-xs capitalize">{fp.type.replace("_", " ")}</Badge>
                        <Badge variant={fp.isActive ? "default" : "secondary"} className="text-xs">
                          {fp.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {fp.description && <p className="text-xs text-muted-foreground">{fp.description}</p>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(fp.startDate)} — {formatDate(fp.endDate)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No featured placements configured.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Module Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review: {selectedModule?.name}</DialogTitle>
          </DialogHeader>
          {selectedModule && (
            <div className="space-y-4">
              <div className="border rounded-lg p-3 space-y-1 text-sm">
                <p><strong>Category:</strong> {selectedModule.category.replace(/_/g, " ")}</p>
                <p><strong>Version:</strong> v{selectedModule.version}</p>
                <p><strong>Publisher:</strong> {selectedModule.publisherName} ({selectedModule.publisherVerification})</p>
                <p><strong>Pricing:</strong> {selectedModule.pricingModel}</p>
              </div>
              <div>
                <Label>Review Notes</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  placeholder="Provide feedback for the developer..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="destructive" size="sm" onClick={() => handleReview("rejected")}>
                  <XCircle className="h-4 w-4 mr-1" />Reject
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReview("requires_changes")}>
                  <AlertTriangle className="h-4 w-4 mr-1" />Request Changes
                </Button>
                <Button size="sm" onClick={() => handleReview("approved")}>
                  <CheckCircle className="h-4 w-4 mr-1" />Approve & Publish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Seed Categories Dialog */}
      <Dialog open={isSeedDialogOpen} onOpenChange={setIsSeedDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Seed Default Categories</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will create the 10 default category entries (Academic Tools, Communication, Finance & Fees, etc.)
            as defined in the marketplace specification. Existing categories will not be duplicated.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSeedDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSeedCategories}>Seed Categories</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
