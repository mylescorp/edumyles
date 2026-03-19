"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { api } from "@/convex/_generated/api";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { sessionToken } = useAuth();

  const students = usePlatformQuery(
    api.modules.sis.queries.listStudents,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );

  const generateInvoice = useMutation(api.modules.finance.mutations.generateInvoice);

  const [studentId, setStudentId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [feeStructureId, setFeeStructureId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addLineItem = () =>
    setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);

  const removeLineItem = (index: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== index));

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) =>
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );

  const total = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken || !studentId || !dueDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      await generateInvoice({
        studentId,
        feeStructureId,
        dueDate,
        issuedAt: new Date().toISOString(),
      });
      toast.success("Invoice created successfully.");
      router.push("/admin/finance/invoices");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Invoice"
        description="Generate a new fee invoice for a student"
        actions={
          <Link href="/admin/finance/invoices">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Invoices
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger id="student">
                    <SelectValue placeholder="Select student…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(students as any[] | undefined)?.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes for this invoice…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5 space-y-1">
                  {index === 0 && <Label>Description</Label>}
                  <Input
                    placeholder="e.g. Tuition Fee"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  {index === 0 && <Label>Qty</Label>}
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  {index === 0 && <Label>Unit Price (KES)</Label>}
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, "unitPrice", Number(e.target.value))}
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  {index === 0 && <Label>Total</Label>}
                  <p className="text-sm font-medium py-2">
                    {(item.quantity * item.unitPrice).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-1">
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">KES {total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/admin/finance/invoices">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
