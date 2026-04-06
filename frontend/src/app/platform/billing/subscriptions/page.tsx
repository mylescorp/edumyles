"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { BillingAdminRail } from "@/components/platform/BillingAdminRail";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import { CheckCircle2, CreditCard, PauseCircle, SearchX, ShieldAlert, TimerReset } from "lucide-react";

type SubscriptionRow = {
  _id: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  status: "trialing" | "active" | "past_due" | "suspended" | "cancelled";
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd?: boolean;
  nextPaymentDue?: number;
  trialEndsAt?: number;
  customPriceMonthlyKes?: number;
  customPriceAnnualKes?: number;
  customPricingNotes?: string;
  createdAt: number;
  updatedAt: number;
};

type Plan = {
  id: string;
  name: string;
  priceMonthlyKes: number;
  priceAnnualKes: number;
};

function statusClass(status: SubscriptionRow["status"]) {
  switch (status) {
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "trialing":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "past_due":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "suspended":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    case "cancelled":
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
    default:
      return "";
  }
}

function formatKes(amount?: number) {
  if (amount === undefined) return "Custom";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function daysUntil(timestamp?: number) {
  if (!timestamp) return null;
  return Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function PlatformBillingSubscriptionsPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pauseTarget, setPauseTarget] = useState<SubscriptionRow | null>(null);
  const [pauseNotes, setPauseNotes] = useState("");
  const [extendTarget, setExtendTarget] = useState<SubscriptionRow | null>(null);
  const [extendDays, setExtendDays] = useState("7");
  const [saving, setSaving] = useState(false);

  const subscriptions = usePlatformQuery(
    api.modules.platform.subscriptions.getAllSubscriptions,
    sessionToken
      ? {
          sessionToken,
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          ...(planFilter !== "all" ? { planId: planFilter } : {}),
        }
      : "skip",
    !!sessionToken
  ) as SubscriptionRow[] | undefined;

  const atRiskSubscriptions = usePlatformQuery(
    api.modules.platform.subscriptions.getSubscriptionsAtRisk,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as SubscriptionRow[] | undefined;

  const plans = usePlatformQuery(
    api.modules.platform.subscriptions.getSubscriptionPlans,
    {},
    true
  ) as Plan[] | undefined;

  const pauseSubscription = useMutation(api.modules.platform.subscriptions.pauseSubscription);
  const extendTrial = useMutation(api.modules.platform.subscriptions.extendTrial);

  const riskIds = useMemo(
    () => new Set((atRiskSubscriptions ?? []).map((subscription) => subscription.tenantId)),
    [atRiskSubscriptions]
  );

  const planMap = useMemo(
    () => new Map((plans ?? []).map((plan) => [plan.name, plan])),
    [plans]
  );

  const filteredRows = useMemo(() => {
    const rows = subscriptions ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.tenantName, row.tenantId, row.planId, row.status].join(" ").toLowerCase().includes(needle)
    );
  }, [search, subscriptions]);

  const stats = useMemo(() => {
    const rows = subscriptions ?? [];
    return {
      total: rows.length,
      active: rows.filter((row) => row.status === "active").length,
      trialing: rows.filter((row) => row.status === "trialing").length,
      atRisk: rows.filter((row) => riskIds.has(row.tenantId)).length,
      suspended: rows.filter((row) => row.status === "suspended").length,
    };
  }, [riskIds, subscriptions]);

  if (isLoading || subscriptions === undefined || atRiskSubscriptions === undefined || plans === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handlePause = async () => {
    if (!sessionToken || !pauseTarget) return;
    setSaving(true);
    try {
      await pauseSubscription({
        sessionToken,
        tenantId: pauseTarget.tenantId,
        notes: pauseNotes.trim() || undefined,
      });
      toast({ title: "Subscription paused", description: `${pauseTarget.tenantName} is now suspended.` });
      setPauseTarget(null);
      setPauseNotes("");
    } catch (error) {
      toast({
        title: "Unable to pause subscription",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!sessionToken || !extendTarget) return;
    setSaving(true);
    try {
      await extendTrial({
        sessionToken,
        tenantId: extendTarget.tenantId,
        days: Number(extendDays),
      });
      toast({ title: "Trial extended", description: `${extendTarget.tenantName} received ${extendDays} more days.` });
      setExtendTarget(null);
      setExtendDays("7");
    } catch (error) {
      toast({
        title: "Unable to extend trial",
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
        title="Subscriptions"
        description="Manage tenant subscription health, trial lifecycles, and billing risk across the platform."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Billing", href: "/platform/billing" },
          { label: "Subscriptions" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/platform/billing">Billing overview</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/platform/billing/invoices">Invoices</Link>
            </Button>
          </div>
        }
      />

      <BillingAdminRail currentHref="/platform/billing/subscriptions" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total subscriptions" value={stats.total} icon={CreditCard} />
        <MetricCard title="Active" value={stats.active} icon={CheckCircle2} />
        <MetricCard title="Trialing" value={stats.trialing} icon={TimerReset} />
        <MetricCard title="At risk" value={stats.atRisk} icon={ShieldAlert} />
        <MetricCard title="Suspended" value={stats.suspended} icon={PauseCircle} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tenant, subscription, or plan"
              className="w-full md:w-80"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="past_due">Past due</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.name}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {filteredRows.length === 0 ? (
            <EmptyState
              icon={search || statusFilter !== "all" || planFilter !== "all" ? SearchX : CreditCard}
              title={search || statusFilter !== "all" || planFilter !== "all" ? "No subscriptions match these filters" : "No subscriptions yet"}
              description="Tenant subscriptions will appear here as schools enter trial or paid billing."
            />
          ) : (
            <div className="space-y-4">
              {filteredRows.map((row) => {
                const plan = planMap.get(row.planId);
                const effectiveTrialEnd = row.trialEndsAt ?? row.currentPeriodEnd;
                const daysLeft = row.status === "trialing" ? daysUntil(effectiveTrialEnd) : null;
                const nextPaymentDue = row.nextPaymentDue ? formatDate(row.nextPaymentDue) : null;

                return (
                  <div key={row.tenantId} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{row.tenantName}</h3>
                          <Badge variant="outline" className={statusClass(row.status)}>
                            {row.status.replace(/_/g, " ")}
                          </Badge>
                          {riskIds.has(row.tenantId) ? (
                            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-700">
                              At risk
                            </Badge>
                          ) : null}
                          {row.cancelAtPeriodEnd ? (
                            <Badge variant="outline" className="border-rose-500/20 bg-rose-500/10 text-rose-700">
                              Cancels at period end
                            </Badge>
                          ) : null}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <InfoItem label="Tenant ID" value={row.tenantId} />
                          <InfoItem
                            label="Plan"
                            value={plan ? `${plan.name} · ${formatKes(row.customPriceMonthlyKes ?? plan.priceMonthlyKes)}/month` : row.planId}
                          />
                          <InfoItem label="Period end" value={formatDate(row.currentPeriodEnd)} />
                          <InfoItem
                            label={row.status === "trialing" ? "Trial ends" : "Updated"}
                            value={row.status === "trialing" ? formatDate(effectiveTrialEnd) : formatRelativeTime(row.updatedAt)}
                          />
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {daysLeft !== null ? (
                            <span>{daysLeft} day{daysLeft === 1 ? "" : "s"} left in trial</span>
                          ) : null}
                          {nextPaymentDue ? <span>Next payment due {nextPaymentDue}</span> : null}
                          {row.customPricingNotes ? <span>Custom pricing note: {row.customPricingNotes}</span> : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/platform/tenants/${row.tenantId}`}>Open tenant</Link>
                        </Button>
                        {row.status === "trialing" ? (
                          <Button size="sm" onClick={() => setExtendTarget(row)}>
                            Extend trial
                          </Button>
                        ) : null}
                        {row.status === "active" || row.status === "past_due" ? (
                          <Button size="sm" variant="outline" onClick={() => setPauseTarget(row)}>
                            Pause
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!extendTarget} onOpenChange={(open) => !open && setExtendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend tenant trial</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Additional trial days</Label>
            <Input type="number" min="1" value={extendDays} onChange={(event) => setExtendDays(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleExtendTrial} disabled={saving || Number(extendDays) <= 0}>
              Extend trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pauseTarget} onOpenChange={(open) => !open && setPauseTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              rows={4}
              value={pauseNotes}
              onChange={(event) => setPauseNotes(event.target.value)}
              placeholder="Capture why this subscription is being paused."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handlePause} disabled={saving}>
              Pause subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: typeof CreditCard;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold">{value}</p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-2">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
