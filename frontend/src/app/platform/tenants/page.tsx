"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import Link from "next/link";
import { BulkOperations } from "@/components/platform/BulkOperations";

type Tenant = {
    _id: string;
    tenantId: string;
    name: string;
    subdomain: string;
    plan: string;
    status: string;
    email: string;
    county: string;
    country: string;
    createdAt: number;
};

function StatusBadge({ status }: { status: string }) {
    const variant = status === "active"
        ? "bg-green-500/10 text-green-700 border-green-200"
        : status === "trial"
            ? "bg-blue-500/10 text-blue-700 border-blue-200"
            : "bg-red-500/10 text-red-700 border-red-200";

    return (
        <Badge variant="outline" className={variant}>
            {status}
        </Badge>
    );
}

function PlanBadge({ plan }: { plan: string }) {
    const variant = plan === "enterprise"
        ? "bg-purple-500/10 text-purple-700 border-purple-200"
        : plan === "growth"
            ? "bg-blue-500/10 text-blue-700 border-blue-200"
            : plan === "starter"
                ? "bg-green-500/10 text-green-700 border-green-200"
                : "bg-gray-500/10 text-gray-700 border-gray-200";

    return (
        <Badge variant="outline" className={variant}>
            {plan}
        </Badge>
    );
}

export default function TenantsPage() {
    const { isLoading, sessionToken } = useAuth();
    const { hasRole } = usePermissions();
    const isPlatformAdmin = hasRole("master_admin", "super_admin");
    const [statusFilter, setStatusFilter] = useState<"active" | "suspended" | "trial" | undefined>(undefined);

    const tenants = useQuery(
        api.platform.tenants.queries.listAllTenants,
        isPlatformAdmin && sessionToken
            ? (statusFilter ? { sessionToken, status: statusFilter } : { sessionToken })
            : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<Tenant>[] = [
        {
            key: "name",
            header: "School Name",
            sortable: true,
            cell: (row) => (
                <Link href={`/platform/tenants/${row.tenantId}`} className="font-medium text-primary hover:underline">
                    {row.name}
                </Link>
            ),
        },
        {
            key: "subdomain",
            header: "Subdomain",
            sortable: true,
            cell: (row) => (
                <span className="text-sm text-muted-foreground">{row.subdomain}.edumyles.com</span>
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
            key: "county",
            header: "County",
            sortable: true,
            cell: (row) => <span className="text-sm">{row.county}</span>,
        },
        {
            key: "createdAt",
            header: "Created",
            sortable: true,
            cell: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Tenants"
                description="Manage all schools on the platform"
                breadcrumbs={[
                    { label: "Platform", href: "/platform" },
                    { label: "Tenants" },
                ]}
                actions={
                    <Link href="/platform/tenants/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add School
                        </Button>
                    </Link>
                }
            />

            {/* Filters */}
            <div className="mb-4 flex items-center gap-3">
                <Select
                    value={statusFilter ?? "all"}
                    onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v as "active" | "suspended" | "trial")}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                data={(tenants as Tenant[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search schools..."
                searchKey={(row) => `${row.name} ${row.subdomain} ${row.email} ${row.county}`}
                emptyTitle="No tenants found"
                emptyDescription="No schools match the current filters."
            />
        </div>
    );
}
