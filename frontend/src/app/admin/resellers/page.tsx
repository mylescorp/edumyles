"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
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
import { CheckCircle2, Search, Store, Users, Wallet } from "lucide-react";

type ResellerSummary = {
  _id: string;
  resellerId: string;
  businessName: string;
  applicantType: "reseller" | "affiliate";
  tier: "starter" | "silver" | "gold" | "platinum";
  status: "active" | "suspended" | "inactive";
  website?: string;
  description: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    country: string;
  };
  commission: {
    rate: number;
    minPayout: number;
  };
  schools: {
    total: number;
    converted: number;
  };
  commissions: {
    totalKes: number;
    availableKes: number;
  };
  payouts: {
    totalKes: number;
  };
  applicationStatus: string | null;
};

function formatMoney(amount: number) {
  return `KES ${amount.toLocaleString()}`;
}

export default function AdminResellersPage() {
  const { isLoading, sessionToken } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedResellerId, setSelectedResellerId] = useState<string | null>(null);

  const resellers = useQuery(
    api.platform.resellers.queries.getResellers,
    sessionToken ? { sessionToken } : "skip"
  ) as ResellerSummary[] | undefined;

  const allResellers = resellers ?? [];
  const selectedReseller = allResellers.find((reseller) => reseller._id === selectedResellerId) ?? null;

  const filteredResellers = allResellers.filter((reseller) => {
    const matchesSearch =
      reseller.businessName.toLowerCase().includes(search.toLowerCase()) ||
      reseller.contactInfo.email.toLowerCase().includes(search.toLowerCase()) ||
      reseller.contactInfo.country.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || reseller.status === statusFilter;
    const matchesTier = tierFilter === "all" || reseller.tier === tierFilter;
    const matchesType = typeFilter === "all" || reseller.applicantType === typeFilter;
    return matchesSearch && matchesStatus && matchesTier && matchesType;
  });

  const stats = {
    total: allResellers.length,
    active: allResellers.filter((reseller) => reseller.status === "active").length,
    schools: allResellers.reduce((sum, reseller) => sum + reseller.schools.total, 0),
    converted: allResellers.reduce((sum, reseller) => sum + reseller.schools.converted, 0),
    totalCommissionKes: allResellers.reduce((sum, reseller) => sum + reseller.commissions.totalKes, 0),
    availableCommissionKes: allResellers.reduce(
      (sum, reseller) => sum + reseller.commissions.availableKes,
      0
    ),
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reseller Management"
        description="Live reseller and affiliate partner records backed by Convex."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminStatsCard title="Total Partners" value={stats.total} icon={Store} />
        <AdminStatsCard title="Active" value={stats.active} icon={CheckCircle2} variant="success" />
        <AdminStatsCard title="Tracked Schools" value={stats.schools} icon={Users} />
        <AdminStatsCard title="Converted Schools" value={stats.converted} icon={Users} />
        <AdminStatsCard title="Total Commissions" value={formatMoney(stats.totalCommissionKes)} icon={Wallet} />
        <AdminStatsCard
          title="Available Balance"
          value={formatMoney(stats.availableCommissionKes)}
          icon={Wallet}
          variant={stats.availableCommissionKes > 0 ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Resellers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by partner name, email, or country..."
            className="max-w-xl"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All tiers</option>
            <option value="starter">Starter</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All partner types</option>
            <option value="reseller">Reseller</option>
            <option value="affiliate">Affiliate</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partner Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResellers.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No partners found"
              description="There are no reseller or affiliate accounts matching the current filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Partner</th>
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">Tier</th>
                    <th className="py-3 pr-4 font-medium">Schools</th>
                    <th className="py-3 pr-4 font-medium">Commission</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResellers.map((reseller) => (
                    <tr key={reseller._id} className="border-b last:border-0">
                      <td className="py-4 pr-4">
                        <div>
                          <p className="font-medium">{reseller.businessName}</p>
                          <p className="text-muted-foreground">{reseller.contactInfo.email}</p>
                          <p className="text-xs text-muted-foreground">{reseller.contactInfo.country}</p>
                        </div>
                      </td>
                      <td className="py-4 pr-4 capitalize">{reseller.applicantType}</td>
                      <td className="py-4 pr-4 capitalize">{reseller.tier}</td>
                      <td className="py-4 pr-4">
                        {reseller.schools.total} total / {reseller.schools.converted} converted
                      </td>
                      <td className="py-4 pr-4">{formatMoney(reseller.commissions.totalKes)}</td>
                      <td className="py-4 pr-4">
                        <Badge variant={reseller.status === "active" ? "default" : "outline"}>
                          {reseller.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline"
                          onClick={() => setSelectedResellerId(reseller._id)}
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

      <Dialog open={!!selectedReseller} onOpenChange={(open) => !open && setSelectedResellerId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedReseller?.businessName ?? "Reseller details"}</DialogTitle>
            <DialogDescription>
              Live partner summary built from reseller, school, commission, and payout records.
            </DialogDescription>
          </DialogHeader>

          {!selectedReseller ? (
            <LoadingSkeleton variant="table" />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{selectedReseller.contactInfo.email}</p>
                    <p>{selectedReseller.contactInfo.phone}</p>
                    <p>{selectedReseller.contactInfo.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedReseller.website ?? "No website provided"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p>{selectedReseller.schools.total} tracked schools</p>
                    <p>{selectedReseller.schools.converted} converted schools</p>
                    <p>{formatMoney(selectedReseller.commissions.availableKes)} available</p>
                    <p>{formatMoney(selectedReseller.payouts.totalKes)} paid out</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Partner Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{selectedReseller.description}</p>
                  <p>
                    <span className="font-medium text-foreground">Commission rate:</span>{" "}
                    {selectedReseller.commission.rate}%
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Minimum payout:</span>{" "}
                    {formatMoney(selectedReseller.commission.minPayout)}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Application status:</span>{" "}
                    {selectedReseller.applicationStatus ?? "No linked application"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
