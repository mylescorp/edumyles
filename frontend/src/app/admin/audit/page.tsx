"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Users, 
  Shield, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  Download,
  Calendar,
  Filter,
  Eye,
  Search,
  Clock,
  User,
  Database,
  Settings,
  BarChart3
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/formatters";
import { useState } from "react";
import Link from "next/link";

type AuditLogEntry = {
    _id: string;
    actorId: string;
    actorName?: string;
    actorRole?: string;
    action: string;
    entityId?: string;
    entityType?: string;
    entityName?: string;
    after?: any;
    before?: any;
    timestamp: number;
    ipAddress?: string;
    userAgent?: string;
    severity?: "low" | "medium" | "high" | "critical";
    category?: "user" | "system" | "security" | "data" | "compliance";
};

const actionColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    created: "default",
    updated: "secondary",
    deleted: "destructive",
    installed: "default",
    uninstalled: "destructive",
    submitted: "default",
    enrolled: "default",
    login: "default",
    logout: "secondary",
    failed: "destructive",
    exported: "secondary",
    imported: "default",
    permission_change: "destructive",
    system_config: "secondary",
};

const severityColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    low: "outline",
    medium: "secondary",
    high: "destructive",
    critical: "destructive",
};

function getActionColor(action: string): "default" | "secondary" | "destructive" | "outline" {
    for (const [key, color] of Object.entries(actionColors)) {
        if (action.toLowerCase().includes(key)) return color;
    }
    return "outline";
}

function getSeverityColor(severity?: string): "default" | "secondary" | "destructive" | "outline" {
    if (!severity) return "outline";
    return severityColors[severity] || "outline";
}

function getCategoryIcon(category?: string) {
    switch (category) {
        case "user": return User;
        case "system": return Settings;
        case "security": return Shield;
        case "data": return Database;
        case "compliance": return FileText;
        default: return Activity;
    }
}

