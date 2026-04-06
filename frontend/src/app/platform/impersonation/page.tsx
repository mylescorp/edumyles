"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/formatters";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn } from "lucide-react";

type ImpersonationSession = {
    _id: string;
    adminId: string;
    targetUserId: string;
    targetTenantId: string;
    reason: string;
    startedAt: number;
    endedAt?: number;
    active: boolean;
    adminName: string;
    adminEmail: string;
    targetUserName: string;
    targetUserEmail: string;
    tenantName: string;
};

export default function ImpersonationPage() {
    const { isLoading, sessionToken } = useAuth();
    const { hasRole } = usePermissions();
    const router = useRouter();
    const isMasterAdmin = hasRole("master_admin");
    const isPlatformAdmin = hasRole("master_admin", "super_admin");

    const allSessions = usePlatformQuery(
        api.platform.impersonation.queries.listImpersonationSessions,
        { sessionToken },
        isPlatformAdmin && !!sessionToken
    );
    const activeSessions = usePlatformQuery(
        api.platform.impersonation.queries.listImpersonationSessions,
        { sessionToken, activeOnly: true },
        isPlatformAdmin && !!sessionToken
    );

    const endImpersonation = useMutation(api.platform.impersonation.mutations.endImpersonation);
    const beginImpersonationSession = useMutation(api.platform.impersonation.mutations.beginImpersonationSession);

    const [endDialog, setEndDialog] = useState<ImpersonationSession | null>(null);
    const [browseDialog, setBrowseDialog] = useState<ImpersonationSession | null>(null);
    const [browseReason, setBrowseReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const handleEnd = async () => {
        if (!endDialog) return;
        setActionLoading(true);
        try {
            await endImpersonation({ sessionToken: sessionToken!, targetUserId: endDialog.targetUserId });
            setEndDialog(null);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBrowseAsUser = async () => {
        if (!browseDialog || !sessionToken) return;
        setActionLoading(true);
        try {
            const result = await beginImpersonationSession({
                sessionToken,
                targetUserId: browseDialog.targetUserId,
                targetTenantId: browseDialog.targetTenantId,
                reason: browseReason || browseDialog.reason,
            });

            // Switch session cookies via API route
            await fetch("/api/impersonation/switch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    impersonationToken: result.impersonationToken,
                    role: result.targetUser.role,
                    adminSessionToken: sessionToken,
                }),
            });

            setBrowseDialog(null);

            // Navigate to target user's dashboard based on their role
            const roleDashboard = getRoleDashboard(result.targetUser.role);
            router.push(roleDashboard);
        } finally {
            setActionLoading(false);
        }
    };

    const baseColumns: Column<ImpersonationSession>[] = [
        {
            key: "adminName",
            header: "Admin",
            sortable: true,
            cell: (row) => (
                <div>
                    <p className="text-sm font-medium">{row.adminName}</p>
                    <p className="text-xs text-muted-foreground">{row.adminEmail}</p>
                </div>
            ),
        },
        {
            key: "targetUserName",
            header: "Impersonating",
            sortable: true,
            cell: (row) => (
                <div>
                    <p className="text-sm font-medium">{row.targetUserName}</p>
                    <p className="text-xs text-muted-foreground">{row.targetUserEmail}</p>
                </div>
            ),
        },
        {
            key: "tenantName",
            header: "Tenant",
            sortable: true,
            cell: (row) => <span className="text-sm">{row.tenantName}</span>,
        },
        {
            key: "reason",
            header: "Reason",
            cell: (row) => <span className="text-sm text-muted-foreground">{row.reason}</span>,
        },
        {
            key: "startedAt",
            header: "Started",
            sortable: true,
            cell: (row) => <span className="text-sm text-muted-foreground">{formatRelativeTime(row.startedAt)}</span>,
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => (
                <Badge variant="outline" className={row.active ? "bg-amber-500/10 text-amber-700" : "bg-gray-500/10 text-gray-700"}>
                    {row.active ? "Active" : "Ended"}
                </Badge>
            ),
        },
    ];

    const activeColumns: Column<ImpersonationSession>[] = [
        ...baseColumns.filter((c) => c.key !== "status"),
    ];

    if (isMasterAdmin) {
        activeColumns.push({
            key: "actions",
            header: "",
            className: "w-40",
            cell: (row) => (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setBrowseDialog(row); setBrowseReason(row.reason); }}
                        title="Browse the platform as this user"
                    >
                        <LogIn className="h-3.5 w-3.5 mr-1" />
                        Browse As
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setEndDialog(row)}>
                        End
                    </Button>
                </div>
            ),
        });
    }

    const historyColumns: Column<ImpersonationSession>[] = [
        ...baseColumns,
        {
            key: "endedAt",
            header: "Ended",
            cell: (row) => (
                <span className="text-sm text-muted-foreground">
                    {row.endedAt ? formatRelativeTime(row.endedAt) : "—"}
                </span>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Impersonation Sessions"
                description="Monitor and perform admin impersonation with full audit trail"
                breadcrumbs={[
                    { label: "Platform", href: "/platform" },
                    { label: "Impersonation" },
                ]}
            />

            <Tabs defaultValue="active" className="mt-2">
                <TabsList>
                    <TabsTrigger value="active">
                        Active ({activeSessions?.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        History ({allSessions?.length ?? 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4">
                    <DataTable
                        data={(activeSessions as ImpersonationSession[]) ?? []}
                        columns={activeColumns}
                        emptyTitle="No active sessions"
                        emptyDescription="No impersonation sessions are currently active."
                    />
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <DataTable
                        data={(allSessions as ImpersonationSession[]) ?? []}
                        columns={historyColumns}
                        searchable
                        searchPlaceholder="Search sessions..."
                        searchKey={(row) => `${row.adminName} ${row.targetUserName} ${row.tenantName} ${row.reason}`}
                        emptyTitle="No sessions"
                        emptyDescription="No impersonation sessions have been recorded."
                    />
                </TabsContent>
            </Tabs>

            {/* End Session Dialog */}
            <ConfirmDialog
                open={!!endDialog}
                onOpenChange={(open) => !open && setEndDialog(null)}
                title="End Impersonation Session"
                description={`End impersonation of "${endDialog?.targetUserName}" by "${endDialog?.adminName}"?`}
                confirmLabel="End Session"
                variant="destructive"
                onConfirm={handleEnd}
                isLoading={actionLoading}
            />

            {/* Browse As User Dialog */}
            <Dialog open={!!browseDialog} onOpenChange={(open) => !open && setBrowseDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Browse as {browseDialog?.targetUserName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">
                            You will be redirected to the platform as <strong>{browseDialog?.targetUserName}</strong>{" "}
                            ({browseDialog?.targetUserEmail}) in tenant <strong>{browseDialog?.tenantName}</strong>.
                            All actions performed will be logged against your admin account.
                            The session expires in <strong>2 hours</strong>.
                        </p>
                        <div className="space-y-1">
                            <Label htmlFor="browse-reason">Reason for impersonation</Label>
                            <Input
                                id="browse-reason"
                                value={browseReason}
                                onChange={(e) => setBrowseReason(e.target.value)}
                                placeholder="e.g. Support ticket #1234"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBrowseDialog(null)}>Cancel</Button>
                        <Button
                            onClick={handleBrowseAsUser}
                            disabled={actionLoading || !browseReason.trim()}
                            className="gap-2"
                        >
                            <LogIn className="h-4 w-4" />
                            {actionLoading ? "Starting..." : "Browse as User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getRoleDashboard(role: string): string {
    switch (role) {
        case "master_admin":
        case "super_admin":
            return "/platform";
        case "teacher":
            return "/portal/teacher";
        case "parent":
            return "/portal/parent";
        case "student":
            return "/portal/student";
        case "alumni":
            return "/portal/alumni";
        case "partner":
            return "/portal/partner";
        default:
            return "/admin";
    }
}
