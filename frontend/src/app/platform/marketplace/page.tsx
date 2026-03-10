"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { MarketplaceManager } from "@/components/platform/MarketplaceManager";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package,
  TrendingUp,
  Users,
  Star,
  Download,
  Settings,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shield,
  Zap,
  Globe
} from "lucide-react";

export default function PlatformMarketplacePage() {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Module Marketplace"
        description="Comprehensive module management, registry, analytics, and approvals"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace" },
        ]}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">12</div>
            <div className="text-sm text-muted-foreground">Total Modules</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Download className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">3,247</div>
            <div className="text-sm text-muted-foreground">Total Downloads</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">8</div>
            <div className="text-sm text-muted-foreground">Developers</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">4.7</div>
            <div className="text-sm text-muted-foreground">Avg Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Important Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Module Management</h3>
            </div>
            <p className="text-sm text-blue-700">
              Add, edit, and manage modules in the marketplace. Control versions, pricing, and availability.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Approval Process</h3>
            </div>
            <p className="text-sm text-green-700">
              Review and approve module submissions. Ensure quality and security standards are met.
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">Analytics</h3>
            </div>
            <p className="text-sm text-purple-700">
              Track downloads, ratings, and usage patterns. Monitor marketplace performance.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>System Status:</strong> All marketplace services are operational. Registry is up to date with 12 active modules.
        </AlertDescription>
      </Alert>

      {/* Marketplace Manager */}
      <MarketplaceManager />
    </div>
  );
}
