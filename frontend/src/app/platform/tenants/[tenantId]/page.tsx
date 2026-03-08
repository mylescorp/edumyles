"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/formatters";
import { getRoleLabel as getRoleLabelFromRoutes } from "@/lib/routes";
import {
    Building2, Users, Package, CreditCard, ShieldAlert, ShieldCheck,
    Mail, Phone, MapPin, Globe, Calendar, Inbox
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
    const variant = status === "active"
        ? "bg-green-500/10 text-green-700 border-green-200"
        : status === "trial"
            ? "bg-blue-500/10 text-blue-700 border-blue-200"
            : "bg-red-500/10 text-red-700 border-red-200";
    return <Badge variant="outline" className={variant}>{status}</Badge>;
}

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

export default function TenantDetailPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    const { isLoading, sessionToken } = useAuth();
    const { hasRole } = usePermissions();
    const isMasterAdmin = hasRole("master_admin");
    const isPlatformAdmin = hasRole("master_admin", "super_admin");

    const tenant = useQuery(
        api.platform.tenants.queries.getTenantById,
        isPlatformAdmin && sessionToken ? { sessionToken, tenantId } : "skip"
    );
    const tenantUsers = useQuery(
        api.platform.tenants.queries.getTenantUsers,
        isPlatformAdmin && sessionToken ? { sessionToken, tenantId } : "skip"
    );
    const tenantModules = useQuery(
        api.platform.tenants.queries.getTenantModules,
        isPlatformAdmin && sessionToken ? { sessionToken, tenantId } : "skip"
    );

    const suspendTenant = useMutation(api.platform.tenants.mutations.suspendTenant);
    const activateTenant = useMutation(api.platform.tenants.mutations.activateTenant);

    const [suspendDialog, setSuspendDialog] = useState(false);
    const [activateDialog, setActivateDialog] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    if (isLoading || tenant === undefined) return <LoadingSkeleton variant="page" />;
    if (!tenant) return <EmptyState icon={Building2} title="Tenant Not Found" description="The requested tenant could not be found." />;

    const handleSuspend = async () => {
        setActionLoading(true);
        try {
            await suspendTenant({ sessionToken: sessionToken!, tenantId, reason: "Suspended by platform admin" });
            setSuspendDialog(false);
        } finally {
            setActionLoading(false);
        }
    };

    const handleActivate = async () => {
        setActionLoading(true);
        try {
            await activateTenant({ sessionToken: sessionToken!, tenantId });
            setActivateDialog(false);
        } finally {
            setActionLoading(false);
        }
    };

    const userColumns: Column<any>[] = [
        {
            key: "name",
            header: "Name",
            sortable: true,
            cell: (row) => (
                <span className="font-medium">
                    {[row.firstName, row.lastName].filter(Boolean).join(" ") || "—"}
                </span>
            ),
        },
        { key: "email", header: "Email", sortable: true, cell: (row) => row.email },
        {
            key: "role",
            header: "Role",
            sortable: true,
            cell: (row) => (
                <Badge variant="secondary" className="capitalize">
                    {getRoleLabelFromRoutes(row.role)}
                </Badge>
            ),
        },
        {
            key: "isActive",
            header: "Status",
            cell: (row) => (
                <Badge variant="outline" className={row.isActive ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"}>
                    {row.isActive ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Joined",
            sortable: true,
            cell: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>,
        },
    ];

    const moduleColumns: Column<any>[] = [
        {
            key: "moduleId",
            header: "Module",
            sortable: true,
            cell: (row) => <span className="font-medium capitalize">{row.moduleId.replace(/_/g, " ")}</span>,
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => (
                <Badge variant="outline" className={row.status === "active" ? "bg-green-500/10 text-green-700" : "bg-gray-500/10 text-gray-700"}>
                    {row.status}
                </Badge>
            ),
        },
        {
            key: "installedAt",
            header: "Installed",
            sortable: true,
            cell: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.installedAt)}</span>,
        },
    ];

    return (
        <div>
            <PageHeader
                title={tenant.name}
                description={`${tenant.subdomain}.edumyles.com`}
                breadcrumbs={[
                    { label: "Platform", href: "/platform" },
                    { label: "Tenants", href: "/platform/tenants" },
                    { label: tenant.name },
                ]}
                actions={
                    isMasterAdmin && (
                        <div className="flex items-center gap-2">
                            {tenant.status !== "suspended" ? (
                                <Button variant="destructive" size="sm" onClick={() => setSuspendDialog(true)}>
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    Suspend
                                </Button>
                            ) : (
                                <Button variant="default" size="sm" onClick={() => setActivateDialog(true)}>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Activate
                                </Button>
                            )}
                        </div>
                    )
                }
            />

            <Tabs defaultValue="overview" className="mt-2">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="users">Users ({tenantUsers?.length ?? 0})</TabsTrigger>
                    <TabsTrigger value="modules">Modules ({tenantModules?.length ?? 0})</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    School Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Tenant ID</p>
                                        <p className="text-sm font-mono">{tenant.tenantId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Subdomain</p>
                                        <p className="text-sm">{tenant.subdomain}.edumyles.com</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Plan</p>
                                        <PlanBadge plan={tenant.plan} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                                        <StatusBadge status={tenant.status} />
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        {tenant.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        {tenant.phone}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {tenant.county}, {tenant.country}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Created {formatDate(tenant.createdAt)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg border p-4 text-center">
                                        <p className="text-2xl font-bold">{tenantUsers?.length ?? 0}</p>
                                        <p className="text-sm text-muted-foreground">Users</p>
                                    </div>
                                    <div className="rounded-lg border p-4 text-center">
                                        <p className="text-2xl font-bold">{tenantModules?.filter((m: any) => m.status === "active").length ?? 0}</p>
                                        <p className="text-sm text-muted-foreground">Active Modules</p>
                                    </div>
                                </div>
                                {tenant.suspendedAt && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                        <p className="text-sm font-medium text-red-700">Suspended</p>
                                        <p className="text-xs text-red-600">
                                            {formatDate(tenant.suspendedAt)}
                                            {tenant.suspendReason && ` — ${tenant.suspendReason}`}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="mt-4">
                    <DataTable
                        data={tenantUsers ?? []}
                        columns={userColumns}
                        searchable
                        searchPlaceholder="Search users..."
                        searchKey={(row: any) => `${row.firstName ?? ""} ${row.lastName ?? ""} ${row.email} ${row.role}`}
                        emptyTitle="No users"
                        emptyDescription="This tenant has no users yet."
                    />
                </TabsContent>

                {/* Modules Tab */}
                <TabsContent value="modules" className="mt-4">
                    <DataTable
                        data={tenantModules ?? []}
                        columns={moduleColumns}
                        emptyTitle="No modules installed"
                        emptyDescription="This tenant hasn't installed any modules yet."
                    />
                </TabsContent>
            </Tabs>

            {/* Suspend Dialog */}
            <ConfirmDialog
                open={suspendDialog}
                onOpenChange={setSuspendDialog}
                title="Suspend Tenant"
                description={`Are you sure you want to suspend "${tenant.name}"? Users will lose access until the tenant is reactivated.`}
                confirmLabel="Suspend"
                variant="destructive"
                onConfirm={handleSuspend}
                isLoading={actionLoading}
            />

            {/* Activate Dialog */}
            <ConfirmDialog
                open={activateDialog}
                onOpenChange={setActivateDialog}
                title="Activate Tenant"
                description={`Are you sure you want to activate "${tenant.name}"? Users will regain access immediately.`}
                confirmLabel="Activate"
                onConfirm={handleActivate}
                isLoading={actionLoading}
            />
        </div>
    );
}
