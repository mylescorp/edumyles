"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { RequestList } from "../components/RequestList";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";

export default function ModuleRequestsPage() {
  const { isLoading: authLoading, sessionToken } = useAuth();
  const { isLoading: tenantLoading } = useTenant();
  const [activeTab, setActiveTab] = useState("pending");

  const requests = useQuery(
    api.modules.marketplace.queries.getModuleRequests,
    sessionToken ? { sessionToken } : "skip"
  );

  const reviewRequest = useMutation(api.modules.marketplace.mutations.reviewModuleRequest);
  const [isProcessing, setIsProcessing] = useState(false);

  if (authLoading || tenantLoading || requests === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const pendingRequests = ((requests as any[]) ?? []).filter((r: any) => r.status === "pending");
  const approvedRequests = ((requests as any[]) ?? []).filter((r: any) => r.status === "approved");
  const rejectedRequests = ((requests as any[]) ?? []).filter((r: any) => r.status === "rejected");

  const handleApprove = async (requestId: string) => {
    if (!sessionToken) return;
    setIsProcessing(true);
    try {
      await reviewRequest({
        sessionToken,
        requestId: requestId as Id<"moduleRequests">,
        status: "approved",
      });
    } catch (error) {
      console.error("Failed to approve request:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!sessionToken) return;
    setIsProcessing(true);
    try {
      await reviewRequest({
        sessionToken,
        requestId: requestId as Id<"moduleRequests">,
        status: "rejected",
      });
    } catch (error) {
      console.error("Failed to reject request:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Module Access Requests"
        description="Review and manage module access requests from users"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Marketplace", href: "/admin/marketplace" },
          { label: "Requests" },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="m-4">
              <TabsTrigger value="pending">
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="px-4 pb-4">
              <RequestList
                requests={pendingRequests}
                onApprove={handleApprove}
                onReject={handleReject}
                isLoading={isProcessing}
              />
            </TabsContent>

            <TabsContent value="approved" className="px-4 pb-4">
              <RequestList
                requests={approvedRequests}
                onApprove={handleApprove}
                onReject={handleReject}
                isLoading={isProcessing}
              />
            </TabsContent>

            <TabsContent value="rejected" className="px-4 pb-4">
              <RequestList
                requests={rejectedRequests}
                onApprove={handleApprove}
                onReject={handleReject}
                isLoading={isProcessing}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
