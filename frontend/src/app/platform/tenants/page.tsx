"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, TrendingUp, Activity } from "lucide-react";
import { TenantList } from "@/components/platform/TenantList";
import Link from "next/link";

export default function TenantsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasPermission } = usePermissions();

  // Fetch tenants data from Convex backend
  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    { sessionToken: sessionToken || "" }
  );

  // Fetch platform stats from Convex backend
  const platformStats = usePlatformQuery(
    api.platform.tenants.queries.getPlatformStats,
    { sessionToken: sessionToken || "" }
  );

  // Calculate statistics from real data
  const stats = useMemo(() => {
    if (platformStats) {
      return {
        totalTenants: platformStats.totalTenants,
        activeTenants: platformStats.activeTenants,
        trialTenants: platformStats.trialTenants,
        suspendedTenants: platformStats.suspendedTenants,
        totalUsers: platformStats.totalUsers,
      };
    }
    // Fallback: derive stats from tenants list if platformStats not yet loaded
    if (tenants) {
      const totalTenants = tenants.length;
      const activeTenants = tenants.filter((t: any) => t.status === "active").length;
      const trialTenants = tenants.filter((t: any) => t.status === "trial").length;
      const totalUsers = tenants.reduce((sum: number, t: any) => sum + (t.userCount || 0), 0);
      return {
        totalTenants,
        activeTenants,
        trialTenants,
        suspendedTenants: totalTenants - activeTenants - trialTenants,
        totalUsers,
      };
    }
    return { totalTenants: 0, activeTenants: 0, trialTenants: 0, suspendedTenants: 0, totalUsers: 0 };
  }, [tenants, platformStats]);

  if (isLoading || !tenants) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Tenants"
          description="Manage and monitor all school tenants"
        />
        <div className="flex items-center space-x-3">
          <Link href="/platform/analytics">
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTenants} active, {stats.trialTenants} trial
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
            <Users className="h-4 w-4 text-em-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-em-success">{stats.activeTenants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTenants > 0 ? Math.round((stats.activeTenants / stats.totalTenants) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Schools</CardTitle>
            <Activity className="h-4 w-4 text-em-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-em-info">{stats.trialTenants}</div>
            <p className="text-xs text-muted-foreground">
              Converting to paid plans
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-em-accent-dark" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-em-accent-dark">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all tenants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tenant List */}
      <TenantList tenants={tenants as any} isLoading={false} />
    </div>
  );
}
