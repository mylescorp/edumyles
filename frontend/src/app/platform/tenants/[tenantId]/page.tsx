"use client";

import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Edit, Settings } from "lucide-react";
import { TenantDetailTabs } from "@/components/platform/TenantDetailTabs";
import Link from "next/link";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const { isLoading, sessionToken } = useAuth();
  const { hasPermission } = usePermissions();

  // Fetch tenant details from Convex backend
  const tenantData = usePlatformQuery(
    api.platform.tenants.queries.getTenantById,
    { sessionToken: sessionToken || "", tenantId }
  );

  const tenantModules = usePlatformQuery(
    api.platform.tenants.queries.getTenantModules,
    { sessionToken: sessionToken || "", tenantId }
  ) as Array<{ moduleId: string; status: string }> | undefined;

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
            <Link href={`https://${tenantData.subdomain}.edumyles.co.ke`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Visit Site
            </Link>
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Tenant
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </div>
      </div>

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
    </div>
  );
}
            
