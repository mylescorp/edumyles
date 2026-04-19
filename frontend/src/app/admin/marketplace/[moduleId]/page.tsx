"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { TierBadge } from "../components/TierBadge";
import { ModuleStatusBadge } from "../components/ModuleStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpCircle,
  BookOpen,
  Bus,
  Calendar,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Download,
  ExternalLink,
  GraduationCap,
  Library,
  MessageSquare,
  Shield,
  ShoppingCart,
  Trash2,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const CORE_MODULE_IDS = ["sis", "communications", "users"];

const MODULE_ICONS: Record<string, LucideIcon> = {
  sis: GraduationCap,
  admissions: ClipboardList,
  finance: DollarSign,
  academics: BookOpen,
  timetable: Calendar,
  communications: MessageSquare,
  hr: UserCog,
  library: Library,
  transport: Bus,
  ewallet: Wallet,
  ecommerce: ShoppingCart,
};

type AccessStatus = "allowed" | "plan_upgrade_required" | "rbac_escalation_required" | "payment_required" | "waitlist_only";

export default function ModuleDetailPage() {
  const params = useParams();
  const moduleSlug = params.moduleId as string;
  const { sessionToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const canQuery = !authLoading && isAuthenticated && !!sessionToken;

  const moduleDetail = useQuery(
    api.modules.marketplace.settings.getModuleDetail,
    canQuery ? { sessionToken, moduleSlug } : "skip"
  )?.data as any;
  const shouldQueryPricing =
    canQuery && moduleDetail !== undefined && moduleDetail !== null && !moduleDetail.isCore;

  // Access check — only run when user clicks Install
  const [checkingAccess, setCheckingAccess] = useState(false);
  const accessStatus = useQuery(
    api.modules.marketplace.queries.getModuleAccessStatus,
    checkingAccess && sessionToken ? { sessionToken, moduleId } : "skip"
  ) as { status: AccessStatus; reason: string; platformPriceKes?: number } | undefined;

  const installModule = useMutation(api.modules.marketplace.mutations.installModule);
  const uninstallModule = useMutation(api.modules.marketplace.mutations.uninstallModule);
  const recordModulePayment = useMutation(api.modules.marketplace.modules.recordModulePayment);

  const [dialog, setDialog] = useState<
    | { kind: "confirm_install" }
    | { kind: "confirm_uninstall" }
    | { kind: "access_blocked"; status: AccessStatus; reason: string }
    | { kind: "payment"; platformPriceKes: number }
    | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState("mpesa");
  const [paymentReference, setPaymentReference] = useState("");

  useEffect(() => {
    if (!checkingAccess || accessStatus === undefined) return;
    setCheckingAccess(false);

    if (accessStatus.status === "allowed") {
      setDialog({ kind: "confirm_install" });
      return;
    }

    if (accessStatus.status === "payment_required") {
      setDialog({ kind: "payment", platformPriceKes: accessStatus.platformPriceKes ?? 0 });
      return;
    }

    setDialog({
      kind: "access_blocked",
      status: accessStatus.status,
      reason: accessStatus.reason,
    });
  }, [checkingAccess, accessStatus]);

  if (
    authLoading ||
    (canQuery && moduleDetail === undefined) ||
    (shouldQueryPricing && (pricingMonthly === undefined || pricingAnnual === undefined))
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!moduleDetail) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Module details could not be loaded.
      </div>
    );
  }

  const Icon = MODULE_ICONS[moduleId] ?? BookOpen;
  const features = moduleDetails.features ?? [];
  const isInstalled = !!moduleDetails.installed;
  const isCore = Boolean(moduleDetails.isCore || CORE_MODULE_IDS.includes(moduleId));

  const handleInstallClick = () => {
    setCheckingAccess(true);
  };

  const handleConfirmInstall = async () => {
    if (!tenantId || !sessionToken) return;
    setIsProcessing(true);
    try {
      await installModule({ sessionToken, tenantId, moduleId });
      toast.success("Module installed successfully");
      setDialog(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to install module");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPaymentInstall = async (platformPriceKes: number) => {
    if (!tenantId || !paymentReference.trim()) return;
    setIsProcessing(true);
    try {
      await recordModulePayment({
        tenantId,
        moduleId,
        amountKes: platformPriceKes,
        currency: "KES",
        displayAmount: platformPriceKes,
        exchangeRate: 1,
        provider: paymentProvider,
        status: "success",
      });

      await installModule({ sessionToken: sessionToken!, tenantId, moduleId });
      toast.success("Payment confirmed and module installed successfully");
      setDialog(null);
      setPaymentReference("");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to confirm payment and install module");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUninstall = async () => {
    if (!tenantId || !sessionToken) return;
    setIsProcessing(true);
    try {
      await uninstallModule({ sessionToken, tenantId, moduleId });
      toast.success("Module uninstalled");
      setDialog(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to uninstall module");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCoreInstall() {
    try {
      await installModule({
        sessionToken,
        moduleSlug,
        billingPeriod: "monthly",
      });
      toast.success("Core module activated successfully");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to activate core module");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={moduleDetail.name}
        description={moduleDetail.description}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Marketplace", href: "/admin/marketplace" },
          { label: moduleDetail.name },
        ]}
        actions={
          isInstalled && !isCore ? (
            <Button
              variant="outline"
              onClick={() => setDialog({ kind: "confirm_uninstall" })}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Uninstall
            </Button>
          ) : isCore ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline">Core Module</Badge>
              {moduleDetails.documentation && (
                <Button variant="outline" asChild>
                  <a href={moduleDetails.documentation} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Docs
                  </a>
                </Button>
              )}
            </div>
          ) : moduleDetails.availableForTier ? (
            <div className="flex items-center gap-2">
              <Button
                className="bg-[#0F4C2A] hover:bg-[#1A7A4A] text-white"
                onClick={handleInstallClick}
                disabled={checkingAccess}
              >
                <Download className="mr-2 h-4 w-4" />
                {checkingAccess ? "Checking access…" : "Install Module"}
              </Button>
              {moduleDetails.documentation && (
                <Button variant="outline" asChild>
                  <a href={moduleDetails.documentation} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Docs
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <Button disabled variant="outline">
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Upgrade Required
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Features */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About this module</CardTitle>
            </CardHeader>
            <CardContent>
              {features.length === 0 ? (
                <p className="text-sm text-muted-foreground">No feature list available.</p>
              ) : (
                <ul className="space-y-3">
                  {features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F4C2A]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {!moduleDetails.availableForTier && !isInstalled && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">Plan upgrade required</p>
                  <p className="mt-1 text-sm text-amber-800">
                    This module requires the <strong>{moduleDetails.tier}</strong> plan or higher.
                    Your current plan is <strong>{moduleDetails.currentTier}</strong>.
                  </p>
                  <Button asChild size="sm" className="mt-3 bg-[#0F4C2A] hover:bg-[#1A7A4A] text-white">
                    <Link href="/admin/settings/billing">Upgrade Plan</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: "Status",
                  value: <ModuleStatusBadge status={isInstalled ? moduleDetails.installed!.status : "not_installed"} />,
                },
                { label: "Required Tier", value: <TierBadge tier={moduleDetails.tier} /> },
                { label: "Your Tier", value: <TierBadge tier={moduleDetails.currentTier} /> },
                { label: "Category", value: <span className="capitalize font-medium">{moduleDetails.category}</span> },
                {
                  label: "Dependencies",
                  value: (
                    <span className="text-right text-sm">
                      {moduleDetails.dependencies?.length > 0 ? moduleDetails.dependencies.join(", ") : "None"}
                    </span>
                  ),
                },
                { label: "Version", value: <span className="font-mono text-xs">{moduleDetails.version}</span> },
                {
                  label: "Pricing",
                  value: (
                    <span>
                      {moduleDetails.pricing?.monthly
                        ? `${moduleDetails.pricing.currency} ${moduleDetails.pricing.monthly}/mo`
                        : "Included"}
                    </span>
                  ),
                },
                {
                  label: "Support",
                  value: <span className="text-sm">{moduleDetails.support?.email ?? "support@edumyles.com"}</span>,
                },
                ...(isInstalled && moduleDetails.installed
                  ? [{
                      label: "Installed",
                      value: (
                        <span className="text-xs">
                          {new Date(moduleDetails.installed.installedAt).toLocaleDateString("en-KE")}
                        </span>
                      ),
                    }]
                  : []),
              ].map(({ label, value }, idx, arr) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    {value}
                  </div>
                  {idx < arr.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Confirm install dialog ── */}
      {dialog?.kind === "confirm_install" && (
        <Dialog open onOpenChange={() => setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Install {moduleDetails.name}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              All features in &ldquo;{moduleDetails.name}&rdquo; will be enabled for your school immediately.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)} disabled={isProcessing}>Cancel</Button>
              <Button
                className="bg-[#0F4C2A] hover:bg-[#1A7A4A] text-white"
                onClick={handleConfirmInstall}
                disabled={isProcessing}
              >
                <Download className="mr-2 h-4 w-4" />
                {isProcessing ? "Installing…" : "Install"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Confirm uninstall dialog ── */}
      {dialog?.kind === "confirm_uninstall" && (
        <Dialog open onOpenChange={() => setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uninstall {moduleDetails.name}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              &ldquo;{moduleDetails.name}&rdquo; will be disabled. Your data is preserved and can be re-enabled anytime.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)} disabled={isProcessing}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmUninstall} disabled={isProcessing}>
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
                &ldquo;{moduleDetails.name}&rdquo; requires a one-time payment of{" "}
                <span className="font-semibold text-foreground">
                  KES {dialog.platformPriceKes.toLocaleString()}
                </span>.
              </p>
              <div className="space-y-2">
                <Label>Payment method</Label>
                <Select value={paymentProvider} onValueChange={setPaymentProvider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                onClick={() => handleConfirmPaymentInstall(dialog.platformPriceKes)}
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
