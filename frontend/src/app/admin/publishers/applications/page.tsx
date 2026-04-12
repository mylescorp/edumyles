"use client";

import { useMemo, useState } from "react";
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
import { CheckCircle2, Clock3, PauseCircle, Search, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";

type PublisherApplication = {
  _id: Id<"publisherApplications">;
  applicantEmail: string;
  businessName: string;
  businessType: "individual" | "company";
  businessDescription: string;
  website?: string;
  contactPhone: string;
  contactAddress: string;
  country: string;
  experience: string;
  modules: string[];
  status: "submitted" | "under_review" | "approved" | "rejected" | "on_hold";
  reviewNotes?: string;
  submittedAt: number;
};

type PublisherApplicationDetail = {
  publisher: PublisherApplication;
  stats: {
    totalModules: number;
    publishedModules: number;
    totalPayoutKes: number;
    openSupportTickets: number;
  };
};

function statusVariant(status: PublisherApplication["status"]) {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  if (status === "on_hold") return "secondary";
  return "outline";
}

export default function AdminPublisherApplicationsPage() {
  const { isLoading, sessionToken } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<Id<"publisherApplications"> | null>(null);

  const applications = useQuery(
    api.modules.marketplace.publishers.getPublishers,
    sessionToken ? { sessionToken } : "skip"
  ) as PublisherApplication[] | undefined;

  const detail = useQuery(
    api.modules.marketplace.publishers.getPublisherDetailBundle,
    sessionToken && selectedApplicationId
      ? { sessionToken, publisherId: selectedApplicationId }
      : "skip"
  ) as PublisherApplicationDetail | undefined;

  const approvePublisher = useMutation(api.modules.marketplace.publishers.approvePublisher);
  const rejectPublisher = useMutation(api.modules.marketplace.publishers.rejectPublisher);
  const holdPublisher = useMutation(api.modules.marketplace.publishers.suspendPublisher);

  const allApplications = applications ?? [];

  const filteredApplications = useMemo(
    () =>
      allApplications.filter((application) => {
        const matchesSearch =
          application.businessName.toLowerCase().includes(search.toLowerCase()) ||
          application.applicantEmail.toLowerCase().includes(search.toLowerCase()) ||
          application.country.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || application.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [allApplications, search, statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: allApplications.length,
      submitted: allApplications.filter((application) => application.status === "submitted").length,
      underReview: allApplications.filter((application) => application.status === "under_review")
        .length,
      approved: allApplications.filter((application) => application.status === "approved").length,
      rejected: allApplications.filter((application) => application.status === "rejected").length,
      onHold: allApplications.filter((application) => application.status === "on_hold").length,
    }),
    [allApplications]
  );

  const handleDecision = async (
    action: "approve" | "reject" | "hold",
    applicationId: Id<"publisherApplications">
  ) => {
    if (!sessionToken) return;
    try {
      if (action === "approve") {
        await approvePublisher({ sessionToken, publisherId: applicationId });
      } else if (action === "reject") {
        await rejectPublisher({ sessionToken, publisherId: applicationId });
      } else {
        await holdPublisher({ sessionToken, publisherId: applicationId });
      }
      toast.success(`Publisher application ${action}d.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${action} application.`);
    }
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publisher Applications"
        description="Review publisher applications from the live Convex application queue."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminStatsCard title="Total" value={stats.total} icon={Clock3} />
        <AdminStatsCard title="Submitted" value={stats.submitted} icon={Clock3} variant="warning" />
        <AdminStatsCard title="Under Review" value={stats.underReview} icon={ShieldAlert} />
        <AdminStatsCard title="Approved" value={stats.approved} icon={CheckCircle2} variant="success" />
        <AdminStatsCard title="Rejected" value={stats.rejected} icon={XCircle} variant="danger" />
        <AdminStatsCard title="On Hold" value={stats.onHold} icon={PauseCircle} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Queue</CardTitle>
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
              description="There are no publisher applications matching the current filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Applicant</th>
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">Modules</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
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
                      <td className="py-4 pr-4">{application.modules.length}</td>
                      <td className="py-4 pr-4">
                        <Badge variant={statusVariant(application.status)}>
                          {application.status.replaceAll("_", " ")}
                        </Badge>
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

      <Dialog open={!!selectedApplicationId} onOpenChange={(open) => !open && setSelectedApplicationId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detail?.publisher.businessName ?? "Application detail"}</DialogTitle>
            <DialogDescription>
              Review the live application record and make an approval decision.
            </DialogDescription>
          </DialogHeader>

          {!detail ? (
            <LoadingSkeleton variant="table" />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm text-muted-foreground">Application</p>
                    <p className="font-medium">{detail.publisher.applicantEmail}</p>
                    <p>{detail.publisher.contactPhone}</p>
                    <p>{detail.publisher.contactAddress}</p>
                    <p className="text-sm text-muted-foreground">{detail.publisher.website ?? "No website provided"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm text-muted-foreground">Live Publisher Stats</p>
                    <p>{detail.stats.totalModules} modules linked</p>
                    <p>{detail.stats.publishedModules} published</p>
                    <p>KES {detail.stats.totalPayoutKes.toLocaleString()} paid out</p>
                    <p>{detail.stats.openSupportTickets} open support tickets</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Business Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{detail.publisher.businessDescription}</p>
                  <p>
                    <span className="font-medium text-foreground">Experience:</span>{" "}
                    {detail.publisher.experience}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Proposed modules:</span>{" "}
                    {detail.publisher.modules.length > 0 ? detail.publisher.modules.join(", ") : "No modules submitted"}
                  </p>
                  {detail.publisher.reviewNotes ? (
                    <p>
                      <span className="font-medium text-foreground">Review notes:</span>{" "}
                      {detail.publisher.reviewNotes}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedApplicationId(null)}>
                  Close
                </Button>
                {detail.publisher.status !== "approved" ? (
                  <Button variant="outline" onClick={() => handleDecision("hold", detail.publisher._id)}>
                    Put on hold
                  </Button>
                ) : null}
                {detail.publisher.status !== "rejected" ? (
                  <Button variant="destructive" onClick={() => handleDecision("reject", detail.publisher._id)}>
                    Reject
                  </Button>
                ) : null}
                {detail.publisher.status !== "approved" ? (
                  <Button onClick={() => handleDecision("approve", detail.publisher._id)}>
                    Approve
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
