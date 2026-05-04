"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TenantsAdminRail } from "@/components/platform/TenantsAdminRail";
import { Building2, Share2 } from "lucide-react";

export default function NetworksPage() {
  const { sessionToken } = useAuth();
  const networks = usePlatformQuery(
    api.platform.tenants.queries.listTenantNetworks,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  ) as Array<any> | undefined;

  if (networks === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Networks"
        description="Monitor multi-campus network groups, campus counts, and linked tenant topology."
      />
      <TenantsAdminRail currentHref="/platform/networks" />

      {networks.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No networks yet"
          description="Single-campus tenants continue to work normally. Multi-campus provisioning will create network records here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {networks.map((network) => (
            <Card key={network.networkId}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{network.name}</CardTitle>
                    <CardDescription>{network.networkId}</CardDescription>
                  </div>
                  <Badge variant="outline">{network.campusCount} campuses</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>Mode: {network.organizationMode}</span>
                  <span>Billing: {network.billingMode}</span>
                  <span>Status: {network.status}</span>
                </div>
                <div className="space-y-2">
                  {network.campuses.slice(0, 4).map((campus: any) => (
                    <div
                      key={campus.tenantId}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{campus.campusName}</span>
                      </div>
                      {campus.isPrimary ? <Badge variant="secondary">Primary</Badge> : null}
                    </div>
                  ))}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/platform/tenants/${network.primaryTenantId}`}>Open primary campus</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
