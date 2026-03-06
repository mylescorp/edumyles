"use client";

import { useState, useEffect } from "react";
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
    const { isLoading, user } = useAuth();
    const { hasRole } = usePermissions();
    const isMasterAdmin = hasRole("master_admin");
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [tenantFilter, setTenantFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const admins = useQuery(api.platform.users.queries.listPlatformAdmins);
    const updateRole = useMutation(api.platform.users.mutations.updatePlatformAdminRole);
    const deactivate = useMutation(api.platform.users.mutations.deactivatePlatformAdmin);

    const [deactivateDialog, setDeactivateDialog] = useState<PlatformAdmin | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [showAllUsers, setShowAllUsers] = useState(false);

    // Mock data for all system users
    const mockSystemUsers: SystemUser[] = [
        {
            _id: "1",
            email: "admin@edumyles.com",
            firstName: "Super",
            lastName: "Admin",
            role: "master_admin",
            status: "active",
            lastLogin: "2024-01-15T10:30:00Z",
            createdAt: "2023-01-01T00:00:00Z"
        },
        {
            _id: "2",
            email: "john@nairobi-intl.edu",
            firstName: "John",
            lastName: "Mwangi",
            role: "school_admin",
            tenantId: "tenant1",
            tenantName: "Nairobi International School",
            status: "active",
            lastLogin: "2024-01-15T09:15:00Z",
            createdAt: "2023-03-15T00:00:00Z"
        },
        {
            _id: "3",
            email: "mary@st-marys.edu",
            firstName: "Mary",
            lastName: "Wanjiku",
            role: "teacher",
            tenantId: "tenant2",
            tenantName: "St. Mary's Academy",
            status: "active",
            lastLogin: "2024-01-14T16:45:00Z",
            createdAt: "2023-06-20T00:00:00Z"
        },
        {
            _id: "4",
            email: "student1@nairobi-intl.edu",
            firstName: "James",
            lastName: "Kamau",
            role: "student",
            tenantId: "tenant1",
            tenantName: "Nairobi International School",
            status: "active",
            lastLogin: "2024-01-15T08:00:00Z",
            createdAt: "2023-09-01T00:00:00Z"
        },
        {
            _id: "5",
            email: "parent1@st-marys.edu",
            firstName: "David",
            lastName: "Ochieng",
            role: "parent",
            tenantId: "tenant2",
            tenantName: "St. Mary's Academy",
            status: "inactive",
            lastLogin: "2024-01-10T14:30:00Z",
            createdAt: "2023-08-15T00:00:00Z"
        }
    ];

    const mockUserStats: UserStats = {
        total: 48392,
        active: 42156,
        inactive: 5234,
        suspended: 1002,
        byRole: {
            master_admin: 2,
            super_admin: 5,
            school_admin: 127,
            teacher: 3456,
            student: 41234,
            parent: 3568
        },
        byTenant: {
            "Nairobi International School": 1234,
            "St. Mary's Academy": 987,
            "Eastland High School": 756,
            "Rift Valley Academy": 543
        }
    };

    useEffect(() => {
        const loadSystemUsers = async () => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));
            setSystemUsers(mockSystemUsers);
            setUserStats(mockUserStats);
        };

        if (isMasterAdmin) {
            loadSystemUsers();
        }
    }, [isMasterAdmin]);

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const handleToggleRole = async (admin: PlatformAdmin) => {
        const newRole = admin.role === "master_admin" ? "super_admin" : "master_admin";
        try {
            await updateRole({ userId: admin._id, role: newRole as "master_admin" | "super_admin" });
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
            await deactivate({ userId: deactivateDialog._id });
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
                        <div className="flex items-center space-x-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowAllUsers(!showAllUsers)}
                            >
                                {showAllUsers ? "Platform Admins" : "All System Users"}
                            </Button>
                            <Link href="/platform/users/invite">
                                <Button className="bg-[#056C40] hover:bg-[#023c24]">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite User
                                </Button>
                            </Link>
                        </div>
                    )
                }
            />

            {/* Stats Cards - Only show for all users view */}
            {isMasterAdmin && showAllUsers && userStats && (
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
                        <div className="flex items-center justify-between">
                            <CardTitle>All System Users</CardTitle>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>
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
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3 font-medium">User</th>
                                            <th className="text-left p-3 font-medium">Role</th>
                                            <th className="text-left p-3 font-medium">Tenant</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                            <th className="text-left p-3 font-medium">Last Login</th>
                                            <th className="text-left p-3 font-medium">Joined</th>
                                            <th className="text-left p-3 font-medium w-[100px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {systemUsers
                                            .filter(user => {
                                                const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                                    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                                    user.email.toLowerCase().includes(searchTerm.toLowerCase());
                                                const matchesRole = roleFilter === "all" || user.role === roleFilter;
                                                const matchesStatus = statusFilter === "all" || user.status === statusFilter;
                                                return matchesSearch && matchesRole && matchesStatus;
                                            })
                                            .map((user) => (
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
                                                <td className="p-3">
                                                    <div className="flex items-center space-x-1">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{user.tenantName || "Platform"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {getStatusBadge(user.status)}
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm">
                                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                                                    </div>
                                                </td>
                                                <td className="p-3">
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
