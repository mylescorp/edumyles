"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { SearchInput } from "@/components/shared/SearchInput";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Package, Puzzle, Settings2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function MarketplacePage() {
  const { sessionToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const canQuery = !authLoading && isAuthenticated && !!sessionToken;

  const modules = useQuery(
    api.modules.marketplace.settings.getMarketplaceModules,
    canQuery ? { sessionToken } : "skip"
  )?.data as any[] | undefined;
  const installAllFreeCoreModules = useMutation(
    api.modules.marketplace.installation.installAllFreeCoreModules
  );

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const missingCoreModules = (modules ?? []).filter(
    (module) => module.isCore && module.installed?.status !== "active"
  );

  const filteredModules = useMemo(() => {
    const list = modules ?? [];
    const searched = search
      ? list.filter((module) =>
          [module.name, module.tagline, module.description, module.slug]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      : list;

    if (tab === "installed") {
      return searched.filter((module) => module.installed);
    }
    if (tab === "available") {
      return searched.filter((module) => !module.installed);
    }
    return searched;
  }, [modules, search, tab]);

  if (authLoading || (canQuery && modules === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  async function handleInstallCoreModules() {
    try {
      await installAllFreeCoreModules({ sessionToken });
      toast.success("Free core modules activated");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to activate free core modules");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        description="Browse, evaluate, and install marketplace modules for your school."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Marketplace" },
        ]}
        actions={
          <div className="flex gap-2">
            {missingCoreModules.length > 0 ? (
              <Button onClick={() => void handleInstallCoreModules()}>
                <Package className="mr-2 h-4 w-4" />
                Activate Free Core Modules
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/admin/modules">
                <Settings2 className="mr-2 h-4 w-4" />
                Manage Installed Modules
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{modules?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Published modules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-100 p-3 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {modules?.filter((module) => module.installed).length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Installed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-100 p-3 text-amber-700">
              <Puzzle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {modules?.filter((module) => !module.installed).length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Available to install</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {modules?.filter((module) => module.isCore).length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Core modules</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search modules by name, tagline, or slug"
          className="max-w-md"
        />
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredModules.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No modules matched your current filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredModules.map((module) => (
            <Card key={module._id} className="h-full">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{module.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{module.tagline}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge variant="outline">{module.slug}</Badge>
                    {module.installed ? <Badge>{module.installed.status}</Badge> : null}
                    {module.isCore ? <Badge variant="secondary">Core</Badge> : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {module.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="capitalize">{module.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Minimum plan</span>
                  <span className="capitalize">{module.minimumPlan}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Version</span>
                  <span>{module.version}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button asChild className="flex-1">
                    <Link href={`/admin/marketplace/${module.slug}`}>View Module</Link>
                  </Button>
                  {module.installed ? (
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/admin/settings/modules/${module.slug}`}>Configure</Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
