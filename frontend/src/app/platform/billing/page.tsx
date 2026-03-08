"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, CreditCard, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/formatters";

type Subscription = {
    _id: string;
    tenantId: string;
    name: string;
    subdomain: string;
    plan: string;
    status: string;
    email: string;
    createdAt: number;
    updatedAt: number;
};

function PlanBadge({ plan }: { plan: string }) {
    const variant = plan === "enterprise"
        ? "bg-purple-500/10 text-purple-700 border-purple-200"
        : plan === "growth"
            ? "bg-blue-500/10 text-blue-700 border-blue-200"
            : plan === "starter"
                ? "bg-green-500/10 text-green-700 border-green-200"
                : "bg-gray-500/10 text-gray-700 border-gray-200";
    return <Badge variant="outline" className={variant}>{plan}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
    const variant = status === "active"
        ? "bg-green-500/10 text-green-700"
        : status === "trial"
            ? "bg-blue-500/10 text-blue-700"
            : "bg-red-500/10 text-red-700";
    return <Badge variant="outline" className={variant}>{status}</Badge>;
}

export default function BillingPage() {
    const { isLoading, sessionToken } = useAuth();
    const { hasRole } = usePermissions();
    const isMasterAdmin = hasRole("master_admin");
    const isPlatformAdmin = hasRole("master_admin", "super_admin");

    const [planFilter, setPlanFilter] = useState<string | undefined>(undefined);
    const subscriptions = usePlatformQuery(
        api.platform.billing.queries.listSubscriptions,
        planFilter ? { sessionToken, plan: planFilter } : { sessionToken },
        isPlatformAdmin && !!sessionToken
    );

    const updateTier = useMutation(api.platform.billing.mutations.updateTenantTier);

    const [changeTierDialog, setChangeTierDialog] = useState<{ tenant: Subscription; newPlan: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const PLAN_PRICES: Record<string, number> = { free: 0, starter: 49, growth: 129, enterprise: 499 };
    const billingStats = useMemo(() => {
        const list = (subscriptions as Subscription[]) ?? [];
        const active = list.filter((s) => s.status === "active" || s.status === "trial");
        const mrr = active.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);
        const topPlan = Object.entries(
            list.reduce((acc, s) => { acc[s.plan] = (acc[s.plan] ?? 0) + 1; return acc; }, {} as Record<string, number>)
        ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
        return { total: list.length, active: active.length, mrr, topPlan };
    }, [subscriptions]);

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const handleChangeTier = async () => {
        if (!changeTierDialog) return;
        setActionLoading(true);
        try {
            await updateTier({
                sessionToken: sessionToken!,
                tenantId: changeTierDialog.tenant.tenantId,
                plan: changeTierDialog.newPlan as "free" | "starter" | "growth" | "enterprise",
            });
            setChangeTierDialog(null);
        } finally {
            setActionLoading(false);
        }
    };

    const columns: Column<Subscription>[] = [
        {
            key: "name",
            header: "School",
            sortable: true,
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.subdomain}.edumyles.com</p>
                </div>
            ),
        },
        {
            key: "plan",
            header: "Plan",
            sortable: true,
            cell: (row) => <PlanBadge plan={row.plan} />,
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            cell: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: "email",
            header: "Contact",
            cell: (row) => <span className="text-sm">{row.email}</span>,
        },
        {
            key: "createdAt",
            header: "Since",
            sortable: true,
            cell: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>,
        },
    ];

    // Master admin can change tiers
    if (isMasterAdmin) {
        columns.push({
            key: "actions",
            header: "Change Plan",
            className: "w-48",
            cell: (row) => (
                <Select
                    value={row.plan}
                    onValueChange={(v) => {
                        if (v !== row.plan) {
                            setChangeTierDialog({ tenant: row, newPlan: v });
                        }
                    }}
                >
                    <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                </Select>
            ),
        });
    }

    return (
        <div>
            <PageHeader
                title="Billing & Subscriptions"
                description="View and manage tenant subscription plans"
                breadcrumbs={[
                    { label: "Platform", href: "/platform" },
                    { label: "Billing" },
                ]}
            />

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Estimated MRR</CardTitle>
                        <DollarSign className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${billingStats.mrr.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Monthly recurring revenue (USD)</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
                        <CreditCard className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{billingStats.active}</div>
                        <p className="text-xs text-muted-foreground">Active + trial plans</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Top Plan</CardTitle>
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{billingStats.topPlan}</div>
                        <p className="text-xs text-muted-foreground">Most common plan</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="mb-4 flex items-center gap-3">
                <Select
                    value={planFilter ?? "all"}
                    onValueChange={(v) => setPlanFilter(v === "all" ? undefined : v)}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All plans" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All plans</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                data={(subscriptions as Subscription[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search subscriptions..."
                searchKey={(row) => `${row.name} ${row.subdomain} ${row.email}`}
                emptyTitle="No subscriptions"
                emptyDescription="No subscriptions found matching filters."
            />

            {/* Confirm Tier Change */}
            <ConfirmDialog
                open={!!changeTierDialog}
                onOpenChange={(open) => !open && setChangeTierDialog(null)}
                title="Change Subscription Plan"
                description={`Change "${changeTierDialog?.tenant.name}" from ${changeTierDialog?.tenant.plan} to ${changeTierDialog?.newPlan}?`}
                confirmLabel="Update Plan"
                onConfirm={handleChangeTier}
                isLoading={actionLoading}
            />
        </div>
    );
}
