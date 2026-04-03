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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

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
    const [statusFilter, setStatusFilter] = useState("all");
    const [form, setForm] = useState({
        periodLabel: "",
        startDate: "",
        endDate: "",
    });

    const payrollRuns = useQuery(
        api.modules.hr.queries.listPayrollRuns,
        sessionToken ? { sessionToken, status: statusFilter === "all" ? undefined : statusFilter } : "skip"
    );

    const createPayrollRun = useMutation(api.modules.hr.mutations.createPayrollRun);
    const generatePayrollPayslips = useMutation(api.modules.hr.mutations.generatePayrollPayslips);
    const approvePayrollRun = useMutation(api.modules.hr.mutations.approvePayrollRun);
    const completePayrollRun = useMutation(api.modules.hr.mutations.completePayrollRun);
    const cancelPayrollRun = useMutation(api.modules.hr.mutations.cancelPayrollRun);

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

    const handleGenerateDrafts = async (payrollRunId: Id<"payrollRuns">) => {
        try {
            const result = await generatePayrollPayslips({ payrollRunId });
            toast({
                title: "Draft payslips generated",
                description: `${result.created} payslips created, ${result.skipped} staff skipped because they already had a draft or no active contract was found.`,
            });
        } catch (error) {
            toast({
                title: "Unable to generate payslips",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleComplete = async (payrollRunId: Id<"payrollRuns">) => {
        try {
            await completePayrollRun({ payrollRunId });
            toast({
                title: "Payroll run completed",
                description: "The payroll run has been marked as completed.",
            });
        } catch (error) {
            toast({
                title: "Unable to complete payroll run",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleCancel = async (payrollRunId: Id<"payrollRuns">) => {
        try {
            await cancelPayrollRun({ payrollRunId });
            toast({
                title: "Payroll run cancelled",
                description: "The payroll run will no longer progress through payroll processing.",
            });
        } catch (error) {
            toast({
                title: "Unable to cancel payroll run",
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
            cell: (row) => (
                <div className="flex gap-2">
                    {["draft", "pending"].includes(row.status) && (
                        <Button size="sm" variant="outline" onClick={() => handleGenerateDrafts(row._id)}>
                            Generate Payslips
                        </Button>
                    )}
                    {["draft", "pending"].includes(row.status) && (
                        <Button size="sm" onClick={() => handleApprove(row._id)}>
                            Approve
                        </Button>
                    )}
                    {row.status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => handleComplete(row._id)}>
                            Complete
                        </Button>
                    )}
                    {["draft", "pending", "approved"].includes(row.status) && (
                        <Button size="sm" variant="ghost" onClick={() => handleCancel(row._id)}>
                            Cancel
                        </Button>
                    )}
                    {["completed", "cancelled"].includes(row.status) && (
                        <span className="text-sm text-muted-foreground">Locked</span>
                    )}
                </div>
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

            <div className="max-w-xs">
                <Label htmlFor="payroll-status-filter" className="sr-only">Filter payroll runs</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="payroll-status-filter">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Payroll Runs</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                    Draft payroll generation now uses active staff contracts to create payslips before approval. Runs move from <span className="font-medium text-foreground">draft</span> to <span className="font-medium text-foreground">pending</span> once draft payslips are generated.
                </CardContent>
            </Card>

            <DataTable
                data={(payrollRuns as PayrollRun[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search periods..."
                searchKey={(row) => `${row.periodLabel} ${row.status}`}
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
