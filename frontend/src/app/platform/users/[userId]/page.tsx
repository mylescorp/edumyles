"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime } from "@/lib/formatters";
import { ArrowLeft, Shield, UserX } from "lucide-react";

const PLATFORM_ROLES = [
  "master_admin",
  "super_admin",
  "platform_manager",
  "support_agent",
  "billing_admin",
  "marketplace_reviewer",
  "content_moderator",
  "analytics_viewer",
];

function formatRoleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function badgeClass(status: string) {
  return status === "active"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
    : "border-rose-500/20 bg-rose-500/10 text-rose-700";
}

export default function PlatformUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading, sessionToken } = useAuth();
  const userId = params.userId as string;

  const user = usePlatformQuery(
    api.modules.platform.users.getPlatformUser,
    sessionToken ? { sessionToken, platformUserId: userId as any } : "skip",
    !!sessionToken
  ) as any;

  const auditLogs = usePlatformQuery(
    api.platform.audit.queries.listAuditLogs,
    sessionToken && user?.userId
      ? { sessionToken, userId: user.userId, limit: 20 }
      : "skip",
    !!sessionToken && !!user?.userId
  ) as Array<any> | undefined;

  const updateRole = useMutation(api.modules.platform.users.updatePlatformUserRole);
  const updatePermissions = useMutation(api.modules.platform.users.updatePlatformUserPermissions);
  const suspendUser = useMutation(api.modules.platform.users.suspendPlatformUser);

  const [role, setRole] = useState("super_admin");
  const [addedPermissions, setAddedPermissions] = useState("");
  const [removedPermissions, setRemovedPermissions] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setRole(user.role);
    setAddedPermissions((user.addedPermissions ?? []).join(", "));
    setRemovedPermissions((user.removedPermissions ?? []).join(", "));
  }, [user]);

  if (isLoading || user === undefined || auditLogs === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!user) {
    return (
      <EmptyState
        icon={Shield}
        title="Platform user not found"
        description="The requested platform user could not be loaded."
        action={
          <Button asChild>
            <Link href="/platform/users">Back to users</Link>
          </Button>
        }
      />
    );
  }

  const handleSave = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await updateRole({
        sessionToken,
        platformUserId: userId as any,
        role,
      });
      await updatePermissions({
        sessionToken,
        platformUserId: userId as any,
        addedPermissions: addedPermissions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        removedPermissions: removedPermissions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      toast({
        title: "Platform user updated",
        description: "Role and permission overrides have been saved.",
      });
    } catch (error) {
      toast({
        title: "Unable to save changes",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await suspendUser({
        sessionToken,
        platformUserId: userId as any,
      });
      toast({
        title: "Platform user suspended",
        description: "The account has been suspended.",
      });
    } catch (error) {
      toast({
        title: "Unable to suspend user",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.firstName || user.lastName ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : user.email}
        description="Platform staff detail with persisted role assignment and permission overrides."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: user.email },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => router.push("/platform/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Badge variant="outline" className={badgeClass(user.status)}>
          {user.status}
        </Badge>
        {user.status === "active" ? (
          <Button variant="destructive" onClick={handleSuspend} disabled={saving}>
            <UserX className="mr-2 h-4 w-4" />
            Suspend User
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Email</Label>
                <p className="mt-1 font-medium">{user.email}</p>
              </div>
              <div>
                <Label>User ID</Label>
                <p className="mt-1 font-medium">{user.userId}</p>
              </div>
              <div>
                <Label>Department</Label>
                <p className="mt-1 font-medium">{user.department ?? "—"}</p>
              </div>
              <div>
                <Label>Last Login</Label>
                <p className="mt-1 font-medium">{user.lastLogin ? formatDateTime(user.lastLogin) : "No login yet"}</p>
              </div>
              <div>
                <Label>Accepted At</Label>
                <p className="mt-1 font-medium">{user.acceptedAt ? formatDateTime(user.acceptedAt) : "Invite not accepted yet"}</p>
              </div>
              <div>
                <Label>Access Expires</Label>
                <p className="mt-1 font-medium">{user.accessExpiresAt ? formatDateTime(user.accessExpiresAt) : "No expiry"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role and Permission Overrides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_ROLES.map((platformRole) => (
                      <SelectItem key={platformRole} value={platformRole}>
                        {formatRoleLabel(platformRole)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Added Permissions</Label>
                <Textarea
                  value={addedPermissions}
                  onChange={(event) => setAddedPermissions(event.target.value)}
                  placeholder="Comma-separated permission keys"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Removed Permissions</Label>
                <Textarea
                  value={removedPermissions}
                  onChange={(event) => setRemovedPermissions(event.target.value)}
                  placeholder="Comma-separated permission keys"
                  rows={4}
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No audit activity"
                description="Platform audit events for this user will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={String(log._id)}>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.tenantName}</TableCell>
                      <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
