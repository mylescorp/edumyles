"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Coins, SearchX } from "lucide-react";

const marketplacePlatformApi =
  (api as any).modules?.marketplace?.platformDashboard ??
  (api as any)["modules/marketplace/platformDashboard"];

function formatKes(amount?: number) {
  return `KES ${(amount ?? 0).toLocaleString()}`;
}

export default function MarketplacePricingPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [studentCount, setStudentCount] = useState("750");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "termly" | "quarterly" | "annual">("monthly");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [selectedOverrideModule, setSelectedOverrideModule] = useState<any>(null);
  const [ruleForm, setRuleForm] = useState({
    category: "",
    minPriceKes: "",
    maxPriceKes: "",
    defaultRevenueSharePct: "",
  });
  const [overrideForm, setOverrideForm] = useState({
    tenantId: "",
    overridePriceKes: "",
    reason: "",
    expiresAt: "",
  });

  const data = usePlatformQuery(
    marketplacePlatformApi.getPlatformPricingControlData,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as any;

  const simulation = usePlatformQuery(
    marketplacePlatformApi.simulatePlatformPricing,
    sessionToken && selectedModuleId
      ? {
          sessionToken,
          moduleId: selectedModuleId as any,
          studentCount: Number(studentCount || 0),
          billingPeriod,
        }
      : "skip",
    !!sessionToken && !!selectedModuleId
  ) as any;

  const upsertRule = useMutation(marketplacePlatformApi.upsertPlatformPricingRule);
  const deleteRule = useMutation(marketplacePlatformApi.deletePlatformPricingRule);
  const upsertOverride = useMutation(marketplacePlatformApi.upsertPlatformModulePriceOverride);
  const revokeOverride = useMutation(marketplacePlatformApi.revokePlatformModulePriceOverride);

  const modules = useMemo(() => {
    const rows = data?.modules ?? [];
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((module: any) => [module.name, module.slug, module.category].join(" ").toLowerCase().includes(needle));
  }, [data, search]);

  if (isLoading || data === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleSaveRule = async () => {
    if (!sessionToken) return;
    try {
      await upsertRule({
        sessionToken,
        category: ruleForm.category,
        minPriceKes: Number(ruleForm.minPriceKes),
        maxPriceKes: Number(ruleForm.maxPriceKes),
        defaultRevenueSharePct: Number(ruleForm.defaultRevenueSharePct),
      });
      toast({ title: "Pricing rule saved" });
      setRuleDialogOpen(false);
      setRuleForm({ category: "", minPriceKes: "", maxPriceKes: "", defaultRevenueSharePct: "" });
    } catch (error) {
      toast({ title: "Unable to save rule", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!sessionToken) return;
    try {
      await deleteRule({ sessionToken, ruleId: ruleId as any });
      toast({ title: "Pricing rule deleted" });
    } catch (error) {
      toast({ title: "Unable to delete rule", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const handleSaveOverride = async () => {
    if (!sessionToken || !selectedOverrideModule) return;
    try {
      await upsertOverride({
        sessionToken,
        moduleId: selectedOverrideModule.moduleId,
        tenantId: overrideForm.tenantId,
        overridePriceKes: Number(overrideForm.overridePriceKes),
        reason: overrideForm.reason,
        expiresAt: overrideForm.expiresAt ? new Date(overrideForm.expiresAt).getTime() : undefined,
      });
      toast({ title: "Price override saved" });
      setOverrideDialogOpen(false);
      setSelectedOverrideModule(null);
      setOverrideForm({ tenantId: "", overridePriceKes: "", reason: "", expiresAt: "" });
    } catch (error) {
      toast({ title: "Unable to save override", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Pricing"
        description="Manage category pricing guardrails, per-school overrides, and simulate live KES pricing bands."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Pricing" },
        ]}
        actions={<Button onClick={() => setRuleDialogOpen(true)}>Add Pricing Rule</Button>}
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/pricing" />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Catalog Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search modules by name, slug, or category"
              className="max-w-md"
            />
            {modules.length === 0 ? (
              <EmptyState icon={search ? SearchX : Coins} title="No pricing rows found" description="Marketplace modules with pricing bands will appear here." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Bands</TableHead>
                    <TableHead>Overrides</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module: any) => (
                    <TableRow key={module.moduleId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{module.name}</p>
                          <p className="text-sm text-muted-foreground">{module.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>{module.pricing ? formatKes(module.pricing.baseRateKes) : "Not set"}</TableCell>
                      <TableCell>
                        {module.pricing ? (
                          <div className="text-xs text-muted-foreground">
                            {formatKes(module.pricing.band1Rate)} / {formatKes(module.pricing.band2Rate)} / {formatKes(module.pricing.band3Rate)}
                          </div>
                        ) : "Not set"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={module.activeOverrides.length > 0 ? "default" : "outline"}>
                          {module.activeOverrides.length} active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedModuleId(module.moduleId)}>
                            Simulate
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOverrideModule(module);
                              setOverrideDialogOpen(true);
                            }}
                          >
                            Override
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Simulator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                  <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>
                    {(data.modules ?? []).map((module: any) => (
                      <SelectItem key={module.moduleId} value={module.moduleId}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Student Count</Label>
                <Input value={studentCount} onChange={(event) => setStudentCount(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Billing Period</Label>
                <Select value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="termly">Termly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {simulation ? (
                <div className="rounded-xl border p-4 text-sm">
                  <p className="font-medium">Total: {formatKes(simulation.totalKes)}</p>
                  <p className="text-muted-foreground">VAT: {formatKes(simulation.vatKes)}</p>
                  <p className="text-muted-foreground">Discount: {formatKes(simulation.discountKes)}</p>
                  <p className="text-muted-foreground">Effective monthly: {formatKes(simulation.effectiveMonthlyKes)}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a module to preview its pricing breakdown.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.rules ?? []).length > 0 ? (
                data.rules.map((rule: any) => (
                  <div key={rule.ruleId} className="flex items-center justify-between rounded-xl border px-4 py-3">
                    <div>
                      <p className="font-medium">{rule.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatKes(rule.minPriceKes)} - {formatKes(rule.maxPriceKes)} | {rule.defaultRevenueSharePct}% share
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteRule(rule.ruleId)}>
                      Delete
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No platform pricing rules yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Price History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.history ?? []).slice(0, 6).map((entry: any) => (
                <div key={entry.historyId} className="rounded-xl border px-4 py-3">
                  <p className="font-medium">{entry.moduleName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatKes(entry.oldPriceKes)} to {formatKes(entry.newPriceKes)}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.reason || entry.changeType || "Price change"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pricing Rule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={ruleForm.category} onChange={(event) => setRuleForm((current) => ({ ...current, category: event.target.value }))} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Min KES</Label>
                <Input value={ruleForm.minPriceKes} onChange={(event) => setRuleForm((current) => ({ ...current, minPriceKes: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Max KES</Label>
                <Input value={ruleForm.maxPriceKes} onChange={(event) => setRuleForm((current) => ({ ...current, maxPriceKes: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Share %</Label>
                <Input value={ruleForm.defaultRevenueSharePct} onChange={(event) => setRuleForm((current) => ({ ...current, defaultRevenueSharePct: event.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRule} disabled={!ruleForm.category || !ruleForm.minPriceKes || !ruleForm.maxPriceKes || !ruleForm.defaultRevenueSharePct}>
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create School Override</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Module</Label>
              <p className="text-sm text-muted-foreground">{selectedOverrideModule?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Input value={overrideForm.tenantId} onChange={(event) => setOverrideForm((current) => ({ ...current, tenantId: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Override Price (KES)</Label>
              <Input value={overrideForm.overridePriceKes} onChange={(event) => setOverrideForm((current) => ({ ...current, overridePriceKes: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Expiry</Label>
              <Input type="date" value={overrideForm.expiresAt} onChange={(event) => setOverrideForm((current) => ({ ...current, expiresAt: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={overrideForm.reason} onChange={(event) => setOverrideForm((current) => ({ ...current, reason: event.target.value }))} rows={3} />
            </div>

            {selectedOverrideModule?.activeOverrides?.length > 0 ? (
              <div className="space-y-2 rounded-xl border p-3">
                <p className="text-sm font-medium">Active Overrides</p>
                {selectedOverrideModule.activeOverrides.map((override: any) => (
                  <div key={override.overrideId} className="flex items-center justify-between gap-3 text-sm">
                    <span>{override.tenantId}: {formatKes(override.overridePriceKes)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeOverride({ sessionToken: sessionToken || "", overrideId: override._id })}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveOverride} disabled={!overrideForm.tenantId || !overrideForm.overridePriceKes || !overrideForm.reason}>
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
