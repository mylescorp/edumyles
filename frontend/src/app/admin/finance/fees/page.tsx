"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { formatCurrency } from "@/lib/formatters";
import { Plus } from "lucide-react";
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
import { toast } from "sonner";
import { createFeeStructureSchema } from "@shared/validators";
import type { FeeStructure } from "@shared/types";

const frequencyOptions = [
    { value: "one_time", label: "One Time" },
    { value: "monthly", label: "Monthly" },
    { value: "termly", label: "Termly" },
    { value: "yearly", label: "Yearly" },
] as const;

export default function FeeStructuresPage() {
    const { isLoading, sessionToken } = useAuth();
    const createFeeStructure = useMutation(api.modules.finance.mutations.createFeeStructure);
    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: "",
        amount: "",
        academicYear: "",
        grade: "",
        frequency: "termly",
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const feeStructures = useQuery(
        api.modules.finance.queries.listFeeStructures,
        sessionToken ? { sessionToken } : "skip"
    );

    const updateField = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const resetForm = () => {
        setForm({
            name: "",
            amount: "",
            academicYear: "",
            grade: "",
            frequency: "termly",
        });
        setFormErrors({});
    };

    const handleCreate = async () => {
        const parsed = createFeeStructureSchema.safeParse({
            name: form.name.trim(),
            amount: Number(form.amount),
            academicYear: form.academicYear.trim(),
            grade: form.grade.trim(),
            frequency: form.frequency,
        });

        if (!parsed.success) {
            const nextErrors = parsed.error.flatten().fieldErrors;
            setFormErrors({
                name: nextErrors.name?.[0] ?? "",
                amount: nextErrors.amount?.[0] ?? "",
                academicYear: nextErrors.academicYear?.[0] ?? "",
                grade: nextErrors.grade?.[0] ?? "",
                frequency: nextErrors.frequency?.[0] ?? "",
            });
            return;
        }

        setSubmitting(true);
        try {
            await createFeeStructure(parsed.data);
            toast.success("Fee structure created successfully.");
            resetForm();
            setIsCreating(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create fee structure.");
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<FeeStructure>[] = [
        {
            key: "name",
            header: "Fee Name",
            sortable: true,
            cell: (row: FeeStructure) => row.name,
        },
        {
            key: "amount",
            header: "Amount",
            cell: (row: FeeStructure) => formatCurrency(row.amount),
            sortable: true,
        },
        {
            key: "grade",
            header: "Target Grade",
            sortable: true,
            cell: (row: FeeStructure) => row.grade,
        },
        {
            key: "academicYear",
            header: "Academic Year",
            sortable: true,
            cell: (row: FeeStructure) => row.academicYear,
        },
        {
            key: "frequency",
            header: "Frequency",
            cell: (row: FeeStructure) =>
                row.frequency.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Fee Structures"
                description="Manage academic year fee structures"
                actions={
                    <Button className="gap-2" onClick={() => setIsCreating((prev) => !prev)}>
                        <Plus className="h-4 w-4" />
                        {isCreating ? "Close Form" : "Add Fee Structure"}
                    </Button>
                }
            />

            {isCreating && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Create Fee Structure</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fee-name">Fee Name</Label>
                            <Input
                                id="fee-name"
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                placeholder="Tuition Fee"
                            />
                            {formErrors.name ? <p className="text-sm text-destructive">{formErrors.name}</p> : null}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fee-amount">Amount</Label>
                            <Input
                                id="fee-amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.amount}
                                onChange={(e) => updateField("amount", e.target.value)}
                                placeholder="15000"
                            />
                            {formErrors.amount ? <p className="text-sm text-destructive">{formErrors.amount}</p> : null}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fee-year">Academic Year</Label>
                            <Input
                                id="fee-year"
                                value={form.academicYear}
                                onChange={(e) => updateField("academicYear", e.target.value)}
                                placeholder="2026"
                            />
                            {formErrors.academicYear ? <p className="text-sm text-destructive">{formErrors.academicYear}</p> : null}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fee-grade">Target Grade</Label>
                            <Input
                                id="fee-grade"
                                value={form.grade}
                                onChange={(e) => updateField("grade", e.target.value)}
                                placeholder="Grade 6"
                            />
                            {formErrors.grade ? <p className="text-sm text-destructive">{formErrors.grade}</p> : null}
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="fee-frequency">Frequency</Label>
                            <Select value={form.frequency} onValueChange={(value) => updateField("frequency", value)}>
                                <SelectTrigger id="fee-frequency">
                                    <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {frequencyOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formErrors.frequency ? <p className="text-sm text-destructive">{formErrors.frequency}</p> : null}
                        </div>
                        <div className="sm:col-span-2 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    resetForm();
                                    setIsCreating(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleCreate} disabled={submitting}>
                                {submitting ? "Creating..." : "Create Fee Structure"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <DataTable
                data={(feeStructures as FeeStructure[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search fee structures"
                emptyTitle="No fee structures found"
                emptyDescription="Create your first fee structure to start generating invoices."
            />
        </div>
    );
}
