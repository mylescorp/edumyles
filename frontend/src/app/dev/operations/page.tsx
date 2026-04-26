"use client";

import { useState } from "react";
import { Code2, LayoutDashboard, LogIn, Power, Search, ShieldCheck } from "lucide-react";
import {
  DevConsoleShell,
  ErrorState,
  LoadingState,
  MetricCard,
  PortalLauncherCard,
  PrivilegedAccessEmptyState,
  formatRoleName,
  useDevOps,
  useDevSystemMapData,
  useModuleRowsFromOps,
} from "@/components/dev/console";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";

export default function DevOperationsPage() {
  const { role } = useAuth();
  const {
    systemMap,
    isLoading,
    isRefreshing,
    error,
    autoRefresh,
    setAutoRefresh,
    loadSystemMap,
  } = useDevSystemMapData();
  const [query, setQuery] = useState("");
  const searchNeedle = query.trim().toLowerCase();
  const {
    hasPrivilegedAccess,
    opsData,
    isOpsLoading,
    opsError,
    selectedTenantId,
    setSelectedTenantId,
    opsActionKey,
    runDevAction,
  } = useDevOps(role, async () => {
    await loadSystemMap("refresh");
  });
  const moduleRows = useModuleRowsFromOps({ opsData, searchNeedle });

  if (isLoading && !systemMap) {
    return (
      <DevConsoleShell
        title="Privileged Operations"
        description="Tenant-scoped module controls, portal launchers, and impersonation shortcuts."
        systemMap={null}
        isRefreshing={isRefreshing}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onRefresh={() => void loadSystemMap("refresh")}
      >
        <LoadingState />
      </DevConsoleShell>
    );
  }

  return (
    <DevConsoleShell
      title="Privileged Operations"
      description="Tenant-scoped module controls, portal launchers, and impersonation shortcuts."
      systemMap={systemMap}
      isRefreshing={isRefreshing}
      autoRefresh={autoRefresh}
      setAutoRefresh={setAutoRefresh}
      onRefresh={() => void loadSystemMap("refresh")}
    >
      {error ? <ErrorState error={error} /> : null}
      {!hasPrivilegedAccess ? <PrivilegedAccessEmptyState /> : null}

      {systemMap && hasPrivilegedAccess ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Tenants" value={opsData?.tenants.length ?? 0} detail="Tenants available for direct dev tooling" icon={ShieldCheck} />
            <MetricCard title="Installed Modules" value={opsData?.tenantModules.length ?? 0} detail="Installed module records on selected tenant" icon={Code2} />
            <MetricCard title="Launchers" value={opsData?.portalLaunchers.length ?? 0} detail="Role-driven launch targets" icon={LayoutDashboard} />
            <MetricCard title="Candidates" value={opsData?.impersonationCandidates.length ?? 0} detail="Impersonation-ready tenant users" icon={LogIn} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4" />
                  Active Tenant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <select
                  value={selectedTenantId ?? ""}
                  onChange={(event) => setSelectedTenantId(event.target.value || null)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="">Choose a tenant</option>
                  {opsData?.tenants.map((tenant) => (
                    <option key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.name} ({tenant.plan ?? "plan n/a"})
                    </option>
                  ))}
                </select>
                {opsData?.tenants.find((tenant) => tenant.tenantId === selectedTenantId) ? (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{opsData.tenants.find((tenant) => tenant.tenantId === selectedTenantId)?.status ?? "unknown"}</Badge>
                    <Badge variant="outline">{opsData.tenants.find((tenant) => tenant.tenantId === selectedTenantId)?.plan ?? "plan n/a"}</Badge>
                    {opsData.tenants.find((tenant) => tenant.tenantId === selectedTenantId)?.subdomain ? (
                      <Badge variant="secondary">{opsData.tenants.find((tenant) => tenant.tenantId === selectedTenantId)?.subdomain}</Badge>
                    ) : null}
                  </div>
                ) : null}
                {opsError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {opsError}
                  </div>
                ) : null}
                {isOpsLoading ? (
                  <div className="rounded-xl border border-border/70 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
                    Loading tenant operations...
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-background/90 shadow-sm">
              <CardContent className="flex h-full items-center gap-3 p-5">
                <div className="rounded-xl bg-muted/60 p-2.5">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search modules, categories, tiers..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Power className="h-4 w-4" />
                  Module Control Surface
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTenantId ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Module</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {moduleRows.slice(0, 30).map(({ catalog, installed }) => {
                        const actionPrefix = selectedTenantId ? `${selectedTenantId}:${catalog.moduleId}` : catalog.moduleId;
                        const isBusy = opsActionKey?.includes(actionPrefix);
                        const status = installed?.status ?? "not installed";

                        return (
                          <TableRow key={catalog.moduleId}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-foreground">{catalog.name}</div>
                                <div className="font-mono text-[11px] text-muted-foreground">{catalog.moduleId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {catalog.category ? <Badge variant="outline">{catalog.category}</Badge> : null}
                                {catalog.tier ? <Badge variant="secondary">{catalog.tier}</Badge> : null}
                                {catalog.isCore ? <Badge variant="secondary">core</Badge> : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={installed ? "default" : "secondary"}>{status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {!installed ? (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      void runDevAction(
                                        {
                                          action: "installModule",
                                          tenantId: selectedTenantId,
                                          moduleId: catalog.moduleId,
                                        },
                                        `${catalog.name} installed for the selected tenant.`
                                      )
                                    }
                                    disabled={isBusy}
                                  >
                                    Install
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        void runDevAction(
                                          {
                                            action: "setModuleStatus",
                                            tenantId: selectedTenantId,
                                            moduleId: catalog.moduleId,
                                            status: installed.status === "active" ? "inactive" : "active",
                                          },
                                          `${catalog.name} ${installed.status === "active" ? "disabled" : "enabled"} for the selected tenant.`
                                        )
                                      }
                                      disabled={isBusy}
                                    >
                                      {installed.status === "active" ? "Disable" : "Enable"}
                                    </Button>
                                    {!catalog.isCore ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          void runDevAction(
                                            {
                                              action: "uninstallModule",
                                              tenantId: selectedTenantId,
                                              moduleId: catalog.moduleId,
                                            },
                                            `${catalog.name} removed from the selected tenant.`
                                          )
                                        }
                                        disabled={isBusy}
                                      >
                                        Remove
                                      </Button>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                    Choose a tenant to enable module control actions.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LayoutDashboard className="h-4 w-4" />
                    Role-Based Portal Launchers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(opsData?.portalLaunchers ?? []).map((launcher) => (
                    <PortalLauncherCard
                      key={launcher.role}
                      launcher={launcher}
                      selectedTenantId={selectedTenantId}
                      opsActionKey={opsActionKey}
                      onLaunch={() =>
                        void runDevAction(
                          {
                            action: "startImpersonation",
                            tenantId: selectedTenantId,
                            targetUserId: launcher.candidate?.id,
                            reason: `Developer portal launch into ${launcher.label}`,
                          },
                          `${launcher.label} launcher is opening in impersonation mode.`
                        )
                      }
                    />
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle className="text-base">Quick Impersonation Shortcuts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(opsData?.impersonationCandidates ?? []).slice(0, 6).map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/25 p-3">
                      <div>
                        <div className="font-medium text-foreground">{candidate.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatRoleName(candidate.role)} • {candidate.email}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void runDevAction(
                            {
                              action: "startImpersonation",
                              tenantId: selectedTenantId,
                              targetUserId: candidate.id,
                              reason: `Developer quick impersonation for ${candidate.role}`,
                            },
                            `Impersonation started for ${candidate.name}.`
                          )
                        }
                      >
                        Launch
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </DevConsoleShell>
  );
}
