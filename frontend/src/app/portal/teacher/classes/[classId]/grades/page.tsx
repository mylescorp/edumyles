"use client";

import { useState } from "react";
import { use } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function ClassGradesPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const { user, isLoading: authLoading, sessionToken } = useAuth();
  const [term, setTerm] = useState<string>("Term 1");
  const [grades, setGrades] = useState<Record<string, { score: string; remarks: string }>>({});

  const classData = useQuery(
    api.modules.sis.queries.listClasses,
    sessionToken ? { sessionToken } : "skip"
  )?.find((c) => c._id === classId);
  const students = useQuery(api.modules.academics.queries.getClassStudents, { classId });

  const enterGradesMutation = useMutation(api.modules.academics.mutations.enterGrades);

  if (authLoading || classData === undefined || students === undefined) return <LoadingSkeleton variant="page" />;

  const handleGradeChange = (studentId: string, field: "score" | "remarks", value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }));
  };

  const calculateGrade = (score: number): string => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const handleSubmit = async () => {
    if (!classData) return;

    try {
      const payload = students.map(student => ({
        studentId: student._id,
        score: parseFloat(grades[student._id]?.score || "0"),
        grade: calculateGrade(parseFloat(grades[student._id]?.score || "0")),
        remarks: grades[student._id]?.remarks || "",
      }));

      await enterGradesMutation({
        tenantId: user?.tenantId || "",
        classId,
        subjectId: "general", // This should be dynamic based on subject selection
        term,
        academicYear: new Date().getFullYear().toString(),
        grades: payload,
      });

      toast({
        title: "Success",
        description: "Grades entered successfully",
      });
      setGrades({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enter grades",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${classData.name} - Grades`}
        description="Enter and manage student grades"
        breadcrumbs={[
          { label: "Teacher Portal", href: "/portal/teacher" },
          { label: "Classes", href: "/portal/teacher/classes" },
          { label: classData.name, href: `/portal/teacher/classes/${classId}` },
          { label: "Grades" }
        ]}
      />

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div>
                <Label>Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit}>
                Submit Grades
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => {
                  const score = parseFloat(grades[student._id]?.score || "0");
                  const grade = score > 0 ? calculateGrade(score) : "";
                  
                  return (
                    <TableRow key={student._id}>
                      <TableCell>
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={grades[student._id]?.score || ""}
                          onChange={(e) => handleGradeChange(student._id, "score", e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{grade}</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Optional remarks"
                          value={grades[student._id]?.remarks || ""}
                          onChange={(e) => handleGradeChange(student._id, "remarks", e.target.value)}
                          className="w-48"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
