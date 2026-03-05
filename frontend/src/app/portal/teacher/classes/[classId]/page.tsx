"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Users, ClipboardList, BookOpen } from "lucide-react";

export default function ClassDetailsPage({ params }: { params: Promise<{ classId: string }> }) {
    const { classId } = use(params);
    const { user, isLoading: authLoading } = useAuth();

    const classData = useQuery(api.modules.sis.queries.listClasses, {})?.find(c => c._id === classId);
    const students = useQuery(api.modules.academics.queries.getClassStudents, { classId });
    const assignments = useQuery(api.modules.academics.queries.getAssignments, { classId });

    if (authLoading || classData === undefined || students === undefined) return <LoadingSkeleton variant="page" />;

    const studentColumns = [
        { key: "name", header: "Name", cell: (row: any) => `${row.firstName} ${row.lastName}` },
        { key: "admissionNumber", header: "Admission No.", cell: (row: any) => row.admissionNumber },
        { key: "gender", header: "Gender", cell: (row: any) => row.gender },
        { key: "status", header: "Status", cell: (row: any) => row.status },
    ];

    const assignmentColumns = [
        { key: "title", header: "Title", cell: (row: any) => row.title },
        { key: "dueDate", header: "Due Date", cell: (row: any) => row.dueDate },
        { key: "maxPoints", header: "Max Points", cell: (row: any) => row.maxPoints },
        { key: "status", header: "Status", cell: (row: any) => row.status },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title={classData.name}
                description={`${classData.level || "Grade"} ${classData.stream || ""} • ${students.length} Students`}
                breadcrumbs={[
                    { label: "Classes", href: "/portal/teacher/classes" },
                    { label: "Class Details" }
                ]}
            />

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Students</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{students.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{assignments?.length || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Class Attendance</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">--</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">No recent activity for this class.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <Button asChild>
                                    <Link href={`/portal/teacher/classes/${classId}/grades`}>
                                        <ClipboardList className="mr-2 h-4 w-4" />
                                        Open Gradebook
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={`/portal/teacher/attendance?classId=${classId}`}>
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Mark Attendance
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="students" className="space-y-4">
                    <DataTable
                        columns={studentColumns}
                        data={students}
                        searchKey={(row: any) => row.firstName}
                    />
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <CardTitle>Assignments</CardTitle>
                        <Button asChild size="sm">
                            <Link href="/portal/teacher/assignments/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Assignment
                            </Link>
                        </Button>
                    </div>
                    <DataTable
                        columns={assignmentColumns}
                        data={assignments || []}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Helper icons
import { FileText, Plus } from "lucide-react";
