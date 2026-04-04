"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Edit, Settings, Archive, Trash2 } from "lucide-react";
import { TenantDetailTabs } from "@/components/platform/TenantDetailTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { formatTenantHostname } from "@/lib/domains";
import Link from "next/link";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const { isLoading, sessionToken } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmationName, setConfirmationName] = useState("");
  const [submittingArchive, setSubmittingArchive] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Fetch tenant details from Convex backend
  const tenantData = usePlatformQuery(
    api.platform.tenants.queries.getTenantById,
    { sessionToken: sessionToken || "", tenantId }
  );

  const tenantModules = usePlatformQuery(
    api.platform.tenants.queries.getTenantModules,
    { sessionToken: sessionToken || "", tenantId }
  ) as Array<{ moduleId: string; status: string }> | undefined;
  const dependencySummary = usePlatformQuery(
    api.platform.tenants.queries.getTenantDependencySummary,
    { sessionToken: sessionToken || "", tenantId }
  );
  const archiveTenant = useMutation(api.platform.tenants.mutations.archiveTenant);
  const deleteTenant = useMutation(api.platform.tenants.mutations.deleteTenant);

  if (isLoading || tenantData === undefined) {
    return <LoadingSkeleton />;
  }

  if (!tenantData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Tenant Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The tenant you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/platform/tenants">
            <Button>
              <Eye className="h-4 w-4 mr-2" />
              View All Tenants
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleArchive = async () => {
    if (!sessionToken) return;
    setSubmittingArchive(true);
    try {
      await archiveTenant({
        sessionToken,
        tenantId,
        confirmationName,
      });
      toast({
        title: "Tenant archived",
        description: `${tenantData.name} has been archived and removed from active operations.`,
      });
      setArchiveOpen(false);
      setConfirmationName("");
    } catch (error) {
      toast({
        title: "Unable to archive tenant",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingArchive(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToken) return;
    setSubmittingDelete(true);
    try {
      await deleteTenant({
        sessionToken,
        tenantId,
        confirmationName,
      });
      toast({
        title: "Tenant deleted",
        description: `${tenantData.name} has been permanently removed.`,
      });
      router.push("/platform/tenants");
    } catch (error) {
      toast({
        title: "Unable to delete tenant",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
          <PageHeader
            title={tenantData.name}
            description={`Manage ${tenantData.name} - ${tenantData.plan} plan tenant`}
          />
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" asChild>
            <Link href={`https://${formatTenantHostname(tenantData.subdomain)}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Visit Site
            </Link>
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Tenant
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmationName("");
              setArchiveOpen(true);
            }}
            disabled={tenantData.status !== "suspended"}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmationName("");
              setDeleteOpen(true);
            }}
            disabled={tenantData.status !== "archived"}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Lifecycle Safety Checks</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div>
            <p className="text-sm text-muted-foreground">Users</p>
            <p className="text-xl font-semibold">{dependencySummary?.users ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Users</p>
            <p className="text-xl font-semibold">{dependencySummary?.activeUsers ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Students</p>
            <p className="text-xl font-semibold">{dependencySummary?.students ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Invoices</p>
            <p className="text-xl font-semibold">{dependencySummary?.invoices ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Open Invoices</p>
            <p className="text-xl font-semibold">{dependencySummary?.openInvoices ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Modules</p>
            <p className="text-xl font-semibold">{dependencySummary?.modules ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Detail Tabs */}
      <TenantDetailTabs
        tenant={{
          ...(tenantData as any),
          modules:
            tenantModules
              ?.filter((module) => module.status === "active")
              .map((module) => module.moduleId) ?? [],
        }}
        isLoading={false}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive Tenant"
        description={
          tenantData.status !== "suspended"
            ? "Suspend this tenant before archiving it."
            : `Archive ${tenantData.name}? Type the exact tenant name below before confirming.`
        }
        onConfirm={handleArchive}
        confirmLabel="Archive Tenant"
        variant="destructive"
        isLoading={submittingArchive}
      />

      {archiveOpen && (
        <Card className="border-dashed">
          <CardContent className="pt-6 space-y-2">
            <Label htmlFor="archive-confirmation">Type tenant name to archive</Label>
            <Input
              id="archive-confirmation"
              value={confirmationName}
              onChange={(event) => setConfirmationName(event.target.value)}
              placeholder={tenantData.name}
            />
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Tenant"
        description={
          dependencySummary?.canDelete
            ? `Permanently delete ${tenantData.name}. This cannot be undone.`
            : "This tenant still has dependent records. Only archived tenants with no users, students, invoices, or payments can be deleted."
        }
        onConfirm={handleDelete}
        confirmLabel="Delete Tenant"
        variant="destructive"
        isLoading={submittingDelete}
      />

      {deleteOpen && (
        <Card className="border-dashed">
          <CardContent className="pt-6 space-y-2">
            <Label htmlFor="delete-confirmation">Type tenant name to delete</Label>
            <Input
              id="delete-confirmation"
              value={confirmationName}
              onChange={(event) => setConfirmationName(event.target.value)}
              placeholder={tenantData.name}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
            
