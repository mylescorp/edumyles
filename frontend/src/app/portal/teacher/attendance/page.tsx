"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function TeacherAttendancePage() {
    const { user, isLoading: authLoading } = useAuth();
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0] ?? "");
    const [attendance, setAttendance] = useState<Record<string, string>>({});

    const classes = useQuery(
        api.modules.academics.queries.getTeacherClasses,
        {}
    );

    const [selectedClassId, setSelectedClassId] = useState<string>("");

    const students = useQuery(api.modules.academics.queries.getClassStudents,
        selectedClassId ? { tenantId: user?.tenantId || "", classId: selectedClassId } : "skip"
    );

    const submitAttendanceMutation = useMutation(api.modules.academics.mutations.recordAttendance);

    if (authLoading || classes === undefined || students === undefined) {
        return <LoadingSkeleton variant="page" />;
    }

    const handleAttendanceChange = (studentId: string, status: string) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async () => {
        if (!selectedClassId) {
            toast({
                title: "Error",
                description: "Please select a class",
                variant: "destructive",
            });
            return;
        }

        try {
            const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status,
                date,
                classId: selectedClassId,
                tenantId: user?.tenantId || "",
                recordedBy: user?._id || "",
            }));

            await submitAttendanceMutation({ attendance: attendanceData });
            toast({
                title: "Success",
                description: "Attendance recorded successfully",
            });
            setAttendance({});
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to record attendance",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Attendance"
                description="Record daily attendance for your classes"
                breadcrumbs={[
                    { label: "Teacher Portal", href: "/portal/teacher" },
                    { label: "Attendance" }
                ]}
            />

            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">Class</label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map((cls: any) => (
                                <SelectItem key={cls._id} value={cls._id}>
                                    {cls.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </div>

            {selectedClassId && students.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">
                                    {classes.find((c: any) => c._id === selectedClassId)?.name}
                                </h3>
                                <Button onClick={handleSubmit}>
                                    Submit Attendance
                                </Button>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student: any) => (
                                        <TableRow key={student._id}>
                                            <TableCell>
                                                {student.firstName} {student.lastName}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={attendance[student._id] || ""}
                                                    onValueChange={(value) => handleAttendanceChange(student._id, value)}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="present">Present</SelectItem>
                                                        <SelectItem value="absent">Absent</SelectItem>
                                                        <SelectItem value="late">Late</SelectItem>
                                                        <SelectItem value="excused">Excused</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {selectedClassId && students.length === 0 && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">No students found in this class</p>
                    </CardContent>
                </Card>
            )}

            {!selectedClassId && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">Select a class to record attendance</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
