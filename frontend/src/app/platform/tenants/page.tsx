"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building2, CheckCircle2, PauseCircle, FlaskConical } from "lucide-react";
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

    const tenantStats = useMemo(() => {
        const list = (tenants as Tenant[]) ?? [];
        return {
            total: list.length,
            active: list.filter((t) => t.status === "active").length,
            suspended: list.filter((t) => t.status === "suspended").length,
            trial: list.filter((t) => t.status === "trial").length,
        };
    }, [tenants]);

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

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Schools</CardTitle>
                        <Building2 className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tenantStats.total}</div>
                        <p className="text-xs text-muted-foreground">All registered schools</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{tenantStats.active}</div>
                        <p className="text-xs text-muted-foreground">Currently active</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-400">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Trial</CardTitle>
                        <FlaskConical className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{tenantStats.trial}</div>
                        <p className="text-xs text-muted-foreground">On trial plan</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
                        <PauseCircle className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{tenantStats.suspended}</div>
                        <p className="text-xs text-muted-foreground">Suspended accounts</p>
                    </CardContent>
                </Card>
            </div>

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
