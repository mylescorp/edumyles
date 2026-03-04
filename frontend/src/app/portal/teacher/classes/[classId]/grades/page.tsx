"use client";

import { use, useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GradeEntryPage({ params }: { params: Promise<{ classId: string }> }) {
    const { classId } = use(params);
    const { user, isLoading: authLoading } = useAuth();

    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [term, setTerm] = useState<string>("Term 1");
    const [grades, setGrades] = useState<Record<string, { score: string; remarks: string }>>({});

    const classData = useQuery(api.modules.sis.queries.listClasses, {})?.find(c => c._id === classId);
    const students = useQuery(api.modules.academics.queries.getClassStudents, { classId });
    const enterGradesMutation = useMutation(api.modules.academics.mutations.enterGrades);

    if (authLoading || classData === undefined || students === undefined) return <LoadingSkeleton variant="page" />;

    const handleGradeChange = (studentId: string, field: "score" | "remarks", value: string) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || { score: "", remarks: "" }),
                [field]: value
            }
        }));
    };

    const calculateGrade = (score: number) => {
        if (score >= 80) return "A";
        if (score >= 70) return "B";
        if (score >= 60) return "C";
        if (score >= 50) return "D";
        return "E";
    };

    const handleSave = async () => {
        if (!selectedSubject) {
            toast({ title: "Error", description: "Please select a subject.", variant: "destructive" });
            return;
        }

        const payload = Object.entries(grades).map(([studentId, data]) => ({
            studentId,
            classId,
            subjectId: selectedSubject,
            term,
            academicYear: "2024", // Dynamic year in production
            score: parseFloat(data.score),
            grade: calculateGrade(parseFloat(data.score)),
            remarks: data.remarks,
            recordedBy: user?.eduMylesUserId || "",
        }));

        try {
            await enterGradesMutation({ grades: payload });
            toast({ title: "Success", description: "Grades saved successfully." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save grades.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Enter Grades"
                description={`${classData.name} • ${term}`}
                backHref={`/portal/teacher/classes/${classId}`}
            />

            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Subject</label>
                            <Select onValueChange={setSelectedSubject} value={selectedSubject}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="math">Mathematics</SelectItem>
                                    <SelectItem value="eng">English</SelectItem>
                                    <SelectItem value="sci">Science</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Term</label>
                            <Select onValueChange={setTerm} value={term}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select term" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Term 1">Term 1</SelectItem>
                                    <SelectItem value="Term 2">Term 2</SelectItem>
                                    <SelectItem value="Term 3">Term 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="w-[100px]">Score</TableHead>
                                <TableHead className="w-[80px]">Grade</TableHead>
                                <TableHead>Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student) => (
                                <TableRow key={student._id}>
                                    <TableCell className="font-medium">
                                        {student.firstName} {student.lastName}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            placeholder="0-100"
                                            value={grades[student._id]?.score || ""}
                                            onChange={(e) => handleGradeChange(student._id, "score", e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        {grades[student._id]?.score ? calculateGrade(parseFloat(grades[student._id].score)) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            placeholder="Add remarks..."
                                            value={grades[student._id]?.remarks || ""}
                                            onChange={(e) => handleGradeChange(student._id, "remarks", e.target.value)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleSave}>Save Grades</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
