"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { formatDateTime } from "@/lib/formatters";
import { FileText, Send } from "lucide-react";
import { toast } from "sonner";

type ProposalDetail = {
  _id: string;
  recommendedPlan?: string;
  status: string;
  totalKes: number;
  totalMonthlyKes?: number;
  totalAnnualKes?: number;
  billingPeriod?: string;
  studentCount?: number;
  validUntil?: number;
  trackingToken?: string;
  lead?: {
    _id: string;
    schoolName: string;
    contactName: string;
    email: string;
  } | null;
};

function formatKes(amount?: number) {
  return amount
    ? new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    : "—";
}

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = String(params.proposalId);
  const { sessionToken } = useAuth();

  const proposal = usePlatformQuery(
    api.modules.platform.crm.getProposal,
    sessionToken ? { sessionToken, proposalId: proposalId as never } : "skip",
    !!sessionToken
  ) as ProposalDetail | null | undefined;

  const sendProposal = useMutation(api.modules.platform.crm.sendProposal);

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
            <EmptyState icon={FileText} title="This proposal does not exist" description="Return to the proposal ledger and select a different record." />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSend = async () => {
    if (!sessionToken) return;
    try {
      await sendProposal({ sessionToken, proposalId: proposalId as never });
      toast.success("Proposal sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send proposal.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Proposal for ${proposal.lead?.schoolName ?? "Unknown school"}`}
        description="Use this page to review the commercial package before or after it goes out to the school."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM", href: "/platform/crm" },
          { label: "Proposals", href: "/platform/crm/proposals" },
          { label: proposal.lead?.schoolName ?? "Proposal" },
        ]}
        actions={
          proposal.status === "draft" ? (
            <Button className="gap-2" onClick={handleSend}>
              <Send className="h-4 w-4" />
              Send proposal
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Proposal summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Info label="School" value={proposal.lead?.schoolName ?? "Unknown"} />
            <Info label="Contact" value={proposal.lead?.contactName ?? "Unknown"} />
            <Info label="Email" value={proposal.lead?.email ?? "Unknown"} />
            <Info label="Status" value={proposal.status} />
            <Info label="Recommended plan" value={proposal.recommendedPlan ?? "Custom"} />
            <Info label="Billing period" value={proposal.billingPeriod ?? "Not set"} />
            <Info label="Student count" value={proposal.studentCount ? String(proposal.studentCount) : "Not set"} />
            <Info label="Valid until" value={proposal.validUntil ? formatDateTime(proposal.validUntil) : "No expiry"} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <PriceRow label="Quoted total" value={formatKes(proposal.totalKes)} />
              <PriceRow label="Monthly baseline" value={formatKes(proposal.totalMonthlyKes)} />
              <PriceRow label="Annual baseline" value={formatKes(proposal.totalAnnualKes)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shareable link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="outline">{proposal.status}</Badge>
              {proposal.trackingToken ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/proposals/${proposal.trackingToken}`}>Open public proposal page</Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">A public link will appear once the proposal is sent.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
