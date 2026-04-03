"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/formatters";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/ui/use-toast";

type PayrollRun = {
    _id: Id<"payrollRuns">;
    periodLabel: string;
    startDate: string;
    endDate: string;
    status: string;
    createdAt: number;
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    pending: "secondary",
    approved: "default",
    completed: "default",
    cancelled: "destructive",
};

export default function PayrollPage() {
    const { isLoading, sessionToken } = useAuth();
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        periodLabel: "",
        startDate: "",
        endDate: "",
    });

    const payrollRuns = useQuery(
        api.modules.hr.queries.listPayrollRuns,
        sessionToken ? { sessionToken } : "skip"
    );

    const createPayrollRun = useMutation(api.modules.hr.mutations.createPayrollRun);
    const approvePayrollRun = useMutation(api.modules.hr.mutations.approvePayrollRun);

    const handleCreate = async () => {
        if (!form.periodLabel || !form.startDate || !form.endDate) return;
        setSubmitting(true);
        try {
            await createPayrollRun({
                periodLabel: form.periodLabel.trim(),
                startDate: form.startDate,
                endDate: form.endDate,
            });
            toast({
                title: "Payroll run created",
                description: `${form.periodLabel} is ready for review.`,
            });
            setIsCreateOpen(false);
            setForm({ periodLabel: "", startDate: "", endDate: "" });
        } catch (error) {
            toast({
                title: "Unable to create payroll run",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (payrollRunId: Id<"payrollRuns">) => {
        try {
            await approvePayrollRun({ payrollRunId });
            toast({
                title: "Payroll run approved",
                description: "The payroll run is now ready for downstream processing.",
            });
        } catch (error) {
            toast({
                title: "Unable to approve payroll run",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<PayrollRun>[] = [
        {
            key: "periodLabel",
            header: "Period",
            sortable: true,
            cell: (row: PayrollRun) => row.periodLabel,
        },
        {
            key: "dates",
            header: "Dates",
            cell: (row) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => (
                <Badge variant={statusColors[row.status] ?? "outline"}>
                    {row.status}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Created",
            cell: (row) => formatDate(row.createdAt),
            sortable: true,
        },
        {
            key: "actions",
            header: "",
            cell: (row) => ["draft", "pending"].includes(row.status) ? (
                <Button size="sm" onClick={() => handleApprove(row._id)}>
                    Approve
                </Button>
            ) : (
                <span className="text-sm text-muted-foreground">Locked</span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Payroll Runs"
                description="Manage monthly staff payroll"
                actions={
                    <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4" />
                        New Payroll Run
                    </Button>
                }
            />

            <DataTable
                data={(payrollRuns as PayrollRun[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search periods..."
                emptyTitle="No payroll runs found"
                emptyDescription="Start your first payroll run to process staff salaries."
            />

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Payroll Run</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="periodLabel">Period label</Label>
                            <Input
                                id="periodLabel"
                                placeholder="April 2026 Payroll"
                                value={form.periodLabel}
                                onChange={(event) => setForm((prev) => ({ ...prev, periodLabel: event.target.value }))}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={form.startDate}
                                    onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={form.endDate}
                                    onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleCreate} disabled={submitting}>
                                {submitting ? "Creating..." : "Create payroll run"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
