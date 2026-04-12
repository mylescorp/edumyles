"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Clock3, PauseCircle, Search, Store, XCircle } from "lucide-react";
import { toast } from "sonner";

type ResellerApplication = {
  _id: Id<"resellerApplications">;
  applicantEmail: string;
  businessName: string;
  businessType: "reseller" | "affiliate";
  businessDescription: string;
  website?: string;
  contactPhone: string;
  contactAddress: string;
  country: string;
  targetMarket: string;
  experience: string;
  marketingChannels: string[];
  expectedVolume: string;
  status: "submitted" | "under_review" | "approved" | "rejected" | "on_hold";
  reviewNotes?: string;
  submittedAt: number;
  provisionedResellerId: string | null;
  provisionedResellerStatus: string | null;
  provisionedResellerTier: string | null;
};

function statusVariant(status: ResellerApplication["status"]) {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  if (status === "on_hold") return "secondary";
  return "outline";
}

export default function AdminResellerApplicationsPage() {
  const { isLoading, sessionToken } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<Id<"resellerApplications"> | null>(null);

  const applications = useQuery(
    api.platform.resellers.queries.getResellerApplications,
    sessionToken ? { sessionToken } : "skip"
  ) as ResellerApplication[] | undefined;

  const reviewApplication = useMutation(api.platform.resellers.mutations.reviewResellerApplication);

  const allApplications = applications ?? [];
  const selectedApplication =
    allApplications.find((application) => application._id === selectedApplicationId) ?? null;

  const filteredApplications = allApplications.filter((application) => {
    const matchesSearch =
      application.businessName.toLowerCase().includes(search.toLowerCase()) ||
      application.applicantEmail.toLowerCase().includes(search.toLowerCase()) ||
      application.country.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || application.status === statusFilter;
    const matchesType = typeFilter === "all" || application.businessType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: allApplications.length,
    submitted: allApplications.filter((application) => application.status === "submitted").length,
    underReview: allApplications.filter((application) => application.status === "under_review").length,
    approved: allApplications.filter((application) => application.status === "approved").length,
    rejected: allApplications.filter((application) => application.status === "rejected").length,
    provisioned: allApplications.filter((application) => application.provisionedResellerId).length,
  };

  const handleDecision = async (
    decision: "approved" | "rejected" | "on_hold" | "under_review",
    applicationId: Id<"resellerApplications">
  ) => {
    if (!sessionToken) return;
    try {
      await reviewApplication({ sessionToken, applicationId, decision });
      toast.success(`Reseller application moved to ${decision.replaceAll("_", " ")}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update reseller application.");
    }
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reseller Applications"
        description="Live Convex application queue for reseller and affiliate onboarding."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminStatsCard title="Total" value={stats.total} icon={Store} />
        <AdminStatsCard title="Submitted" value={stats.submitted} icon={Clock3} variant="warning" />
        <AdminStatsCard title="Under Review" value={stats.underReview} icon={PauseCircle} />
        <AdminStatsCard title="Approved" value={stats.approved} icon={CheckCircle2} variant="success" />
        <AdminStatsCard title="Rejected" value={stats.rejected} icon={XCircle} variant="danger" />
        <AdminStatsCard title="Provisioned" value={stats.provisioned} icon={CheckCircle2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by business, email, or country..."
            className="max-w-xl"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="on_hold">On hold</option>
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
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No applications found"
              description="There are no reseller applications matching the current filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Applicant</th>
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">Target Market</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Provisioned</th>
                    <th className="py-3 pr-4 font-medium">Submitted</th>
                    <th className="py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application) => (
                    <tr key={application._id} className="border-b last:border-0">
                      <td className="py-4 pr-4">
                        <div>
                          <p className="font-medium">{application.businessName}</p>
                          <p className="text-muted-foreground">{application.applicantEmail}</p>
                          <p className="text-xs text-muted-foreground">{application.country}</p>
                        </div>
                      </td>
                      <td className="py-4 pr-4 capitalize">{application.businessType}</td>
                      <td className="py-4 pr-4">{application.targetMarket}</td>
                      <td className="py-4 pr-4">
                        <Badge variant={statusVariant(application.status)}>
                          {application.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4">
                        {application.provisionedResellerId ? (
                          <span className="text-sm">
                            {application.provisionedResellerTier} · {application.provisionedResellerStatus}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not yet</span>
                        )}
                      </td>
                      <td className="py-4 pr-4">{new Date(application.submittedAt).toLocaleString()}</td>
                      <td className="py-4 text-right">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline"
                          onClick={() => setSelectedApplicationId(application._id)}
                        >
                          Review
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

      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplicationId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedApplication?.businessName ?? "Application detail"}</DialogTitle>
            <DialogDescription>
              Review the live application and provision or update the reseller record from Convex.
            </DialogDescription>
          </DialogHeader>

          {!selectedApplication ? (
            <LoadingSkeleton variant="table" />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm text-muted-foreground">Applicant</p>
                    <p className="font-medium">{selectedApplication.applicantEmail}</p>
                    <p>{selectedApplication.contactPhone}</p>
                    <p>{selectedApplication.contactAddress}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedApplication.website ?? "No website provided"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm text-muted-foreground">Provisioning</p>
                    <p>
                      <span className="font-medium text-foreground">Current status:</span>{" "}
                      {selectedApplication.status.replaceAll("_", " ")}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Provisioned reseller:</span>{" "}
                      {selectedApplication.provisionedResellerId ?? "Not yet created"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Tier:</span>{" "}
                      {selectedApplication.provisionedResellerTier ?? "Will default on approval"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Application Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{selectedApplication.businessDescription}</p>
                  <p>
                    <span className="font-medium text-foreground">Target market:</span>{" "}
                    {selectedApplication.targetMarket}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Experience:</span>{" "}
                    {selectedApplication.experience}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Expected volume:</span>{" "}
                    {selectedApplication.expectedVolume}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Marketing channels:</span>{" "}
                    {selectedApplication.marketingChannels.join(", ")}
                  </p>
                  {selectedApplication.reviewNotes ? (
                    <p>
                      <span className="font-medium text-foreground">Review notes:</span>{" "}
                      {selectedApplication.reviewNotes}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedApplicationId(null)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => handleDecision("under_review", selectedApplication._id)}>
                  Mark under review
                </Button>
                <Button variant="outline" onClick={() => handleDecision("on_hold", selectedApplication._id)}>
                  Put on hold
                </Button>
                <Button variant="destructive" onClick={() => handleDecision("rejected", selectedApplication._id)}>
                  Reject
                </Button>
                <Button onClick={() => handleDecision("approved", selectedApplication._id)}>
                  Approve & provision
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
