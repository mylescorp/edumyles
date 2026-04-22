"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { InviteStaffModal } from "@/components/platform/InviteStaffModal";
import { PermissionGate } from "@/components/platform/PermissionGate";
import { UsersNavigationRail } from "@/components/platform/UsersNavigationRail";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime } from "@/lib/formatters";
import { normalizeArray } from "@/lib/normalizeData";
import { Clock3, Pencil, RotateCcw, Search, Shield, Sparkles, Trash2, UserCheck, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";

const PLATFORM_ROLES = ["master_admin", "super_admin", "platform_manager", "support_agent", "billing_admin", "marketplace_reviewer", "content_moderator", "analytics_viewer"];
type SortKey = "name" | "role" | "department" | "status" | "accessExpiresAt" | "updatedAt";
const roleLabel = (role: string) => role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const userName = (user: any) => `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || user.userId;
const badgeClass = (status: string) => status === "active" || status === "accepted" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : status === "suspended" || status === "revoked" || status === "expired" ? "border-rose-500/20 bg-rose-500/10 text-rose-700" : "border-sky-500/20 bg-sky-500/10 text-sky-700";

function SortHead({ label, value, sortKey, sortDirection, onSort }: { label: string; value: SortKey; sortKey: SortKey; sortDirection: "asc" | "desc"; onSort: (next: SortKey) => void }) {
  return <TableHead><button type="button" onClick={() => onSort(value)} className="inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}{sortKey === value ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}</button></TableHead>;
}

export default function PlatformUsersPage() {
  const { isLoading, sessionToken } = useAuth();
  const { can, isMasterAdmin } = usePlatformPermissions();
  const [tab, setTab] = useState("all-staff");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteBusyId, setInviteBusyId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);
  const [activateTarget, setActivateTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [revokeInviteTarget, setRevokeInviteTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ role: "super_admin", addedPermissions: "", removedPermissions: "", accessExpiresAt: "" });
  const [actionReason, setActionReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [saving, setSaving] = useState(false);

  const users = usePlatformQuery(api.modules.platform.rbac.getPlatformUsers, sessionToken ? { sessionToken } : "skip", !!sessionToken) as Array<any> | undefined;
  const invites = usePlatformQuery(api.modules.platform.rbac.getPlatformInvites, sessionToken ? { sessionToken } : "skip", !!sessionToken) as Array<any> | undefined;
  const updateUserRole = useMutation(api.modules.platform.rbac.updateUserRole);
  const updateUserPermissions = useMutation(api.modules.platform.rbac.updateUserPermissions);
  const setAccessExpiry = useMutation(api.modules.platform.rbac.setAccessExpiry);
  const suspendPlatformUser = useMutation(api.modules.platform.rbac.suspendPlatformUser);
  const activatePlatformUser = useMutation(api.modules.platform.rbac.unsuspendPlatformUser);
  const deletePlatformUser = useMutation(api.modules.platform.rbac.deletePlatformUser);
  const resendPlatformInvite = useMutation(api.modules.platform.rbac.resendPlatformInvite);
  const revokePlatformInvite = useMutation(api.modules.platform.rbac.revokePlatformInvite);

  const userRows = useMemo(() => normalizeArray<any>(users), [users]);
  const inviteRows = useMemo(() => normalizeArray<any>(invites), [invites]);
  const roleOptions = useMemo(() => Array.from(new Set([...userRows.map((u) => u.role), ...inviteRows.map((i) => i.role)])).sort(), [inviteRows, userRows]);
  const searchTerm = search.trim().toLowerCase();
  const now = Date.now();

  const filteredUsers = useMemo(() => [...userRows].filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    if (!searchTerm) return true;
    return [userName(user), user.email, user.department, user.role, user.userId].filter(Boolean).join(" ").toLowerCase().includes(searchTerm);
  }).sort((a, b) => {
    const dir = sortDirection === "asc" ? 1 : -1;
    const aExpiry = a.accessExpiresAt ?? Number.MAX_SAFE_INTEGER;
    const bExpiry = b.accessExpiresAt ?? Number.MAX_SAFE_INTEGER;
    if (sortKey === "name") return userName(a).localeCompare(userName(b)) * dir;
    if (sortKey === "role") return String(a.role).localeCompare(String(b.role)) * dir;
    if (sortKey === "department") return String(a.department ?? "").localeCompare(String(b.department ?? "")) * dir;
    if (sortKey === "status") return String(a.status).localeCompare(String(b.status)) * dir;
    if (sortKey === "accessExpiresAt") return (aExpiry - bExpiry) * dir;
    return ((a.updatedAt ?? 0) - (b.updatedAt ?? 0)) * dir;
  }), [roleFilter, searchTerm, sortDirection, sortKey, statusFilter, userRows]);

  const filteredInvites = useMemo(() => inviteRows.filter((invite) => {
    if (roleFilter !== "all" && invite.role !== roleFilter) return false;
    if (statusFilter !== "all" && invite.status !== statusFilter) return false;
    if (!searchTerm) return true;
    return [invite.email, invite.role, invite.inviterEmail].filter(Boolean).join(" ").toLowerCase().includes(searchTerm);
  }), [inviteRows, roleFilter, searchTerm, statusFilter]);

  const pendingInvites = filteredInvites.filter((invite) => invite.status === "pending");
  const suspendedUsers = filteredUsers.filter((user) => user.status === "suspended");
  const expiringUsers = filteredUsers.filter((user) => user.accessExpiresAt && user.accessExpiresAt <= now + 30 * 24 * 60 * 60 * 1000);
  const usersByRole = roleOptions.map((role) => ({ role, members: filteredUsers.filter((user) => user.role === role) })).filter((group) => group.members.length > 0);
  const stats = { totalUsers: userRows.length, activeUsers: userRows.filter((u) => u.status === "active").length, suspendedUsers: userRows.filter((u) => u.status === "suspended").length, pendingInvites: inviteRows.filter((i) => i.status === "pending").length };

  const resetDialogs = () => { setSuspendTarget(null); setActivateTarget(null); setDeleteTarget(null); setRevokeInviteTarget(null); setActionReason(""); setRevokeReason(""); };
  const onSort = (next: SortKey) => { if (sortKey === next) setSortDirection((current) => current === "asc" ? "desc" : "asc"); else { setSortKey(next); setSortDirection(next === "name" || next === "role" ? "asc" : "desc"); } };
  const openEdit = (user: any) => { setEditingUser(user); setEditForm({ role: user.role, addedPermissions: (user.addedPermissions ?? []).join(", "), removedPermissions: (user.removedPermissions ?? []).join(", "), accessExpiresAt: user.accessExpiresAt ? new Date(user.accessExpiresAt).toISOString().slice(0, 16) : "" }); setActionReason(""); };

  const saveUser = async () => {
    if (!sessionToken || !editingUser) return;
    setSaving(true);
    try {
      await updateUserRole({ sessionToken, targetUserId: editingUser.id as any, newRole: editForm.role, reason: actionReason.trim() || "Updated from platform users page" });
      await updateUserPermissions({ sessionToken, targetUserId: editingUser.id as any, addedPermissions: editForm.addedPermissions.split(",").map((item) => item.trim()).filter(Boolean), removedPermissions: editForm.removedPermissions.split(",").map((item) => item.trim()).filter(Boolean), reason: actionReason.trim() || "Updated from platform users page" });
      await setAccessExpiry({ sessionToken, targetUserId: editingUser.id as any, accessExpiresAt: editForm.accessExpiresAt ? new Date(editForm.accessExpiresAt).getTime() : undefined, reason: actionReason.trim() || "Updated from platform users page" });
      toast.success("Platform user updated"); setEditingUser(null); setActionReason("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update platform user"); } finally { setSaving(false); }
  };
  const suspendUser = async () => { if (!sessionToken || !suspendTarget) return; setSaving(true); try { await suspendPlatformUser({ sessionToken, targetUserId: suspendTarget.id as any, reason: actionReason.trim() || "Suspended from platform users page" }); toast.success("Platform user suspended"); resetDialogs(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to suspend platform user"); } finally { setSaving(false); } };
  const activateUser = async () => { if (!sessionToken || !activateTarget) return; setSaving(true); try { await activatePlatformUser({ sessionToken, targetUserId: activateTarget.id as any, reason: actionReason.trim() || "Unsuspended from platform users page" }); toast.success("Platform user reactivated"); resetDialogs(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to reactivate platform user"); } finally { setSaving(false); } };
  const removeUser = async () => { if (!sessionToken || !deleteTarget) return; setSaving(true); try { await deletePlatformUser({ sessionToken, targetUserId: deleteTarget.id as any, reason: actionReason.trim() || "Deleted from platform users page" }); toast.success("Platform user deleted"); resetDialogs(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete platform user"); } finally { setSaving(false); } };
  const resendInvite = async (inviteId: string) => { if (!sessionToken) return; setInviteBusyId(inviteId); try { await resendPlatformInvite({ sessionToken, inviteId: inviteId as any }); toast.success("Invite resent"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to resend invite"); } finally { setInviteBusyId(null); } };
  const revokeInvite = async () => { if (!sessionToken || !revokeInviteTarget) return; if (!revokeReason.trim()) { toast.error("A revoke reason is required"); return; } setSaving(true); try { await revokePlatformInvite({ sessionToken, inviteId: revokeInviteTarget.id as any, reason: revokeReason.trim() }); toast.success("Invite revoked"); resetDialogs(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to revoke invite"); } finally { setSaving(false); } };

  if (isLoading || users === undefined || invites === undefined) return <LoadingSkeleton variant="page" />;

  const table = (rows: any[], title: string, description: string) => <Card className="border-border/70 shadow-sm"><CardContent className="p-0">{rows.length === 0 ? <EmptyState icon={Shield} title={title} description={description} /> : <div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-border/60"><SortHead label="User" value="name" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} /><SortHead label="Role" value="role" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} /><SortHead label="Department" value="department" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} /><SortHead label="Status" value="status" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} /><SortHead label="Access Expires" value="accessExpiresAt" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} /><SortHead label="Updated" value="updatedAt" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} /><TableHead className="pr-6 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{rows.map((user) => <TableRow key={user.id} className="border-border/60"><TableCell className="pl-6"><div className="space-y-1"><Link href={`/platform/users/${user.id}`} className="font-medium hover:underline">{userName(user)}</Link><p className="text-xs text-muted-foreground">{user.email}</p></div></TableCell><TableCell>{roleLabel(user.role)}</TableCell><TableCell>{user.department ?? "—"}</TableCell><TableCell><Badge variant="outline" className={badgeClass(user.status)}>{user.status}</Badge></TableCell><TableCell>{user.accessExpiresAt ? formatDateTime(user.accessExpiresAt) : "No expiry"}</TableCell><TableCell>{formatDateTime(user.updatedAt)}</TableCell><TableCell className="pr-6"><div className="flex flex-wrap justify-end gap-2"><PermissionGate permission="platform_users.edit_role" showDisabled disabledTooltip="You don't have access to edit platform users."><Button variant="outline" size="sm" onClick={() => openEdit(user)}><Pencil className="mr-2 h-3.5 w-3.5" />Edit</Button></PermissionGate>{user.status === "active" ? <PermissionGate permission="platform_users.suspend" showDisabled disabledTooltip="You can't suspend platform users."><Button variant="outline" size="sm" onClick={() => setSuspendTarget(user)}><UserX className="mr-2 h-3.5 w-3.5" />Suspend</Button></PermissionGate> : <PermissionGate permission="platform_users.suspend" showDisabled disabledTooltip="You can't reactivate platform users."><Button variant="outline" size="sm" onClick={() => setActivateTarget(user)}><UserCheck className="mr-2 h-3.5 w-3.5" />Activate</Button></PermissionGate>}<PermissionGate permission="platform_users.delete" showDisabled disabledTooltip="You can't delete platform users."><Button variant="destructive" size="sm" onClick={() => setDeleteTarget(user)} disabled={!(can("platform_users.delete") || isMasterAdmin)}><Trash2 className="mr-2 h-3.5 w-3.5" />Delete</Button></PermissionGate></div></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>;

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Users" description="Manage platform staff, pending invitations, suspended accounts, and expiring access from one registry." breadcrumbs={[{ label: "Platform", href: "/platform" }, { label: "Users" }]} />
      <UsersNavigationRail />
      <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/20 shadow-sm"><CardContent className="p-0"><div className="grid gap-0 xl:grid-cols-[1.6fr_1fr]"><div className="space-y-6 p-6 lg:p-8"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700">Registry Overview</Badge><Badge variant="secondary" className="rounded-full px-3 py-1"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Staff access center</Badge></div><div className="max-w-3xl space-y-3"><h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Track active staff, pending invites, and access drift without leaving the registry.</h2><p className="text-sm leading-7 text-muted-foreground md:text-base">The page is now split into all staff, role review, pending invites, suspended accounts, and expiring access so the next admin action is obvious.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Platform staff", value: stats.totalUsers, icon: Shield }, { label: "Active", value: stats.activeUsers, icon: UserCheck }, { label: "Suspended", value: stats.suspendedUsers, icon: UserX }, { label: "Pending invites", value: stats.pendingInvites, icon: Clock3 }].map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-2xl border border-border/70 bg-background/70 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background shadow-sm"><Icon className="h-4 w-4 text-foreground" /></div></div></div>; })}</div></div><div className="border-t border-border/60 bg-muted/20 p-6 lg:p-8 xl:border-l xl:border-t-0"><div className="space-y-5"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Filters & Actions</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Search, narrow by role or status, then invite, resend, suspend, or revoke without losing context.</p></div><div className="space-y-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, role, or user ID" className="h-11 border-border/70 bg-background pl-9" /></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1"><Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="h-11 border-border/70 bg-background"><SelectValue placeholder="Filter by role" /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem>{roleOptions.map((role) => <SelectItem key={role} value={role}>{roleLabel(role)}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-11 border-border/70 bg-background"><SelectValue placeholder="Filter by status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending invite</SelectItem><SelectItem value="accepted">Accepted invite</SelectItem><SelectItem value="revoked">Revoked invite</SelectItem><SelectItem value="expired">Expired invite</SelectItem></SelectContent></Select></div></div><div className="rounded-2xl border border-border/70 bg-background/80 p-4"><p className="text-sm font-medium text-foreground">Attention queue</p><div className="mt-3 space-y-2 text-sm text-muted-foreground"><p>{pendingInvites.length} pending invites need follow-up.</p><p>{expiringUsers.length} staff accounts have access expiring within 30 days.</p><p>{suspendedUsers.length} suspended accounts are available for review.</p></div></div><PermissionGate permission="platform_users.invite" showDisabled disabledTooltip="You don't have permission to invite platform staff."><Button className="h-11 w-full" onClick={() => setShowInviteModal(true)}><UserPlus className="mr-2 h-4 w-4" />Invite Staff</Button></PermissionGate></div></div></div></CardContent></Card>
      <Tabs value={tab} onValueChange={setTab} className="space-y-4"><TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl border border-border/70 bg-muted/30 p-1"><TabsTrigger value="all-staff">All Staff ({filteredUsers.length})</TabsTrigger><TabsTrigger value="by-role">By Role ({usersByRole.length})</TabsTrigger><TabsTrigger value="pending-invites">Pending Invites ({pendingInvites.length})</TabsTrigger><TabsTrigger value="suspended">Suspended ({suspendedUsers.length})</TabsTrigger><TabsTrigger value="expiring">Expiring ({expiringUsers.length})</TabsTrigger></TabsList><TabsContent value="all-staff">{table(filteredUsers, "No platform users match these filters", "Adjust your filters or create the first platform invite to populate the registry.")}</TabsContent><TabsContent value="by-role">{usersByRole.length === 0 ? <EmptyState icon={Shield} title="No role groups match these filters" description="Try clearing your search or role filter to review the current team mix." /> : <div className="grid gap-4 xl:grid-cols-2">{usersByRole.map((group) => <Card key={group.role} className="border-border/70 shadow-sm"><CardHeader className="border-b border-border/60 bg-muted/20"><CardTitle>{roleLabel(group.role)}</CardTitle><p className="text-sm text-muted-foreground">{group.members.length} members</p></CardHeader><CardContent className="space-y-3 p-4">{group.members.slice(0, 6).map((member) => <div key={member.id} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"><div><Link href={`/platform/users/${member.id}`} className="font-medium hover:underline">{userName(member)}</Link><p className="text-xs text-muted-foreground">{member.email}</p></div><Badge variant="outline" className={badgeClass(member.status)}>{member.status}</Badge></div>)}</CardContent></Card>)}</div>}</TabsContent><TabsContent value="pending-invites"><Card className="border-border/70 shadow-sm"><CardHeader className="border-b border-border/60 bg-muted/20"><CardTitle>Pending Platform Invites</CardTitle></CardHeader><CardContent className="p-0">{pendingInvites.length === 0 ? <EmptyState icon={Clock3} title="No pending invites match these filters" description="Pending invites will appear here with resend and revoke actions." /> : <div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-border/60"><TableHead className="pl-6">Email</TableHead><TableHead>Role</TableHead><TableHead>Invited By</TableHead><TableHead>Created</TableHead><TableHead>Expires</TableHead><TableHead className="pr-6 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{pendingInvites.map((invite) => <TableRow key={invite.id} className="border-border/60"><TableCell className="pl-6"><div className="space-y-1"><p className="font-medium">{invite.email}</p><p className="text-xs text-muted-foreground">Token expires after 72 hours</p></div></TableCell><TableCell>{roleLabel(invite.role)}</TableCell><TableCell>{invite.inviterEmail}</TableCell><TableCell>{formatDateTime(invite.createdAt)}</TableCell><TableCell>{formatDateTime(invite.expiresAt)}</TableCell><TableCell className="pr-6"><div className="flex flex-wrap justify-end gap-2"><PermissionGate permission="platform_users.invite" showDisabled disabledTooltip="You can't resend platform invites."><Button variant="outline" size="sm" disabled={inviteBusyId === invite.id} onClick={() => resendInvite(invite.id)}><RotateCcw className="mr-2 h-3.5 w-3.5" />Resend</Button></PermissionGate><PermissionGate permission="platform_users.invite" showDisabled disabledTooltip="You can't revoke platform invites."><Button variant="destructive" size="sm" onClick={() => setRevokeInviteTarget(invite)}>Revoke</Button></PermissionGate></div></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card></TabsContent><TabsContent value="suspended">{table(suspendedUsers, "No suspended users match these filters", "Suspended staff accounts will appear here for audit and reactivation work.")}</TabsContent><TabsContent value="expiring">{table(expiringUsers, "No expiring users match these filters", "Accounts with access expiring within the next 30 days will appear here.")}</TabsContent></Tabs>
      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}><DialogContent><DialogHeader><DialogTitle>Edit Platform User</DialogTitle><DialogDescription>Update role assignment, permission overrides, and access expiry for this staff account.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Role</Label><Select value={editForm.role} onValueChange={(value) => setEditForm((current) => ({ ...current, role: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORM_ROLES.map((role) => <SelectItem key={role} value={role}>{roleLabel(role)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Added Permissions</Label><Textarea rows={3} value={editForm.addedPermissions} onChange={(event) => setEditForm((current) => ({ ...current, addedPermissions: event.target.value }))} /></div><div className="space-y-2"><Label>Removed Permissions</Label><Textarea rows={3} value={editForm.removedPermissions} onChange={(event) => setEditForm((current) => ({ ...current, removedPermissions: event.target.value }))} /></div><div className="space-y-2"><Label>Access Expiry</Label><Input type="datetime-local" value={editForm.accessExpiresAt} onChange={(event) => setEditForm((current) => ({ ...current, accessExpiresAt: event.target.value }))} /></div><div className="space-y-2"><Label>Reason</Label><Textarea rows={3} value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder="Why are these access changes being made?" /></div></div><DialogFooter><Button variant="outline" onClick={() => setEditingUser(null)} disabled={saving}>Cancel</Button><Button onClick={saveUser} disabled={saving || !(can("platform_users.edit_role") || can("platform_users.edit_permissions"))}>Save Changes</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(suspendTarget)} onOpenChange={(open) => !open && resetDialogs()}><DialogContent><DialogHeader><DialogTitle>Suspend Platform User</DialogTitle><DialogDescription>This immediately blocks access for the selected platform staff account.</DialogDescription></DialogHeader><div className="space-y-2"><Label>Reason</Label><Textarea rows={3} value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder="Why is this account being suspended?" /></div><DialogFooter><Button variant="outline" onClick={resetDialogs} disabled={saving}>Cancel</Button><Button variant="destructive" onClick={suspendUser} disabled={saving}>Suspend User</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(activateTarget)} onOpenChange={(open) => !open && resetDialogs()}><DialogContent><DialogHeader><DialogTitle>Reactivate Platform User</DialogTitle><DialogDescription>Restore access for this staff account and keep an audit reason on record.</DialogDescription></DialogHeader><div className="space-y-2"><Label>Reason</Label><Textarea rows={3} value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder="Why is this account being reactivated?" /></div><DialogFooter><Button variant="outline" onClick={resetDialogs} disabled={saving}>Cancel</Button><Button onClick={activateUser} disabled={saving}>Reactivate User</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && resetDialogs()}><DialogContent><DialogHeader><DialogTitle>Delete Platform User</DialogTitle><DialogDescription>This soft-deletes the staff record, scrambles the email, and removes active access.</DialogDescription></DialogHeader><div className="space-y-2"><Label>Reason</Label><Textarea rows={3} value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder="Why is this account being deleted?" /></div><DialogFooter><Button variant="outline" onClick={resetDialogs} disabled={saving}>Cancel</Button><Button variant="destructive" onClick={removeUser} disabled={saving}>Delete User</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(revokeInviteTarget)} onOpenChange={(open) => !open && resetDialogs()}><DialogContent><DialogHeader><DialogTitle>Revoke Platform Invite</DialogTitle><DialogDescription>A revoke reason is required so the audit trail clearly explains why access was withdrawn.</DialogDescription></DialogHeader><div className="space-y-2"><Label>Reason</Label><Textarea rows={3} value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} placeholder="Why is this invite being revoked?" /></div><DialogFooter><Button variant="outline" onClick={resetDialogs} disabled={saving}>Cancel</Button><Button variant="destructive" onClick={revokeInvite} disabled={saving}>Revoke Invite</Button></DialogFooter></DialogContent></Dialog>
      {sessionToken ? <InviteStaffModal open={showInviteModal} onOpenChange={setShowInviteModal} sessionToken={sessionToken} /> : null}
    </div>
  );
}
