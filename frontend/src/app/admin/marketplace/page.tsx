"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ModuleCard } from "./components/ModuleCard";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/shared/SearchInput";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowUpCircle,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Download,
  Lock,
  Package,
  Shield,
  Wallet,
} from "lucide-react";
import Link from "next/link";

/** Core module IDs — must match backend */
const CORE_MODULE_IDS = ["sis", "communications", "users"];

type AccessStatus =
  | "allowed"
  | "plan_upgrade_required"
  | "rbac_escalation_required"
  | "payment_required"
  | "waitlist_only";

type AccessResult = {
  status: AccessStatus;
  reason: string;
  platformPriceKes?: number;
};

type DialogKind =
  | { kind: "install"; moduleId: string; moduleName: string; requiredTier: string }
  | { kind: "uninstall"; moduleId: string; moduleName: string }
  | { kind: "access_blocked"; status: AccessStatus; reason: string; platformPriceKes?: number; moduleName: string; moduleId: string }
  | { kind: "payment"; moduleId: string; moduleName: string; platformPriceKes: number }
  | null;

export default function MarketplacePage() {
  const { isLoading: authLoading, isAuthenticated, sessionToken } = useAuth();
  const { tenantId, installedModules, tier, isLoading: tenantLoading } = useTenant();
  const hasLiveTenantSession = !!sessionToken && sessionToken !== "dev_session_token";
  const canQueryMarketplace = !authLoading && isAuthenticated && hasLiveTenantSession;

  const [marketplaceTimedOut, setMarketplaceTimedOut] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [accessCheckModuleId, setAccessCheckModuleId] = useState<string | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<string>("mpesa");
  const [paymentReference, setPaymentReference] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const availableModules = useQuery(
    api.modules.marketplace.queries.getAvailableForTier,
    { sessionToken: sessionToken ?? "" },
    canQueryMarketplace
  );
  const resolvedAvailableModules = (availableModules as any[]) ?? [];

  // Live access-check for the module the user is about to install
  const accessStatus = useQuery(
    api.modules.marketplace.queries.getModuleAccessStatus,
    accessCheckModuleId && sessionToken
      ? { sessionToken, moduleId: accessCheckModuleId }
      : "skip"
  ) as AccessResult | undefined;

  const installModule = useMutation(api.modules.marketplace.mutations.installModule);
  const uninstallModule = useMutation(api.modules.marketplace.mutations.uninstallModule);

  useEffect(() => {
    if (!canQueryMarketplace) { setMarketplaceTimedOut(false); return; }
    if (availableModules !== undefined) { setMarketplaceTimedOut(false); return; }
    const id = window.setTimeout(() => setMarketplaceTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [availableModules, canQueryMarketplace]);

  // Once access check resolves, open the right dialog
  useEffect(() => {
    if (!accessCheckModuleId || !accessStatus) return;
    const mod = resolvedAvailableModules.find((m) => m.moduleId === accessCheckModuleId);
    if (!mod) return;

    if (accessStatus.status === "allowed") {
      setDialog({
        kind: "install",
        moduleId: mod.moduleId,
        moduleName: mod.name,
        requiredTier: mod.tier,
      });
    } else if (accessStatus.status === "payment_required") {
      setDialog({
        kind: "payment",
        moduleId: mod.moduleId,
        moduleName: mod.name,
        platformPriceKes: accessStatus.platformPriceKes ?? 0,
      });
    } else {
      setDialog({
        kind: "access_blocked",
        status: accessStatus.status,
        reason: accessStatus.reason,
        platformPriceKes: accessStatus.platformPriceKes,
        moduleName: mod.name,
        moduleId: mod.moduleId,
      });
    }
    setAccessCheckModuleId(null);
  }, [accessStatus, accessCheckModuleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const { coreModules, optionalModules, installedCount, totalCount } = useMemo(() => {
    const mods = resolvedAvailableModules;
    const core = mods.filter((m) => CORE_MODULE_IDS.includes(m.moduleId) || m.isCore);
    const optional = mods.filter((m) => !CORE_MODULE_IDS.includes(m.moduleId) && !m.isCore);
    const installed = optional.filter((m) => installedModules.includes(m.moduleId));
    return { coreModules: core, optionalModules: optional, installedCount: installed.length, totalCount: optional.length };
  }, [resolvedAvailableModules, installedModules]);

  const filteredOptional = useMemo(() => {
    let result = optionalModules;
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((m: any) =>
        [m.name, m.description, m.moduleId].some((s: string) => s.toLowerCase().includes(lower))
      );
    }
    if (tab === "installed") result = result.filter((m: any) => installedModules.includes(m.moduleId));
    else if (tab === "available") result = result.filter((m: any) => !installedModules.includes(m.moduleId) && m.availableForTier);
    else if (tab === "upgrade") result = result.filter((m: any) => !m.availableForTier);
    return result;
  }, [optionalModules, search, tab, installedModules]);

  if ((authLoading && !isAuthenticated) || (tenantLoading && !tenantId)) {
    return <LoadingSkeleton variant="page" />;
  }

  const isRefreshing = !marketplaceTimedOut && canQueryMarketplace && availableModules === undefined;

  // Trigger access check — opens the dialog once the query resolves
  const handleInstall = (moduleId: string) => {
    setAccessCheckModuleId(moduleId);
  };

  const handleUninstall = (moduleId: string) => {
    if (CORE_MODULE_IDS.includes(moduleId)) return;
    const mod = resolvedAvailableModules.find((m) => m.moduleId === moduleId);
    if (!mod) return;
    setDialog({ kind: "uninstall", moduleId, moduleName: mod.name });
  };

  const handleConfirmInstall = async (moduleId: string) => {
    if (!sessionToken || !tenantId) return;
    setIsProcessing(true);
    try {
      await installModule({ sessionToken, tenantId, moduleId });
      toast.success("Module installed successfully");
      setDialog(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to install module");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUninstall = async (moduleId: string) => {
    if (!sessionToken || !tenantId) return;
    setIsProcessing(true);
    try {
      await uninstallModule({ sessionToken, tenantId, moduleId });
      toast.success("Module uninstalled");
      setDialog(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to uninstall module");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Module Marketplace"
        description={`Manage your school's modules. Current plan: ${tier ?? "Free"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Marketplace" },
        ]}
        actions={
          <Link href="/admin/marketplace/requests">
            <Button variant="outline">
              <ClipboardList className="mr-2 h-4 w-4" />
              Access Requests
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Core Modules", value: coreModules.length, icon: Package, color: "bg-blue-100 text-blue-600" },
          { label: "Installed", value: installedCount, icon: CheckCircle2, color: "bg-green-100 text-green-600" },
          { label: "Available", value: totalCount - installedCount, icon: Download, color: "bg-purple-100 text-purple-600" },
          { label: `Plan: ${tier ?? "Free"}`, value: tier?.toUpperCase() ?? "FREE", icon: Shield, color: "bg-amber-100 text-amber-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Core Modules */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-semibold">Core Modules</h2>
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            Always Active
          </Badge>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Included with every plan. Cannot be uninstalled.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coreModules.map((mod: any) => (
            <Card key={mod.moduleId} className="relative overflow-hidden ring-1 ring-primary/20">
              <div className="absolute right-2 top-2">
                <Badge variant="default" className="gap-1 bg-blue-600">
                  <Shield className="h-3 w-3" />
                  Core
                </Badge>
              </div>
              <CardContent className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{mod.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{mod.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                  <span className="text-xs text-muted-foreground">Free</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Optional Modules */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Optional Modules</h2>
          <p className="text-sm text-muted-foreground">
            Modules available depend on your subscription plan. All install attempts are verified server-side.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search modules..." className="max-w-sm" />
          <Tabs value={tab} onValueChange={setTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All ({optionalModules.length})</TabsTrigger>
              <TabsTrigger value="installed">Installed ({installedCount})</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="upgrade">Upgrade Required</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOptional.map((mod: any) => (
            <ModuleCard
              key={mod.moduleId}
              moduleId={mod.moduleId}
              name={mod.name}
              description={mod.description}
              tier={mod.tier}
              category={mod.category}
              status={mod.status}
              isInstalled={installedModules.includes(mod.moduleId)}
              availableForTier={mod.availableForTier}
              onInstall={() => handleInstall(mod.moduleId)}
              onUninstall={() => handleUninstall(mod.moduleId)}
            />
          ))}
        </div>

        {isRefreshing && filteredOptional.length === 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-5">
                  <LoadingSkeleton variant="card" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isRefreshing && filteredOptional.length === 0 && (
          <div className="py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {search
                ? "No modules match your search."
                : tab === "installed"
                  ? "No optional modules installed yet."
                  : tab === "upgrade"
                    ? "All available modules shown. Upgrade your plan to access more."
                    : marketplaceTimedOut
                      ? "Marketplace is taking longer than expected to load."
                      : "No modules available."}
            </p>
          </div>
        )}
      </div>

      {/* Dependency note */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h3 className="font-medium text-amber-900">Module Dependencies</h3>
            <p className="mt-1 text-sm text-amber-800">
              Some modules require others to be installed first (e.g. Timetable requires SIS + Academics).
              The system prevents uninstalling a module that others depend on.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Access check in-flight indicator */}
      {accessCheckModuleId && accessStatus === undefined && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border bg-background px-4 py-3 shadow-lg text-sm">
          Checking access…
        </div>
      )}

      {/* ── Install confirmation dialog ── */}
      {dialog?.kind === "install" && (
        <Dialog open onOpenChange={() => setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Install {dialog.moduleName}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Install &ldquo;{dialog.moduleName}&rdquo; for your school? All features in this module will be enabled immediately.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)} disabled={isProcessing}>Cancel</Button>
              <Button
                className="bg-[#0F4C2A] hover:bg-[#1A7A4A] text-white"
                onClick={() => handleConfirmInstall(dialog.moduleId)}
                disabled={isProcessing}
              >
                <Download className="mr-2 h-4 w-4" />
                {isProcessing ? "Installing…" : "Install"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Uninstall confirmation dialog ── */}
      {dialog?.kind === "uninstall" && (
        <Dialog open onOpenChange={() => setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uninstall {dialog.moduleName}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Remove &ldquo;{dialog.moduleName}&rdquo; from your school? Your data will be preserved but all features will be disabled.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)} disabled={isProcessing}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleConfirmUninstall(dialog.moduleId)} disabled={isProcessing}>
                {isProcessing ? "Removing…" : "Uninstall"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Access blocked dialog ── */}
      {dialog?.kind === "access_blocked" && (
        <Dialog open onOpenChange={() => setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {dialog.status === "plan_upgrade_required" && <ArrowUpCircle className="h-5 w-5 text-amber-600" />}
                {dialog.status === "rbac_escalation_required" && <Shield className="h-5 w-5 text-blue-600" />}
                {dialog.status === "waitlist_only" && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                {dialog.status === "plan_upgrade_required" && "Plan Upgrade Required"}
                {dialog.status === "rbac_escalation_required" && "Role Assignment Required"}
                {dialog.status === "waitlist_only" && "Module Not Available"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{dialog.reason}</p>
            {dialog.status === "plan_upgrade_required" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-medium">Upgrade your plan to install {dialog.moduleName}.</p>
                <p className="mt-1">Go to Settings → Billing to view available plans and pricing.</p>
              </div>
            )}
            {dialog.status === "rbac_escalation_required" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-medium">No eligible users found for {dialog.moduleName}.</p>
                <p className="mt-1">Assign the required roles to staff members before installing this module.</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)}>Close</Button>
              {dialog.status === "plan_upgrade_required" && (
                <Button asChild className="bg-[#0F4C2A] hover:bg-[#1A7A4A] text-white">
                  <Link href="/admin/settings/billing">Upgrade Plan</Link>
                </Button>
              )}
              {dialog.status === "rbac_escalation_required" && (
                <Button asChild variant="outline">
                  <Link href="/admin/users">Manage Users</Link>
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Payment dialog ── */}
      {dialog?.kind === "payment" && (
        <Dialog open onOpenChange={() => setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#0F4C2A]" />
                Payment Required
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                &ldquo;{dialog.moduleName}&rdquo; requires a one-time payment of{" "}
                <span className="font-semibold text-foreground">KES {dialog.platformPriceKes.toLocaleString()}</span>.
              </p>
              <div className="space-y-2">
                <Label>Payment method</Label>
                <Select value={paymentProvider} onValueChange={setPaymentProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="airtel">Airtel Money</SelectItem>
                    <SelectItem value="stripe">Card (Stripe)</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transaction / reference number</Label>
                <Input
                  placeholder="e.g. QHG4X7T29R"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)} disabled={isProcessing}>Cancel</Button>
              <Button
                className="bg-[#0F4C2A] hover:bg-[#1A7A4A] text-white"
                disabled={isProcessing || !paymentReference.trim()}
                onClick={() => handleConfirmInstall(dialog.moduleId)}
              >
                {isProcessing ? "Processing…" : "Confirm Payment & Install"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
