"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type TenantSubscriptionOption = {
  tenantId: string;
  tenantName: string;
  planId: string;
};

type CurrencyRate = {
  code: string;
  rateAgainstKes: number;
};

type LineItem = {
  description: string;
  quantity: number;
  amountKes: number;
};

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function toTimestamp(dateValue?: string) {
  if (!dateValue) {
    return Date.now();
  }
  return new Date(`${dateValue}T00:00:00.000Z`).getTime();
}

const DEFAULT_PLAN_PRICE_KES: Record<string, number> = {
  free: 0,
  starter: 2999,
  standard: 7999,
  pro: 19999,
  enterprise: 49999,
};

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTenantId = searchParams.get("tenantId") ?? "";
  const { sessionToken } = useAuth();

  const subscriptions = usePlatformQuery(
    api.modules.platform.subscriptions.getAllSubscriptions,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as TenantSubscriptionOption[] | undefined;

  const currencyRates = usePlatformQuery(
    api.modules.platform.currency.getCurrencyRates,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as CurrencyRate[] | undefined;

  const createInvoice = useMutation(api.modules.platform.subscriptions.recordSubscriptionInvoice);

  const [selectedTenantId, setSelectedTenantId] = useState(preselectedTenantId);
  const [displayCurrency, setDisplayCurrency] = useState("KES");
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 14);
    return date.toISOString().split("T")[0];
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "EduMyles subscription charge", quantity: 1, amountKes: 0 },
  ]);
  const [paymentProvider, setPaymentProvider] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTenant = (subscriptions ?? []).find((tenant) => tenant.tenantId === selectedTenantId);

  const subtotalKes = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.amountKes, 0),
    [lineItems]
  );
  const vatKes = useMemo(() => Math.round(subtotalKes * 0.16), [subtotalKes]);
  const totalKes = subtotalKes + vatKes;

  const exchangeRate = useMemo(() => {
    if (displayCurrency === "KES") {
      return 1;
    }
    return (currencyRates ?? []).find((rate) => rate.code === displayCurrency)?.rateAgainstKes ?? 1;
  }, [currencyRates, displayCurrency]);

  const displayAmount = useMemo(() => {
    if (displayCurrency === "KES") {
      return totalKes;
    }
    return Math.round(totalKes * exchangeRate * 100) / 100;
  }, [displayCurrency, exchangeRate, totalKes]);

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const applySuggestedPlanPrice = (tenant: TenantSubscriptionOption | undefined) => {
    if (!tenant) {
      return;
    }
    const suggestedPrice = DEFAULT_PLAN_PRICE_KES[tenant.planId] ?? 0;
    setLineItems([
      {
        description: `${tenant.tenantName} ${tenant.planId} subscription`,
        quantity: 1,
        amountKes: suggestedPrice,
      },
    ]);
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const tenant = (subscriptions ?? []).find((option) => option.tenantId === tenantId);
    applySuggestedPlanPrice(tenant);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionToken || !selectedTenant) {
      toast.error("Select a tenant before creating the invoice.");
      return;
    }

    if (lineItems.some((item) => !item.description.trim() || item.quantity <= 0 || item.amountKes < 0)) {
      toast.error("Every line item needs a description, positive quantity, and valid KES amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createInvoice({
        sessionToken,
        tenantId: selectedTenant.tenantId,
        amountKes: subtotalKes,
        displayCurrency,
        displayAmount,
        exchangeRate,
        vatAmountKes: vatKes,
        totalAmountKes: totalKes,
        dueDate: toTimestamp(dueDate),
        paymentProvider,
        paymentReference: paymentReference || undefined,
        lineItems: [
          ...lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            amountKes: item.amountKes,
          })),
          ...(notes.trim()
            ? [
                {
                  description: `Notes: ${notes.trim()}`,
                  quantity: 1,
                  amountKes: 0,
                },
              ]
            : []),
        ],
      });
      toast.success("Invoice created.");
      router.push("/platform/billing/invoices");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionToken || subscriptions === undefined || currencyRates === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <PageHeader
          title="Create platform invoice"
          description="Generate a KES-based invoice, capture VAT, and store the display currency conversion for the tenant."
        />
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Invoice details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Tenant</Label>
              <Select value={selectedTenantId} onValueChange={handleTenantChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptions.map((tenant) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.tenantName} ({tenant.planId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Display currency</Label>
              <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">KES</SelectItem>
                  {currencyRates
                    .filter((rate) => rate.code !== "KES")
                    .map((rate) => (
                      <SelectItem key={rate.code} value={rate.code}>
                        {rate.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment provider</Label>
              <Select value={paymentProvider} onValueChange={setPaymentProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="airtel">Airtel Money</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentReference">Payment reference</Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Line items</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applySuggestedPlanPrice(selectedTenant)}
                disabled={!selectedTenant}
              >
                Use suggested plan price
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLineItems((current) => [
                    ...current,
                    { description: "", quantity: 1, amountKes: 0 },
                  ])
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-6 space-y-1">
                  {index === 0 ? <Label className="text-xs">Description</Label> : null}
                  <Input
                    value={item.description}
                    onChange={(event) => updateLineItem(index, "description", event.target.value)}
                    placeholder="Monthly subscription"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  {index === 0 ? <Label className="text-xs">Qty</Label> : null}
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => updateLineItem(index, "quantity", Number(event.target.value))}
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  {index === 0 ? <Label className="text-xs">Amount (KES)</Label> : null}
                  <Input
                    type="number"
                    min={0}
                    value={item.amountKes}
                    onChange={(event) => updateLineItem(index, "amountKes", Number(event.target.value))}
                  />
                </div>
                <div className="col-span-1">
                  {lineItems.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() =>
                        setLineItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr,320px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Internal notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Optional context for the finance team or future audit trail."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={formatKes(subtotalKes)} />
              <SummaryRow label="VAT (16%)" value={formatKes(vatKes)} />
              <SummaryRow label="Total" value={formatKes(totalKes)} strong />
              <SummaryRow
                label={`Display (${displayCurrency})`}
                value={
                  displayCurrency === "KES"
                    ? formatKes(displayAmount)
                    : new Intl.NumberFormat("en-KE", {
                        style: "currency",
                        currency: displayCurrency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      }).format(displayAmount)
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !selectedTenantId}>
            {isSubmitting ? "Creating..." : "Create invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
