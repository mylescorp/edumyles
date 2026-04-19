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
import { normalizeArray } from "@/lib/normalizeData";
import { Package, SearchX } from "lucide-react";

function formatKes(amount?: number) {
  return `KES ${(amount ?? 0).toLocaleString()}`;
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function MarketplaceModulesPage() {
  const router = useRouter();
  const { sessionToken, isLoading } = useAuth();
  const [search, setSearch] = useState("");

  const browseResult = usePlatformQuery(
    api.platform.marketplace.queries.browseModules,
    sessionToken ? { sessionToken, limit: 250 } : "skip",
    !!sessionToken
  ) as { modules?: Array<any> } | undefined;

  const modules = useMemo(() => {
    const rows = normalizeArray<any>(browseResult?.modules);
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((module) =>
      [
        module.name,
        module.category,
        module.publisherName ?? "",
        module.pricingModel ?? "",
        module.status ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [browseResult, search]);

  if (isLoading || browseResult === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const moduleRows = normalizeArray<any>(browseResult?.modules);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Modules"
        description="Browse the full module registry, inspect publishing state, and jump into module-level admin controls."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Modules" },
        ]}
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/module" />

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total modules</p><p className="text-3xl font-semibold">{moduleRows.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Published</p><p className="text-3xl font-semibold">{moduleRows.filter((module) => (module.status ?? "published") === "published").length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Overrides active</p><p className="text-3xl font-semibold">{moduleRows.filter((module) => module.hasPlatformOverride).length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Built-in</p><p className="text-3xl font-semibold">{moduleRows.filter((module) => module.publisherName === "EduMyles").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search modules by name, category, publisher, status, or pricing model"
              className="max-w-md"
            />
            <Badge variant="outline">Use this page to open module admin detail pages</Badge>
          </div>

          {modules.length === 0 ? (
            <EmptyState
              icon={search ? SearchX : Package}
              title={search ? "No modules match this search" : "No modules available"}
              description="Marketplace modules will appear here once they are available in the platform catalog."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Publisher</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Installs</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => {
                  const effectivePriceKes =
                    typeof module.effectivePriceKes === "number"
                      ? module.effectivePriceKes
                      : typeof module.priceCents === "number"
                        ? Math.round(module.priceCents / 100)
                        : 0;

                  return (
                    <TableRow key={module.moduleId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{module.name}</p>
                          <p className="text-sm text-muted-foreground">{module.shortDescription}</p>
                        </div>
                      </TableCell>
                      <TableCell>{titleCase(module.category)}</TableCell>
                      <TableCell>{module.publisherName ?? "EduMyles"}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline">{titleCase(module.pricingModel ?? "free")}</Badge>
                          <p className="text-sm text-muted-foreground">{formatKes(effectivePriceKes)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(module.status ?? "published") === "published" ? "default" : "outline"}>
                          {module.status ?? "published"}
                        </Badge>
                      </TableCell>
                      <TableCell>{(module.totalInstalls ?? 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/platform/marketplace/${encodeURIComponent(module.moduleId)}`)
                          }
                        >
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
