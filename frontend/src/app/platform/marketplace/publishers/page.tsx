"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/formatters";
import { Building2, CheckCircle2, SearchX, ShieldX, XCircle } from "lucide-react";

function badgeClass(status: string) {
  switch (status) {
    case "approved":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "pending":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "suspended":
    case "banned":
    case "rejected":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
  }
}

function tierClass(tier: string) {
  switch (tier) {
    case "enterprise":
      return "border-violet-500/20 bg-violet-500/10 text-violet-700";
    case "verified":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
  }
}

export default function MarketplacePublishersPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"publishers" | "applications">("publishers");
  const [busyId, setBusyId] = useState<string | null>(null);

  const publishers = usePlatformQuery(
    api.modules.marketplace.publishers.getPublishers,
    sessionToken
      ? {
          sessionToken,
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          ...(tierFilter !== "all" ? { tier: tierFilter } : {}),
        }
      : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const approvePublisher = useMutation(api.modules.marketplace.publishers.approvePublisher);
  const rejectPublisher = useMutation(api.modules.marketplace.publishers.rejectPublisher);
  const suspendPublisher = useMutation(api.modules.marketplace.publishers.suspendPublisher);

  const filtered = useMemo(() => {
    const rows = publishers ?? [];
    const scopedRows =
      viewMode === "applications"
        ? rows.filter((publisher) => publisher.status === "pending")
        : rows;
    if (!search.trim()) return scopedRows;
    const needle = search.toLowerCase();
    return scopedRows.filter((publisher) =>
      [publisher.companyName, publisher.email, publisher.website ?? "", publisher.billingCountry ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [publishers, search, viewMode]);

  const stats = useMemo(() => {
    const rows = publishers ?? [];
    return {
      total: rows.length,
      approved: rows.filter((publisher) => publisher.status === "approved").length,
      pending: rows.filter((publisher) => publisher.status === "pending").length,
      suspended: rows.filter((publisher) => ["suspended", "banned"].includes(publisher.status)).length,
    };
  }, [publishers]);

  if (isLoading || publishers === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const runPublisherAction = async (
    publisherId: any,
    action: () => Promise<unknown>,
    successMessage: string
  ) => {
    setBusyId(String(publisherId));
    try {
      await action();
      toast({ title: successMessage });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Publishers"
        description="Review publisher applications, monitor status, and drill into each publisher's modules, payouts, support load, and webhooks."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Publishers" },
        ]}
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/publishers" />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={viewMode === "publishers" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("publishers")}
        >
          Publishers
        </Button>
        <Button
          variant={viewMode === "applications" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("applications")}
        >
          Applications
          <Badge variant="secondary" className="ml-2">
            {stats.pending}
          </Badge>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total publishers</p><p className="text-3xl font-semibold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Approved</p><p className="text-3xl font-semibold">{stats.approved}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending review</p><p className="text-3xl font-semibold">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Restricted</p><p className="text-3xl font-semibold">{stats.suspended}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by company, email, website, or country"
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            <SelectItem value="indie">Indie</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon={search || statusFilter !== "all" || tierFilter !== "all" ? SearchX : Building2}
              title={search || statusFilter !== "all" || tierFilter !== "all" ? "No publishers match these filters" : "No publishers yet"}
              description="Publisher applications and approved marketplace partners will appear here as they register."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Publisher</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Revenue Share</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[280px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((publisher) => (
                  <TableRow key={String(publisher._id)}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{publisher.companyName}</p>
                        <p className="text-xs text-muted-foreground">{publisher.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badgeClass(publisher.status)}>
                        {publisher.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tierClass(publisher.tier)}>
                        {publisher.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>{publisher.revenueSharePct}%</TableCell>
                    <TableCell>{publisher.billingCountry ?? "—"}</TableCell>
                    <TableCell>{formatDateTime(publisher.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/platform/marketplace/publishers/${publisher._id}`}>View</Link>
                        </Button>
                        {publisher.status === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                runPublisherAction(
                                  publisher._id,
                                  () => approvePublisher({ sessionToken: sessionToken!, publisherId: publisher._id }),
                                  "Publisher approved"
                                )
                              }
                              disabled={busyId === String(publisher._id)}
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                runPublisherAction(
                                  publisher._id,
                                  () => rejectPublisher({ sessionToken: sessionToken!, publisherId: publisher._id }),
                                  "Publisher rejected"
                                )
                              }
                              disabled={busyId === String(publisher._id)}
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </>
                        ) : publisher.status === "approved" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              runPublisherAction(
                                publisher._id,
                                () => suspendPublisher({ sessionToken: sessionToken!, publisherId: publisher._id }),
                                "Publisher suspended"
                              )
                            }
                            disabled={busyId === String(publisher._id)}
                          >
                            <ShieldX className="mr-1 h-3.5 w-3.5" />
                            Suspend
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
