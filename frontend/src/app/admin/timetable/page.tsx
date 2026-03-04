"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { AlertCircle, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type TimetableSlot = {
    _id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subjectId: string;
    teacherId: string;
    room?: string;
};

export default function TimetablePage() {
    const { isLoading, sessionToken } = useAuth();
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [checkConflictsDay, setCheckConflictsDay] = useState<number>(0);

    const classes = useQuery(
        api.modules.sis.queries.listClasses,
        sessionToken ? {} : "skip"
    );

    const schedule = useQuery(
        api.modules.timetable.queries.getClassSchedule,
        sessionToken && selectedClassId ? { classId: selectedClassId } : "skip"
    );

    const conflicts = useQuery(
        api.modules.timetable.queries.getConflicts,
        sessionToken && checkConflictsDay ? { dayOfWeek: checkConflictsDay } : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<TimetableSlot>[] = [
        {
            key: "dayOfWeek",
            header: "Day",
            cell: (row) => DAYS[row.dayOfWeek - 1],
        },
        {
            key: "time",
            header: "Time",
            cell: (row) => `${row.startTime} - ${row.endTime}`,
        },
        {
            key: "subjectId",
            header: "Subject",
            cell: (row) => row.subjectId,
        },
        {
            key: "room",
            header: "Room",
            cell: (row) => row.room ?? "—",
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Timetable Management"
                description="View class schedules and detect conflicts"
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>View Class Table</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes?.map((c) => (
                                    <SelectItem key={c._id} value={c._id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedClassId && schedule && (
                            <DataTable
                                data={schedule}
                                columns={columns}
                                emptyTitle="No slots defined"
                                emptyDescription="This class doesn't have a schedule set up yet."
                            />
                        )}
                        {!selectedClassId && (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                                <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground">
                                    Select a class to view its weekly timetable.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Conflict Detection</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Check for teacher double-bookings or room clashes on a specific day.
                        </p>
                        <Select
                            value={checkConflictsDay.toString()}
                            onValueChange={(v) => setCheckConflictsDay(parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select day to check" />
                            </SelectTrigger>
                            <SelectContent>
                                {DAYS.map((day, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                        {day}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {checkConflictsDay > 0 && conflicts && (
                            <div className="space-y-4">
                                {conflicts.length === 0 ? (
                                    <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm font-medium">
                                        No conflicts detected on {DAYS[checkConflictsDay - 1]}.
                                    </div>
                                ) : (
                                    conflicts.map((conflict, i) => (
                                        <Alert variant="destructive" key={i}>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle className="capitalize">
                                                {conflict.type.replace("_", " ")}
                                            </AlertTitle>
                                            <AlertDescription>
                                                {conflict.message}
                                            </AlertDescription>
                                        </Alert>
                                    ))
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
