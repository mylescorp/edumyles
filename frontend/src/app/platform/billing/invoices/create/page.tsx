"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { toast } from "sonner";

interface LineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

type Subscription = {
  tenantId: string;
  name: string;
  plan: string;
};

const PLAN_PRICE_CENTS: Record<string, number> = {
  starter: 2999,
  standard: 7999,
  pro: 19999,
  enterprise: 49999,
};

function toTimestamp(dateValue: string | undefined): number {
  if (!dateValue) {
    return Date.now();
  }
  return new Date(dateValue).getTime();
}

function formatKes(amountCents: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTenantId = searchParams.get("tenantId") ?? "";
  const { sessionToken } = useAuth();

  const createInvoice = useMutation(api.platform.billing.mutations.createInvoice);
  const tenants = usePlatformQuery(
    api.platform.billing.queries.listSubscriptions,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const [selectedTenantId, setSelectedTenantId] = useState(preselectedTenantId);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  });
  const [periodStart, setPeriodStart] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0);
    return date.toISOString().split("T")[0];
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "Platform subscription", quantity: 1, unitPriceCents: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tenantOptions = (tenants ?? []) as Subscription[];
  const selectedTenant = tenantOptions.find((tenant) => tenant.tenantId === selectedTenantId);

  const totalCents = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0),
    [lineItems]
  );

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((previous) =>
      previous.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const applySuggestedSubscriptionLine = (tenant: Subscription | undefined) => {
    if (!tenant) return;
    const suggestedPrice = PLAN_PRICE_CENTS[tenant.plan] ?? 0;
    setLineItems([
      {
        description: `${tenant.name} ${tenant.plan === "standard" ? "growth" : tenant.plan} subscription`,
        quantity: 1,
        unitPriceCents: suggestedPrice,
      },
    ]);
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const tenant = tenantOptions.find((option) => option.tenantId === tenantId);
    applySuggestedSubscriptionLine(tenant);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionToken || !selectedTenant || lineItems.length === 0) {
      toast.error("Select a tenant and add at least one line item.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createInvoice({
        sessionToken,
        tenantId: selectedTenant.tenantId,
        tenantName: selectedTenant.name,
        plan: selectedTenant.plan,
        amountCents: totalCents,
        billingPeriodStart: toTimestamp(periodStart),
        billingPeriodEnd: toTimestamp(periodEnd),
        dueDate: toTimestamp(dueDate),
        lineItems: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalCents: item.quantity * item.unitPriceCents,
        })),
        notes: notes || undefined,
      });
      toast.success("Invoice created.");
      router.push("/platform/billing/invoices");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionToken || tenants === undefined) {
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
          title="Create Platform Invoice"
          description="Generate a billing invoice for a tenant using the platform billing ledger."
        />
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tenant *</Label>
              <Select value={selectedTenantId} onValueChange={handleTenantChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenantOptions.map((tenant) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.name} ({tenant.plan === "standard" ? "growth" : tenant.plan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start *</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={periodStart}
                  onChange={(event) => setPeriodStart(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End *</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={periodEnd}
                  onChange={(event) => setPeriodEnd(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applySuggestedSubscriptionLine(selectedTenant)}
                disabled={!selectedTenant}
              >
                Use Suggested Plan Price
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLineItems((previous) => [
                    ...previous,
                    { description: "", quantity: 1, unitPriceCents: 0 },
                  ])
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-6 space-y-1">
                  {index === 0 && <Label className="text-xs">Description</Label>}
                  <Input
                    value={item.description}
                    onChange={(event) => updateLineItem(index, "description", event.target.value)}
                    placeholder="e.g. Monthly subscription"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  {index === 0 && <Label className="text-xs">Qty</Label>}
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => updateLineItem(index, "quantity", Number(event.target.value))}
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  {index === 0 && <Label className="text-xs">Unit Price (cents)</Label>}
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPriceCents}
                    onChange={(event) =>
                      updateLineItem(index, "unitPriceCents", Number(event.target.value))
                    }
                  />
                </div>
                <div className="col-span-1">
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() =>
                        setLineItems((previous) => previous.filter((_, currentIndex) => currentIndex !== index))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-end border-t pt-2">
              <p className="text-sm font-medium">Total: {formatKes(totalCents)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !selectedTenantId}>
            {isSubmitting ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
