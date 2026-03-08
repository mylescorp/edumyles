"use client";

import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
