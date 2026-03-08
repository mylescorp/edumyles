"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { VirtualizedList } from "@/components/ui/VirtualizedList";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal, 
  UserX, 
  ArrowUpDown,
  UserCheck,
  Shield,
  Download,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Building2
} from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { getRoleLabel } from "@/lib/routes";
import { useToast } from "@/components/ui/use-toast";
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

interface SystemUser {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId?: string;
    tenantName?: string;
    status: "active" | "inactive" | "suspended";
    lastLogin?: string;
    createdAt: string;
    avatarUrl?: string;
}

interface UserStats {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byRole: Record<string, number>;
    byTenant: Record<string, number>;
}

export default function PlatformUsersPage() {
    const { isLoading, user, sessionToken } = useAuth();
    const { hasRole } = usePermissions();
    const isMasterAdmin = hasRole("master_admin");
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [tenantFilter, setTenantFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const admins = usePlatformQuery(
        api.platform.users.queries.listPlatformAdmins,
        { sessionToken },
        isMasterAdmin && !!sessionToken
    );
    const updateRole = useMutation(api.platform.users.mutations.updatePlatformAdminRole);
    const deactivate = useMutation(api.platform.users.mutations.deactivatePlatformAdmin);

    const [deactivateDialog, setDeactivateDialog] = useState<PlatformAdmin | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showAllUsers, setShowAllUsers] = useState(false);

    const allUsersRaw = usePlatformQuery(
        api.platform.users.queries.listAllUsers,
        { sessionToken },
        isMasterAdmin && !!sessionToken
    ) as any[] | undefined;

    const systemUsers = useMemo<SystemUser[]>(
        () =>
            (allUsersRaw ?? []).map((u: any) => ({
                _id: String(u._id),
                email: u.email,
                firstName: u.firstName ?? "",
                lastName: u.lastName ?? "",
                role: u.role,
                tenantId: u.tenantId,
                tenantName: u.tenantId ?? "Platform",
                status: u.isActive ? "active" : "inactive",
                createdAt: new Date(u.createdAt ?? Date.now()).toISOString(),
            })),
        [allUsersRaw]
    );

    const userStats = useMemo<UserStats>(() => {
        const byRole: Record<string, number> = {};
        const byTenant: Record<string, number> = {};
        let active = 0;
        let inactive = 0;
        let suspended = 0;

        for (const u of systemUsers) {
            byRole[u.role] = (byRole[u.role] ?? 0) + 1;
            const tenantKey = u.tenantName ?? "Platform";
            byTenant[tenantKey] = (byTenant[tenantKey] ?? 0) + 1;
            if (u.status === "active") active += 1;
            else if (u.status === "inactive") inactive += 1;
            else suspended += 1;
        }

        return {
            total: systemUsers.length,
            active,
            inactive,
            suspended,
            byRole,
            byTenant,
        };
    }, [systemUsers]);

    const filteredUsers = useMemo(() => {
        return systemUsers.filter((u) => {
            const matchesSearch =
                u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === "all" || u.role === roleFilter;
            const matchesStatus = statusFilter === "all" || u.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [systemUsers, searchTerm, roleFilter, statusFilter]);

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const handleToggleRole = async (admin: PlatformAdmin) => {
        const newRole = admin.role === "master_admin" ? "super_admin" : "master_admin";
        try {
            await updateRole({ sessionToken: sessionToken!, userId: admin._id, role: newRole as "master_admin" | "super_admin" });
            toast({
                title: "Role Updated",
                description: `Successfully changed ${admin.email} to ${newRole}`,
            });
        } catch (err) {
            console.error("Failed to update role:", err);
            toast({
                title: "Error",
                description: "Failed to update role. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDeactivate = async () => {
        if (!deactivateDialog) return;
        setActionLoading(true);
        try {
            await deactivate({ sessionToken: sessionToken!, userId: deactivateDialog._id });
            setDeactivateDialog(null);
            toast({
                title: "Admin Deactivated",
                description: `${deactivateDialog.email} has been deactivated`,
            });
        } catch (err) {
            console.error("Failed to deactivate:", err);
            toast({
                title: "Error",
                description: "Failed to deactivate admin. Please try again.",
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleUserAction = (action: string, user: SystemUser) => {
        toast({
            title: `${action} User`,
            description: `${action} ${user.firstName} ${user.lastName} (${user.email})`,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case "inactive":
                return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
            case "suspended":
                return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            master_admin: "bg-purple-100 text-purple-800",
            super_admin: "bg-indigo-100 text-indigo-800",
            school_admin: "bg-blue-100 text-blue-800",
            teacher: "bg-green-100 text-green-800",
            student: "bg-amber-100 text-amber-800",
            parent: "bg-pink-100 text-pink-800"
        };
        
        return (
            <Badge className={colors[role] || "bg-gray-100 text-gray-800"}>
                {getRoleLabel(role)}
            </Badge>
        );
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
        <div className="space-y-6">
            <PageHeader
                title="User Management"
                description="Manage all users across the EduMyles platform"
                breadcrumbs={[
                    { label: "Dashboard", href: "/platform" },
                    { label: "Users", href: "/platform/users" }
                ]}
                actions={
                    isMasterAdmin && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAllUsers(!showAllUsers)}
                                className="w-full sm:w-auto"
                            >
                                {showAllUsers ? "Platform Admins" : "All System Users"}
                            </Button>
                            <Link href="/platform/users/invite">
                                <Button size="sm" className="bg-[#056C40] hover:bg-[#023c24] w-full sm:w-auto">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite User
                                </Button>
                            </Link>
                        </div>
                    )
                }
            />

            {/* Stats Cards - Only show for all users view */}
            {isMasterAdmin && showAllUsers && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Users
                            </CardTitle>
                            <UserCheck className="h-5 w-5 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userStats.total.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">All registered users</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Active Users
                            </CardTitle>
                            <UserCheck className="h-5 w-5 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{userStats.active.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Currently active</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-gray-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Inactive Users
                            </CardTitle>
                            <UserX className="h-5 w-5 text-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-600">{userStats.inactive.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Not recently active</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Suspended Users
                            </CardTitle>
                            <Shield className="h-5 w-5 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{userStats.suspended.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Suspended accounts</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Enhanced User Table for All Users */}
            {isMasterAdmin && showAllUsers ? (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>All System Users</CardTitle>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Search and Filters */}
                            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search users by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#056C40]"
                                        />
                                    </div>
                                </div>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#056C40]"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="master_admin">Master Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                    <option value="school_admin">School Admin</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="student">Student</option>
                                    <option value="parent">Parent</option>
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#056C40]"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            {/* Users Table */}
                            <div className="overflow-x-auto -mx-1">
                                <table className="w-full min-w-[600px]">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3 font-medium">User</th>
                                            <th className="text-left p-3 font-medium">Role</th>
                                            <th className="text-left p-3 font-medium hidden md:table-cell">Tenant</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                            <th className="text-left p-3 font-medium hidden lg:table-cell">Last Login</th>
                                            <th className="text-left p-3 font-medium hidden lg:table-cell">Joined</th>
                                            <th className="text-left p-3 font-medium w-[80px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user._id} className="border-b hover:bg-gray-50">
                                                <td className="p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-8 w-8 rounded-full bg-[#056C40] text-white flex items-center justify-center text-sm font-medium">
                                                            {user.firstName[0]}{user.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">
                                                                {user.firstName} {user.lastName}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {getRoleBadge(user.role)}
                                                </td>
                                                <td className="p-3 hidden md:table-cell">
                                                    <div className="flex items-center space-x-1">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{user.tenantName || "Platform"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {getStatusBadge(user.status)}
                                                </td>
                                                <td className="p-3 hidden lg:table-cell">
                                                    <div className="text-sm">
                                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                                                    </div>
                                                </td>
                                                <td className="p-3 hidden lg:table-cell">
                                                    <div className="text-sm">
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleUserAction("View", user)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUserAction("Edit", user)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit User
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {user.status === "active" ? (
                                                                <DropdownMenuItem onClick={() => handleUserAction("Suspend", user)}>
                                                                    <UserX className="h-4 w-4 mr-2" />
                                                                    Suspend
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleUserAction("Activate", user)}>
                                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                                    Activate
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                onClick={() => handleUserAction("Delete", user)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* Original Platform Admins Table */
                <DataTable
                    data={(admins as PlatformAdmin[]) ?? []}
                    columns={columns}
                    searchable
                    searchPlaceholder="Search admins..."
                    searchKey={(row) => `${row.firstName ?? ""} ${row.lastName ?? ""} ${row.email}`}
                    emptyTitle="No platform admins"
                    emptyDescription="No platform administrators found."
                />
            )}

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
