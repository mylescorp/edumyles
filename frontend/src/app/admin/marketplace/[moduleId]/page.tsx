"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CreditCard, Download, ExternalLink, Settings2, Star } from "lucide-react";

export default function MarketplaceModuleDetailPage() {
  const params = useParams();
  const moduleSlug = params.moduleId as string;
  const { sessionToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const canQuery = !authLoading && isAuthenticated && !!sessionToken;

  const moduleDetail = useQuery(
    api.modules.marketplace.settings.getModuleDetail,
    canQuery ? { sessionToken, moduleSlug } : "skip"
  )?.data as any;
  const shouldQueryPricing =
    canQuery && moduleDetail !== undefined && moduleDetail !== null && !moduleDetail.isCore;

  const pricingMonthly = useQuery(
    api.modules.marketplace.pricing.generatePricingBreakdown,
    shouldQueryPricing ? { sessionToken, moduleSlug, billingPeriod: "monthly" } : "skip"
  )?.data as any;
  const pricingAnnual = useQuery(
    api.modules.marketplace.pricing.generatePricingBreakdown,
    shouldQueryPricing ? { sessionToken, moduleSlug, billingPeriod: "annual" } : "skip"
  )?.data as any;

  const installModule = useMutation(api.modules.marketplace.installation.installModule);
  const isCoreModule = Boolean(moduleDetail?.isCore);
  const monthlyTotalKes = pricingMonthly?.breakdown?.totalKes ?? 0;
  const annualTotalKes = pricingAnnual?.breakdown?.totalKes ?? 0;

  if (
    authLoading ||
    (canQuery && moduleDetail === undefined) ||
    (shouldQueryPricing && (pricingMonthly === undefined || pricingAnnual === undefined))
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!moduleDetail) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Module details could not be loaded.
      </div>
    );
  }

  async function handleInstall(billingPeriod: "monthly" | "annual") {
    try {
      await installModule({
        sessionToken,
        moduleSlug,
        billingPeriod,
      });
      toast.success("Module installed successfully");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to install module");
    }
  }

  async function handleCoreInstall() {
    try {
      await installModule({
        sessionToken,
        moduleSlug,
        billingPeriod: "monthly",
      });
      toast.success("Core module activated successfully");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to activate core module");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={moduleDetail.name}
        description={moduleDetail.description}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Marketplace", href: "/admin/marketplace" },
          { label: moduleDetail.name },
        ]}
        actions={
          <div className="flex gap-2">
            {moduleDetail.documentationUrl ? (
              <Button asChild variant="outline">
                <a href={moduleDetail.documentationUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Docs
                </a>
              </Button>
            ) : null}
            {moduleDetail.install ? (
              <Button asChild variant="outline">
                <Link href={`/admin/settings/modules/${moduleSlug}`}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Configure
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About this module</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>{moduleDetail.status}</Badge>
                <Badge variant="outline">{moduleDetail.slug}</Badge>
                <Badge variant="outline" className="capitalize">
                  {moduleDetail.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{moduleDetail.description}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {(moduleDetail.features ?? []).map((feature: any) => (
                  <div key={feature.key} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{feature.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Monthly</p>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold">
                    {isCoreModule ? "Included" : `KES ${monthlyTotalKes}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isCoreModule
                      ? "Core module included with every school tenant."
                      : `${pricingMonthly?.studentCount ?? 0} active students`}
                  </p>
                  {!moduleDetail.install && isCoreModule ? (
                    <Button className="mt-4 w-full" onClick={() => void handleCoreInstall()}>
                      <Download className="mr-2 h-4 w-4" />
                      Activate Core Module
                    </Button>
                  ) : null}
                  {!moduleDetail.install && !isCoreModule ? (
                    <Button className="mt-4 w-full" onClick={() => handleInstall("monthly")}>
                      <Download className="mr-2 h-4 w-4" />
                      Install Monthly
                    </Button>
                  ) : null}
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Annual</p>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold">
                    {isCoreModule ? "Included" : `KES ${annualTotalKes}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isCoreModule
                      ? "No separate billing period is required for core modules."
                      : `Saves KES ${Math.max(0, monthlyTotalKes * 12 - annualTotalKes)}`}
                  </p>
                  {!moduleDetail.install && !isCoreModule ? (
                    <Button variant="outline" className="mt-4 w-full" onClick={() => handleInstall("annual")}>
                      Install Annual
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(moduleDetail.reviews ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No approved reviews have been published yet.
                </p>
              ) : (
                (moduleDetail.reviews as any[]).map((review) => (
                  <div key={review._id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{review.title}</p>
                      <Badge variant="outline">{review.rating}/5</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{review.body}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge>{moduleDetail.install?.status ?? "not installed"}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>{moduleDetail.version}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Minimum plan</span>
                <span className="capitalize">{moduleDetail.minimumPlan}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Featured</span>
                <span>{moduleDetail.isFeatured ? "Yes" : "No"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Install count</span>
                <span>{moduleDetail.installCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changelog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(moduleDetail.versions ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No version history yet.</p>
              ) : (
                (moduleDetail.versions as any[]).map((version) => (
                  <div key={version._id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{version.version}</p>
                      <Badge variant="outline">{version.status}</Badge>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                      {version.changelog ?? "No changelog notes provided."}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
