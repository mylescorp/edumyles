"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { formatDateTime } from "@/lib/formatters";
import {
  Clock3,
  Shield,
  Users,
  UserPlus,
} from "lucide-react";

function formatRoleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function badgeClass(status: string) {
  switch (status) {
    case "active":
    case "accepted":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "suspended":
    case "revoked":
    case "expired":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
  }
}

export default function PlatformUsersPage() {
  const { isLoading, sessionToken } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const users = usePlatformQuery(
    api.modules.platform.users.getPlatformUsers,
    sessionToken
      ? {
          sessionToken,
          ...(roleFilter !== "all" ? { role: roleFilter } : {}),
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        }
      : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const invites = usePlatformQuery(
    api.modules.platform.users.getPlatformInvites,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;
  const tenantUsers = usePlatformQuery(
    api.platform.users.queries.listAllUsers,
    sessionToken
      ? {
          sessionToken,
          ...(roleFilter !== "all" ? { role: roleFilter } : {}),
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        }
      : "skip",
    !!sessionToken
  ) as Array<any> | undefined;
  const tenantOptions = usePlatformQuery(
    api.platform.users.queries.listTenantFilterOptions,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;
  const [tenantFilter, setTenantFilter] = useState("all");

  const filteredInvites = (invites ?? []).filter((invite) => {
    const matchesSearch =
      search.trim().length === 0 ||
      invite.email.toLowerCase().includes(search.toLowerCase()) ||
      invite.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || invite.status === statusFilter;
    const matchesRole = roleFilter === "all" || invite.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const stats = useMemo(
    () => ({
      totalUsers: (users ?? []).length,
      activeUsers: (users ?? []).filter((user) => user.status === "active").length,
      suspendedUsers: (users ?? []).filter((user) => user.status === "suspended").length,
      pendingInvites: (invites ?? []).filter((invite) => invite.status === "pending").length,
      totalTenantUsers: (tenantUsers ?? []).filter((user) => user.tenantId !== "PLATFORM").length,
    }),
    [invites, users, tenantUsers]
  );

  const roleOptions = Array.from(
    new Set([...(users ?? []).map((user) => user.role), ...(invites ?? []).map((invite) => invite.role)])
  ).sort();

  if (isLoading || users === undefined || invites === undefined || tenantUsers === undefined || tenantOptions === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const filteredTenantUsers = (tenantUsers ?? []).filter((user) => {
    if (tenantFilter !== "all" && user.tenantId !== tenantFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Users"
        description="Manage platform staff, access roles, and pending invitations from the platform user registry."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by email, user ID, department, or role"
          className="max-w-sm"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem key={role} value={role}>
                {formatRoleLabel(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending Invite</SelectItem>
            <SelectItem value="accepted">Accepted Invite</SelectItem>
            <SelectItem value="revoked">Revoked Invite</SelectItem>
            <SelectItem value="expired">Expired Invite</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href="/platform/users/invite">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Staff
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Platform staff</p>
            <p className="text-3xl font-semibold">{stats.totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-3xl font-semibold">{stats.activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Suspended</p>
            <p className="text-3xl font-semibold">{stats.suspendedUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending invites</p>
            <p className="text-3xl font-semibold">{stats.pendingInvites}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList className="h-auto w-full justify-start rounded-xl border bg-muted/30 p-1">
          <TabsTrigger value="staff">Platform Staff</TabsTrigger>
          <TabsTrigger value="tenant-users">Tenant Users</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Platform Staff Registry</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No platform users yet"
                  description="Invited and accepted platform staff will appear here once the first access grants are created."
                  action={
                    <Button asChild>
                      <Link href="/platform/users/invite">Invite first staff member</Link>
                    </Button>
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Access Expires</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <Link href={`/platform/users/${user.id}`} className="font-medium hover:underline">
                              {user.firstName || user.lastName
                                ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                                : user.email}
                            </Link>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatRoleLabel(user.role)}</TableCell>
                        <TableCell>{user.department ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeClass(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.accessExpiresAt ? formatDateTime(user.accessExpiresAt) : "No expiry"}</TableCell>
                        <TableCell>{formatDateTime(user.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenant-users">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Tenant Users</CardTitle>
              </div>
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Filter by tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tenants</SelectItem>
                  {tenantOptions.map((tenant) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {filteredTenantUsers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No tenant users match these filters"
                  description="Tenant user records across all schools will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenantUsers.map((user) => (
                      <TableRow key={String(user._id)}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {user.firstName || user.lastName
                                ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                                : user.email}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{user.tenantId}</TableCell>
                        <TableCell>{formatRoleLabel(user.role)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeClass(user.isActive ? "active" : "suspended")}>
                            {user.isActive ? "active" : "inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Platform Staff Invites</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInvites.length === 0 ? (
                <EmptyState
                  icon={Clock3}
                  title="No invites match these filters"
                  description="Pending, accepted, revoked, or expired invites will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>{invite.email}</TableCell>
                        <TableCell>{formatRoleLabel(invite.role)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeClass(invite.status)}>
                            {invite.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{invite.inviterEmail}</TableCell>
                        <TableCell>{formatDateTime(invite.createdAt)}</TableCell>
                        <TableCell>{formatDateTime(invite.expiresAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
