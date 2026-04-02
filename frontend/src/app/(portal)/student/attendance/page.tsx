"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type AttendanceRecord = {
    date: string;
    status: "present" | "absent" | "late" | "excused";
};

export default function StudentAttendance() {
    const records = useQuery(api.modules.portal.student.queries.getMyAttendance, {}) as AttendanceRecord[] | undefined;

    const stats = records ? {
        present: records.filter((r) => r.status === "present").length,
        absent: records.filter((r) => r.status === "absent").length,
        late: records.filter((r) => r.status === "late").length,
        excused: records.filter((r) => r.status === "excused").length,
        total: records.length,
    } : null;

    const rate = stats?.total ? (stats.present / stats.total * 100).toFixed(1) : "0.0";

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "present": return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "absent": return <XCircle className="h-4 w-4 text-destructive" />;
            case "late": return <Clock className="h-4 w-4 text-yellow-500" />;
            case "excused": return <AlertTriangle className="h-4 w-4 text-blue-500" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Attendance Record"
                description="View your daily class attendance history."
            />

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-green-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-800">Present</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900">{stats?.present || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">Absent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900">{stats?.absent || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-800">Late</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-900">{stats?.late || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">Attendance Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{rate}%</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {records && records.length > 0 ? (
                            records
                              .slice()
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((rec, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{new Date(rec.date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(rec.status)}
                                        <span className="text-sm capitalize font-medium">{rec.status}</span>
                                    </div>
                                </div>
                            ))
                        ) : records ? (
                            <p className="text-center py-8 text-muted-foreground italic">No attendance records found.</p>
                        ) : (
                            <p className="text-center py-8 text-muted-foreground italic">Loading records...</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
