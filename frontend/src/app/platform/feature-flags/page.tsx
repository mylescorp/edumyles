"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { FeatureFlagsManager } from "@/components/platform/FeatureFlagsManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Flag,
  Shield,
  Zap,
  AlertTriangle,
  Info,
  CheckCircle2,
  Settings,
  Users,
  Globe,
  Rocket
} from "lucide-react";
import { api } from "@/convex/_generated/api";

export default function FeatureFlagsPage() {
  const { isLoading, sessionToken } = useAuth();
  const flags = usePlatformQuery(
    api.platform.featureFlags.queries.listFeatureFlags,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );
  const stats = useMemo(() => {
    const flagList = flags ?? [];
    return {
      total: flagList.length,
      active: flagList.filter((flag: any) => flag.enabled).length,
      beta: flagList.filter(
        (flag: any) => flag.environment === "staging" || flag.targetType === "percentage"
      ).length,
      globalActive: flagList.filter(
        (flag: any) => (flag.targetType === "all" || !flag.targetType) && flag.enabled
      ).length,
    };
  }, [flags]);

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature Flags"
        description="Manage feature flags, module toggles, and rollout configurations"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Feature Flags" },
        ]}
      />

      {/* Important Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              What are Feature Flags?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-blue-700">
              Feature flags allow you to enable/disable functionality without deploying code. Use them for:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Gradual feature rollouts</li>
              <li>• A/B testing</li>
              <li>• Emergency kill switches</li>
              <li>• Beta feature management</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Global Flags Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-orange-700">
              <strong>Warning:</strong> Global flags affect all users immediately:
            </p>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Test thoroughly before activation</li>
              <li>• Monitor system performance</li>
              <li>• Have rollback plan ready</li>
              <li>• Document changes</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-green-700">
              Follow these guidelines for effective flag management:
            </p>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Use descriptive names</li>
              <li>• Add clear descriptions</li>
              <li>• Set expiration dates</li>
              <li>• Clean up unused flags</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Feature Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Flag Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Globe className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold">Global</h4>
                <p className="text-sm text-muted-foreground">Platform-wide settings</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold">Module</h4>
                <p className="text-sm text-muted-foreground">Feature-specific toggles</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold">Tenant</h4>
                <p className="text-sm text-muted-foreground">Per-tenant settings</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Rocket className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold">Beta</h4>
                <p className="text-sm text-muted-foreground">Experimental features</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Flags</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.beta}</div>
            <div className="text-sm text-muted-foreground">Beta Features</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.globalActive}</div>
            <div className="text-sm text-muted-foreground">Global Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags Manager */}
      <FeatureFlagsManager />

      {/* System Health Warning */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>System Health:</strong> All feature flags are operating normally. No emergency kill switches are currently active.
        </AlertDescription>
      </Alert>
    </div>
  );
}
