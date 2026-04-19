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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
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

function titleCase(value?: string) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function MarketplacePricingPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
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

  const pricingHistory = usePlatformQuery(
    api.modules.platform.ops.getMarketplaceModulePricingHistory,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const upsertPricingRule = useMutation(api.modules.platform.ops.upsertPlatformPricingRule);
  const deletePricingRule = useMutation(api.modules.platform.ops.deletePlatformPricingRule);
  const upsertCurrencyRateOverride = useMutation(
    api.modules.platform.currency.upsertCurrencyRateOverride
  );
  const upsertMarketplaceModulePricingOverride = useMutation(
    api.modules.platform.ops.upsertMarketplaceModulePricingOverride
  );
  const deleteMarketplaceModulePricingOverride = useMutation(
    api.modules.platform.ops.deleteMarketplaceModulePricingOverride
  );

  const pricingRules = data?.rules ?? [];
  const modules = useMemo(() => {
    const rows = data?.modules ?? [];
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((moduleRecord: any) =>
      [moduleRecord.name, moduleRecord.slug, moduleRecord.category]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [data?.modules, search]);

  const stats = useMemo(
    () => ({
      moduleCount: modules.length,
      overriddenCount: modules.filter(
        (moduleRecord: any) => (moduleRecord.activeOverrides ?? []).length > 0
      ).length,
      ruleCount: pricingRules.length,
      currencyCount: (currencyRates ?? []).length,
    }),
    [currencyRates, modules, pricingRules.length]
  );

  if (
    isLoading ||
    data === undefined ||
    currencyRates === undefined ||
    supportedCurrencies === undefined ||
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

  const openPriceDialog = (moduleRecord: any) => {
    setSelectedModule(moduleRecord);
    const activeOverride = moduleRecord.activeOverrides?.[0];
    setPriceOverrideKes(String(activeOverride?.overridePriceKes ?? ""));
    setOverrideReason(activeOverride?.reason ?? "");
    setPriceDialogOpen(true);
  };

  const openCurrencyDialog = (rate?: any) => {
    setSelectedRate(rate ?? null);
    setCurrencyOverrideRate(String(rate?.rate ?? ""));
    setCurrencyDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await upsertPricingRule({
        sessionToken,
        category: ruleForm.category.trim(),
        minPriceKes: Number(ruleForm.minPriceKes),
        maxPriceKes: Number(ruleForm.maxPriceKes),
        defaultRevenueSharePct: Number(ruleForm.defaultRevenueSharePct),
      });
      toast({ title: "Pricing rule saved" });
      setRuleDialogOpen(false);
      setSelectedRule(null);
      setRuleForm({
        category: "",
        minPriceKes: "",
        maxPriceKes: "",
        defaultRevenueSharePct: "",
      });
    } catch (error) {
      toast({
        title: "Unable to save rule",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelectedRule = async () => {
    if (!sessionToken || !selectedRule) return;
    setSaving(true);
    try {
      await deletePricingRule({
        sessionToken,
        pricingRuleId: selectedRule._id ?? selectedRule.pricingRuleId,
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
    if (!sessionToken || !selectedModule || !priceOverrideKes) return;
    setSaving(true);
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
      toast({
        title: "Unable to save override",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (moduleRecord: any) => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await deleteMarketplaceModulePricingOverride({
        sessionToken,
        moduleId: moduleRecord.moduleId,
      });
      toast({ title: "Module price override removed" });
      if (selectedModule?.moduleId === moduleRecord.moduleId) {
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
        description="Manage category pricing guardrails, per-module overrides, and currency controls."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Pricing" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => openCurrencyDialog(currencyRates[0])}
              disabled={currencyRates.length === 0}
            >
              Manual Currency Override
            </Button>
            <Button onClick={() => openRuleDialog()}>Add Pricing Rule</Button>
          </div>
        }
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/pricing" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pricing rules</p>
            <p className="text-3xl font-semibold">{stats.ruleCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Catalog modules</p>
            <p className="text-3xl font-semibold">{stats.moduleCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Currency pairs</p>
            <p className="text-3xl font-semibold">{stats.currencyCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Supported currencies</p>
            <p className="text-3xl font-semibold">{supportedCurrencies.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Platform Pricing Rules</CardTitle>
          </CardHeader>
          <CardContent>
            {pricingRules.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="No pricing rules yet"
                description="Create a category rule to guide marketplace pricing ranges and revenue share."
              />
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
                  {pricingRules.map((rule: any) => (
                    <TableRow key={String(rule._id ?? rule.ruleId)}>
                      <TableCell>{titleCase(rule.category)}</TableCell>
                      <TableCell>
                        {formatKes(rule.minPriceKes)} - {formatKes(rule.maxPriceKes)}
                      </TableCell>
                      <TableCell>{rule.defaultRevenueSharePct}%</TableCell>
                      <TableCell>
                        {formatDateTime(rule.updatedAt ?? rule.createdAt)}
                      </TableCell>
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
            {currencyRates.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="No currency rates found"
                description="Currency exchange rate rows will appear here."
              />
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
                      <TableCell>
                        {rate.fromCurrency} → {rate.toCurrency}
                      </TableCell>
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
              placeholder="Search modules by name, slug, or category"
              className="max-w-md"
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
                  <TableHead>Status</TableHead>
                  <TableHead>Overrides</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((moduleRecord: any) => {
                  const activeOverride = moduleRecord.activeOverrides?.[0];
                  return (
                    <TableRow key={moduleRecord.moduleId}>
                      <TableCell className="font-medium">{moduleRecord.name}</TableCell>
                      <TableCell>{titleCase(moduleRecord.category)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {titleCase(moduleRecord.status ?? "published")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {activeOverride ? (
                          <div className="space-y-1">
                            <p>{formatKes(activeOverride.overridePriceKes)}</p>
                            <p className="text-xs text-muted-foreground">
                              {activeOverride.reason || "Platform pricing override"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No override</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPriceDialog(moduleRecord)}
                          >
                            {activeOverride ? "Edit override" : "Create override"}
                          </Button>
                          {activeOverride ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteOverride(moduleRecord)}
                              disabled={saving}
                            >
                              Clear
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                {pricingHistory.slice(0, 20).map((entry: any) => (
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
          <DialogHeader>
            <DialogTitle>Pricing Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={ruleForm.category}
                onChange={(event) =>
                  setRuleForm((current) => ({ ...current, category: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Min KES</Label>
                <Input
                  value={ruleForm.minPriceKes}
                  onChange={(event) =>
                    setRuleForm((current) => ({
                      ...current,
                      minPriceKes: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max KES</Label>
                <Input
                  value={ruleForm.maxPriceKes}
                  onChange={(event) =>
                    setRuleForm((current) => ({
                      ...current,
                      maxPriceKes: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Share %</Label>
                <Input
                  value={ruleForm.defaultRevenueSharePct}
                  onChange={(event) =>
                    setRuleForm((current) => ({
                      ...current,
                      defaultRevenueSharePct: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRule}
              disabled={
                saving ||
                !ruleForm.category ||
                !ruleForm.minPriceKes ||
                !ruleForm.maxPriceKes ||
                !ruleForm.defaultRevenueSharePct
              }
            >
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Module Price Override</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Module</Label>
              <p className="text-sm text-muted-foreground">{selectedModule?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>Override Price (KES)</Label>
              <Input
                value={priceOverrideKes}
                onChange={(event) => setPriceOverrideKes(event.target.value)}
              />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveOverride}
              disabled={saving || !priceOverrideKes}
            >
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={currencyDialogOpen} onOpenChange={setCurrencyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Currency Override</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Currency Pair</Label>
            <p className="text-sm text-muted-foreground">
              {selectedRate?.fromCurrency} → {selectedRate?.toCurrency}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Rate</Label>
            <Input
              value={currencyOverrideRate}
              onChange={(event) => setCurrencyOverrideRate(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCurrencyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCurrencyOverride}
              disabled={saving || !currencyOverrideRate}
            >
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pricing Rule</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete the pricing rule for{" "}
            <span className="font-medium text-foreground">
              {selectedRule?.category}
            </span>
            ? This removes the category guardrail from the pricing controls.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSelectedRule}
              disabled={saving}
            >
              Delete Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
