"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { FeeStructure, Student } from "@shared/types";
import { generateInvoiceSchema } from "@shared/validators";
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
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { formatCurrency } from "@/lib/formatters";

export default function CreateInvoicePage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const generateInvoice = useMutation(api.modules.finance.mutations.generateInvoice);

  const students = useQuery(
    api.modules.sis.queries.listStudents,
    sessionToken ? { sessionToken } : "skip"
  );
  const feeStructures = useQuery(
    api.modules.finance.queries.listFeeStructures,
    sessionToken ? { sessionToken } : "skip"
  );

  const [form, setForm] = useState({
    studentId: "",
    feeStructureId: "",
    dueDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFeeStructure = useMemo(
    () =>
      ((feeStructures as FeeStructure[] | undefined) ?? []).find(
        (feeStructure) => feeStructure._id === form.feeStructureId
      ) ?? null,
    [feeStructures, form.feeStructureId]
  );

  const selectedStudent = useMemo(
    () =>
      ((students as Student[] | undefined) ?? []).find(
        (student) => student._id === form.studentId
      ) ?? null,
    [students, form.studentId]
  );

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = generateInvoiceSchema.safeParse({
      studentId: form.studentId,
      feeStructureId: form.feeStructureId,
      dueDate: form.dueDate,
      issuedAt: new Date().toISOString(),
    });

    if (!parsed.success) {
      const nextErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        studentId: nextErrors.studentId?.[0] ?? "",
        feeStructureId: nextErrors.feeStructureId?.[0] ?? "",
        dueDate: nextErrors.dueDate?.[0] ?? "",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await generateInvoice(parsed.data);
      toast.success("Invoice created successfully.");
      router.push("/admin/finance/invoices");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Invoice"
        description="Generate a real invoice from an existing fee structure"
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
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="student">Student</Label>
              <Select value={form.studentId} onValueChange={(value) => updateField("studentId", value)}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {((students as Student[] | undefined) ?? []).map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.studentId ? <p className="text-sm text-destructive">{errors.studentId}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feeStructure">Fee Structure</Label>
              <Select
                value={form.feeStructureId}
                onValueChange={(value) => updateField("feeStructureId", value)}
              >
                <SelectTrigger id="feeStructure">
                  <SelectValue placeholder="Select fee structure" />
                </SelectTrigger>
                <SelectContent>
                  {((feeStructures as FeeStructure[] | undefined) ?? []).map((feeStructure) => (
                    <SelectItem key={feeStructure._id} value={feeStructure._id}>
                      {feeStructure.name} - {feeStructure.grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.feeStructureId ? <p className="text-sm text-destructive">{errors.feeStructureId}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(event) => updateField("dueDate", event.target.value)}
              />
              {errors.dueDate ? <p className="text-sm text-destructive">{errors.dueDate}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Student</span>
              <span>
                {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : "Select a student"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fee Structure</span>
              <span>{selectedFeeStructure?.name ?? "Select a fee structure"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Academic Year</span>
              <span>{selectedFeeStructure?.academicYear ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Target Grade</span>
              <span>{selectedFeeStructure?.grade ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
              <span>Total Amount</span>
              <span>{selectedFeeStructure ? formatCurrency(selectedFeeStructure.amount) : "—"}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/admin/finance/invoices">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
