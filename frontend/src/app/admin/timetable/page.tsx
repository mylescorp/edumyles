"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Eye,
  Settings,
  BarChart3,
  RefreshCw,
  Download
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type TimetableSlot = {
    _id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subjectId: string;
    subjectName?: string;
    teacherId: string;
    teacherName?: string;
    room?: string;
    classId: string;
    className?: string;
    status: "scheduled" | "conflict" | "cancelled" | "substitute";
    conflictType?: "teacher" | "room" | "class" | "subject";
    notes?: string;
};

type Conflict = {
    _id: string;
    type: "teacher" | "room" | "class" | "subject";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    affectedSlots: string[];
    suggestions: string[];
    autoResolved: boolean;
};

export default function TimetablePage() {
    const { isLoading, sessionToken } = useAuth();
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedTerm, setSelectedTerm] = useState<string>("");
    const [viewMode, setViewMode] = useState<"grid" | "list" | "conflicts">("grid");
    const [checkConflictsDay, setCheckConflictsDay] = useState<number>(0);

    const classes = usePlatformQuery(
        api.modules.sis.queries.listClasses,
        sessionToken ? { sessionToken } : "skip",
        !!sessionToken
    );

    const schedule = usePlatformQuery(
        api.modules.timetable.queries.getClassSchedule,
        sessionToken && selectedClassId ? { classId: selectedClassId } : "skip",
        !!(sessionToken && selectedClassId)
    );

    const conflicts = usePlatformQuery(
        api.modules.timetable.queries.getConflicts,
        sessionToken && checkConflictsDay ? { dayOfWeek: checkConflictsDay } : "skip",
        !!(sessionToken && checkConflictsDay)
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const currentSchedule = (schedule as TimetableSlot[]) || [];
    const currentConflicts = (conflicts as any[]) || [];

    const stats = {
        totalSlots: currentSchedule.length,
        scheduledSlots: currentSchedule.filter(s => s.status === "scheduled").length,
        conflictSlots: currentSchedule.filter(s => s.status === "conflict").length,
        cancelledSlots: currentSchedule.filter(s => s.status === "cancelled").length,
        totalConflicts: currentConflicts.length,
        criticalConflicts: currentConflicts.filter(c => c.severity === "critical").length,
        resolvedConflicts: currentConflicts.filter(c => c.autoResolved).length,
        utilizationRate: Math.round((currentSchedule.filter(s => s.status === "scheduled").length / currentSchedule.length) * 100),
    };

    const columns: Column<TimetableSlot>[] = [
        {
            key: "dayOfWeek",
            header: "Day",
            sortable: true,
            cell: (row) => (
                <div>
                    <p className="font-medium">{DAYS[row.dayOfWeek - 1]}</p>
                    <Badge variant={row.status === "conflict" ? "destructive" : "outline"} className="text-xs mt-1">
                        {row.status}
                    </Badge>
                </div>
            ),
        },
        {
            key: "time",
            header: "Time",
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.startTime} - {row.endTime}</p>
                    <p className="text-sm text-muted-foreground">40 minutes</p>
                </div>
            ),
        },
        {
            key: "subject",
            header: "Subject",
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.subjectName || "—"}</p>
                    <p className="text-sm text-muted-foreground">{row.subjectId || "—"}</p>
                </div>
            ),
        },
        {
            key: "teacher",
            header: "Teacher",
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.teacherName || "—"}</p>
                    <p className="text-sm text-muted-foreground">{row.teacherId || "—"}</p>
                </div>
            ),
        },
        {
            key: "room",
            header: "Room",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{row.room || "—"}</span>
                </div>
            ),
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
                    {row.status === "conflict" && (
                        <Button size="sm" variant="outline">
                            Resolve
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const conflictColumns: Column<Conflict>[] = [
        {
            key: "type",
            header: "Type",
            cell: (row) => (
                <Badge variant={
                    row.type === "teacher" ? "default" :
                    row.type === "room" ? "secondary" :
                    "outline"
                }>
                    {row.type}
                </Badge>
            ),
        },
        {
            key: "severity",
            header: "Severity",
            cell: (row) => (
                <Badge variant={
                    row.severity === "critical" ? "destructive" :
                    row.severity === "high" ? "destructive" :
                    row.severity === "medium" ? "secondary" :
                    "outline"
                }>
                    {row.severity}
                </Badge>
            ),
        },
        {
            key: "description",
            header: "Description",
            cell: (row) => (
                <p className="text-sm">{row.description}</p>
            ),
        },
        {
            key: "affectedSlots",
            header: "Affected Slots",
            cell: (row) => (
                <Badge variant="outline">
                    {row.affectedSlots.length} slots
                </Badge>
            ),
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => (
                <Badge variant={row.autoResolved ? "default" : "secondary"}>
                    {row.autoResolved ? "Auto-resolved" : "Pending"}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                        View Details
                    </Button>
                    {!row.autoResolved && (
                        <Button size="sm" variant="outline">
                            Resolve
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Timetable Management"
                description="Comprehensive scheduling system with conflict detection and resolution"
                actions={
                    <div className="flex gap-2">
                        <Link href="/admin/timetable/schedule">
                            <Button variant="outline" className="gap-2">
                                <Calendar className="h-4 w-4" />
                                Schedule Builder
                            </Button>
                        </Link>
                        <Link href="/admin/timetable/assignments">
                            <Button variant="outline" className="gap-2">
                                <Users className="h-4 w-4" />
                                Teacher Assignments
                            </Button>
                        </Link>
                        <Button className="gap-2">
                            <Download className="h-4 w-4" />
                            Export Timetable
                        </Button>
                    </div>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="Scheduled Slots"
                    value={stats.scheduledSlots}
                    description="Successfully scheduled"
                    icon={CheckCircle}
                    variant="success"
                />
                <AdminStatsCard
                    title="Conflicts"
                    value={stats.conflictSlots}
                    description="Need resolution"
                    icon={AlertTriangle}
                    variant="danger"
                />
                <AdminStatsCard
                    title="Utilization Rate"
                    value={`${stats.utilizationRate}%`}
                    description="Time slot usage"
                    icon={BarChart3}
                    trend={{ value: 3, isPositive: true }}
                />
                <AdminStatsCard
                    title="Critical Issues"
                    value={stats.criticalConflicts}
                    description="Require immediate attention"
                    icon={AlertTriangle}
                    variant="warning"
                />
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Link href="/admin/timetable/schedule">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                                    <Calendar className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Build Schedule</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Create new timetable
                                </p>
                            </div>
                        </Link>
                        <Link href="/admin/timetable/assignments">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Manage Teachers</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Assign subjects
                                </p>
                            </div>
                        </Link>
                        <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-medium text-center">Resolve Conflicts</h3>
                            <p className="text-sm text-muted-foreground text-center mt-1">
                                Fix scheduling issues
                            </p>
                        </div>
                        <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
                                <Settings className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-medium text-center">Settings</h3>
                            <p className="text-sm text-muted-foreground text-center mt-1">
                                Configure timetable
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Timetable Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="text-sm font-medium">Select Class</label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Choose class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(classes as any[])?.map((c) => (
                                        <SelectItem key={c._id} value={c._id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Academic Term</label>
                            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select term" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="term1">Term 1 (Jan-Apr)</SelectItem>
                                    <SelectItem value="term2">Term 2 (May-Aug)</SelectItem>
                                    <SelectItem value="term3">Term 3 (Sep-Dec)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">View Mode</label>
                            <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="grid">Grid View</SelectItem>
                                    <SelectItem value="list">List View</SelectItem>
                                    <SelectItem value="conflicts">Conflicts Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            {selectedClassId ? (
                <div className="space-y-6">
                    {viewMode === "grid" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Weekly Schedule Grid</CardTitle>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Refresh
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Slot
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Weekly grid view would go here */}
                                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-lg font-medium">Weekly Schedule Grid</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Interactive weekly timetable view with drag-and-drop functionality
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {viewMode === "list" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Schedule List</CardTitle>
                                <div className="text-sm text-muted-foreground">
                                    {currentSchedule.length} total slots
                                </div>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    data={currentSchedule}
                                    columns={columns}
                                    searchable
                                    searchPlaceholder="Search schedule..."
                                    emptyTitle="No schedule found"
                                    emptyDescription="This class doesn't have a schedule set up yet."
                                />
                            </CardContent>
                        </Card>
                    )}

                    {viewMode === "conflicts" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Conflict Detection
                                </CardTitle>
                                <Button size="sm" variant="outline">
                                    Auto-Resolve All
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    data={currentConflicts}
                                    columns={conflictColumns}
                                    searchable
                                    searchPlaceholder="Search conflicts..."
                                    emptyTitle="No conflicts found"
                                    emptyDescription="Great! No scheduling conflicts detected."
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Select a Class to View Timetable</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Choose a class from the dropdown above to view and manage its schedule
                        </p>
                        <Link href="/admin/timetable/schedule">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create New Schedule
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
