"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Edit, Settings } from "lucide-react";
import { TenantDetailTabs } from "@/components/platform/TenantDetailTabs";
import Link from "next/link";

type TenantDetail = {
  _id: string;
  tenantId: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  email: string;
  phone?: string;
  county: string;
  country: string;
  address?: string;
  createdAt: number;
  modules?: string[];
  userCount?: number;
  lastActive?: number;
  billing?: {
    mrr: number;
    arr: number;
    nextBillingDate: number;
    paymentMethod: string;
    invoiceCount: number;
    totalPaid: number;
  };
  stats?: {
    totalLogins: number;
    totalSessions: number;
    avgSessionDuration: number;
    storageUsed: number;
    apiCalls: number;
  };
};

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const { isLoading, sessionToken } = useAuth();
  const { hasPermission } = usePermissions();

  // Fetch tenant details - use mock data for now since backend function doesn't exist
  const { data: tenant, isLoading: tenantLoading } = useQuery(
    api.platform.tenants.queries.listAllTenants, // Use existing function as fallback
    { sessionToken: sessionToken || "" }
  );

  // Mock data for demonstration
  const mockTenant: TenantDetail = {
    _id: "1",
    tenantId: "st-johns-academy",
    name: "St. John's Academy",
    subdomain: "stjohns",
    plan: "growth",
    status: "active",
    email: "admin@stjohns.edu",
    phone: "+254 712 345 678",
    county: "Nairobi",
    country: "KE",
    address: "123 Education Road, Nairobi, Kenya",
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    modules: ["academics", "communications", "billing", "hr"],
    userCount: 245,
    lastActive: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    billing: {
      mrr: 15000,
      arr: 180000,
      nextBillingDate: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days from now
      paymentMethod: "M-Pesa",
      invoiceCount: 12,
      totalPaid: 180000,
    },
    stats: {
      totalLogins: 15420,
      totalSessions: 23150,
      avgSessionDuration: 1800, // 30 minutes in seconds
      storageUsed: 2.5,
      apiCalls: 125000,
    },
  };

  // Use mock data for now since backend function doesn't exist
  const tenantData = mockTenant; // Always use mock data

  if (isLoading || tenantLoading) {
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
      <TenantDetailTabs tenant={tenantData} isLoading={tenantLoading} />
    </div>
  );
}
            
