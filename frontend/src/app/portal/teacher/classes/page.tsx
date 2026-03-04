"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Users, ChevronRight } from "lucide-react";

export default function MyClassesPage() {
    const { user, isLoading: authLoading } = useAuth();

    const classes = useQuery(
        api.modules.academics.queries.getTeacherClasses,
        {}
    );

    if (authLoading || classes === undefined) return <LoadingSkeleton variant="page" />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Classes"
                description="Manage your assigned classes, students, and grades."
            />

            {classes.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle>No Classes Assigned</CardTitle>
                    <CardDescription>
                        You don't have any classes assigned to you yet. Please contact the administrator.
                    </CardDescription>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {classes.map((cls) => (
                        <Card key={cls._id} className="overflow-hidden">
                            <CardHeader className="bg-muted/50 pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl">{cls.name}</CardTitle>
                                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <CardDescription>
                                    {cls.level || "Grade"} {cls.stream || ""}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                                    <Users className="h-4 w-4" />
                                    <span>{cls.capacity || 0} Students enrolled</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button asChild variant="outline" className="w-full justify-between">
                                        <Link href={`/portal/teacher/classes/${cls._id}`}>
                                            View Class Details
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="secondary" className="w-full justify-between">
                                        <Link href={`/portal/teacher/classes/${cls._id}/grades`}>
                                            Enter Grades
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
