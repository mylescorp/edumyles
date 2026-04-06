"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { api } from "@/convex/_generated/api";
import { CrmAdminRail } from "@/components/platform/CrmAdminRail";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { ArrowRight, CheckCircle, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type DealDetail = {
  _id: string;
  leadId: string;
  tenantId?: string;
  valueKes: number;
  stage: string;
  proposalId?: string;
  closedAt?: number;
  status: "open" | "won" | "lost";
  lossReason?: string;
  createdAt: number;
  updatedAt: number;
  lead: {
    _id: string;
    schoolName: string;
    contactName: string;
    email: string;
    phone?: string;
    country: string;
    studentCount?: number;
    source?: string;
    qualificationScore?: number;
    expectedClose?: number;
    notes?: string;
  };
  proposal?: {
    _id: string;
    status: string;
    totalKes: number;
  } | null;
};

type PlanRow = {
  name: string;
};

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function stageTone(stage: string) {
  switch (stage) {
    case "proposal":
      return "bg-amber-100 text-amber-700";
    case "negotiation":
      return "bg-orange-100 text-orange-700";
    case "converted":
    case "won":
      return "bg-emerald-100 text-emerald-700";
    case "lost":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function DealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = String(params.dealId);
  const { sessionToken } = useAuth();
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"open" | "won" | "lost">("open");
  const [lossReason, setLossReason] = useState("");
  const [planId, setPlanId] = useState("");
  const [proposalTotal, setProposalTotal] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [conversionPlan, setConversionPlan] = useState<"starter" | "standard" | "pro" | "enterprise">("starter");
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, startRefreshing] = useTransition();

  const deal = usePlatformQuery(
    api.modules.platform.crm.getDeal,
    sessionToken ? { sessionToken, dealId: dealId as never } : "skip",
    !!sessionToken
  ) as DealDetail | null | undefined;

  const plans = usePlatformQuery(api.modules.platform.subscriptions.getSubscriptionPlans, {}, true) as
    | PlanRow[]
    | undefined;

  const updateDealStage = useMutation(api.modules.platform.crm.updateDealStage);
  const createProposal = useMutation(api.modules.platform.crm.createProposal);
  const convertDealToTenant = useMutation(api.modules.platform.crm.convertDealToTenant);

  useEffect(() => {
    if (deal) {
      setSelectedStage(deal.stage);
      setSelectedStatus(deal.status);
      setProposalTotal(deal.valueKes > 0 ? String(deal.valueKes) : "");
    }
  }, [deal]);

  const refreshPage = () => startRefreshing(() => router.refresh());

  const handleSaveStage = async () => {
    if (!sessionToken || !deal) return;
    setIsSaving(true);
    try {
      await updateDealStage({
        sessionToken,
        dealId: deal._id as never,
        stage: selectedStage,
        status: selectedStatus,
        lossReason: selectedStatus === "lost" ? lossReason || undefined : undefined,
      });
      toast.success("Deal updated.");
      refreshPage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update deal.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!sessionToken || !deal || !proposalTotal) return;
    setIsSaving(true);
    try {
      await createProposal({
        sessionToken,
        dealId: deal._id as never,
        planId: planId || undefined,
        totalKes: Number(proposalTotal),
      });
      toast.success("Proposal created.");
      setIsProposalOpen(false);
      refreshPage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create proposal.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!sessionToken || !deal || !subdomain.trim()) return;
    setIsSaving(true);
    try {
      await convertDealToTenant({
        sessionToken,
        dealId: deal._id as never,
        subdomain: subdomain.trim().toLowerCase(),
        plan: conversionPlan,
        country: deal.lead.country,
        phone: deal.lead.phone,
      });
      toast.success("Deal converted to tenant.");
      setIsConvertOpen(false);
      refreshPage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to convert deal.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!sessionToken || deal === undefined || plans === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!deal) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Deal not found"
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "CRM", href: "/platform/crm" },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={FileText}
              title="This deal does not exist"
              description="Return to the CRM board and choose a different opportunity."
              action={
                <Button asChild>
                  <Link href="/platform/crm">Back to CRM</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.lead.schoolName}
        description="Work the opportunity, create a proposal, and convert the school into a live tenant."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM", href: "/platform/crm" },
          { label: deal.lead.schoolName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={refreshPage} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Dialog open={isProposalOpen} onOpenChange={setIsProposalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Create proposal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create proposal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select value={planId} onValueChange={setPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Optional plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.name} value={plan.name}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proposalTotal">Total (KES)</Label>
                    <Input
                      id="proposalTotal"
                      type="number"
                      value={proposalTotal}
                      onChange={(event) => setProposalTotal(event.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsProposalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProposal} disabled={isSaving || !proposalTotal}>
                      {isSaving ? "Creating..." : "Create proposal"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
              <DialogTrigger asChild>
                <Button disabled={deal.status === "won" || Boolean(deal.tenantId)}>Convert to tenant</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create tenant from deal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <Input
                      id="subdomain"
                      value={subdomain}
                      onChange={(event) => setSubdomain(event.target.value)}
                      placeholder="school-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select value={conversionPlan} onValueChange={(value) => setConversionPlan(value as typeof conversionPlan)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">starter</SelectItem>
                        <SelectItem value="standard">standard</SelectItem>
                        <SelectItem value="pro">pro</SelectItem>
                        <SelectItem value="enterprise">enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsConvertOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleConvert} disabled={isSaving || !subdomain.trim()}>
                      {isSaving ? "Converting..." : "Convert"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <CrmAdminRail currentHref="/platform/crm" />

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Deal overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={stageTone(deal.stage)}>{deal.stage}</Badge>
              <Badge variant="outline">{deal.status}</Badge>
              {deal.proposal ? <Badge variant="outline">proposal linked</Badge> : null}
              {deal.tenantId ? <Badge variant="outline">tenant created</Badge> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Detail label="School" value={deal.lead.schoolName} />
              <Detail label="Contact" value={deal.lead.contactName} />
              <Detail label="Email" value={deal.lead.email} />
              <Detail label="Phone" value={deal.lead.phone ?? "Not provided"} />
              <Detail label="Country" value={deal.lead.country} />
              <Detail label="Students" value={String(deal.lead.studentCount ?? 0)} />
              <Detail label="Source" value={deal.lead.source ?? "Not recorded"} />
              <Detail label="Qualification" value={`${deal.lead.qualificationScore ?? 0}%`} />
              <Detail label="Expected close" value={deal.lead.expectedClose ? formatDate(deal.lead.expectedClose) : "Not set"} />
              <Detail label="Value" value={formatKes(deal.valueKes)} />
              <Detail label="Created" value={formatDateTime(deal.createdAt)} />
              <Detail label="Updated" value={formatDateTime(deal.updatedAt)} />
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Lead notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{deal.lead.notes ?? "No notes recorded."}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stage controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">new</SelectItem>
                    <SelectItem value="contacted">contacted</SelectItem>
                    <SelectItem value="qualified">qualified</SelectItem>
                    <SelectItem value="proposal">proposal</SelectItem>
                    <SelectItem value="negotiation">negotiation</SelectItem>
                    <SelectItem value="won">won</SelectItem>
                    <SelectItem value="lost">lost</SelectItem>
                    <SelectItem value="converted">converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as typeof selectedStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">open</SelectItem>
                    <SelectItem value="won">won</SelectItem>
                    <SelectItem value="lost">lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedStatus === "lost" ? (
                <div className="space-y-2">
                  <Label htmlFor="lossReason">Loss reason</Label>
                  <Input
                    id="lossReason"
                    value={lossReason}
                    onChange={(event) => setLossReason(event.target.value)}
                    placeholder="Optional reason"
                  />
                </div>
              ) : null}
              <Button onClick={handleSaveStage} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save deal"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deal.proposal ? (
                <div className="rounded-xl border p-4">
                  <p className="font-medium">Proposal</p>
                  <p className="text-sm text-muted-foreground">
                    {deal.proposal.status} · {formatKes(deal.proposal.totalKes)}
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href={`/platform/crm/proposals/${deal.proposal._id}`}>
                      Open proposal
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No proposal yet"
                  description="Create a proposal from this deal to move it into the commercial approval flow."
                  className="py-6"
                />
              )}

              {deal.tenantId ? (
                <div className="rounded-xl border p-4">
                  <p className="font-medium">Tenant created</p>
                  <p className="text-sm text-muted-foreground">{deal.tenantId}</p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href={`/platform/tenants/${deal.tenantId}`}>Open tenant</Link>
                  </Button>
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle}
                  title="Not converted yet"
                  description="Convert this opportunity to create the tenant, organization, onboarding, and trial subscription."
                  className="py-6"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
