"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, TrendingUp, Activity } from "lucide-react";
import { TenantList } from "@/components/platform/TenantList";
import Link from "next/link";

type Tenant = {
  _id: string;
  tenantId: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  email: string;
  county: string;
  country: string;
  createdAt: number;
  modules?: string[];
  userCount?: number;
  lastActive?: number;
};

export default function TenantsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasPermission } = usePermissions();

  // Fetch tenants data
  const { data: tenants, isLoading: tenantsLoading } = useQuery(
    api.platform.tenants.queries.listAllTenants,
    { sessionToken: sessionToken || "" }
  );

  // Debug logging
  console.log("TenantsPage - API data:", { tenants, tenantsLoading, hasSessionToken: !!sessionToken });

  // Mock data for demonstration
  const mockTenants: Tenant[] = [
    {
      _id: "1",
      tenantId: "st-johns-academy",
      name: "St. John's Academy",
      subdomain: "stjohns",
      plan: "growth",
      status: "active",
      email: "admin@stjohns.edu",
      county: "nairobi",
      country: "KE",
      createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
      modules: ["academics", "communications", "billing"],
      userCount: 245,
      lastActive: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    },
    {
      _id: "2",
      tenantId: "elite-high-school",
      name: "Elite High School",
      subdomain: "elite",
      plan: "pro",
      status: "active",
      email: "info@elitehigh.sc.ke",
      county: "mombasa",
      country: "KE",
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
      modules: ["academics", "communications", "billing", "hr"],
      userCount: 189,
      lastActive: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
    },
    {
      _id: "3",
      tenantId: "sunshine-primary",
      name: "Sunshine Primary School",
      subdomain: "sunshine",
      plan: "starter",
      status: "trial",
      email: "headteacher@sunshineprimary.sc.ke",
      county: "nakuru",
      country: "KE",
      createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
      modules: ["academics"],
      userCount: 67,
      lastActive: Date.now() - 30 * 60 * 1000, // 30 minutes ago
    },
    {
      _id: "4",
      tenantId: "kisumu-international",
      name: "Kisumu International School",
      subdomain: "kisumu-int",
      plan: "enterprise",
      status: "active",
      email: "admin@kisumu-int.sc.ke",
      county: "kisumu",
      country: "KE",
      createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000, // 120 days ago
      modules: ["academics", "communications", "billing", "hr", "library"],
      userCount: 412,
      lastActive: Date.now() - 15 * 60 * 1000, // 15 minutes ago
    },
    {
      _id: "5",
      tenantId: "hillside-academy",
      name: "Hillside Academy",
      subdomain: "hillside",
      plan: "growth",
      status: "suspended",
      email: "office@hillside.sc.ke",
      county: "kiambu",
      country: "KE",
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000, // 180 days ago
      modules: ["academics", "communications"],
      userCount: 156,
      lastActive: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    },
  ];

  // Use real data if available, otherwise use mock data
  const tenantsData = tenants && tenants.length > 0 ? tenants : mockTenants;
  
  // Debug logging to show what data is being used
  console.log("TenantsPage - Using data:", { 
    hasRealData: !!(tenants && tenants.length > 0), 
    realDataCount: tenants?.length || 0, 
    mockDataCount: mockTenants.length 
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTenants = tenantsData.length;
    const activeTenants = tenantsData.filter(t => t.status === "active").length;
    const trialTenants = tenantsData.filter(t => t.status === "trial").length;
    const totalUsers = tenantsData.reduce((sum, t) => sum + (t.userCount || 0), 0);

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants: totalTenants - activeTenants - trialTenants,
      totalUsers,
    };
  }, [tenantsData]);

  if (isLoading || tenantsLoading) {
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
              {Math.round((stats.activeTenants / stats.totalTenants) * 100)}% of total
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
      <TenantList tenants={tenantsData} isLoading={tenantsLoading} />
    </div>
  );
}
