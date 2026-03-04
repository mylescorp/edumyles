"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StudentGrades() {
    const grades = useQuery(api.modules.portal.student.queries.getMyGrades, {});

    const columns = [
        {
            header: "Subject",
            accessorKey: "subjectId", // In a real app, this would be joined with subject name
        },
        {
            header: "Assessment",
            accessorKey: "assessmentType",
        },
        {
            header: "Score",
            cell: ({ row }: any) => (
                <span>{row.original.score} / {row.original.maxScore}</span>
            ),
        },
        {
            header: "Percentage",
            cell: ({ row }: any) => {
                const percentage = (row.original.score / row.original.maxScore) * 100;
                return (
                    <Badge variant={percentage >= 50 ? "success" : "destructive"} className={percentage >= 50 ? "bg-green-100 text-green-800" : ""}>
                        {percentage.toFixed(1)}%
                    </Badge>
                );
            },
        },
        {
            header: "Term",
            accessorKey: "term",
        },
        {
            header: "Date",
            cell: ({ row }: any) => (
                <span className="text-muted-foreground">
                    {new Date(row.original.createdAt).toLocaleDateString()}
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
                        <DataTable columns={columns} data={grades} />
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