export default function AuditLogPage() {
    const { isLoading, sessionToken } = useAuth();
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [severityFilter, setSeverityFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<string>("7");

    const auditLogs = useQuery(
        api.platform.audit.queries.listTenantAuditLogs,
        sessionToken
            ? { sessionToken, action: actionFilter === "all" ? undefined : actionFilter }
            : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const currentAuditLogs = (auditLogs as AuditLogEntry[]) || [];

    const stats = {
        totalLogs: currentAuditLogs.length,
        todayLogs: currentAuditLogs.filter(log => 
            new Date(log.timestamp).toDateString() === new Date().toDateString()
        ).length,
        criticalLogs: currentAuditLogs.filter(log => log.severity === "critical").length,
        securityLogs: currentAuditLogs.filter(log => log.category === "security").length,
        userLogs: currentAuditLogs.filter(log => log.category === "user").length,
        systemLogs: currentAuditLogs.filter(log => log.category === "system").length,
        totalActions: currentAuditLogs.length,
        criticalActions: currentAuditLogs.filter(l => l.severity === "critical").length,
        highSeverity: currentAuditLogs.filter(l => l.severity === "high").length,
        securityEvents: currentAuditLogs.filter(l => l.category === "security").length,
        todayActions: currentAuditLogs.filter(l => 
            new Date(l.timestamp).toDateString() === new Date().toDateString()
        ).length,
        uniqueUsers: new Set(currentAuditLogs.map(l => l.actorId)).size,
    };

    const filteredLogs = currentAuditLogs.filter(log => {
        const matchesSearch = searchTerm === "" || 
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.actorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entityType?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesAction = actionFilter === "all" || log.action.toLowerCase().includes(actionFilter.toLowerCase());
        const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
        const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
        
        return matchesSearch && matchesAction && matchesSeverity && matchesCategory;
    });

    const columns: Column<AuditLogEntry>[] = [
        {
            key: "timestamp",
            header: "Timestamp",
            sortable: true,
            cell: (row) => (
                <div>
                    <p className="text-sm font-medium">{formatDateTime(row.timestamp)}</p>
                    <p className="text-xs text-muted-foreground">
                        {Math.floor((Date.now() - row.timestamp) / (1000 * 60))} minutes ago
                    </p>
                </div>
            ),
        },
        {
            key: "action",
            header: "Action",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Badge variant={getActionColor(row.action)}>
                        {row.action}
                    </Badge>
                    {row.severity && (
                        <Badge variant={getSeverityColor(row.severity)} className="text-xs">
                            {row.severity}
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: "actor",
            header: "Actor",
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.actorName || "—"}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                            {row.actorRole || "—"}
                        </Badge>
                        {row.ipAddress && (
                            <span className="text-xs text-muted-foreground">
                                {row.ipAddress}
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "entity",
            header: "Entity",
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.entityName || "—"}</p>
                    <p className="text-sm text-muted-foreground">{row.entityType || "—"}</p>
                    {row.entityId && (
                        <p className="text-xs text-muted-foreground font-mono">
                            {row.entityId.substring(0, 8)}...
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: "category",
            header: "Category",
            cell: (row) => {
                const Icon = getCategoryIcon(row.category);
                return (
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{row.category || "general"}</span>
                    </div>
                );
            },
        },
        {
            key: "details",
            header: "Details",
            cell: (row) => {
                const details = row.after || row.before;
                if (!details || Object.keys(details).length === 0) return "—";
                return (
                    <div className="max-w-[200px]">
                        <p className="text-xs text-muted-foreground truncate">
                            {JSON.stringify(details).substring(0, 60)}...
                        </p>
                    </div>
                );
            },
        },
        {
            key: "actions",
            header: "Actions",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                    </Button>
                    {row.severity === "critical" && (
                        <Button size="sm" variant="outline">Investigate</Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Audit Log"
                description="Comprehensive audit trail for all system activities and security events"
                actions={
                    <div className="flex gap-2">
                        <Link href="/admin/audit/reports">
                            <Button variant="outline" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                View Reports
                            </Button>
                        </Link>
                        <Button className="gap-2">
                            <Download className="h-4 w-4" />
                            Export Logs
                        </Button>
                    </div>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="Total Actions"
                    value={stats.totalActions}
                    description="All logged activities"
                    icon={Activity}
                    trend={{ value: 8, isPositive: true }}
                />
                <AdminStatsCard
                    title="Critical Events"
                    value={stats.criticalActions}
                    description="Require immediate attention"
                    icon={AlertTriangle}
                    variant="danger"
                />
                <AdminStatsCard
                    title="Security Events"
                    value={stats.securityEvents}
                    description="Security-related activities"
                    icon={Shield}
                    variant="warning"
                />
                <AdminStatsCard
                    title="Active Users"
                    value={stats.uniqueUsers}
                    description="Users with activity"
                    icon={Users}
                    variant="success"
                />
            </div>

            {/* Advanced Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Advanced Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-5">
                        <div>
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Action Type</label>
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Filter by action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="create">Create</SelectItem>
                                    <SelectItem value="update">Update</SelectItem>
                                    <SelectItem value="delete">Delete</SelectItem>
                                    <SelectItem value="login">Login</SelectItem>
                                    <SelectItem value="export">Export</SelectItem>
                                    <SelectItem value="permission">Permission</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Severity</label>
                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Filter by severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Severities</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                    <SelectItem value="security">Security</SelectItem>
                                    <SelectItem value="data">Data</SelectItem>
                                    <SelectItem value="compliance">Compliance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Date Range</label>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Last 24 Hours</SelectItem>
                                    <SelectItem value="7">Last 7 Days</SelectItem>
                                    <SelectItem value="30">Last 30 Days</SelectItem>
                                    <SelectItem value="90">Last 90 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Logs Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Audit Trail</CardTitle>
                    <div className="text-sm text-muted-foreground">
                        Showing {filteredLogs.length} of {currentAuditLogs.length} entries
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={filteredLogs}
                        columns={columns}
                        searchable={false} // We have custom search
                        emptyTitle="No audit logs found"
                        emptyDescription="No logs match your current filters."
                    />
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Link href="/admin/audit/reports">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                                    <BarChart3 className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Generate Reports</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Analytics & insights
                                </p>
                            </div>
                        </Link>
                        <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-medium text-center">Security Review</h3>
                            <p className="text-sm text-muted-foreground text-center mt-1">
                                Security analysis
                            </p>
                        </div>
                        <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                                <Database className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-medium text-center">Data Export</h3>
                            <p className="text-sm text-muted-foreground text-center mt-1">
                                Export audit data
                            </p>
                        </div>
                        <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
                                <Settings className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-medium text-center">Audit Settings</h3>
                            <p className="text-sm text-muted-foreground text-center mt-1">
                                Configuration
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
