"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, CheckCircle2, Globe, Package, Search, Star, Wallet } from "lucide-react";

type Publisher = {
  _id: Id<"marketplacePublishers">;
  legalName: string;
  entityType: "individual" | "organization";
  country: string;
  verificationLevel: "basic" | "verified" | "featured_partner";
  totalModules: number;
  totalInstalls: number;
  totalEarningsCents: number;
  pendingPayoutCents: number;
  averageRating: number;
  isActive: boolean;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  createdAt: number;
};

type PublisherDetail = {
  publisher: Publisher;
  modules: Array<{ _id: string; name?: string; moduleId?: string; status?: string }>;
  payouts: Array<{ _id: string; amountCents?: number; status?: string; requestedAt?: number }>;
  stats: {
    totalModules: number;
    totalInstalls: number;
    totalEarningsCents: number;
    pendingPayoutCents: number;
  };
};

function formatMoney(amountCents: number) {
  return `KES ${(amountCents / 100).toLocaleString()}`;
}

export default function AdminPublishersPage() {
  const { isLoading, sessionToken } = useAuth();
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedPublisherId, setSelectedPublisherId] = useState<Id<"marketplacePublishers"> | null>(
    null
  );

  const publishers = useQuery(
    api.platform.marketplace.queries.getPublishers,
    sessionToken ? { sessionToken } : "skip"
  ) as Publisher[] | undefined;

  const publisherDetail = useQuery(
    api.platform.marketplace.queries.getPublisherDetail,
    sessionToken && selectedPublisherId
      ? { sessionToken, publisherId: selectedPublisherId }
      : "skip"
  ) as PublisherDetail | undefined;

  const allPublishers = publishers ?? [];

  const filteredPublishers = useMemo(
    () =>
      allPublishers.filter((publisher) => {
        const matchesSearch =
          publisher.legalName.toLowerCase().includes(search.toLowerCase()) ||
          publisher.contactEmail.toLowerCase().includes(search.toLowerCase()) ||
          (publisher.website ?? "").toLowerCase().includes(search.toLowerCase());
        const matchesVerification =
          verificationFilter === "all" || publisher.verificationLevel === verificationFilter;
        const matchesActive =
          activeFilter === "all" ||
          (activeFilter === "active" ? publisher.isActive : !publisher.isActive);
        return matchesSearch && matchesVerification && matchesActive;
      }),
    [activeFilter, allPublishers, search, verificationFilter]
  );

  const stats = useMemo(
    () => ({
      total: allPublishers.length,
      active: allPublishers.filter((publisher) => publisher.isActive).length,
      modules: allPublishers.reduce((sum, publisher) => sum + publisher.totalModules, 0),
      installs: allPublishers.reduce((sum, publisher) => sum + publisher.totalInstalls, 0),
      earningsCents: allPublishers.reduce(
        (sum, publisher) => sum + publisher.totalEarningsCents,
        0
      ),
      pendingPayoutCents: allPublishers.reduce(
        (sum, publisher) => sum + publisher.pendingPayoutCents,
        0
      ),
    }),
    [allPublishers]
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publisher Management"
        description="Live marketplace publisher records backed by Convex."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminStatsCard title="Total Publishers" value={stats.total} icon={Building2} />
        <AdminStatsCard title="Active" value={stats.active} icon={CheckCircle2} variant="success" />
        <AdminStatsCard title="Modules" value={stats.modules} icon={Package} />
        <AdminStatsCard title="Installs" value={stats.installs} icon={Package} />
        <AdminStatsCard title="Gross Earnings" value={formatMoney(stats.earningsCents)} icon={Wallet} />
        <AdminStatsCard
          title="Pending Payouts"
          value={formatMoney(stats.pendingPayoutCents)}
          icon={Wallet}
          variant={stats.pendingPayoutCents > 0 ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Publishers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by publisher, email, or website..."
            className="max-w-xl"
          />
          <select
            value={verificationFilter}
            onChange={(event) => setVerificationFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All verification levels</option>
            <option value="basic">Basic</option>
            <option value="verified">Verified</option>
            <option value="featured_partner">Featured partner</option>
          </select>
          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publishers</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPublishers.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No publishers found"
              description="Try widening your search or verification filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Publisher</th>
                    <th className="py-3 pr-4 font-medium">Verification</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Modules</th>
                    <th className="py-3 pr-4 font-medium">Installs</th>
                    <th className="py-3 pr-4 font-medium">Earnings</th>
                    <th className="py-3 pr-4 font-medium">Rating</th>
                    <th className="py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPublishers.map((publisher) => (
                    <tr key={publisher._id} className="border-b last:border-0">
                      <td className="py-4 pr-4">
                        <div>
                          <p className="font-medium">{publisher.legalName}</p>
                          <p className="text-muted-foreground">{publisher.contactEmail}</p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {publisher.entityType} · {publisher.country}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <Badge variant={publisher.verificationLevel === "featured_partner" ? "default" : "outline"}>
                          {publisher.verificationLevel.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4">
                        <Badge variant={publisher.isActive ? "default" : "outline"}>
                          {publisher.isActive ? "active" : "inactive"}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4">{publisher.totalModules}</td>
                      <td className="py-4 pr-4">{publisher.totalInstalls.toLocaleString()}</td>
                      <td className="py-4 pr-4">{formatMoney(publisher.totalEarningsCents)}</td>
                      <td className="py-4 pr-4">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          {publisher.averageRating.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline"
                          onClick={() => setSelectedPublisherId(publisher._id)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPublisherId} onOpenChange={(open) => !open && setSelectedPublisherId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{publisherDetail?.publisher.legalName ?? "Publisher details"}</DialogTitle>
            <DialogDescription>
              Convex-backed publisher profile, module catalog, and payout snapshot.
            </DialogDescription>
          </DialogHeader>

          {!publisherDetail ? (
            <LoadingSkeleton variant="table" />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{publisherDetail.publisher.contactEmail}</p>
                    <p>{publisherDetail.publisher.contactPhone ?? "No phone on file"}</p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      {publisherDetail.publisher.website ?? "No website provided"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p>{publisherDetail.stats.totalModules} modules</p>
                    <p>{publisherDetail.stats.totalInstalls.toLocaleString()} installs</p>
                    <p>{formatMoney(publisherDetail.stats.totalEarningsCents)} earned</p>
                    <p>{formatMoney(publisherDetail.stats.pendingPayoutCents)} pending payout</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Latest Modules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {publisherDetail.modules.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No modules published yet.</p>
                    ) : (
                      publisherDetail.modules.slice(0, 6).map((module) => (
                        <div key={module._id} className="flex items-center justify-between rounded-md border p-3">
                          <div>
                            <p className="font-medium">{module.name ?? module.moduleId ?? "Untitled module"}</p>
                            <p className="text-xs text-muted-foreground">{module.moduleId ?? module._id}</p>
                          </div>
                          <Badge variant="outline">{module.status ?? "unknown"}</Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Latest Payouts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {publisherDetail.payouts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No payout records yet.</p>
                    ) : (
                      publisherDetail.payouts.slice(0, 6).map((payout) => (
                        <div key={payout._id} className="flex items-center justify-between rounded-md border p-3">
                          <div>
                            <p className="font-medium">{formatMoney(payout.amountCents ?? 0)}</p>
                            <p className="text-xs text-muted-foreground">
                              {payout.requestedAt
                                ? new Date(payout.requestedAt).toLocaleString()
                                : "No payout date"}
                            </p>
                          </div>
                          <Badge variant="outline">{payout.status ?? "unknown"}</Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
