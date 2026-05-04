"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Copy, QrCode } from "lucide-react";

export default function TeacherAttendancePage() {
    const { sessionToken, isLoading: authLoading } = useAuth();
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0] ?? "");
    const [attendance, setAttendance] = useState<Record<string, string>>({});
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [qrToken, setQrToken] = useState<{ token: string; expiresAt: number } | null>(null);

    const classes = useQuery(
        api.modules.academics.queries.getTeacherClasses,
        sessionToken ? { sessionToken } : "skip",
        !!sessionToken
    );

    const [selectedClassId, setSelectedClassId] = useState<string>("");

    const students = useQuery(
        api.modules.academics.queries.getClassStudents,
        sessionToken && selectedClassId ? { classId: selectedClassId, sessionToken } : "skip"
    );

    const existingAttendance = useQuery(
        api.modules.attendance.queries.getClassAttendance,
        sessionToken && selectedClassId && date ? { classId: selectedClassId, date, sessionToken } : "skip"
    );
    const sessions = useQuery(
        api.modules.attendance.queries.getAttendanceSessions,
        sessionToken && selectedClassId && date ? { classId: selectedClassId, date, sessionToken } : "skip"
    );

    const submitAttendanceMutation = useMutation(api.modules.attendance.mutations.markClassAttendance);
    const openSessionMutation = useMutation(api.modules.attendance.mutations.openAttendanceSession);
    const closeSessionMutation = useMutation(api.modules.attendance.mutations.closeAttendanceSession);
    const createQrTokenMutation = useMutation(api.modules.attendance.mutations.createQrAttendanceToken);

    if (
        authLoading ||
        classes === undefined ||
        (selectedClassId && (students === undefined || existingAttendance === undefined || sessions === undefined))
    ) {
        return <LoadingSkeleton variant="page" />;
    }

    const studentsList = Array.isArray(students) ? students : [];
    const openSession = ((sessions as any[]) ?? []).find((session) => session.status === "open");
    const attendanceByStudent = new Map(
        ((existingAttendance as any[]) ?? []).map((entry) => [entry.student._id, entry.record])
    );

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
            }));

            await submitAttendanceMutation({
                sessionToken,
                classId: selectedClassId,
                date,
                records: attendanceData,
            });
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

    const handleOpenSession = async () => {
        if (!selectedClassId || !sessionToken) return;
        try {
            const id = await openSessionMutation({
                sessionToken,
                classId: selectedClassId,
                date,
                sessionType: "daily",
            });
            setSessionId(id as string);
            setQrToken(null);
            toast({ title: "Attendance session opened" });
        } catch {
            toast({ title: "Error", description: "Failed to open attendance session", variant: "destructive" });
        }
    };

    const handleCloseSession = async () => {
        const id = sessionId ?? openSession?._id;
        if (!id || !sessionToken) return;
        try {
            await closeSessionMutation({ sessionToken, sessionId: id });
            setSessionId(null);
            setQrToken(null);
            toast({ title: "Attendance session closed" });
        } catch {
            toast({ title: "Error", description: "Failed to close attendance session", variant: "destructive" });
        }
    };

    const handleCreateQrToken = async () => {
        const id = sessionId ?? openSession?._id;
        if (!id || !sessionToken) return;
        try {
            const result = await createQrTokenMutation({
                sessionToken,
                sessionId: id,
                expiresInMinutes: 15,
            }) as { token: string; expiresAt: number };
            setQrToken({ token: result.token, expiresAt: result.expiresAt });
            toast({ title: "QR attendance token created" });
        } catch {
            toast({ title: "Error", description: "Failed to create QR attendance token", variant: "destructive" });
        }
    };

    const qrScanUrl = qrToken
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/portal/student/attendance?token=${encodeURIComponent(qrToken.token)}`
        : "";

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

            {selectedClassId && studentsList.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <CardTitle>
                            {classes.find((c: any) => c._id === selectedClassId)?.name}
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleOpenSession} disabled={Boolean(openSession || sessionId)}>
                                {openSession || sessionId ? "Session Open" : "Open Session"}
                            </Button>
                            <Button variant="outline" onClick={handleCloseSession} disabled={!openSession && !sessionId}>
                                Close Session
                            </Button>
                            <Button variant="outline" onClick={handleCreateQrToken} disabled={!openSession && !sessionId}>
                                <QrCode className="mr-2 h-4 w-4" />
                                QR Token
                            </Button>
                            <Button onClick={handleSubmit}>
                                Submit Attendance
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {qrToken && (
                                <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-medium">QR attendance link</p>
                                        <p className="break-all text-sm text-muted-foreground">{qrScanUrl}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Expires {new Date(qrToken.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            navigator.clipboard?.writeText(qrScanUrl);
                                            toast({ title: "QR link copied" });
                                        }}
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy
                                    </Button>
                                </div>
                            )}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentsList.map((student: any) => (
                                        <TableRow key={student._id}>
                                            <TableCell>
                                                {student.firstName} {student.lastName}
                                                {attendanceByStudent.get(student._id) && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        saved: {attendanceByStudent.get(student._id)?.status}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={attendance[student._id] || attendanceByStudent.get(student._id)?.status || ""}
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
                                                        <SelectItem value="medical">Medical Leave</SelectItem>
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

            {selectedClassId && studentsList.length === 0 && (
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
