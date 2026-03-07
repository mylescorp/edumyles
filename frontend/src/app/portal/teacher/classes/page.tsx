"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, BookOpen, Calendar, ArrowRight } from "lucide-react";

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
                description="Manage your assigned classes and student information"
                breadcrumbs={[
                    { label: "Teacher Portal", href: "/portal/teacher" },
                    { label: "Classes" }
                ]}
            />

            {classes.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No classes assigned</h3>
                        <p className="text-muted-foreground mb-4">
                            You do not have any classes assigned to you yet.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {classes.map((classData: any) => (
                        <Card key={classData._id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    {classData.name}
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/portal/teacher/classes/${classData._id}`}>
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardTitle>
                                <CardDescription>
                                    Grade {classData.grade} • {classData.subject}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>Students enrolled</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Academic Year 2024</span>
                                    </div>
                                    <div className="pt-4 space-y-2">
                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href={`/portal/teacher/classes/${classData._id}/grades`}>
                                                Enter Grades
                                            </Link>
                                        </Button>
                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href={`/portal/teacher/attendance`}>
                                                Take Attendance
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

