"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useCurrency } from "@/hooks/useCurrency";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard, Calendar, Users, HardDrive, Briefcase, ArrowUpCircle, FileText, Download, CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { toast } from "sonner";
import Link from "next/link";

/* ---- helpers ---- */
function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active": return "default";
    case "trialing": return "secondary";
    case "past_due": return "destructive";
    case "suspended": return "destructive";
    case "cancelled": return "outline";
    default: return "outline";
  }
}

function invoiceStatusClass(status: string) {
  switch (status) {
    case "paid": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "sent": return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "draft": return "border-slate-500/20 bg-slate-500/10 text-slate-700";
    default: return "border-rose-500/20 bg-rose-500/10 text-rose-700";
  }
}

function usagePct(used: number, limit: number | undefined) {
  if (!limit || limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

/* ---- plan card ---- */
interface PlanCardProps {
  plan: any;
  isCurrent: boolean;
  onSelect: (plan: any) => void;
}

function PlanCard({ plan, isCurrent, onSelect }: PlanCardProps) {
  const { format } = useCurrency();
  return (
    <Card className={`relative flex flex-col ${isCurrent ? "border-[#0F4C2A] ring-2 ring-[#0F4C2A]/30" : "hover:border-[#1A7A4A] transition-colors"}`}>
      {isCurrent && (
        <span className="absolute -top-3 left-4 text-xs font-semibold bg-[#0F4C2A] text-white px-2 py-0.5 rounded-full">
          Current Plan
        </span>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="capitalize text-base">{plan.name}</CardTitle>
        <CardDescription className="text-sm">{plan.description ?? `${plan.name} plan for schools`}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 flex-1">
        <div>
          <span className="text-2xl font-bold">{format(plan.priceMonthlyKes)}</span>
          <span className="text-sm text-muted-foreground"> / month</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Up to {plan.maxStudents ?? "∞"} students</div>
          <div>Up to {plan.maxStaff ?? "∞"} staff</div>
          <div>{plan.storageGb ?? "—"} GB storage</div>
          {plan.includedModuleIds?.length > 0 && (
            <div>{plan.includedModuleIds.length} included modules</div>
          )}
        </div>
        <div className="mt-auto pt-2">
          {isCurrent ? (
            <Button variant="outline" disabled className="w-full">
              <CheckCircle2 className="mr-2 h-4 w-4 text-[#0F4C2A]" />
              Active Plan
            </Button>
          ) : (
            <Button
              className="w-full bg-[#0F4C2A] hover:bg-[#1A7A4A] text-white"
              onClick={() => onSelect(plan)}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Select Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---- main page ---- */
export default function BillingSettingsPage() {
  const { isLoading: authLoading } = useAuth();
  const { tenant } = useTenant();
  const { format } = useCurrency();

  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentProvider, setPaymentProvider] = useState<string>("mpesa");
  const [paymentReference, setPaymentReference] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const subscription = useQuery(api.modules.platform.subscriptions.getTenantSubscription) as any;
  const plans = useQuery(api.modules.platform.subscriptions.getSubscriptionPlans) as any[] | undefined;
  const invoices = useQuery(api.modules.platform.subscriptions.getSubscriptionInvoices, {}) as any[] | undefined;
  const usageHistory = useQuery(api.modules.platform.subscriptions.getTenantUsageStats, {}) as any[] | undefined;

  const upgradePlan = useMutation(api.modules.platform.subscriptions.upgradePlan);

  if (authLoading || subscription === undefined || plans === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const latestUsage = usageHistory?.[0] ?? null;
  const currentPlan = subscription?.plan ?? null;

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setPaymentProvider("mpesa");
    setPaymentReference("");
    setUpgradeDialogOpen(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;
    setUpgrading(true);
    try {
      await upgradePlan({
        planId: selectedPlan.name,
        paymentProvider: paymentProvider as any,
        paymentReference: paymentReference || undefined,
      });
      toast.success(`Successfully switched to ${selectedPlan.name} plan.`);
      setUpgradeDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to upgrade plan. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your school's subscription plan, usage, and invoices."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Billing" },
        ]}
      />

      {/* ── Current plan + period ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-start gap-4">
            <div className="rounded-full bg-[#0F4C2A]/10 p-3">
              <CreditCard className="h-5 w-5 text-[#0F4C2A]" />
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xl font-bold capitalize">{currentPlan?.name ?? subscription?.planId ?? tenant?.plan ?? "Free"}</p>
                <Badge variant={statusVariant(subscription?.status ?? "active")}>
                  {subscription?.status ?? "active"}
                </Badge>
              </div>
              {currentPlan && (
                <p className="text-sm text-muted-foreground">
                  {format(currentPlan.priceMonthlyKes)} / month
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-start gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Calendar className="h-5 w-5 text-[#1565C0]" />
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-sm text-muted-foreground">Billing Period</p>
              {subscription ? (
                <>
                  <p className="font-semibold text-sm">
                    {formatDate(subscription.currentPeriodStart)} – {formatDate(subscription.currentPeriodEnd)}
                  </p>
                  {subscription.nextPaymentDue && (
                    <p className="text-xs text-muted-foreground">
                      Next renewal: {formatDate(subscription.nextPaymentDue)}
                    </p>
                  )}
                  {subscription.cancelAtPeriodEnd && (
                    <Badge variant="destructive" className="text-xs mt-1">Cancels at period end</Badge>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No active subscription period.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-start gap-4">
            <div className="rounded-full bg-amber-100 p-3">
              <Briefcase className="h-5 w-5 text-[#E8A020]" />
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-sm text-muted-foreground">Payment Provider</p>
              <p className="font-semibold capitalize">
                {subscription?.paymentProvider?.replace("_", " ") ?? "—"}
              </p>
              {subscription?.paymentReference && (
                <p className="text-xs text-muted-foreground font-mono">{subscription.paymentReference}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Usage ── */}
      {(latestUsage || currentPlan) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Usage</CardTitle>
            <CardDescription>Your current resource consumption vs. plan limits</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" /> Students</span>
                <span className="font-medium">
                  {latestUsage?.studentCount ?? "—"} / {currentPlan?.maxStudents ?? "∞"}
                </span>
              </div>
              {latestUsage && currentPlan?.maxStudents && (
                <Progress
                  value={usagePct(latestUsage.studentCount, currentPlan.maxStudents)}
                  className="h-2"
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Briefcase className="h-4 w-4" /> Staff</span>
                <span className="font-medium">
                  {latestUsage?.staffCount ?? "—"} / {currentPlan?.maxStaff ?? "∞"}
                </span>
              </div>
              {latestUsage && currentPlan?.maxStaff && (
                <Progress
                  value={usagePct(latestUsage.staffCount, currentPlan.maxStaff)}
                  className="h-2"
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><HardDrive className="h-4 w-4" /> Storage</span>
                <span className="font-medium">
                  {latestUsage?.storageUsedGb?.toFixed(1) ?? "—"} GB / {currentPlan?.storageGb ?? "∞"} GB
                </span>
              </div>
              {latestUsage && currentPlan?.storageGb && (
                <Progress
                  value={usagePct(latestUsage.storageUsedGb ?? 0, currentPlan.storageGb)}
                  className="h-2"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Available plans ── */}
      {plans && plans.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan: any) => (
              <PlanCard
                key={plan.id ?? plan._id}
                plan={plan}
                isCurrent={subscription?.planId === plan.name}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Invoices ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Subscription Invoices
          </CardTitle>
          <CardDescription>Your billing history and downloadable invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {!invoices || invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No invoices found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => (
                  <TableRow key={String(invoice._id)}>
                    <TableCell className="text-sm">{formatDate(invoice.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      {invoice.lineItems?.[0]?.description ?? `Plan – ${subscription?.planId ?? "subscription"}`}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {format(invoice.totalAmountKes ?? invoice.amountKes ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={invoiceStatusClass(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/settings/billing/invoices/${String(invoice._id)}`}>
                          <Download className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Upgrade dialog ── */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan
                ? `Switch to ${selectedPlan.name.charAt(0).toUpperCase() + selectedPlan.name.slice(1)} Plan`
                : "Change Plan"}
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                <p className="font-semibold capitalize">{selectedPlan.name}</p>
                <p className="text-sm text-muted-foreground">{format(selectedPlan.priceMonthlyKes)} / month</p>
                {selectedPlan.maxStudents && (
                  <p className="text-xs text-muted-foreground">Up to {selectedPlan.maxStudents} students</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
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
                <Label>Payment Reference <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <input
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="e.g. MPESA transaction ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                By confirming, your plan will be updated immediately. Contact support if you need a prorated refund.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#0F4C2A] hover:bg-[#1A7A4A] text-white"
              onClick={handleConfirmUpgrade}
              disabled={upgrading || !selectedPlan}
            >
              {upgrading ? "Processing..." : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
