"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { CheckCircle, FileText, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

type ProposalDetail = {
  _id: string;
  dealId: string;
  tenantId?: string;
  planId?: string;
  customItems?: Array<{
    description: string;
    amountKes: number;
    quantity?: number;
  }>;
  totalKes: number;
  status: "draft" | "sent" | "accepted" | "rejected";
  sentAt?: number;
  acceptedAt?: number;
  validUntil?: number;
  createdAt: number;
  updatedAt: number;
  deal: {
    _id: string;
    valueKes: number;
    stage: string;
    status: "open" | "won" | "lost";
    tenantId?: string;
  };
  lead: {
    _id: string;
    schoolName: string;
    contactName: string;
    email: string;
    phone?: string;
    country: string;
    studentCount?: number;
  };
  plan?: {
    name: string;
    priceMonthlyKes: number;
    priceAnnualKes: number;
    supportTier: string;
  } | null;
};

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusTone(status: ProposalDetail["status"]) {
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

export default function ProposalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = String(params.proposalId);
  const { sessionToken } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, startRefreshing] = useTransition();

  const proposal = usePlatformQuery(
    api.modules.platform.crm.getProposal,
    sessionToken ? { sessionToken, proposalId: proposalId as never } : "skip",
    !!sessionToken
  ) as ProposalDetail | null | undefined;

  const sendProposal = useMutation(api.modules.platform.crm.sendProposal);

  const handleSend = async () => {
    if (!sessionToken || !proposal) return;
    setIsSending(true);
    try {
      await sendProposal({ sessionToken, proposalId: proposal._id as never });
      toast.success("Proposal sent.");
      startRefreshing(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send proposal.");
    } finally {
      setIsSending(false);
    }
  };

  if (!sessionToken || proposal === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!proposal) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Proposal not found"
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "CRM", href: "/platform/crm" },
            { label: "Proposals", href: "/platform/crm/proposals" },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={FileText}
              title="This proposal does not exist"
              description="Return to the proposals list and choose a different record."
              action={
                <Button asChild>
                  <Link href="/platform/crm/proposals">Back to proposals</Link>
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
        title={`Proposal for ${proposal.lead.schoolName}`}
        description="Review the real CRM proposal, its linked deal, and live acceptance state."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM", href: "/platform/crm" },
          { label: "Proposals", href: "/platform/crm/proposals" },
          { label: proposal.lead.schoolName },
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
            {proposal.status === "draft" ? (
              <Button onClick={handleSend} disabled={isSending}>
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Sending..." : "Send proposal"}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Proposal summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusTone(proposal.status)}>{proposal.status}</Badge>
              {proposal.planId ? <Badge variant="outline">{proposal.planId}</Badge> : null}
              <Badge variant="outline">{proposal.deal.stage}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Detail label="School" value={proposal.lead.schoolName} />
              <Detail label="Contact" value={proposal.lead.contactName} />
              <Detail label="Email" value={proposal.lead.email} />
              <Detail label="Phone" value={proposal.lead.phone ?? "Not provided"} />
              <Detail label="Created" value={formatDateTime(proposal.createdAt)} />
              <Detail label="Updated" value={formatDateTime(proposal.updatedAt)} />
              <Detail label="Sent at" value={proposal.sentAt ? formatDateTime(proposal.sentAt) : "Not sent"} />
              <Detail
                label="Accepted at"
                value={proposal.acceptedAt ? formatDateTime(proposal.acceptedAt) : "Not accepted"}
              />
              <Detail
                label="Valid until"
                value={proposal.validUntil ? formatDate(proposal.validUntil) : "No expiry set"}
              />
              <Detail label="Total" value={formatKes(proposal.totalKes)} />
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Linked deal</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{proposal.lead.schoolName}</p>
                  <p className="text-sm text-muted-foreground">
                    {proposal.deal.stage} · {proposal.deal.status}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/platform/crm/${proposal.deal._id}`}>Open deal</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposal.plan ? (
                <>
                  <Detail label="Plan" value={proposal.plan.name} />
                  <Detail label="Monthly" value={formatKes(proposal.plan.priceMonthlyKes)} />
                  <Detail label="Annual" value={formatKes(proposal.plan.priceAnnualKes)} />
                  <Detail label="Support tier" value={proposal.plan.supportTier} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No plan is attached to this proposal.</p>
              )}
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-sm text-muted-foreground">Proposal total</p>
                <p className="text-xl font-semibold">{formatKes(proposal.totalKes)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom items</CardTitle>
            </CardHeader>
            <CardContent>
              {proposal.customItems && proposal.customItems.length > 0 ? (
                <div className="space-y-3">
                  {proposal.customItems.map((item, index) => (
                    <div key={`${item.description}-${index}`} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">Qty {item.quantity ?? 1}</p>
                        </div>
                        <p className="font-semibold">{formatKes(item.amountKes)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle}
                  title="No custom items"
                  description="This proposal currently relies only on the selected plan and total amount."
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
