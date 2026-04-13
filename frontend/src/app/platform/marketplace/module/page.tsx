"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { Package, SearchX } from "lucide-react";

const marketplacePlatformApi =
  (api as any).modules?.marketplace?.platformDashboard ??
  (api as any)["modules/marketplace/platformDashboard"];

function formatKes(amount?: number) {
  return `KES ${(amount ?? 0).toLocaleString()}`;
}

export default function MarketplaceModulesPage() {
  const router = useRouter();
  const { sessionToken, isLoading } = useAuth();
  const [search, setSearch] = useState("");

  const data = usePlatformQuery(
    marketplacePlatformApi.getPlatformMarketplaceModules,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as any[] | undefined;

  const modules = useMemo(() => {
    const rows = data ?? [];
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((module) =>
      [module.name, module.slug, module.category, module.status].join(" ").toLowerCase().includes(needle)
    );
  }, [data, search]);

  if (isLoading || data === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Modules"
        description="Inspect catalog modules, install footprint, pricing bands, and publication status."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Modules" },
        ]}
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/modules" />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search modules by name, slug, category, or status"
            className="max-w-md"
          />

          {modules.length === 0 ? (
            <EmptyState
              icon={search ? SearchX : Package}
              title={search ? "No modules match this search" : "No marketplace modules"}
              description="Published marketplace modules will appear here once they are seeded or created."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Installs</TableHead>
                  <TableHead>Base Rate</TableHead>
                  <TableHead>Overrides</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.moduleId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{module.name}</p>
                        <p className="text-sm text-muted-foreground">{module.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={module.status === "published" ? "default" : "outline"}>
                        {module.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {module.activeInstallCount.toLocaleString()} active / {module.installCount.toLocaleString()} total
                    </TableCell>
                    <TableCell>{module.pricing ? formatKes(module.pricing.baseRateKes) : "Not set"}</TableCell>
                    <TableCell>{module.activeOverrideCount}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/platform/marketplace/${module.moduleId}`)}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
