"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelativeTime, formatDateTime } from "@/lib/formatters";
import { useState } from "react";

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
    const isMasterAdmin = hasRole("master_admin");

    const allSessions = useQuery(api.platform.impersonation.queries.listImpersonationSessions, sessionToken ? { sessionToken } : "skip");
    const activeSessions = useQuery(api.platform.impersonation.queries.listImpersonationSessions, sessionToken ? { sessionToken, activeOnly: true } : "skip");

    const endImpersonation = useMutation(api.platform.impersonation.mutations.endImpersonation);

    const [endDialog, setEndDialog] = useState<ImpersonationSession | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const handleEnd = async () => {
        if (!endDialog) return;
        setActionLoading(true);
        try {
            await endImpersonation({ targetUserId: endDialog.targetUserId });
            setEndDialog(null);
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
            className: "w-20",
            cell: (row) => (
                <Button variant="destructive" size="sm" onClick={() => setEndDialog(row)}>
                    End
                </Button>
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
                description="Monitor admin impersonation activity"
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
        </div>
    );
}
