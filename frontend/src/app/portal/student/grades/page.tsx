"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, TrendingUp } from "lucide-react";

export default function StudentGradesPage() {
  const { isLoading } = useAuth();

  const grades = useQuery(api.modules.portal.student.queries.getMyGrades, {});

  if (isLoading || grades === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const getGradeBadge = (score: number, maxScore: number) => {
    const pct = (score / maxScore) * 100;
    if (pct >= 80) return { label: "A", className: "bg-green-100 text-green-800 border-green-200" };
    if (pct >= 65) return { label: "B", className: "bg-blue-100 text-blue-800 border-blue-200" };
    if (pct >= 50) return { label: "C", className: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    if (pct >= 40) return { label: "D", className: "bg-orange-100 text-orange-800 border-orange-200" };
    return { label: "F", className: "bg-red-100 text-red-800 border-red-200" };
  };

  const overallPct =
    grades.length > 0
      ? (grades.reduce((sum, g) => sum + g.score, 0) /
          grades.reduce((sum, g) => sum + g.maxScore, 0)) *
        100
      : null;

  // Group by term
  const byTerm: Record<string, typeof grades> = {};
  for (const g of grades) {
    const term = g.term || "General";
    if (!byTerm[term]) byTerm[term] = [];
    byTerm[term].push(g);
  }

  return (
    <div>
      <PageHeader
        title="My Grades"
        description="Your academic performance across all subjects and assessments"
      />

      <div className="space-y-6">
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {overallPct !== null ? `${overallPct.toFixed(1)}%` : "--"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-500" />
                <span className="text-2xl font-bold">{grades.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Passing Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {grades.length > 0
                    ? `${Math.round(
                        (grades.filter((g) => (g.score / g.maxScore) * 100 >= 50).length /
                          grades.length) *
                          100
                      )}%`
                    : "--"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grades by term */}
        {grades.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Grades Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Your grades will appear here once your teachers have recorded assessments.
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(byTerm).map(([term, termGrades]) => (
            <Card key={term}>
              <CardHeader>
                <CardTitle>{term}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                          Subject
                        </th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                          Assessment
                        </th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                          Score
                        </th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                          Percentage
                        </th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {termGrades.map((grade, i) => {
                        const pct = (grade.score / grade.maxScore) * 100;
                        const badge = getGradeBadge(grade.score, grade.maxScore);
                        return (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-3 pr-4 font-medium">{grade.subjectId}</td>
                            <td className="py-3 pr-4 text-muted-foreground capitalize">
                              {grade.assessmentType}
                            </td>
                            <td className="py-3 pr-4">
                              {grade.score} / {grade.maxScore}
                            </td>
                            <td className="py-3 pr-4">{pct.toFixed(1)}%</td>
                            <td className="py-3">
                              <Badge className={badge.className} variant="outline">
                                {badge.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
