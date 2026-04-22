"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useCurrency } from "@/hooks/useCurrency";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";
import { ArrowDownCircle, ArrowUpCircle, Briefcase, Calendar, CheckCircle2, CreditCard, Download, FileText, HardDrive, MailPlus, Receipt, Users, XCircle } from "lucide-react";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "trialing":
      return "secondary";
    case "past_due":
    case "suspended":
      return "destructive";
    case "cancelled":
      return "outline";
    default:
      return "outline";
  }
}

function invoiceStatusClass(status: string) {
  switch (status) {
    case "paid":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "sent":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "draft":
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
    default:
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
  }
}

function usagePct(used: number, limit: number | undefined) {
  if (!limit || limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function ActionCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{action}</CardContent>
    </Card>
  );
}

function PlanCard({
  plan,
  isCurrent,
  actionLabel,
  onSelect,
}: {
  plan: any;
  isCurrent: boolean;
  actionLabel: string;
  onSelect: (plan: any) => void;
}) {
  const { format } = useCurrency();

  return (
    <Card className={isCurrent ? "border-[#0F4C2A] ring-2 ring-[#0F4C2A]/20" : "hover:border-[#1A7A4A]"}>
      <CardHeader className="pb-2">
        <CardTitle className="capitalize">{plan.name}</CardTitle>
        <CardDescription>{plan.description ?? `${plan.name} plan for schools`}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-2xl font-bold">{format(plan.priceMonthlyKes)}</span>
          <span className="text-sm text-muted-foreground"> / month</span>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>Up to {plan.maxStudents ?? "∞"} students</div>
          <div>Up to {plan.maxStaff ?? "∞"} staff</div>
          <div>{plan.storageGb ?? "—"} GB storage</div>
          <div>{plan.includedModuleIds?.length ?? 0} included modules</div>
        </div>
        {isCurrent ? (
          <Button variant="outline" disabled className="w-full">
            <CheckCircle2 className="mr-2 h-4 w-4 text-[#0F4C2A]" />
            Active Plan
          </Button>
        ) : (
          <Button className="w-full bg-[#0F4C2A] text-white hover:bg-[#1A7A4A]" onClick={() => onSelect(plan)}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function BillingSettingsPage() {
  const { isLoading: authLoading, isAuthenticated, sessionToken } = useAuth();
  const { tenant } = useTenant();
  const { format } = useCurrency();
  const hasLiveTenantSession = !!sessionToken && sessionToken !== "dev_session_token";
  const canQueryBilling = !authLoading && isAuthenticated && hasLiveTenantSession;

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [enterpriseDialogOpen, setEnterpriseDialogOpen] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState("mpesa");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [paymentReference, setPaymentReference] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [enterprisePhone, setEnterprisePhone] = useState(tenant?.phone ?? "");
  const [enterpriseTimeline, setEnterpriseTimeline] = useState("this_term");
  const [enterpriseNotes, setEnterpriseNotes] = useState("");
  const [processingAction, setProcessingAction] = useState<"upgrade" | "downgrade" | "cancel" | "enterprise" | null>(null);

  const subscriptionResult = useQuery(api.modules.platform.subscriptions.getTenantSubscription, sessionToken ? { sessionToken } : "skip", canQueryBilling);
  const plansResult = useQuery(api.modules.platform.subscriptions.getSubscriptionPlans, {}, true);
  const invoicesResult = useQuery(api.modules.platform.subscriptions.getSubscriptionInvoices, sessionToken ? { sessionToken } : "skip", canQueryBilling);
  const usageHistoryResult = useQuery(api.modules.platform.subscriptions.getTenantUsageStats, sessionToken ? { sessionToken } : "skip", canQueryBilling);
  
  const subscription = subscriptionResult?.data;
  const plans = plansResult?.data;
  const invoices = invoicesResult?.data;
  const usageHistory = usageHistoryResult?.data;
  const downgradePreview = useQuery(
    api.modules.platform.subscriptions.previewDowngradePlan,
    downgradeDialogOpen && selectedPlan ? { planId: selectedPlan.name } : "skip",
    downgradeDialogOpen && !!selectedPlan
  ) as { modulesToSuspend: { moduleId: string; name: string; category: string }[] } | undefined;

  const upgradePlan = useMutation(api.modules.platform.subscriptions.upgradePlan);
  const downgradePlan = useMutation(api.modules.platform.subscriptions.downgradePlan);
  const cancelSubscription = useMutation(api.modules.platform.subscriptions.cancelSubscription);
  const requestEnterpriseConsultation = useMutation(api.modules.platform.crm.requestEnterpriseConsultation);

  const latestInvoices = useMemo(() => [...(invoices ?? [])].sort((a, b) => b.createdAt - a.createdAt), [invoices]);

  if (authLoading || plans === undefined || (canQueryBilling && (subscription === undefined || invoices === undefined || usageHistory === undefined))) {
    return <LoadingSkeleton variant="page" />;
  }

  const currentPlan = subscription?.plan ?? null;
  const latestUsage = usageHistory?.[0] ?? null;
  const currentPriceKes = subscription?.customPriceMonthlyKes ?? currentPlan?.priceMonthlyKes ?? 0;
  const sortedPlans = [...(plans ?? [])].sort((a, b) => a.priceMonthlyKes - b.priceMonthlyKes);
  const currentPlanIndex = sortedPlans.findIndex((plan) => plan.name === subscription?.planId);

  const openUpgradeDialog = (plan: any) => {
    setSelectedPlan(plan);
    setPaymentProvider("mpesa");
    setBillingPeriod("monthly");
    setPaymentReference("");
    setUpgradeDialogOpen(true);
  };

  const openDowngradeDialog = (plan: any) => {
    setSelectedPlan(plan);
    setDowngradeDialogOpen(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;
    setProcessingAction("upgrade");
    try {
      await upgradePlan({
        planId: selectedPlan.name,
        paymentProvider: paymentProvider as any,
        paymentReference: paymentReference || undefined,
      });
      toast.success(`Successfully switched to ${selectedPlan.name} plan.`);
      setUpgradeDialogOpen(false);
      setSelectedPlan(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to upgrade plan.");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedPlan) return;
    setProcessingAction("downgrade");
    try {
      const result = await downgradePlan({ planId: selectedPlan.name });
      toast.success(
        result.modulesToSuspend.length > 0
          ? `Plan changed. ${result.modulesToSuspend.length} module(s) need follow-up.`
          : `Successfully switched to ${selectedPlan.name} plan.`
      );
      setDowngradeDialogOpen(false);
      setSelectedPlan(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to downgrade plan.");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason.");
      return;
    }
    setProcessingAction("cancel");
    try {
      await cancelSubscription({ reason: cancelReason.trim() });
      toast.success("Subscription cancellation recorded.");
      setCancelDialogOpen(false);
      setCancelReason("");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to cancel subscription.");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRequestEnterprise = async () => {
    if (!enterpriseNotes.trim()) {
      toast.error("Please share your enterprise needs first.");
      return;
    }
    setProcessingAction("enterprise");
    try {
      await requestEnterpriseConsultation({
        notes: enterpriseNotes.trim(),
        phone: enterprisePhone.trim() || undefined,
        timeline: enterpriseTimeline,
      });
      toast.success("Enterprise request sent.");
      setEnterpriseDialogOpen(false);
      setEnterpriseNotes("");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to submit enterprise request.");
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your school's plan, usage, invoices, downgrade impact, and enterprise requests."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Billing" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card><CardContent className="flex items-start gap-4 pt-6"><div className="rounded-full bg-[#0F4C2A]/10 p-3"><CreditCard className="h-5 w-5 text-[#0F4C2A]" /></div><div className="space-y-1"><p className="text-sm text-muted-foreground">Current Plan</p><div className="flex flex-wrap items-center gap-2"><p className="text-xl font-bold capitalize">{currentPlan?.name ?? subscription?.planId ?? tenant?.plan ?? "free"}</p><Badge variant={statusVariant(subscription?.status ?? "active")}>{subscription?.status ?? "active"}</Badge></div><p className="text-sm text-muted-foreground">{format(currentPriceKes)} / month</p></div></CardContent></Card>
        <Card><CardContent className="flex items-start gap-4 pt-6"><div className="rounded-full bg-blue-100 p-3"><Calendar className="h-5 w-5 text-[#1565C0]" /></div><div className="space-y-1"><p className="text-sm text-muted-foreground">Billing Period</p>{subscription ? <><p className="font-semibold text-sm">{formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}</p>{subscription.nextPaymentDue && <p className="text-xs text-muted-foreground">Next renewal: {formatDate(subscription.nextPaymentDue)}</p>}{subscription.cancelAtPeriodEnd && <Badge variant="destructive" className="mt-1 text-xs">Cancels at period end</Badge>}</> : <p className="text-sm text-muted-foreground">No active subscription.</p>}</div></CardContent></Card>
        <Card><CardContent className="flex items-start gap-4 pt-6"><div className="rounded-full bg-amber-100 p-3"><Receipt className="h-5 w-5 text-[#E8A020]" /></div><div className="space-y-1"><p className="text-sm text-muted-foreground">Payment Provider</p><p className="font-semibold capitalize">{subscription?.paymentProvider?.replace("_", " ") ?? "—"}</p>{subscription?.paymentReference && <p className="font-mono text-xs text-muted-foreground">{subscription.paymentReference}</p>}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ActionCard
          title="Upgrade Plan"
          description="Move to a higher tier with more bundled modules and capacity."
          action={
            sortedPlans.filter((_, index) => index > currentPlanIndex).length === 0 ? (
              <p className="text-sm text-muted-foreground">You are already on the highest active tier.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortedPlans.filter((_, index) => index > currentPlanIndex).map((plan) => (
                  <Button key={plan._id} className="bg-[#0F4C2A] text-white hover:bg-[#1A7A4A]" onClick={() => openUpgradeDialog(plan)}>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    {plan.name}
                  </Button>
                ))}
              </div>
            )
          }
        />
        <ActionCard
          title="Downgrade Plan"
          description="Preview which installed modules may be suspended before switching."
          action={
            sortedPlans.filter((_, index) => index >= 0 && index < currentPlanIndex).length === 0 ? (
              <p className="text-sm text-muted-foreground">No lower plans are available for your current subscription.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortedPlans.filter((_, index) => index >= 0 && index < currentPlanIndex).map((plan) => (
                  <Button key={plan._id} variant="outline" onClick={() => openDowngradeDialog(plan)}>
                    <ArrowDownCircle className="mr-2 h-4 w-4" />
                    {plan.name}
                  </Button>
                ))}
              </div>
            )
          }
        />
        <ActionCard
          title="Enterprise & Cancellation"
          description="Escalate for enterprise pricing or cancel with a recorded reason."
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setEnterpriseDialogOpen(true)}>
                <MailPlus className="mr-2 h-4 w-4" />
                Enterprise Quote
              </Button>
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setCancelDialogOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Subscription
              </Button>
            </div>
          }
        />
      </div>

      {(latestUsage || currentPlan) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Usage</CardTitle>
            <CardDescription>Your current resource consumption vs. plan limits.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2"><div className="flex items-center justify-between text-sm"><span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" />Students</span><span className="font-medium">{latestUsage?.studentCount ?? "—"} / {currentPlan?.maxStudents ?? "∞"}</span></div>{latestUsage && currentPlan?.maxStudents ? <Progress value={usagePct(latestUsage.studentCount, currentPlan.maxStudents)} className="h-2" /> : null}</div>
            <div className="space-y-2"><div className="flex items-center justify-between text-sm"><span className="flex items-center gap-1.5 text-muted-foreground"><Briefcase className="h-4 w-4" />Staff</span><span className="font-medium">{latestUsage?.staffCount ?? "—"} / {currentPlan?.maxStaff ?? "∞"}</span></div>{latestUsage && currentPlan?.maxStaff ? <Progress value={usagePct(latestUsage.staffCount, currentPlan.maxStaff)} className="h-2" /> : null}</div>
            <div className="space-y-2"><div className="flex items-center justify-between text-sm"><span className="flex items-center gap-1.5 text-muted-foreground"><HardDrive className="h-4 w-4" />Storage</span><span className="font-medium">{latestUsage?.storageUsedGb?.toFixed(1) ?? "—"} GB / {currentPlan?.storageGb ?? "∞"} GB</span></div>{latestUsage && currentPlan?.storageGb ? <Progress value={usagePct(latestUsage.storageUsedGb ?? 0, currentPlan.storageGb)} className="h-2" /> : null}</div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div><h2 className="text-lg font-semibold">Available Plans</h2><p className="text-sm text-muted-foreground">Compare current pricing in KES and switch plans when your school grows.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sortedPlans.map((plan, index) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              isCurrent={subscription?.planId === plan.name}
              actionLabel={index > currentPlanIndex ? "Upgrade to this plan" : "Downgrade to this plan"}
              onSelect={index > currentPlanIndex ? openUpgradeDialog : openDowngradeDialog}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />Subscription Invoices</CardTitle>
          <CardDescription>Your billing history and invoice detail records.</CardDescription>
        </CardHeader>
        <CardContent>
          {latestInvoices.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices yet" description="Invoices will appear here after plan changes and billing cycles." />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Invoice</TableHead></TableRow></TableHeader>
              <TableBody>
                {latestInvoices.map((invoice) => (
                  <TableRow key={String(invoice._id)}>
                    <TableCell className="text-sm">{formatDate(invoice.createdAt)}</TableCell>
                    <TableCell className="text-sm">{invoice.lineItems?.[0]?.description ?? `Plan - ${subscription?.planId ?? "subscription"}`}</TableCell>
                    <TableCell className="text-sm font-medium">{format(invoice.totalAmountKes ?? invoice.amountKes ?? 0)}</TableCell>
                    <TableCell><Badge variant="outline" className={invoiceStatusClass(invoice.status)}>{invoice.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/settings/billing/invoices/${String(invoice._id)}`}><Download className="mr-1 h-4 w-4" />View</Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedPlan ? `Upgrade to ${selectedPlan.name}` : "Upgrade Plan"}</DialogTitle><DialogDescription>Confirm your new tier and choose the payment provider.</DialogDescription></DialogHeader>
          {selectedPlan ? <div className="space-y-4"><div className="rounded-lg border bg-muted/30 p-4"><p className="font-semibold capitalize">{selectedPlan.name}</p><p className="text-sm text-muted-foreground">{format(selectedPlan.priceMonthlyKes)} / month</p></div><div className="space-y-2"><Label>Payment Method</Label><Select value={paymentProvider} onValueChange={setPaymentProvider}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mpesa">M-Pesa</SelectItem><SelectItem value="airtel">Airtel Money</SelectItem><SelectItem value="stripe">Card (Stripe)</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Payment Reference</Label><Input placeholder="Optional transaction ID" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} /></div></div> : null}
          <DialogFooter><Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>Cancel</Button><Button className="bg-[#0F4C2A] text-white hover:bg-[#1A7A4A]" onClick={handleConfirmUpgrade} disabled={processingAction === "upgrade" || !selectedPlan}>{processingAction === "upgrade" ? "Processing..." : "Confirm Upgrade"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={downgradeDialogOpen} onOpenChange={setDowngradeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedPlan ? `Downgrade to ${selectedPlan.name}` : "Downgrade Plan"}</DialogTitle><DialogDescription>Review which installed modules may lose access before switching.</DialogDescription></DialogHeader>
          {selectedPlan ? <div className="space-y-4"><div className="rounded-lg border bg-muted/30 p-4"><p className="font-semibold capitalize">{selectedPlan.name}</p><p className="text-sm text-muted-foreground">New monthly price: {format(selectedPlan.priceMonthlyKes)}</p></div>{downgradeDialogOpen && downgradePreview === undefined ? <LoadingSkeleton variant="card" /> : downgradePreview && downgradePreview.modulesToSuspend.length > 0 ? <div className="space-y-3"><p className="text-sm font-medium">Modules affected by this downgrade</p><div className="space-y-2 rounded-lg border p-3">{downgradePreview.modulesToSuspend.map((module) => <div key={module.moduleId} className="flex items-center justify-between text-sm"><span className="font-medium">{module.name}</span><Badge variant="outline" className="capitalize">{module.category}</Badge></div>)}</div></div> : <p className="text-sm text-muted-foreground">No installed modules are expected to lose access on this lower tier.</p>}</div> : null}
          <DialogFooter><Button variant="outline" onClick={() => setDowngradeDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleConfirmDowngrade} disabled={processingAction === "downgrade" || !selectedPlan}>{processingAction === "downgrade" ? "Updating..." : "Confirm Downgrade"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cancel Subscription</DialogTitle><DialogDescription>Tell us why you are leaving. This is recorded against your billing history.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label>Reason</Label><Textarea rows={4} placeholder="Why are you cancelling?" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Keep Subscription</Button><Button variant="destructive" onClick={handleConfirmCancel} disabled={processingAction === "cancel"}>{processingAction === "cancel" ? "Cancelling..." : "Confirm Cancellation"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={enterpriseDialogOpen} onOpenChange={setEnterpriseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Request Enterprise Consultation</DialogTitle><DialogDescription>Send your requirements to the EduMyles team and create a CRM follow-up.</DialogDescription></DialogHeader>
          <div className="space-y-4"><div className="space-y-2"><Label>Contact phone</Label><Input value={enterprisePhone} onChange={(event) => setEnterprisePhone(event.target.value)} placeholder="+254..." /></div><div className="space-y-2"><Label>Decision timeline</Label><Select value={enterpriseTimeline} onValueChange={setEnterpriseTimeline}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="this_week">This week</SelectItem><SelectItem value="this_month">This month</SelectItem><SelectItem value="this_term">This term</SelectItem><SelectItem value="next_term">Next term</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>What do you need?</Label><Textarea rows={5} value={enterpriseNotes} onChange={(event) => setEnterpriseNotes(event.target.value)} placeholder="Tell us about student volume, rollout scope, required modules, or custom pricing needs." /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setEnterpriseDialogOpen(false)}>Close</Button><Button className="bg-[#0F4C2A] text-white hover:bg-[#1A7A4A]" onClick={handleRequestEnterprise} disabled={processingAction === "enterprise"}>{processingAction === "enterprise" ? "Sending..." : "Send Request"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cancel Subscription</DialogTitle><DialogDescription>Tell us why you are leaving. This is recorded against your billing history.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label>Reason</Label><Textarea rows={4} placeholder="Why are you cancelling?" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Keep Subscription</Button><Button variant="destructive" onClick={handleConfirmCancel} disabled={processingAction === "cancel"}>{processingAction === "cancel" ? "Cancelling..." : "Confirm Cancellation"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={enterpriseDialogOpen} onOpenChange={setEnterpriseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Request Enterprise Consultation</DialogTitle><DialogDescription>Send your requirements to the EduMyles team and create a CRM follow-up.</DialogDescription></DialogHeader>
          <div className="space-y-4"><div className="space-y-2"><Label>Contact phone</Label><Input value={enterprisePhone} onChange={(event) => setEnterprisePhone(event.target.value)} placeholder="+254..." /></div><div className="space-y-2"><Label>Decision timeline</Label><Select value={enterpriseTimeline} onValueChange={setEnterpriseTimeline}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="this_week">This week</SelectItem><SelectItem value="this_month">This month</SelectItem><SelectItem value="this_term">This term</SelectItem><SelectItem value="next_term">Next term</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>What do you need?</Label><Textarea rows={5} value={enterpriseNotes} onChange={(event) => setEnterpriseNotes(event.target.value)} placeholder="Tell us about student volume, rollout scope, required modules, or custom pricing needs." /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setEnterpriseDialogOpen(false)}>Close</Button><Button className="bg-[#0F4C2A] text-white hover:bg-[#1A7A4A]" onClick={handleRequestEnterprise} disabled={processingAction === "enterprise"}>{processingAction === "enterprise" ? "Sending..." : "Send Request"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
