"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { CrmAdminRail } from "@/components/platform/CrmAdminRail";
import { PermissionGate } from "@/components/platform/PermissionGate";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { normalizeArray } from "@/lib/normalizeData";
import { ArrowRight, CalendarClock, Columns3, Plus, Search, Target, TrendingUp, Users } from "lucide-react";

type LeadRow = {
  _id: string;
  schoolName: string;
  contactName: string;
  email: string;
  country: string;
  stage: string;
  source?: string;
  sourceType?: string;
  marketingAttribution?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    ctaSource?: string;
  };
  qualificationScore?: number;
  dealValueKes?: number;
  nextFollowUpAt?: number;
  ownerName?: string;
  assignedToName?: string;
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

export default function CRMLeadsPage() {
  const { sessionToken } = useAuth();
  const [stageFilter, setStageFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const leads = usePlatformQuery(
    api.modules.platform.crm.getLeads,
    sessionToken
      ? {
          sessionToken,
          stage: stageFilter === "all" ? undefined : stageFilter,
          country: countryFilter === "all" ? undefined : countryFilter,
          search: search || undefined,
          sortBy: "updated_desc" as const,
        }
      : "skip",
    !!sessionToken
  ) as LeadRow[] | undefined;

  const leadRows = useMemo(() => normalizeArray<LeadRow>(leads), [leads]);
  const countries = useMemo(
    () => [...new Set(leadRows.map((lead) => lead.country).filter(Boolean))].sort(),
    [leadRows]
  );
  const stats = useMemo(
    () => ({
      total: leadRows.length,
      qualified: leadRows.filter((lead) => (lead.qualificationScore ?? 0) >= 60).length,
      followUps: leadRows.filter((lead) => Boolean(lead.nextFollowUpAt)).length,
      value: leadRows.reduce((sum, lead) => sum + (lead.dealValueKes ?? 0), 0),
    }),
    [leadRows]
  );

  if (!sessionToken || leads === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Registry"
        description="Work live school demand from qualification through conversion without leaving the platform."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM", href: "/platform/crm" },
          { label: "Leads" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/platform/crm/pipeline">
                <Columns3 className="h-4 w-4" />
                Pipeline Board
              </Link>
            </Button>
            <PermissionGate permission="crm.create_lead">
              <Button asChild className="gap-2">
                <Link href="/platform/crm/leads/create">
                  <Plus className="h-4 w-4" />
                  New lead
                </Link>
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <CrmAdminRail currentHref="/platform/crm/leads" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Accessible leads" value={stats.total} icon={Users} />
        <Metric label="Qualified leads" value={stats.qualified} icon={TrendingUp} />
        <Metric label="With follow-up" value={stats.followUps} icon={CalendarClock} />
        <Metric label="Visible value" value={formatKes(stats.value)} icon={Target} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search school, contact, email, stage..." className="pl-9" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {["new", "contacted", "qualified", "demo_booked", "demo_done", "proposal_sent", "negotiation", "won", "lost"].map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {leadRows.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Users}
              title="No CRM leads found"
              description="Adjust the filters or add a new lead to begin building the pipeline."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leadRows.map((lead) => (
            <Card key={lead._id} className="overflow-hidden border-slate-200/80">
              <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_auto] lg:items-center">
                <div className="min-w-0">
                  <Link href={`/platform/crm/${lead._id}`} className="truncate text-lg font-semibold hover:text-emerald-700">
                    {lead.schoolName}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">
                    {lead.contactName} · {lead.email}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {lead.country}
                    {lead.source ? ` · ${lead.source}` : ""}
                  </p>
                  {(lead.marketingAttribution?.utmCampaign || lead.marketingAttribution?.ctaSource) ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {lead.marketingAttribution?.ctaSource ?? "Inbound"}
                      {lead.marketingAttribution?.utmCampaign
                        ? ` · ${lead.marketingAttribution.utmCampaign}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stage</p>
                  <Badge variant="outline" className="mt-2">
                    {lead.stage}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lead score</p>
                  <p className="mt-2 text-lg font-semibold">{lead.qualificationScore ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Value</p>
                  <p className="mt-2 text-lg font-semibold">{formatKes(lead.dealValueKes)}</p>
                </div>
                <div className="flex justify-start lg:justify-end">
                  <Button asChild variant="outline" className="gap-2">
                    <Link href={`/platform/crm/${lead._id}`}>
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
