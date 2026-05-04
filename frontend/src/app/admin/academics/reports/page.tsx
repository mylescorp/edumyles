"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, TrendingUp, Users, Printer, ClipboardList, Wand2, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useQuery, useMutation, useAction } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { toast } from "@/components/ui/use-toast";

type ReportCardResult = {
  reportCardId: string;
  student: { firstName?: string; lastName?: string; admissionNumber?: string } | null;
  grades: Array<{ subjectName: string; subjectCode: string; score: number; grade: string; term: string }>;
  gpa: number;
  rank: number;
  averageScore: number;
  totalStudentsInClass: number;
  attendanceSummary: { present: number; absent: number; late: number; total: number; attendanceRate: number } | null;
};

const TERMS = ["Term 1", "Term 2", "Term 3", "Semester 1", "Semester 2"];
const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [`${CURRENT_YEAR - 1}/${CURRENT_YEAR}`, `${CURRENT_YEAR}/${CURRENT_YEAR + 1}`];

export default function AdminAcademicReportsPage() {
  const { isLoading, sessionToken } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingNarrative, setGeneratingNarrative] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [reportCard, setReportCard] = useState<ReportCardResult | null>(null);

  const stats = usePlatformQuery(
    api.modules.academics.queries.getAcademicsStats,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );
  const recentClasses = useQuery(
    api.modules.sis.queries.listClasses,
    sessionToken ? { sessionToken, limit: 5 } : "skip",
    !!sessionToken
  );

  const studentsResult = useQuery(
    api.modules.sis.queries.listStudents,
    sessionToken ? { sessionToken, status: "active" } : "skip"
  );
  const students = studentsResult?.data ?? studentsResult;

  const generateReportCard = useMutation(api.modules.academics.mutations.generateReportCard);
  const generateNarrative = useAction(
    (api as any)["modules/academics/actions"].generateAIReportNarrativeWithOpenRouter
  );

  if (isLoading || !stats) return <LoadingSkeleton variant="page" />;

  const handleGenerate = async () => {
    if (!selectedStudentId || !selectedTerm || !selectedYear) {
      toast({ title: "Missing fields", description: "Please select a student, term, and academic year.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const result = await generateReportCard({
        studentId: selectedStudentId,
        term: selectedTerm,
        academicYear: selectedYear,
        includeAttendance,
      });
      setReportCard(result as ReportCardResult);
      setNarrative("");
    } catch (err) {
      toast({ title: "Failed to generate", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReportCard = () => {
    if (!reportCard?.reportCardId) return;
    window.open(`/api/documents/report-card/${reportCard.reportCardId}`, "_blank", "noopener,noreferrer");
  };

  const handleGenerateNarrative = async () => {
    if (!sessionToken || !selectedStudentId || !selectedTerm) return;
    setGeneratingNarrative(true);
    try {
      const result = await generateNarrative({
        sessionToken,
        studentId: selectedStudentId,
        termId: selectedTerm,
      }) as { narrative?: string; source?: string };
      setNarrative(result.narrative ?? "");
      toast({
        title: result.source === "openrouter" ? "AI narrative generated" : "Narrative generated",
        description: result.source === "openrouter" ? "OpenRouter returned the report comment." : "Using the built-in fallback until OpenRouter is configured.",
      });
    } catch (err) {
      toast({ title: "Narrative failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setGeneratingNarrative(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Academic Reports" description="Snapshot of academic performance and individual report card generation" />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 print:hidden">
        <AdminStatsCard title="Classes" value={stats.totalClasses} description="Tracked classes" icon={BookOpen} />
        <AdminStatsCard title="Subjects" value={stats.totalSubjects} description="Configured subjects" icon={FileText} />
        <AdminStatsCard title="Teachers" value={stats.activeTeachers} description="Teaching staff" icon={Users} />
        <AdminStatsCard title="Avg Performance" value={`${stats.avgPerformance}%`} description="Current average" icon={TrendingUp} />
      </div>

      {/* Report Card Generator */}
      <Card className="print:hidden">
        <CardHeader className="flex flex-row items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Generate Report Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Student</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student..." />
                </SelectTrigger>
                <SelectContent>
                  {((students as any[]) ?? []).map((s: any) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.firstName} {s.lastName}
                      {s.admissionNumber ? ` — ${s.admissionNumber}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term..." />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year..." />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={includeAttendance}
                  onChange={(e) => setIncludeAttendance(e.target.checked)}
                  className="rounded"
                />
                Include Attendance
              </label>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating || !selectedStudentId || !selectedTerm}>
            {generating ? "Generating..." : "Generate Report Card"}
          </Button>
        </CardContent>
      </Card>

      {/* Report Card Result */}
      {reportCard && (
        <Card id="report-card-print">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                Report Card — {reportCard.student?.firstName} {reportCard.student?.lastName}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTerm} · {selectedYear}
                {reportCard.student?.admissionNumber && ` · Adm: ${reportCard.student.admissionNumber}`}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadReportCard}>
                <Download className="mr-2 h-4 w-4" />
                PDF View
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerateNarrative} disabled={generatingNarrative}>
                <Wand2 className="mr-2 h-4 w-4" />
                {generatingNarrative ? "Writing..." : "AI Remarks"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-4 rounded-lg border p-4 bg-muted/30">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{reportCard.averageScore.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Average Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{reportCard.gpa.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">GPA</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {reportCard.rank}/{reportCard.totalStudentsInClass}
                </p>
                <p className="text-xs text-muted-foreground">Class Rank</p>
              </div>
            </div>

            {/* Grades Table */}
            <div>
              <h3 className="font-semibold mb-3">Subject Grades</h3>
              {reportCard.grades.length === 0 ? (
                <p className="text-sm text-muted-foreground">No grades recorded for this term.</p>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Subject</th>
                        <th className="text-right p-3 font-medium">Score</th>
                        <th className="text-right p-3 font-medium">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCard.grades.map((grade, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-3">
                            {grade.subjectName}
                            {grade.subjectCode && <span className="text-muted-foreground ml-1">({grade.subjectCode})</span>}
                          </td>
                          <td className="p-3 text-right font-mono">{grade.score}%</td>
                          <td className="p-3 text-right">
                            <Badge variant={grade.score >= 50 ? "default" : "destructive"}>{grade.grade}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Attendance */}
            {reportCard.attendanceSummary && (
              <div>
                <h3 className="font-semibold mb-3">Attendance</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Present", value: reportCard.attendanceSummary.present },
                    { label: "Absent", value: reportCard.attendanceSummary.absent },
                    { label: "Late", value: reportCard.attendanceSummary.late },
                    { label: "Rate", value: `${reportCard.attendanceSummary.attendanceRate.toFixed(0)}%` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border p-3 text-center">
                      <p className="text-lg font-bold">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {narrative && (
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Teacher Narrative</h3>
                <p className="text-sm leading-6 text-muted-foreground">{narrative}</p>
              </div>
            )}
          </CardContent>
      </Card>
      )}
    </div>
  );
}
