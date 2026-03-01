"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRelativeTime, formatDateTime } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AuditLog = {
    _id: string;
    tenantId: string;
    userId: string;
    action: string;
    targetId?: string;
    targetType?: string;
    details: any;
    createdAt: number;
    tenantName: string;
    userName: string;
    userEmail: string;
};

function ActionBadge({ action }: { action: string }) {
    const colors: Record<string, string> = {
        "tenant.created": "bg-green-500/10 text-green-700",
        "tenant.suspended": "bg-red-500/10 text-red-700",
        "user.created": "bg-blue-500/10 text-blue-700",
        "user.updated": "bg-yellow-500/10 text-yellow-700",
        "user.deleted": "bg-red-500/10 text-red-700",
        "user.login": "bg-gray-500/10 text-gray-700",
        "user.logout": "bg-gray-500/10 text-gray-700",
        "module.installed": "bg-purple-500/10 text-purple-700",
        "module.uninstalled": "bg-orange-500/10 text-orange-700",
        "settings.updated": "bg-teal-500/10 text-teal-700",
        "impersonation.started": "bg-amber-500/10 text-amber-700",
        "impersonation.ended": "bg-amber-500/10 text-amber-700",
        "payment.initiated": "bg-indigo-500/10 text-indigo-700",
        "payment.completed": "bg-green-500/10 text-green-700",
        "payment.failed": "bg-red-500/10 text-red-700",
    };

    return (
        <Badge variant="secondary" className={colors[action] ?? "bg-gray-500/10 text-gray-700"}>
            {action}
        </Badge>
    );
}

export default function AuditLogPage() {
    const { isLoading } = useAuth();
    const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);

    const logs = useQuery(
        api.platform.audit.queries.listAuditLogs,
        actionFilter ? { action: actionFilter } : {}
    );
    const actionTypes = useQuery(api.platform.audit.queries.getAuditActionTypes);

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<AuditLog>[] = [
        {
            key: "createdAt",
            header: "Time",
            sortable: true,
            cell: (row) => (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-sm text-muted-foreground cursor-help">
                                {formatRelativeTime(row.createdAt)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{formatDateTime(row.createdAt)}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ),
        },
        {
            key: "userName",
            header: "User",
            sortable: true,
            cell: (row) => (
                <div>
                    <p className="text-sm font-medium">{row.userName}</p>
                    {row.userEmail && (
                        <p className="text-xs text-muted-foreground">{row.userEmail}</p>
                    )}
                </div>
            ),
        },
        {
            key: "action",
            header: "Action",
            sortable: true,
            cell: (row) => <ActionBadge action={row.action} />,
        },
        {
            key: "tenantName",
            header: "Tenant",
            sortable: true,
            cell: (row) => <span className="text-sm">{row.tenantName}</span>,
        },
        {
            key: "target",
            header: "Target",
            cell: (row) => (
                row.targetType ? (
                    <span className="text-sm text-muted-foreground">
                        {row.targetType}: {row.targetId ?? "—"}
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                )
            ),
        },
        {
            key: "details",
            header: "Details",
            cell: (row) => {
                const details = row.details;
                if (!details || Object.keys(details).length === 0) return <span className="text-sm text-muted-foreground">—</span>;
                const summary = Object.entries(details)
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ");
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="text-sm text-muted-foreground truncate max-w-[200px] inline-block cursor-help">
                                    {summary}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(details, null, 2)}</pre>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
        },
    ];

    return (
        <div>
            <PageHeader
                title="Audit Log"
                description="Platform-wide activity and security audit trail"
                breadcrumbs={[
                    { label: "Platform", href: "/platform" },
                    { label: "Audit Log" },
                ]}
            />

            {/* Filters */}
            <div className="mb-4 flex items-center gap-3">
                <Select
                    value={actionFilter ?? "all"}
                    onValueChange={(v) => setActionFilter(v === "all" ? undefined : v)}
                >
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All actions</SelectItem>
                        {(actionTypes ?? []).map((action) => (
                            <SelectItem key={action} value={action}>
                                {action}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                data={(logs as AuditLog[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search audit logs..."
                searchKey={(row) => `${row.userName} ${row.userEmail} ${row.action} ${row.tenantName}`}
                emptyTitle="No audit logs"
                emptyDescription="No activity has been logged yet."
            />
        </div>
    );
}
