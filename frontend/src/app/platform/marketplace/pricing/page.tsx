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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime } from "@/lib/formatters";
import { Coins, PencilLine, SearchX, Trash2 } from "lucide-react";

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
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [overrideReason, setOverrideReason] = useState("");

  const [ruleForm, setRuleForm] = useState({
    category: "",
    minPriceKes: "",
    maxPriceKes: "",
    defaultRevenueSharePct: "",
  });
  const [priceOverrideKes, setPriceOverrideKes] = useState("");
  const [currencyOverrideRate, setCurrencyOverrideRate] = useState("");

  const data = usePlatformQuery(
    marketplacePlatformApi.getPlatformPricingControlData,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as any;

  const currencyRates = usePlatformQuery(
    api.modules.platform.currency.getCurrencyRates,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const supportedCurrencies = usePlatformQuery(
    api.modules.platform.currency.getSupportedCurrencies,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const browseResult = usePlatformQuery(
    api.platform.marketplace.queries.browseModules,
    sessionToken ? { sessionToken, limit: 200 } : "skip",
    !!sessionToken
  ) as { modules?: Array<any> } | undefined;

  const pricingHistory = usePlatformQuery(
    api.modules.platform.ops.getMarketplaceModulePricingHistory,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const upsertPricingRule = useMutation(api.modules.platform.ops.upsertPlatformPricingRule);
  const deletePricingRule = useMutation(api.modules.platform.ops.deletePlatformPricingRule);
  const upsertCurrencyRateOverride = useMutation(api.modules.platform.currency.upsertCurrencyRateOverride);
  const upsertMarketplaceModulePricingOverride = useMutation(api.modules.platform.ops.upsertMarketplaceModulePricingOverride);
  const deleteMarketplaceModulePricingOverride = useMutation(api.modules.platform.ops.deleteMarketplaceModulePricingOverride);

  const modules = useMemo(() => {
    const rows = data?.modules ?? [];
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((module: any) => [module.name, module.slug, module.category].join(" ").toLowerCase().includes(needle));
  }, [data, search]);

  const stats = useMemo(() => {
    const rows = browseResult?.modules ?? [];
    return {
      moduleCount: rows.length,
      overriddenCount: rows.filter((module) => Boolean(module.hasPlatformOverride)).length,
      ruleCount: (pricingRules ?? []).length,
      currencyCount: (currencyRates ?? []).length,
    };
  }, [browseResult, currencyRates, pricingRules]);

  if (
    isLoading ||
    pricingRules === undefined ||
    currencyRates === undefined ||
    supportedCurrencies === undefined ||
    browseResult === undefined ||
    pricingHistory === undefined
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  const openRuleDialog = (rule?: any) => {
    setSelectedRule(rule ?? null);
    setRuleForm({
      category: rule?.category ?? "",
      minPriceKes: String(rule?.minPriceKes ?? ""),
      maxPriceKes: String(rule?.maxPriceKes ?? ""),
      defaultRevenueSharePct: String(rule?.defaultRevenueSharePct ?? ""),
    });
    setRuleDialogOpen(true);
  };

  const openPriceDialog = (module: any) => {
    setSelectedModule(module);
    setPriceOverrideKes(
      String(
        typeof module.effectivePriceKes === "number"
          ? module.effectivePriceKes
          : typeof module.priceCents === "number"
            ? Math.round(module.priceCents / 100)
            : module.priceKes ?? 0
      )
    );
    setOverrideReason(module.overrideReason ?? "");
    setPriceDialogOpen(true);
  };

  const openCurrencyDialog = (rate?: any) => {
    setSelectedRate(rate ?? null);
    setCurrencyOverrideRate(String(rate?.rate ?? ""));
    setCurrencyDialogOpen(true);
  };

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
      setSelectedRule(null);
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

  const handleDeleteSelectedRule = async () => {
    if (!sessionToken || !selectedRule) return;
    setSaving(true);
    try {
      await deletePricingRule({
        sessionToken,
        pricingRuleId: selectedRule._id,
      });
      toast({ title: "Pricing rule deleted" });
      setDeleteDialogOpen(false);
      setSelectedRule(null);
    } catch (error) {
      toast({
        title: "Unable to delete pricing rule",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOverride = async () => {
    if (!sessionToken || !selectedOverrideModule) return;
    try {
      await upsertMarketplaceModulePricingOverride({
        sessionToken,
        moduleId: selectedModule.moduleId,
        priceKes: Number(priceOverrideKes),
        reason: overrideReason || undefined,
      });
      toast({ title: "Module price override saved" });
      setPriceDialogOpen(false);
      setSelectedModule(null);
      setPriceOverrideKes("");
      setOverrideReason("");
    } catch (error) {
      toast({ title: "Unable to save override", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const handleDeleteOverride = async (module: any) => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await deleteMarketplaceModulePricingOverride({
        sessionToken,
        moduleId: module.moduleId,
      });
      toast({ title: "Module price override removed" });
      if (selectedModule?.moduleId === module.moduleId) {
        setPriceDialogOpen(false);
        setSelectedModule(null);
        setPriceOverrideKes("");
        setOverrideReason("");
      }
    } catch (error) {
      toast({
        title: "Unable to remove override",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCurrencyOverride = async () => {
    if (!sessionToken || !selectedRate || !currencyOverrideRate) return;
    setSaving(true);
    try {
      await upsertCurrencyRateOverride({
        sessionToken,
        fromCurrency: selectedRate.fromCurrency,
        toCurrency: selectedRate.toCurrency,
        rate: Number(currencyOverrideRate),
      });
      toast({ title: "Currency rate updated" });
      setCurrencyDialogOpen(false);
      setSelectedRate(null);
      setCurrencyOverrideRate("");
    } catch (error) {
      toast({
        title: "Unable to update rate",
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
        title="Marketplace Pricing"
        description="Manage category pricing guardrails, per-school overrides, and simulate live KES pricing bands."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Pricing" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => openCurrencyDialog(currencyRates[0])} disabled={currencyRates.length === 0}>
              Manual Currency Override
            </Button>
            <Button onClick={() => openRuleDialog()}>Add Pricing Rule</Button>
          </div>
        }
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/pricing" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pricing rules</p><p className="text-3xl font-semibold">{stats.ruleCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Catalog modules</p><p className="text-3xl font-semibold">{stats.moduleCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Currency pairs</p><p className="text-3xl font-semibold">{stats.currencyCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Supported currencies</p><p className="text-3xl font-semibold">{supportedCurrencies.length}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Platform Pricing Rules</CardTitle>
          </CardHeader>
          <CardContent>
            {pricingRules.length === 0 ? (
              <EmptyState icon={Coins} title="No pricing rules yet" description="Create a category rule to guide marketplace pricing ranges and revenue share." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Revenue Share</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingRules.map((rule) => (
                    <TableRow key={String(rule._id)}>
                      <TableCell>{titleCase(rule.category)}</TableCell>
                      <TableCell>{formatKes(rule.minPriceKes)} - {formatKes(rule.maxPriceKes)}</TableCell>
                      <TableCell>{rule.defaultRevenueSharePct}%</TableCell>
                      <TableCell>{formatDateTime(rule.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openRuleDialog(rule)}>
                            <PencilLine className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRule(rule);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete
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

        <Card>
          <CardHeader>
            <CardTitle>Currency Rates</CardTitle>
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
                    <TableHead>Pair</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Fetched</TableHead>
                    <TableHead className="w-[120px]">Override</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencyRates.map((rate) => (
                    <TableRow key={String(rate._id)}>
                      <TableCell>{rate.fromCurrency} → {rate.toCurrency}</TableCell>
                      <TableCell>{rate.rate}</TableCell>
                      <TableCell>{formatDateTime(rate.fetchedAt)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openCurrencyDialog(rate)}>
                          Edit
                        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Per-Module Price Overrides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search modules by name, category, or publisher"
              className="max-w-sm"
            />
            <Badge variant="outline">KES remains the canonical stored currency</Badge>
          </div>

          {modules.length === 0 ? (
            <EmptyState
              icon={search ? SearchX : Coins}
              title={search ? "No modules match this search" : "No marketplace modules"}
              description="Published marketplace modules will appear here for pricing overrides."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Publisher</TableHead>
                  <TableHead>Pricing Model</TableHead>
                  <TableHead>Current Platform Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.moduleId}>
                    <TableCell className="font-medium">{module.name}</TableCell>
                    <TableCell>{titleCase(module.category)}</TableCell>
                    <TableCell>{module.publisherName ?? "EduMyles"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{titleCase(module.pricingModel)}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatKes(
                        typeof module.effectivePriceKes === "number"
                          ? module.effectivePriceKes
                          : typeof module.priceCents === "number"
                            ? Math.round(module.priceCents / 100)
                            : 0
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={module.hasPlatformOverride ? "default" : "outline"}>
                        {module.hasPlatformOverride ? "Override active" : "Base price"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openPriceDialog(module)}>
                          {module.hasPlatformOverride ? "Edit override" : "Create override"}
                        </Button>
                        {module.hasPlatformOverride ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteOverride(module)}
                            disabled={saving}
                          >
                            Clear
                          </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Price History</CardTitle>
        </CardHeader>
        <CardContent>
          {pricingHistory.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="No pricing history yet"
              description="Module price changes will appear here after overrides are created or updated."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Old Price</TableHead>
                  <TableHead>New Price</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Changed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingHistory.slice(0, 12).map((entry) => (
                  <TableRow key={String(entry._id)}>
                    <TableCell className="font-medium">{entry.moduleId}</TableCell>
                    <TableCell>{formatKes(entry.oldPriceKes)}</TableCell>
                    <TableCell>{formatKes(entry.newPriceKes)}</TableCell>
                    <TableCell>{entry.reason || "Platform pricing override"}</TableCell>
                    <TableCell>{formatDateTime(entry.changedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              rows={3}
              placeholder="Explain why this module price is being overridden."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>Cancel</Button>
            {selectedModule?.hasPlatformOverride ? (
              <Button
                variant="outline"
                onClick={() => handleDeleteOverride(selectedModule)}
                disabled={saving}
              >
                Clear Override
              </Button>
            ) : null}
            <Button onClick={handleSaveOverride} disabled={saving || !priceOverrideKes}>Save Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={currencyDialogOpen} onOpenChange={setCurrencyDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manual Currency Override</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Currency Pair</Label>
            <p className="text-sm text-muted-foreground">
              {selectedRate?.fromCurrency} → {selectedRate?.toCurrency}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Rate</Label>
            <Input value={currencyOverrideRate} onChange={(event) => setCurrencyOverrideRate(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCurrencyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCurrencyOverride} disabled={saving || !currencyOverrideRate}>Save Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Pricing Rule</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete the pricing rule for <span className="font-medium text-foreground">{selectedRule?.category}</span>? This removes the category guardrail from the pricing controls.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSelectedRule} disabled={saving}>Delete Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
