"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FileText, Calendar, ChevronRight } from "lucide-react";

type StudentAssignment = {
    _id: string;
    title: string;
    dueDate: number;
    status: "pending" | "submitted" | "graded";
    maxMarks: number;
    submission?: {
        marks?: number;
    };
};

export default function StudentAssignments() {
    const assignments = useQuery(api.modules.portal.student.queries.getMyAssignments, {}) as StudentAssignment[] | undefined;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "graded": return "bg-green-100 text-green-800";
            case "submitted": return "bg-blue-100 text-blue-800";
            default: return "bg-yellow-100 text-yellow-800";
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Assignments"
                description="Track and submit your coursework assignments."
            />

            <div className="grid gap-4">
                {assignments && assignments.length > 0 ? (
                    assignments.map((asg) => (
                        <Card key={asg._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-0">
                                <Link
                                    href={`/portal/student/assignments/${asg._id}`}
                                    className="flex items-center justify-between p-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{asg.title}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                Due: {new Date(asg.dueDate).toLocaleDateString()}
                                                {asg.dueDate < Date.now() && asg.status === "pending" && (
                                                    <span className="text-destructive font-semibold ml-2">Overdue</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <Badge className={getStatusColor(asg.status)}>
                                                {asg.status.charAt(0).toUpperCase() + asg.status.slice(1)}
                                            </Badge>
                                            {asg.submission?.marks !== undefined && (
                                                <span className="text-sm font-medium">
                                                    Score: {asg.submission.marks} / {asg.maxMarks}
                                                </span>
                                            )}
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    ))
                ) : assignments ? (
                    <Card>
                        <CardContent className="flex h-32 items-center justify-center text-muted-foreground italic">
                            No assignments found for your current class.
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="flex h-32 items-center justify-center text-muted-foreground italic">
                            Loading assignments...
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
