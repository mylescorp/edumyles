"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { FlaskConical, SearchX } from "lucide-react";

const marketplacePlatformApi =
  (api as any).modules?.marketplace?.platformDashboard ??
  (api as any)["modules/marketplace/platformDashboard"];

const GRANT_TYPES = ["free_trial", "free_permanent", "discounted", "plan_upgrade", "beta_access"] as const;
const GRANT_SCOPES = ["single", "selected", "all"] as const;
const STATUSES = ["all", "active", "scheduled", "expired", "revoked", "extended", "converted"] as const;

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function PilotGrantsPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState<any>(null);
  const [revokeTarget, setRevokeTarget] = useState<any>(null);
  const [form, setForm] = useState({
    tenantId: "",
    moduleId: "",
    moduleIds: [] as string[],
    grantScope: "single" as (typeof GRANT_SCOPES)[number],
    grantType: "free_trial" as (typeof GRANT_TYPES)[number],
    discountPct: "",
    customPriceKes: "",
    startDate: "",
    endDate: "",
    stealthMode: "false",
    reason: "",
  });
  const [extendReason, setExtendReason] = useState("");
  const [extendDate, setExtendDate] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [currentTime] = useState(() => Date.now());

  const data = usePlatformQuery(
    marketplacePlatformApi.getPlatformPilotGrantsData,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as any;

  const createPilotGrant = useMutation(api.modules.marketplace.pilotGrants.createPilotGrant);
  const extendPilotGrant = useMutation(api.modules.marketplace.pilotGrants.extendPilotGrant);
  const revokePilotGrant = useMutation(api.modules.marketplace.pilotGrants.revokePilotGrant);

  const grants = useMemo(() => {
    const rows = data?.grants ?? [];
    const filteredByStatus =
      statusFilter === "all" ? rows : rows.filter((grant: any) => grant.status === statusFilter);
    if (!search.trim()) return filteredByStatus;
    const needle = search.toLowerCase();
    return filteredByStatus.filter((grant: any) =>
      [grant.tenantName, grant.moduleName, grant.reason, grant.status].join(" ").toLowerCase().includes(needle)
    );
  }, [data, search, statusFilter]);

  const stats = useMemo(() => {
    const rows = data?.grants ?? [];
    return {
      total: rows.length,
      active: rows.filter((grant: any) => grant.status === "active" || grant.status === "extended").length,
      expiringSoon: rows.filter((grant: any) => grant.endDate && grant.endDate < currentTime + 7 * 24 * 60 * 60 * 1000).length,
      converted: rows.filter((grant: any) => grant.status === "converted").length,
    };
  }, [currentTime, data]);

  if (isLoading || data === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleCreate = async () => {
    if (!sessionToken) return;
    try {
      await createPilotGrant({
        sessionToken,
        tenantId: form.tenantId,
        moduleId: form.grantScope === "single" ? (form.moduleId as any) : undefined,
        moduleIds: form.grantScope === "selected" ? form.moduleIds : undefined,
        grantScope: form.grantScope,
        grantType: form.grantType,
        discountPct: form.discountPct ? Number(form.discountPct) : undefined,
        customPriceKes: form.customPriceKes ? Number(form.customPriceKes) : undefined,
        startDate: form.startDate ? new Date(form.startDate).getTime() : Date.now(),
        endDate: form.endDate ? new Date(form.endDate).getTime() : undefined,
        stealthMode: form.stealthMode === "true",
        reason: form.reason,
      });
      toast({
        title: "Pilot grant created",
        description:
          form.grantScope === "all"
            ? "The tenant now has pilot access across the full marketplace catalog."
            : form.grantScope === "selected"
              ? `${form.moduleIds.length} modules were granted to the tenant.`
              : "The module pilot grant is active.",
      });
      setCreateOpen(false);
      setForm((current) => ({
        ...current,
        moduleId: "",
        moduleIds: [],
        reason: "",
      }));
    } catch (error) {
      toast({ title: "Unable to create pilot grant", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const handleExtend = async () => {
    if (!sessionToken || !extendTarget || !extendDate || !extendReason) return;
    try {
      await extendPilotGrant({
        sessionToken,
        grantId: extendTarget._id,
        newEndDate: new Date(extendDate).getTime(),
        reason: extendReason,
      });
      toast({ title: "Pilot grant extended" });
      setExtendTarget(null);
      setExtendDate("");
      setExtendReason("");
    } catch (error) {
      toast({ title: "Unable to extend pilot grant", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const handleRevoke = async () => {
    if (!sessionToken || !revokeTarget || !revokeReason) return;
    try {
      await revokePilotGrant({
        sessionToken,
        grantId: revokeTarget._id,
        reason: revokeReason,
      });
      toast({ title: "Pilot grant revoked" });
      setRevokeTarget(null);
      setRevokeReason("");
    } catch (error) {
      toast({ title: "Unable to revoke pilot grant", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const canSubmit =
    !!form.tenantId &&
    !!form.reason &&
    (form.grantScope === "all" ||
      (form.grantScope === "single" ? !!form.moduleId : form.moduleIds.length > 0));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pilot Grants"
        description="Manage free trials, discounted pilots, and beta access on the new marketplace grant model."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Pilot Grants" },
        ]}
        actions={<Button onClick={() => setCreateOpen(true)}>Create Grant</Button>}
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/pilot-grants" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total grants</p><p className="text-3xl font-semibold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Active</p><p className="text-3xl font-semibold">{stats.active}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Expiring soon</p><p className="text-3xl font-semibold">{stats.expiringSoon}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Converted to paid</p><p className="text-3xl font-semibold">{stats.converted}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by tenant, module, or reason" className="max-w-sm" />
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof STATUSES)[number])}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all" ? "All statuses" : labelize(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by tenant, module, reason, or status"
            className="max-w-md"
          />

          {grants.length === 0 ? (
            <EmptyState
              icon={search ? SearchX : FlaskConical}
              title={search ? "No grants match this search" : "No pilot grants yet"}
              description="Pilot grants will appear here once the platform team starts issuing them."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grants.map((grant: any) => (
                  <TableRow key={grant.grantId}>
                    <TableCell>{grant.tenantName}</TableCell>
                    <TableCell>{grant.moduleName}</TableCell>
                    <TableCell>{labelize(grant.grantScope ?? "single")}</TableCell>
                    <TableCell>{labelize(grant.grantType)}</TableCell>
                    <TableCell><Badge variant="outline">{labelize(grant.status)}</Badge></TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        <div>{new Date(grant.startDate).toLocaleDateString("en-KE")}</div>
                        <div>{grant.endDate ? new Date(grant.endDate).toLocaleDateString("en-KE") : "Open-ended"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {(grant.status === "active" || grant.status === "extended") ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setExtendTarget(grant)}>Extend</Button>
                            <Button size="sm" variant="destructive" onClick={() => setRevokeTarget(grant)}>Revoke</Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Create Pilot Grant</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select value={form.tenantId} onValueChange={(value) => setForm((current) => ({ ...current, tenantId: value }))}>
                <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>
                  {(data.tenants ?? []).map((tenant: any) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>{tenant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grant scope</Label>
              <Select
                value={form.grantScope}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    grantScope: value as (typeof GRANT_SCOPES)[number],
                    moduleId: "",
                    moduleIds: [],
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single module</SelectItem>
                  <SelectItem value="selected">Selected modules</SelectItem>
                  <SelectItem value="all">All modules</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Module</Label>
              {form.grantScope === "single" ? (
                <Select value={form.moduleId} onValueChange={(value) => setForm((current) => ({ ...current, moduleId: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>
                    {(data.modules ?? []).map((module: any) => (
                      <SelectItem key={module.moduleId} value={module.moduleId}>{module.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : form.grantScope === "selected" ? (
                <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-2">
                  {(data.modules ?? []).map((module: any) => {
                    const checked = form.moduleIds.includes(module.moduleId);
                    return (
                      <label key={module.moduleId} className="flex items-center gap-2 rounded px-2 py-1 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) =>
                            setForm((current) => ({
                              ...current,
                              moduleIds: next
                                ? [...current.moduleIds, module.moduleId]
                                : current.moduleIds.filter((id) => id !== module.moduleId),
                            }))
                          }
                        />
                        <span>{module.name}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                  All marketplace modules will be granted to this tenant for the pilot window.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Grant Type</Label>
              <Select value={form.grantType} onValueChange={(value) => setForm((current) => ({ ...current, grantType: value as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRANT_TYPES.map((type) => <SelectItem key={type} value={type}>{labelize(type)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stealth Mode</Label>
              <Select value={form.stealthMode} onValueChange={(value) => setForm((current) => ({ ...current, stealthMode: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Visible</SelectItem>
                  <SelectItem value="true">Stealth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input value={form.discountPct} onChange={(event) => setForm((current) => ({ ...current, discountPct: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Custom Price (KES)</Label>
              <Input value={form.customPriceKes} onChange={(event) => setForm((current) => ({ ...current, customPriceKes: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!canSubmit}>
              Create Grant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!extendTarget} onOpenChange={(open) => !open && setExtendTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Extend Pilot Grant</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>New End Date</Label>
              <Input type="date" value={extendDate} onChange={(event) => setExtendDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={extendReason} onChange={(event) => setExtendReason(event.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendTarget(null)}>Cancel</Button>
            <Button onClick={handleExtend} disabled={!extendDate || !extendReason}>Extend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revoke Pilot Grant</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={!revokeReason}>Revoke</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
