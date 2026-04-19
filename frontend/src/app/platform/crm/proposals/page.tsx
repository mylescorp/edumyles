"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CrmAdminRail } from "@/components/platform/CrmAdminRail";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import { normalizeArray } from "@/lib/normalizeData";
import { FileText, Plus, RefreshCw, Search, Send } from "lucide-react";
import { toast } from "sonner";

type DealRow = {
  _id: string;
  leadId: string;
  tenantId?: string;
  valueKes: number;
  stage: string;
  proposalId?: string;
  status: "open" | "won" | "lost";
  updatedAt: number;
};

type LeadRow = {
  _id: string;
  schoolName: string;
  contactName: string;
  email: string;
};

type ProposalRow = {
  _id: string;
  planId?: string;
  totalKes: number;
  status: "draft" | "sent" | "accepted" | "rejected";
  sentAt?: number;
  acceptedAt?: number;
  validUntil?: number;
  createdAt: number;
  updatedAt: number;
  deal: DealRow;
  lead: LeadRow;
};

type PlanRow = {
  name: string;
  priceMonthlyKes: number;
};

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusTone(status: ProposalRow["status"]) {
  switch (status) {
    case "sent":
      return "bg-sky-100 text-sky-700";
    case "accepted":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function PlatformCrmProposalsPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProposalRow["status"]>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [customTotalKes, setCustomTotalKes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, startRefreshing] = useTransition();

  const proposals = usePlatformQuery(
    api.modules.platform.crm.getProposals,
    sessionToken
      ? {
          sessionToken,
          status: statusFilter === "all" ? undefined : statusFilter,
        }
      : "skip",
    !!sessionToken
  ) as ProposalRow[] | undefined;

  const deals = usePlatformQuery(
    api.modules.platform.crm.getDeals,
    sessionToken ? { sessionToken, status: "open" } : "skip",
    !!sessionToken
  ) as DealRow[] | undefined;

  const leads = usePlatformQuery(
    api.modules.platform.crm.getLeads,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as LeadRow[] | undefined;

  const plans = usePlatformQuery(api.modules.platform.subscriptions.getSubscriptionPlans, {}, true) as
    | PlanRow[]
    | undefined;

  const createProposal = useMutation(api.modules.platform.crm.createProposal);
  const sendProposal = useMutation(api.modules.platform.crm.sendProposal);
  const proposalList = useMemo(() => normalizeArray<ProposalRow>(proposals), [proposals]);
  const dealList = useMemo(() => normalizeArray<DealRow>(deals), [deals]);
  const leadList = useMemo(() => normalizeArray<LeadRow>(leads), [leads]);
  const planList = useMemo(() => normalizeArray<PlanRow>(plans), [plans]);

  const leadById = useMemo(
    () => new Map(leadList.map((lead) => [String(lead._id), lead])),
    [leadList]
  );

  const proposalRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return proposalList.filter((proposal) => {
      if (!query) return true;
      return (
        proposal.lead.schoolName.toLowerCase().includes(query) ||
        proposal.lead.contactName.toLowerCase().includes(query) ||
        proposal.lead.email.toLowerCase().includes(query) ||
        proposal.status.toLowerCase().includes(query)
      );
    });
  }, [proposalList, searchQuery]);

  const dealOptions = useMemo(
    () =>
      dealList
        .filter((deal) => !deal.proposalId)
        .map((deal) => ({
          ...deal,
          lead: leadById.get(String(deal.leadId)),
        }))
        .filter((deal) => deal.lead),
    [dealList, leadById]
  );

  const selectedPlan = useMemo(
    () => planList.find((plan) => plan.name === selectedPlanId),
    [planList, selectedPlanId]
  );

  const summary = useMemo(
    () => ({
      total: proposalRows.length,
      draft: proposalRows.filter((proposal) => proposal.status === "draft").length,
      sent: proposalRows.filter((proposal) => proposal.status === "sent").length,
      accepted: proposalRows.filter((proposal) => proposal.status === "accepted").length,
      pipelineKes: proposalRows.reduce((sum, proposal) => sum + proposal.totalKes, 0),
    }),
    [proposalRows]
  );

  const handleCreateProposal = async () => {
    if (!sessionToken || !selectedDealId) {
      toast.error("Pick a deal before creating a proposal.");
      return;
    }

    const totalKes =
      customTotalKes.trim().length > 0
        ? Number(customTotalKes)
        : (selectedPlan?.priceMonthlyKes ?? 0);

    if (!Number.isFinite(totalKes) || totalKes <= 0) {
      toast.error("Enter a valid proposal total in KES.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createProposal({
        sessionToken,
        dealId: selectedDealId as never,
        planId: selectedPlanId || undefined,
        totalKes,
        validUntil: validUntil ? new Date(`${validUntil}T00:00:00.000Z`).getTime() : undefined,
      });
      toast.success("Proposal created.");
      setIsCreateOpen(false);
      setSelectedDealId("");
      setSelectedPlanId("");
      setCustomTotalKes("");
      setValidUntil("");
      startRefreshing(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendProposal = async (proposalId: string) => {
    if (!sessionToken) return;
    try {
      await sendProposal({
        sessionToken,
        proposalId: proposalId as never,
      });
      toast.success("Proposal sent.");
      startRefreshing(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send proposal.");
    }
  };

  if (!sessionToken || proposals === undefined || deals === undefined || leads === undefined || plans === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proposals"
        description="Manage real CRM proposals, send them to schools, and track acceptance against live deals."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM", href: "/platform/crm" },
          { label: "Proposals" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => startRefreshing(() => router.refresh())}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create proposal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create proposal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Open deal</Label>
                    <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose deal" />
                      </SelectTrigger>
                      <SelectContent>
                        {dealOptions.map((deal) => (
                          <SelectItem key={deal._id} value={String(deal._id)}>
                            {deal.lead?.schoolName} · {formatKes(deal.valueKes)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {planList.map((plan) => (
                          <SelectItem key={plan.name} value={plan.name}>
                            {plan.name} · {formatKes(plan.priceMonthlyKes)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customTotalKes">Total (KES)</Label>
                    <Input
                      id="customTotalKes"
                      type="number"
                      min={0}
                      value={customTotalKes}
                      onChange={(event) => setCustomTotalKes(event.target.value)}
                      placeholder={selectedPlan ? String(selectedPlan.priceMonthlyKes) : "Enter total KES"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={validUntil}
                      onChange={(event) => setValidUntil(event.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProposal} disabled={isSubmitting || !selectedDealId}>
                      {isSubmitting ? "Creating..." : "Create proposal"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <CrmAdminRail currentHref="/platform/crm/proposals" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Proposals" value={String(summary.total)} />
        <MetricCard title="Draft" value={String(summary.draft)} />
        <MetricCard title="Sent" value={String(summary.sent)} />
        <MetricCard title="Pipeline value" value={formatKes(summary.pipelineKes)} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Proposal queue</CardTitle>
              <CardDescription>Search by school, contact, or proposal status.</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search proposals"
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | ProposalRow["status"])}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {proposalRows.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No proposals yet"
              description="Create the first proposal from an open deal to start moving schools toward conversion."
            />
          ) : (
            <div className="space-y-3">
              {proposalRows.map((proposal) => (
                <div key={proposal._id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{proposal.lead.schoolName}</p>
                        <Badge className={statusTone(proposal.status)}>{proposal.status}</Badge>
                        {proposal.planId ? <Badge variant="outline">{proposal.planId}</Badge> : null}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{proposal.lead.contactName} · {proposal.lead.email}</p>
                        <p>
                          Created {formatDate(proposal.createdAt)} · Updated {formatRelativeTime(proposal.updatedAt)}
                          {proposal.validUntil ? ` · Valid until ${formatDate(proposal.validUntil)}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-semibold">{formatKes(proposal.totalKes)}</p>
                        <p className="text-xs text-muted-foreground">{proposal.deal.stage} stage deal</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/platform/crm/proposals/${proposal._id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        {proposal.status === "draft" ? (
                          <Button size="sm" onClick={() => handleSendProposal(String(proposal._id))}>
                            <Send className="mr-2 h-4 w-4" />
                            Send
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
