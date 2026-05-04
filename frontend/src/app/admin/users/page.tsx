"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, UserCog } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { getRoleLabel } from "@/lib/routes";
import { Id } from "@/convex/_generated/dataModel";

type UserRecord = {
    _id: Id<"users">;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: number;
};

const ROLE_OPTIONS = [
    "school_admin",
    "principal",
    "teacher",
    "bursar",
    "hr_manager",
    "librarian",
    "transport_manager",
    "receptionist",
    "parent",
    "student",
];

const EMPTY_USERS: UserRecord[] = [];

export default function UsersPage() {
    const { isLoading, sessionToken, user } = useAuth();
    const { tenantId } = useTenant();
    const { toast } = useToast();
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
    const [form, setForm] = useState({ firstName: "", lastName: "", role: "teacher", isActive: true });
    const [submitting, setSubmitting] = useState(false);

    const users = useQuery(
        api.users.listTenantUsers,
        sessionToken && tenantId
            ? {
                sessionToken,
                tenantId,
                role: roleFilter === "all" ? undefined : roleFilter,
                isActive: statusFilter === "all" ? undefined : statusFilter === "active",
            }
            : "skip"
    );

    const updateTenantUser = useMutation(api.users.updateTenantUser);
    const userList = (users as UserRecord[] | undefined) ?? EMPTY_USERS;
    const summary = useMemo(() => ({
        total: userList.length,
        active: userList.filter((entry) => entry.isActive).length,
        inactive: userList.filter((entry) => !entry.isActive).length,
    }), [userList]);

    const openEditor = (record: UserRecord) => {
        setSelectedUser(record);
        setForm({
            firstName: record.firstName ?? "",
            lastName: record.lastName ?? "",
            role: record.role,
            isActive: record.isActive,
        });
    };

    const handleSave = async () => {
        if (!sessionToken || !selectedUser) return;
        setSubmitting(true);
        try {
            await updateTenantUser({
                sessionToken,
                userId: selectedUser._id,
                firstName: form.firstName.trim() || undefined,
                lastName: form.lastName.trim() || undefined,
                role: form.role,
                isActive: form.isActive,
            });
            toast({
                title: "User updated",
                description: `${selectedUser.email} has been updated.`,
            });
            setSelectedUser(null);
        } catch (error) {
            toast({
                title: "Update failed",
                description: error instanceof Error ? error.message : "Could not update user.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<UserRecord>[] = [
        {
            key: "name",
            header: "Name",
            cell: (row) => {
                const name = [row.firstName, row.lastName].filter(Boolean).join(" ");
                return (
                    <div>
                        <p className="font-medium">{name || "Pending profile"}</p>
                        <p className="text-sm text-muted-foreground">{row.email}</p>
                    </div>
                );
            },
            sortable: true,
        },
        {
            key: "role",
            header: "Role",
            cell: (row) => (
                <Badge variant="outline">{getRoleLabel(row.role)}</Badge>
            ),
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => (
                <Badge variant={row.isActive ? "default" : "secondary"}>
                    {row.isActive ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            key: "joined",
            header: "Joined",
            cell: (row) => new Date(row.createdAt).toLocaleDateString(),
            sortable: true,
        },
        {
            key: "actions",
            header: "",
            cell: (row) => (
                <Button variant="ghost" size="sm" onClick={() => openEditor(row)}>
                    Manage
                </Button>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="User Management"
                description={`Manage users within your school. ${summary.active} active, ${summary.inactive} inactive.`}
                actions={
                    <Link href="/admin/users/invite">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Invite User
                        </Button>
                    </Link>
                }
            />

            <div className="mb-4 flex flex-wrap gap-3">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role} value={role}>
                                {getRoleLabel(role)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                data={userList}
                columns={columns}
                searchable
                searchPlaceholder="Search by name, email, or role..."
                searchKey={(row) => `${row.firstName ?? ""} ${row.lastName ?? ""} ${row.email} ${row.role}`}
                emptyTitle="No users found"
                emptyDescription="Invite users to your school to get started."
            />

            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCog className="h-5 w-5" />
                            Manage User
                        </DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="rounded-lg border p-3 text-sm">
                                <p className="font-medium">{selectedUser.email}</p>
                                <p className="text-muted-foreground">
                                    {selectedUser._id === user?._id ? "This is your current account." : "Update role, profile, or active state."}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First name</Label>
                                    <Input
                                        id="firstName"
                                        value={form.firstName}
                                        onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last name</Label>
                                    <Input
                                        id="lastName"
                                        value={form.lastName}
                                        onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}>
                                    <SelectTrigger id="role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_OPTIONS.map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {getRoleLabel(role)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={form.isActive ? "active" : "inactive"}
                                    onValueChange={(value) => setForm((prev) => ({ ...prev, isActive: value === "active" }))}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setSelectedUser(null)}>
                                    Cancel
                                </Button>
                                <Button type="button" onClick={handleSave} disabled={submitting}>
                                    {submitting ? "Saving..." : "Save changes"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
