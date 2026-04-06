"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatDate } from "@/lib/formatters";
import { FlaskConical, SearchX } from "lucide-react";

const GRANT_TYPES = [
  "free_trial",
  "free_permanent",
  "discounted",
  "plan_upgrade",
  "beta_access",
] as const;

const STATUSES = ["all", "active", "extended", "expired", "revoked"] as const;

function statusClass(status: string) {
  switch (status) {
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "extended":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "expired":
    case "revoked":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
  }
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function PilotGrantsPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState<any>(null);
  const [revokeTarget, setRevokeTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    tenantId: "",
    moduleId: "",
    grantType: "free_trial" as (typeof GRANT_TYPES)[number],
    discountPct: "",
    customPriceKes: "",
    startDate: "",
    endDate: "",
    reason: "",
    stealthMode: false,
  });
  const [extendDate, setExtendDate] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  const grants = usePlatformQuery(
    api.modules.platform.pilotGrants.getPilotGrants,
    sessionToken
      ? {
          sessionToken,
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        }
      : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const modulesResult = usePlatformQuery(
    api.platform.marketplace.queries.browseModules,
    sessionToken ? { sessionToken, limit: 200 } : "skip",
    !!sessionToken
  ) as { modules?: Array<any> } | undefined;

  const createGrant = useMutation(api.modules.platform.pilotGrants.createPilotGrant);
  const extendGrant = useMutation(api.modules.platform.pilotGrants.extendPilotGrant);
  const revokeGrant = useMutation(api.modules.platform.pilotGrants.revokePilotGrant);

  const tenantMap = useMemo(
    () => new Map((tenants ?? []).map((tenant) => [tenant.tenantId, tenant.name])),
    [tenants]
  );
  const moduleMap = useMemo(
    () => new Map((modulesResult?.modules ?? []).map((module) => [module.moduleId, module.name])),
    [modulesResult]
  );

  const filtered = useMemo(() => {
    const rows = grants ?? [];
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((grant) =>
      [grant.moduleId, grant.tenantId, grant.reason, tenantMap.get(grant.tenantId) ?? "", moduleMap.get(grant.moduleId) ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [grants, moduleMap, search, tenantMap]);

  const stats = useMemo(() => {
    const rows = grants ?? [];
    return {
      total: rows.length,
      active: rows.filter((grant) => grant.status === "active").length,
      expiringSoon: rows.filter((grant) => grant.endDate && grant.endDate - Date.now() <= 3 * 24 * 60 * 60 * 1000 && grant.endDate >= Date.now()).length,
      converted: rows.filter((grant) => grant.convertedToPaid).length,
    };
  }, [grants]);

  if (isLoading || grants === undefined || tenants === undefined || modulesResult === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const resetForm = () => {
    setForm({
      tenantId: "",
      moduleId: "",
      grantType: "free_trial",
      discountPct: "",
      customPriceKes: "",
      startDate: "",
      endDate: "",
      reason: "",
      stealthMode: false,
    });
  };

  const handleCreate = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await createGrant({
        sessionToken,
        tenantId: form.tenantId,
        moduleId: form.moduleId,
        grantType: form.grantType,
        discountPct: form.discountPct ? Number(form.discountPct) : undefined,
        customPriceKes: form.customPriceKes ? Number(form.customPriceKes) : undefined,
        startDate: new Date(form.startDate || Date.now()).getTime(),
        endDate: form.endDate ? new Date(form.endDate).getTime() : undefined,
        reason: form.reason,
        stealthMode: form.stealthMode,
      });
      toast({ title: "Pilot grant created" });
      setCreateOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Unable to create grant",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExtend = async () => {
    if (!sessionToken || !extendTarget || !extendDate) return;
    setSaving(true);
    try {
      await extendGrant({
        sessionToken,
        grantId: extendTarget._id,
        endDate: new Date(extendDate).getTime(),
      });
      toast({ title: "Pilot grant extended" });
      setExtendTarget(null);
      setExtendDate("");
    } catch (error) {
      toast({
        title: "Unable to extend grant",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!sessionToken || !revokeTarget || !revokeReason.trim()) return;
    setSaving(true);
    try {
      await revokeGrant({
        sessionToken,
        grantId: revokeTarget._id,
        reason: revokeReason.trim(),
      });
      toast({ title: "Pilot grant revoked" });
      setRevokeTarget(null);
      setRevokeReason("");
    } catch (error) {
      toast({
        title: "Unable to revoke grant",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pilot Grants"
        description="Manage trial access, beta access, discounted pilot grants, and marketplace conversion experiments."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Pilot Grants" },
        ]}
        actions={<Button onClick={() => setCreateOpen(true)}>Create Grant</Button>}
      />

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
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon={search || statusFilter !== "all" ? SearchX : FlaskConical}
              title={search || statusFilter !== "all" ? "No grants match these filters" : "No pilot grants yet"}
              description="Pilot grants will appear here once the platform team starts issuing marketplace trial access."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((grant) => (
                  <TableRow key={String(grant._id)}>
                    <TableCell>{tenantMap.get(grant.tenantId) ?? grant.tenantId}</TableCell>
                    <TableCell>{moduleMap.get(grant.moduleId) ?? grant.moduleId}</TableCell>
                    <TableCell>{labelize(grant.grantType)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusClass(grant.status)}>
                        {labelize(grant.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(grant.startDate)}</div>
                        <div className="text-muted-foreground">{grant.endDate ? `to ${formatDate(grant.endDate)}` : "Open-ended"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{grant.reason}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {grant.status === "active" || grant.status === "extended" ? (
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
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>{tenant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={form.moduleId} onValueChange={(value) => setForm((current) => ({ ...current, moduleId: value }))}>
                <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                <SelectContent>
                  {(modulesResult.modules ?? []).map((module) => (
                    <SelectItem key={module.moduleId} value={module.moduleId}>{module.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grant Type</Label>
              <Select value={form.grantType} onValueChange={(value) => setForm((current) => ({ ...current, grantType: value as (typeof GRANT_TYPES)[number] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRANT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{labelize(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input value={form.discountPct} onChange={(event) => setForm((current) => ({ ...current, discountPct: event.target.value }))} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Custom Price (KES)</Label>
              <Input value={form.customPriceKes} onChange={(event) => setForm((current) => ({ ...current, customPriceKes: event.target.value }))} placeholder="Optional" />
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
            <Textarea value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} rows={4} placeholder="Explain the pilot grant rationale" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.tenantId || !form.moduleId || !form.reason.trim()}>Create Grant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!extendTarget} onOpenChange={(open) => !open && setExtendTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Extend Pilot Grant</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>New End Date</Label>
            <Input type="date" value={extendDate} onChange={(event) => setExtendDate(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendTarget(null)}>Cancel</Button>
            <Button onClick={handleExtend} disabled={saving || !extendDate}>Extend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revoke Pilot Grant</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Revocation Reason</Label>
            <Textarea value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} rows={4} placeholder="Explain why this grant is being revoked" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={saving || !revokeReason.trim()}>Revoke Grant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
