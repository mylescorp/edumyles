"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { CrmAdminRail } from "@/components/platform/CrmAdminRail";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { normalizeArray } from "@/lib/normalizeData";
import { FileText, Search } from "lucide-react";

type ProposalRow = {
  _id: string;
  recommendedPlan?: string;
  status: string;
  totalKes: number;
  validUntil?: number;
  lead?: {
    _id: string;
    schoolName: string;
    contactName: string;
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

export default function PlatformCrmProposalsPage() {
  const { sessionToken } = useAuth();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const proposals = usePlatformQuery(
    api.modules.platform.crm.getProposals,
    sessionToken ? { sessionToken, status: status === "all" ? undefined : (status as any) } : "skip",
    !!sessionToken
  ) as ProposalRow[] | undefined;

  const rows = useMemo(() => {
    const items = normalizeArray<ProposalRow>(proposals);
    const search = query.trim().toLowerCase();
    if (!search) return items;
    return items.filter((proposal) =>
      [proposal.lead?.schoolName, proposal.lead?.contactName, proposal.status, proposal.recommendedPlan]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [proposals, query]);

  if (!sessionToken || proposals === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Proposals"
        description="Monitor sent, viewed, accepted, and rejected commercial offers from one live ledger."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM", href: "/platform/crm" },
          { label: "Proposals" },
        ]}
      />

      <CrmAdminRail currentHref="/platform/crm/proposals" />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search school, contact, status..." className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full lg:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["draft", "sent", "viewed", "accepted", "rejected", "expired"].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState icon={FileText} title="No proposals match this view" description="Create a proposal from a lead detail page or loosen the filters." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((proposal) => (
            <Link key={proposal._id} href={`/platform/crm/proposals/${proposal._id}`} className="block">
              <Card className="transition hover:border-emerald-200 hover:bg-emerald-50/30">
                <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-center">
                  <div>
                    <p className="text-lg font-semibold">{proposal.lead?.schoolName ?? "Unknown school"}</p>
                    <p className="text-sm text-muted-foreground">{proposal.lead?.contactName ?? "Unknown contact"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Plan</p>
                    <p className="mt-2 font-medium">{proposal.recommendedPlan ?? "Custom"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                    <Badge variant="outline" className="mt-2">{proposal.status}</Badge>
                  </div>
                  <p className="text-right text-lg font-semibold">{formatKes(proposal.totalKes)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
