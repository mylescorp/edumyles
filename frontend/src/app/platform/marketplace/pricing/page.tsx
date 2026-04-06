"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime } from "@/lib/formatters";
import { Coins, SearchX } from "lucide-react";

function formatKes(amount?: number) {
  return `KES ${(amount ?? 0).toLocaleString()}`;
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function MarketplacePricingPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  const [ruleForm, setRuleForm] = useState({
    category: "",
    minPriceKes: "",
    maxPriceKes: "",
    defaultRevenueSharePct: "",
  });
  const [priceOverrideKes, setPriceOverrideKes] = useState("");

  const pricingRules = usePlatformQuery(
    api.modules.platform.ops.getPlatformPricingRules,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const currencyRates = usePlatformQuery(
    api.modules.platform.currency.getCurrencyRates,
    {},
    true
  ) as Array<any> | undefined;

  const supportedCurrencies = usePlatformQuery(
    api.modules.platform.currency.getSupportedCurrencies,
    {},
    true
  ) as Array<any> | undefined;

  const browseResult = usePlatformQuery(
    api.platform.marketplace.queries.browseModules,
    sessionToken ? { sessionToken, limit: 200 } : "skip",
    !!sessionToken
  ) as { modules?: Array<any> } | undefined;

  const upsertPricingRule = useMutation(api.modules.platform.ops.upsertPlatformPricingRule);
  const overrideModulePrice = useMutation(api.modules.marketplace.modules.overrideModulePrice);

  const modules = useMemo(() => {
    const rows = browseResult?.modules ?? [];
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((module) =>
      [module.name, module.category, module.publisherName ?? ""].join(" ").toLowerCase().includes(needle)
    );
  }, [browseResult, search]);

  const stats = useMemo(() => {
    const rows = browseResult?.modules ?? [];
    return {
      moduleCount: rows.length,
      overriddenCount: rows.filter((module) => typeof module.priceCents === "number" && module.priceCents > 0).length,
      ruleCount: (pricingRules ?? []).length,
      currencyCount: (currencyRates ?? []).length,
    };
  }, [browseResult, currencyRates, pricingRules]);

  if (
    isLoading ||
    pricingRules === undefined ||
    currencyRates === undefined ||
    supportedCurrencies === undefined ||
    browseResult === undefined
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  const openRuleDialog = (rule?: any) => {
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
        typeof module.priceCents === "number"
          ? Math.round(module.priceCents / 100)
          : module.priceKes ?? 0
      )
    );
    setPriceDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await upsertPricingRule({
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
      toast({
        title: "Unable to save pricing rule",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOverride = async () => {
    if (!sessionToken || !selectedModule) return;
    setSaving(true);
    try {
      await overrideModulePrice({
        sessionToken,
        moduleId: selectedModule._id,
        priceKes: Number(priceOverrideKes),
      });
      toast({ title: "Module price override saved" });
      setPriceDialogOpen(false);
      setSelectedModule(null);
      setPriceOverrideKes("");
    } catch (error) {
      toast({
        title: "Unable to save module price",
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
        description="Manage platform pricing rules, per-module price overrides, and live display-currency conversion data."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Pricing" },
        ]}
        actions={<Button onClick={() => openRuleDialog()}>Add Pricing Rule</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pricing rules</p><p className="text-3xl font-semibold">{stats.ruleCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Catalog modules</p><p className="text-3xl font-semibold">{stats.moduleCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Currency pairs</p><p className="text-3xl font-semibold">{stats.currencyCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Supported currencies</p><p className="text-3xl font-semibold">{supportedCurrencies.length}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
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
                    <TableHead className="w-[100px]">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingRules.map((rule) => (
                    <TableRow key={String(rule._id)}>
                      <TableCell>{titleCase(rule.category)}</TableCell>
                      <TableCell>{formatKes(rule.minPriceKes)} - {formatKes(rule.maxPriceKes)}</TableCell>
                      <TableCell>{rule.defaultRevenueSharePct}%</TableCell>
                      <TableCell>{formatDateTime(rule.updatedAt)}</TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => openRuleDialog(rule)}>Edit</Button></TableCell>
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
            <p className="text-sm text-muted-foreground">
              Prices are stored in KES in Convex and converted client-side from these rates. Daily refresh is handled by cron.
            </p>
            {currencyRates.length === 0 ? (
              <EmptyState icon={Coins} title="No rates available" description="Currency rates will appear here after the daily refresh action runs." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Fetched</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencyRates.map((rate) => (
                    <TableRow key={String(rate._id)}>
                      <TableCell>{rate.fromCurrency} → {rate.toCurrency}</TableCell>
                      <TableCell>{rate.rate}</TableCell>
                      <TableCell>{formatDateTime(rate.fetchedAt)}</TableCell>
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
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search modules by name, category, or publisher"
            className="max-w-sm"
          />

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
                  <TableHead className="w-[120px]">Override</TableHead>
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
                    <TableCell>{formatKes(typeof module.priceCents === "number" ? Math.round(module.priceCents / 100) : 0)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openPriceDialog(module)}>Edit</Button>
                    </TableCell>
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={ruleForm.category} onChange={(event) => setRuleForm((current) => ({ ...current, category: event.target.value }))} placeholder="academic_tools" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Min Price (KES)</Label>
                <Input value={ruleForm.minPriceKes} onChange={(event) => setRuleForm((current) => ({ ...current, minPriceKes: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Max Price (KES)</Label>
                <Input value={ruleForm.maxPriceKes} onChange={(event) => setRuleForm((current) => ({ ...current, maxPriceKes: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Revenue Share %</Label>
                <Input value={ruleForm.defaultRevenueSharePct} onChange={(event) => setRuleForm((current) => ({ ...current, defaultRevenueSharePct: event.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRule} disabled={saving || !ruleForm.category || !ruleForm.minPriceKes || !ruleForm.maxPriceKes || !ruleForm.defaultRevenueSharePct}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Override Module Price</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Module</Label>
            <p className="text-sm text-muted-foreground">{selectedModule?.name}</p>
          </div>
          <div className="space-y-2">
            <Label>Platform Price (KES)</Label>
            <Input value={priceOverrideKes} onChange={(event) => setPriceOverrideKes(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveOverride} disabled={saving || !priceOverrideKes}>Save Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
