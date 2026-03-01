"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, UserX, ArrowUpDown } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { getRoleLabel } from "@/lib/routes";
import Link from "next/link";

type PlatformAdmin = {
    _id: any;
    eduMylesUserId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    isActive: boolean;
    createdAt: number;
};

export default function PlatformUsersPage() {
    const { isLoading, user } = useAuth();
    const { hasRole } = usePermissions();
    const isMasterAdmin = hasRole("master_admin");

    const admins = useQuery(api.platform.users.queries.listPlatformAdmins);
    const updateRole = useMutation(api.platform.users.mutations.updatePlatformAdminRole);
    const deactivate = useMutation(api.platform.users.mutations.deactivatePlatformAdmin);

    const [deactivateDialog, setDeactivateDialog] = useState<PlatformAdmin | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const handleToggleRole = async (admin: PlatformAdmin) => {
        const newRole = admin.role === "master_admin" ? "super_admin" : "master_admin";
        try {
            await updateRole({ userId: admin._id, role: newRole as "master_admin" | "super_admin" });
        } catch (err) {
            console.error("Failed to update role:", err);
        }
    };

    const handleDeactivate = async () => {
        if (!deactivateDialog) return;
        setActionLoading(true);
        try {
            await deactivate({ userId: deactivateDialog._id });
            setDeactivateDialog(null);
        } finally {
            setActionLoading(false);
        }
    };

    const columns: Column<PlatformAdmin>[] = [
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
        {
            key: "email",
            header: "Email",
            sortable: true,
            cell: (row) => <span className="text-sm">{row.email}</span>,
        },
        {
            key: "role",
            header: "Role",
            sortable: true,
            cell: (row) => (
                <Badge
                    variant="secondary"
                    className={
                        row.role === "master_admin"
                            ? "bg-purple-500/10 text-purple-700 border-purple-200"
                            : "bg-blue-500/10 text-blue-700 border-blue-200"
                    }
                >
                    {getRoleLabel(row.role)}
                </Badge>
            ),
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => (
                <Badge
                    variant="outline"
                    className={row.isActive ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"}
                >
                    {row.isActive ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Added",
            sortable: true,
            cell: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>,
        },
    ];

    // Only master_admin can see actions column
    if (isMasterAdmin) {
        columns.push({
            key: "actions",
            header: "",
            className: "w-12",
            cell: (row) => {
                // Don't show actions for yourself
                const isSelf = user?.email === row.email;
                if (isSelf) return null;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleRole(row)}>
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                Change to {row.role === "master_admin" ? "Super Admin" : "Master Admin"}
                            </DropdownMenuItem>
                            {row.isActive && (
                                <DropdownMenuItem
                                    onClick={() => setDeactivateDialog(row)}
                                    className="text-red-600"
                                >
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        });
    }

    return (
        <div>
            <PageHeader
                title="Platform Users"
                description="Manage platform administrators"
                breadcrumbs={[
                    { label: "Platform", href: "/platform" },
                    { label: "Users" },
                ]}
                actions={
                    isMasterAdmin && (
                        <Link href="/platform/users/invite">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Invite Admin
                            </Button>
                        </Link>
                    )
                }
            />

            <DataTable
                data={(admins as PlatformAdmin[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search admins..."
                searchKey={(row) => `${row.firstName ?? ""} ${row.lastName ?? ""} ${row.email}`}
                emptyTitle="No platform admins"
                emptyDescription="No platform administrators found."
            />

            {/* Deactivate Confirm Dialog */}
            <ConfirmDialog
                open={!!deactivateDialog}
                onOpenChange={(open) => !open && setDeactivateDialog(null)}
                title="Deactivate Admin"
                description={`Are you sure you want to deactivate "${deactivateDialog?.email}"? They will lose platform access immediately.`}
                confirmLabel="Deactivate"
                variant="destructive"
                onConfirm={handleDeactivate}
                isLoading={actionLoading}
            />
        </div>
    );
}
