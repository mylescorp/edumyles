"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ExternalLink, Settings, ShieldCheck } from "lucide-react";

export default function AdminMarketplaceModuleDetailPage() {
  const params = useParams();
  const moduleSlug = String(params.moduleId ?? "");
  const { sessionToken, isAuthenticated, isLoading } = useAuth();
  const canQuery = !isLoading && isAuthenticated && !!sessionToken;

  const moduleDetail = useQuery(
    (api as any).modules?.marketplace?.settings?.getModuleDetail,
    canQuery ? { sessionToken, moduleSlug } : "skip"
  ) as any;

  if (isLoading || (canQuery && moduleDetail === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  const detail = moduleDetail?.data ?? moduleDetail ?? null;

  if (!detail) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Module Detail"
          description="Marketplace module detail could not be loaded."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Marketplace", href: "/admin/marketplace" },
            { label: moduleSlug || "Module" },
          ]}
        />
        <Card>
          <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            This module is unavailable right now. Return to the marketplace and try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  const features = Array.isArray(detail.features) ? detail.features : [];
  const documentationUrl = detail.documentation ?? detail.documentationUrl;

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.name ?? moduleSlug}
        description={detail.description ?? "Manage installation and configuration for this module."}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Marketplace", href: "/admin/marketplace" },
          { label: detail.name ?? moduleSlug },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/settings/modules/${moduleSlug}`}>
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </Link>
            </Button>
            {documentationUrl ? (
              <Button variant="outline" asChild>
                <a href={documentationUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Docs
                </a>
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Module Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {detail.category ? <Badge variant="outline">{String(detail.category).replace(/_/g, " ")}</Badge> : null}
              {detail.tier ? <Badge variant="secondary">{detail.tier}</Badge> : null}
              {detail.version ? <Badge variant="outline">v{detail.version}</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">{detail.shortDescription ?? detail.description}</p>
            {features.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Included capabilities</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {features.map((feature: string) => (
                    <div key={feature} className="rounded-lg border px-3 py-2 text-sm">
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Tenant Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Installed</span>
              <Badge variant={detail.installed ? "default" : "outline"}>
                {detail.installed ? "Installed" : "Not installed"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Billing</span>
              <span>{detail.pricing?.monthly ? `${detail.pricing.currency ?? "KES"} ${detail.pricing.monthly}/mo` : "Included"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dependencies</span>
              <span>{detail.dependencies?.length ? detail.dependencies.join(", ") : "None"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
