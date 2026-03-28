"use client";

import { useMemo, useState } from "react";
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
  Package, Star, Download, Plus, CheckCircle,
  DollarSign, Users, TrendingUp, Clock,
  FileText, AlertTriangle, Eye, Send,
  Building, Award, Layers, Wallet, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { MarketplaceErrorBoundary } from "../MarketplaceErrorBoundary";

function formatPrice(cents: number) {
  return `KES ${(cents / 100).toLocaleString()}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

export default function DeveloperPortalPage() {
  return (
    <MarketplaceErrorBoundary>
      <DeveloperPortalContent />
    </MarketplaceErrorBoundary>
  );
}

function DeveloperPortalContent() {
  const { sessionToken, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  // Registration form state
  const [regForm, setRegForm] = useState({
    legalName: "", entityType: "individual" as "individual" | "organization",
    country: "KE", businessRegistration: "", taxId: "",
    payoutMethod: "mpesa" as "mpesa" | "bank_transfer" | "paypal",
    payoutDetails: "", contactEmail: "", contactPhone: "", website: "", bio: "",
  });

  // Module submission form state
  const [modForm, setModForm] = useState({
    name: "", shortDescription: "", fullDescription: "",
    category: "academic_tools", version: "1.0.0",
    pricingModel: "free", priceCents: 0, trialDays: 14,
    supportsOffline: false, tags: "",
    featureHighlights: "", permissions: "",
    compatiblePlans: "starter,growth,enterprise",
    supportUrl: "", documentationUrl: "", privacyPolicyUrl: "",
  });

  const publishers = usePlatformQuery(
    api.platform.marketplace.getPublishers,
    { sessionToken: sessionToken || "" }
  ) as any[] | undefined;

  const registerPublisher = useMutation(api.platform.marketplace.registerPublisher);
  const createModule = useMutation(api.platform.marketplace.createModule);
  const submitModuleForReview = useMutation(api.platform.marketplace.submitModuleForReview);

  // Find current user's publisher profile
  const myPublisher = useMemo(
    () => publishers?.find((p: any) => p.userId === user?._id || p.contactEmail === user?.email) ?? null,
    [publishers, user?._id, user?.email]
  );

  const myPublisherDetail = usePlatformQuery(
    api.platform.marketplace.getPublisherDetail,
    myPublisher?._id
      ? { sessionToken: sessionToken || "", publisherId: myPublisher._id }
      : "skip"
  ) as any;

  const myModules = useMemo(
    () => (myPublisherDetail?.modules || []).slice().sort((a: any, b: any) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)),
    [myPublisherDetail?.modules]
  );
  const myTransactions = myPublisherDetail?.transactions || [];
  const myPayouts = myPublisherDetail?.payouts || [];
  const myStats = myPublisherDetail?.stats || {
    totalModules: 0,
    publishedModules: 0,
    totalInstalls: 0,
    totalEarningsCents: 0,
    pendingPayoutCents: 0,
    averageRating: 0,
  };

  const handleRegister = async () => {
    if (!sessionToken) return;
    try {
      await registerPublisher({
        sessionToken,
        ...regForm,
      });
      setIsRegisterOpen(false);
      toast.success("Publisher registration completed");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSubmitExistingModule = async (moduleId: string) => {
    if (!sessionToken) return;
    try {
      await submitModuleForReview({ sessionToken, moduleId });
      toast.success("Module submitted for review");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSubmitModule = async () => {
    if (!sessionToken || !myPublisher) return;
    try {
      const result = await createModule({
        sessionToken,
        name: modForm.name,
        shortDescription: modForm.shortDescription,
        fullDescription: modForm.fullDescription,
        category: modForm.category as any,
        version: modForm.version,
        pricingModel: modForm.pricingModel as any,
        priceCents: modForm.priceCents || undefined,
        trialDays: modForm.trialDays || undefined,
        supportsOffline: modForm.supportsOffline,
        tags: modForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        featureHighlights: modForm.featureHighlights.split("\n").filter(Boolean),
        permissions: modForm.permissions.split(",").map((p) => p.trim()).filter(Boolean),
        compatiblePlans: modForm.compatiblePlans.split(",").map((p) => p.trim()).filter(Boolean),
        dataResidency: ["KE"],
        screenshots: [],
        publisherId: myPublisher.userId,
        supportUrl: modForm.supportUrl || undefined,
        documentationUrl: modForm.documentationUrl || undefined,
        privacyPolicyUrl: modForm.privacyPolicyUrl || undefined,
      });
      await submitModuleForReview({
        sessionToken,
        moduleId: result.moduleId,
      });
      setIsSubmitOpen(false);
      toast.success("Module submitted for review");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const verificationBadge = (level: string) => {
    switch (level) {
      case "featured_partner":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Award className="h-3 w-3 mr-1" />Featured Partner</Badge>;
      case "verified":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      default:
        return <Badge variant="secondary">Basic</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer & Publisher Portal"
        description="Register as a publisher, submit modules, and track your earnings"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Developer Portal", href: "#" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="publishers">Publishers</TabsTrigger>
          <TabsTrigger value="submissions">Module Submissions</TabsTrigger>
          <TabsTrigger value="earnings">Revenue & Payouts</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* Registration CTA */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    {myPublisher ? `Publisher Profile: ${myPublisher.legalName}` : "Become a Publisher"}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-lg">
                    {myPublisher
                      ? "Manage your marketplace presence, submit modules for review, and track installs, reviews, and payout readiness."
                      : "Register as an EduMyles Marketplace publisher to distribute and monetise your educational modules, integrations, and content to thousands of institutions."}
                  </p>
                </div>
                {myPublisher ? (
                  <div className="text-right space-y-2">
                    <div>{verificationBadge(myPublisher.verificationLevel)}</div>
                    <Button size="lg" onClick={() => setIsSubmitOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />Submit Module
                    </Button>
                  </div>
                ) : (
                  <Button size="lg" onClick={() => setIsRegisterOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Register Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {myPublisher && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground mb-1">Modules</p>
                  <div className="text-xl font-bold">{myStats.totalModules}</div>
                  <p className="text-xs text-muted-foreground">{myStats.publishedModules} published</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground mb-1">Installs</p>
                  <div className="text-xl font-bold">{myStats.totalInstalls}</div>
                  <p className="text-xs text-muted-foreground">Across all tenants</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
                  <div className="text-xl font-bold">{formatPrice(myStats.totalEarningsCents)}</div>
                  <p className="text-xs text-muted-foreground">Net publisher revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground mb-1">Pending Payout</p>
                  <div className="text-xl font-bold">{formatPrice(myStats.pendingPayoutCents)}</div>
                  <p className="text-xs text-muted-foreground">Average rating {myStats.averageRating.toFixed(1)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Verification Levels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Badge variant="secondary" className="text-sm">Basic</Badge>
                <h3 className="font-semibold">Basic Publisher</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Email verified, policies accepted</li>
                  <li>Can publish free modules only</li>
                  <li>30% commission on paid (when upgraded)</li>
                  <li>Monthly payouts (NET 30)</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="pt-6 space-y-3">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  <CheckCircle className="h-3 w-3 mr-1" />Verified
                </Badge>
                <h3 className="font-semibold">Verified Publisher</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Business docs + tax ID confirmed</li>
                  <li>Can publish paid modules</li>
                  <li>25% commission — 75% to publisher</li>
                  <li>Monthly payouts (NET 15)</li>
                  <li>Full analytics dashboard</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50/30">
              <CardContent className="pt-6 space-y-3">
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                  <Award className="h-3 w-3 mr-1" />Featured Partner
                </Badge>
                <h3 className="font-semibold">Featured Partner</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>4.5+ rating, 100+ installs, NDA signed</li>
                  <li>20% commission — 80% to publisher</li>
                  <li>Bi-weekly payouts</li>
                  <li>Featured placement eligibility</li>
                  <li>Dedicated account manager</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Submission workflow */}
          <Card>
            <CardHeader><CardTitle className="text-base">Module Submission Workflow</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {[
                  { step: "1", label: "Create Draft", icon: FileText },
                  { step: "2", label: "Upload Package", icon: Package },
                  { step: "3", label: "Auto Screening", icon: AlertTriangle },
                  { step: "4", label: "Human Review", icon: Eye },
                  { step: "5", label: "Decision", icon: CheckCircle },
                  { step: "6", label: "Publish", icon: Send },
                ].map((s, i) => (
                  <div key={s.step} className="flex items-center gap-2 flex-1">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <s.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs text-center">{s.label}</span>
                    </div>
                    {i < 5 && <div className="h-px w-4 bg-border shrink-0" />}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Standard review SLA: 7 business days. Fast-track (3 days) available for Verified Partners.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Publishers List */}
        <TabsContent value="publishers" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Registered Publishers</h3>
            <Button onClick={() => setIsRegisterOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Register Publisher
            </Button>
          </div>

          {(publishers || []).length > 0 ? (
            <div className="space-y-3">
              {(publishers || []).map((pub: any) => (
                <Card key={pub._id}>
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{pub.legalName}</h4>
                          {verificationBadge(pub.verificationLevel)}
                          {pub.userId === myPublisher?.userId && (
                            <Badge variant="outline" className="text-xs">My Profile</Badge>
                          )}
                          {!pub.isActive && (
                            <Badge variant="destructive" className="text-xs">Suspended</Badge>
                          )}
                        </div>
                          <p className="text-xs text-muted-foreground">
                            {pub.contactEmail} · {pub.country} · {pub.entityType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{pub.totalModules}</div>
                          <span className="text-xs">Modules</span>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{pub.totalInstalls}</div>
                          <span className="text-xs">Installs</span>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{formatPrice(pub.totalEarningsCents)}</div>
                          <span className="text-xs">Earnings</span>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{pub.averageRating.toFixed(1)}</div>
                          <span className="text-xs">Rating</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No publishers registered yet</h3>
                <p className="text-sm text-muted-foreground">Be the first to register as a marketplace publisher.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Module Submissions */}
        <TabsContent value="submissions" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Submit a New Module</h3>
            <Button onClick={() => setIsSubmitOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Submit Module
            </Button>
          </div>

          {myModules.length > 0 ? (
            <div className="space-y-3">
              {myModules.map((mod: any) => (
                <Card key={mod._id}>
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{mod.name}</h4>
                          <Badge variant="outline" className="capitalize text-xs">{mod.category.replace(/_/g, " ")}</Badge>
                          <Badge className={mod.status === "published" ? "bg-green-100 text-green-700" : mod.status === "pending_review" ? "bg-yellow-100 text-yellow-700" : mod.status === "rejected" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}>
                            {mod.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{mod.shortDescription}</p>
                        <p className="text-xs text-muted-foreground">
                          v{mod.version} · Updated {formatDate(mod.updatedAt || mod.createdAt)} · {formatPrice(mod.priceCents || 0)}
                        </p>
                        {mod.reviewNotes && (
                          <p className="text-xs text-amber-700">Review notes: {mod.reviewNotes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(`/platform/marketplace/${mod.moduleId}`, "_self")}>
                          <Eye className="h-4 w-4 mr-1" />View
                        </Button>
                        {(mod.status === "draft" || mod.status === "rejected") && (
                          <Button size="sm" onClick={() => handleSubmitExistingModule(mod.moduleId)}>
                            <Send className="h-4 w-4 mr-1" />Submit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">Ready to Submit</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Click &ldquo;Submit Module&rdquo; to create a new module listing. You&apos;ll fill in the
                  details and it will be submitted for review by the Mylesoft team.
                </p>
                {!myPublisher && (
                  <p className="text-xs text-amber-700 mt-3">
                    Register a publisher profile first before submitting modules.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Revenue & Payouts */}
        <TabsContent value="earnings" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                <div className="text-xl font-bold">{formatPrice(myStats.totalEarningsCents)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Commission Earned</p>
                <div className="text-xl font-bold">
                  {formatPrice(
                    myTransactions.reduce((sum: number, tx: any) => sum + (tx.commissionCents || 0), 0)
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Pending Payout</p>
                <div className="text-xl font-bold">{formatPrice(myStats.pendingPayoutCents)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Last Payout</p>
                <div className="text-xl font-bold">
                  {myPayouts[0] ? formatPrice(myPayouts[0].amountCents || 0) : "—"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {myTransactions.length > 0 ? myTransactions.map((tx: any) => (
                  <div key={tx._id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm capitalize">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">{tx.moduleId} · {formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatPrice(tx.netAmountCents || 0)}</p>
                      <p className="text-xs text-muted-foreground">{tx.status}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No transactions yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Payouts</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {myPayouts.length > 0 ? myPayouts.map((payout: any) => (
                  <div key={payout._id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{formatDate(payout.createdAt || payout.scheduledAt || Date.now())}</p>
                      <p className="text-xs text-muted-foreground">{payout.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatPrice(payout.amountCents || payout.netAmountCents || 0)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No payouts scheduled yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Commission Structure</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Publisher Level</th>
                      <th className="text-center py-2">Commission Rate</th>
                      <th className="text-center py-2">Net to Publisher</th>
                      <th className="text-center py-2">Payout Frequency</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="py-2">Basic (Unverified)</td>
                      <td className="text-center">30%</td>
                      <td className="text-center font-medium text-foreground">70%</td>
                      <td className="text-center">Monthly (NET 30)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Verified</td>
                      <td className="text-center">25%</td>
                      <td className="text-center font-medium text-foreground">75%</td>
                      <td className="text-center">Monthly (NET 15)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Featured Partner</td>
                      <td className="text-center">20%</td>
                      <td className="text-center font-medium text-foreground">80%</td>
                      <td className="text-center">Bi-weekly</td>
                    </tr>
                    <tr>
                      <td className="py-2">Mylesoft First-Party</td>
                      <td className="text-center">0%</td>
                      <td className="text-center font-medium text-foreground">100%</td>
                      <td className="text-center">Immediate</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Payouts below KES 500 are rolled over to the next period. Minimum payout threshold applies.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Register Publisher Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register as Publisher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Legal Name *</Label>
              <Input value={regForm.legalName} onChange={(e) => setRegForm({ ...regForm, legalName: e.target.value })} placeholder="Full name or organisation name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Entity Type *</Label>
                <Select value={regForm.entityType} onValueChange={(v: any) => setRegForm({ ...regForm, entityType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="organization">Organisation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Country *</Label>
                <Input value={regForm.country} onChange={(e) => setRegForm({ ...regForm, country: e.target.value })} placeholder="KE" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Business Registration</Label>
                <Input value={regForm.businessRegistration} onChange={(e) => setRegForm({ ...regForm, businessRegistration: e.target.value })} placeholder="Certificate number" />
              </div>
              <div>
                <Label>Tax ID</Label>
                <Input value={regForm.taxId} onChange={(e) => setRegForm({ ...regForm, taxId: e.target.value })} placeholder="KRA PIN" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payout Method *</Label>
                <Select value={regForm.payoutMethod} onValueChange={(v: any) => setRegForm({ ...regForm, payoutMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payout Details *</Label>
                <Input value={regForm.payoutDetails} onChange={(e) => setRegForm({ ...regForm, payoutDetails: e.target.value })} placeholder="Phone number or account" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Email *</Label>
                <Input type="email" value={regForm.contactEmail} onChange={(e) => setRegForm({ ...regForm, contactEmail: e.target.value })} />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input value={regForm.contactPhone} onChange={(e) => setRegForm({ ...regForm, contactPhone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Website</Label>
              <Input value={regForm.website} onChange={(e) => setRegForm({ ...regForm, website: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Bio / Description</Label>
              <Textarea value={regForm.bio} onChange={(e) => setRegForm({ ...regForm, bio: e.target.value })} rows={3} placeholder="Tell us about yourself or your organisation..." />
            </div>
            <p className="text-xs text-muted-foreground">
              By registering, you accept the EduMyles Developer Agreement and Marketplace Policies.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
              <Button onClick={handleRegister} disabled={!regForm.legalName || !regForm.contactEmail || !regForm.payoutDetails}>
                Register Publisher
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Module Dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit New Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Module Name * (max 60 chars)</Label>
              <Input value={modForm.name} onChange={(e) => setModForm({ ...modForm, name: e.target.value })} maxLength={60} placeholder="My Awesome Module" />
            </div>
            <div>
              <Label>Short Description * (max 120 chars)</Label>
              <Input value={modForm.shortDescription} onChange={(e) => setModForm({ ...modForm, shortDescription: e.target.value })} maxLength={120} />
            </div>
            <div>
              <Label>Full Description * (max 5000 chars)</Label>
              <Textarea value={modForm.fullDescription} onChange={(e) => setModForm({ ...modForm, fullDescription: e.target.value })} rows={6} maxLength={5000} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={modForm.category} onValueChange={(v) => setModForm({ ...modForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic_tools">Academic Tools</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="finance_fees">Finance & Fees</SelectItem>
                    <SelectItem value="analytics_bi">Analytics & BI</SelectItem>
                    <SelectItem value="content_packs">Content Packs</SelectItem>
                    <SelectItem value="integrations">Integrations</SelectItem>
                    <SelectItem value="ai_automation">AI & Automation</SelectItem>
                    <SelectItem value="accessibility">Accessibility</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                    <SelectItem value="security_compliance">Security & Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Version *</Label>
                <Input value={modForm.version} onChange={(e) => setModForm({ ...modForm, version: e.target.value })} placeholder="1.0.0" />
              </div>
              <div>
                <Label>Pricing Model *</Label>
                <Select value={modForm.pricingModel} onValueChange={(v) => setModForm({ ...modForm, pricingModel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="one_time">One-Time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="per_student">Per Student</SelectItem>
                    <SelectItem value="per_user">Per User</SelectItem>
                    <SelectItem value="free_trial">Free Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {modForm.pricingModel !== "free" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (KES, in cents)</Label>
                  <Input type="number" value={modForm.priceCents} onChange={(e) => setModForm({ ...modForm, priceCents: parseInt(e.target.value) || 0 })} />
                </div>
                {modForm.pricingModel === "free_trial" && (
                  <div>
                    <Label>Trial Days (7-30)</Label>
                    <Input type="number" min={7} max={30} value={modForm.trialDays} onChange={(e) => setModForm({ ...modForm, trialDays: parseInt(e.target.value) || 14 })} />
                  </div>
                )}
              </div>
            )}
            <div>
              <Label>Feature Highlights (one per line, up to 8)</Label>
              <Textarea value={modForm.featureHighlights} onChange={(e) => setModForm({ ...modForm, featureHighlights: e.target.value })} rows={4} placeholder="Feature 1&#10;Feature 2&#10;Feature 3" />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={modForm.tags} onChange={(e) => setModForm({ ...modForm, tags: e.target.value })} placeholder="education, assessment, KNEC" />
            </div>
            <div>
              <Label>Permissions Required (comma-separated)</Label>
              <Input value={modForm.permissions} onChange={(e) => setModForm({ ...modForm, permissions: e.target.value })} placeholder="read:students, write:grades" />
            </div>
            <div>
              <Label>Compatible Plans (comma-separated)</Label>
              <Input value={modForm.compatiblePlans} onChange={(e) => setModForm({ ...modForm, compatiblePlans: e.target.value })} placeholder="starter,growth,enterprise" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Support URL</Label>
                <Input value={modForm.supportUrl} onChange={(e) => setModForm({ ...modForm, supportUrl: e.target.value })} />
              </div>
              <div>
                <Label>Docs URL</Label>
                <Input value={modForm.documentationUrl} onChange={(e) => setModForm({ ...modForm, documentationUrl: e.target.value })} />
              </div>
              <div>
                <Label>Privacy Policy URL</Label>
                <Input value={modForm.privacyPolicyUrl} onChange={(e) => setModForm({ ...modForm, privacyPolicyUrl: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span>Verification starts at Basic and can be upgraded from Marketplace Admin after review.</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitModule} disabled={!myPublisher || !modForm.name || !modForm.shortDescription || !modForm.fullDescription}>
                <Send className="h-4 w-4 mr-2" />Submit for Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
