"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Grade = {
  _id: string;
  subjectId: string;
  assessmentType: string;
  score: number;
  maxScore: number;
  term: string;
  createdAt: number;
};

export default function StudentGrades() {
  const grades = useQuery(api.modules.portal.student.queries.getMyGrades, {});

  const columns: Column<Grade>[] = [
    {
      key: "subjectId",
      header: "Subject",
      cell: (row) => row.subjectId,
    },
    {
      key: "assessmentType",
      header: "Assessment",
      cell: (row) => row.assessmentType,
    },
    {
      key: "score",
      header: "Score",
      cell: (row) => (
        <span>
          {row.score} / {row.maxScore}
        </span>
      ),
    },
    {
      key: "percentage",
      header: "Percentage",
      cell: (row) => {
        const percentage = (row.score / row.maxScore) * 100;
        return (
          <Badge
            variant={percentage >= 50 ? "default" : "destructive"}
            className={percentage >= 50 ? "bg-green-100 text-green-800" : ""}
          >
            {percentage.toFixed(1)}%
          </Badge>
        );
      },
    },
    {
      key: "term",
      header: "Term",
      cell: (row) => row.term,
    },
    {
      key: "date",
      header: "Date",
      cell: (row) => (
        <span className="text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Grades"
        description="View your academic performance across all subjects."
      />

      <Card>
        <CardContent className="pt-6">
          {grades ? (
            <DataTable data={grades} columns={columns} />
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground italic">
              Loading grades...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
