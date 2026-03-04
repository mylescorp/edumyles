"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function AttendancePage() {
    const { user, isLoading: authLoading } = useAuth();
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [attendance, setAttendance] = useState<Record<string, string>>({});

    const classes = useQuery(
        api.modules.academics.queries.getTeacherClasses,
        {}
    );

    const students = useQuery(
        api.modules.academics.queries.getClassStudents,
        selectedClassId ? { classId: selectedClassId } : "skip"
    );

    const markAttendanceMutation = useMutation(api.modules.academics.mutations.markAttendance);

    if (authLoading || classes === undefined) return <LoadingSkeleton variant="page" />;

    const handleStatusChange = (studentId: string, status: string) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        if (!selectedClassId || !students) return;

        const records = students.map(student => ({
            classId: selectedClassId,
            studentId: student._id,
            date,
            status: attendance[student._id] || "present",
            recordedBy: user?.eduMylesUserId || "",
        }));

        try {
            await markAttendanceMutation({ records });
            toast({ title: "Success", description: "Attendance marked successfully." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to mark attendance.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Attendance"
                description="Mark and track student attendance for your classes."
            />

            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Class</label>
                            <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(cls => (
                                        <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                    </div>

                    {!selectedClassId ? (
                        <div className="text-center p-12 text-muted-foreground border rounded-lg border-dashed">
                            Select a class to mark attendance
                        </div>
                    ) : students === undefined ? (
                        <div className="text-center p-12">Loading students...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student) => (
                                    <TableRow key={student._id}>
                                        <TableCell className="font-medium">
                                            {student.firstName} {student.lastName}
                                        </TableCell>
                                        <TableCell>
                                            <RadioGroup
                                                defaultValue="present"
                                                className="flex justify-end gap-4"
                                                onValueChange={(val) => handleStatusChange(student._id, val)}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="present" id={`p-${student._id}`} />
                                                    <Label htmlFor={`p-${student._id}`}>P</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="absent" id={`a-${student._id}`} />
                                                    <Label htmlFor={`a-${student._id}`}>A</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="late" id={`l-${student._id}`} />
                                                    <Label htmlFor={`l-${student._id}`}>L</Label>
                                                </div>
                                            </RadioGroup>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {selectedClassId && (
                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleSave}>Submit Attendance</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
