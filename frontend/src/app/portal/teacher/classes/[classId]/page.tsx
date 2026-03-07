"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Users, ClipboardList, BookOpen, FileText, Plus } from "lucide-react";

type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
};

type Assignment = {
  _id: string;
  title: string;
  type: string;
  dueDate: number;
  maxScore: number;
};

export default function ClassDetailsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const { user, isLoading: authLoading } = useAuth();

  const classData = useQuery(api.modules.sis.queries.listClasses, {})?.find(
    (c) => c._id === classId
  );
  const students = useQuery(api.modules.academics.queries.getClassStudents, { classId });
  const assignments = useQuery(api.modules.academics.queries.getAssignments, { classId });

  if (authLoading || classData === undefined || students === undefined)
    return <LoadingSkeleton variant="page" />;

  const studentColumns: Column<Student>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => row.email,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => row.status,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/portal/teacher/classes/${classId}/grades`}>Enter Grades</Link>
        </Button>
      ),
    },
  ];

  const assignmentColumns: Column<Assignment>[] = [
    {
      key: "title",
      header: "Title",
      cell: (row) => row.title,
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => row.type,
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (row) => new Date(row.dueDate).toLocaleDateString(),
    },
    {
      key: "maxScore",
      header: "Max Score",
      cell: (row) => row.maxScore.toString(),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/portal/teacher/assignments/${row._id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={classData.name}
        description="Manage class information, students, and assignments"
        breadcrumbs={[
          { label: "Teacher Portal", href: "/portal/teacher" },
          { label: "Classes", href: "/portal/teacher/classes" },
          { label: classData.name },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grade Level</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classData.grade}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Students</h3>
            <Button asChild>
              <Link href={`/portal/teacher/classes/${classId}/grades`}>
                <Plus className="h-4 w-4 mr-2" />
                Enter Grades
              </Link>
            </Button>
          </div>
          <DataTable data={students} columns={studentColumns} searchKey={(row) => row.firstName} />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Assignments</h3>
            <Button asChild>
              <Link href="/portal/teacher/assignments/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Link>
            </Button>
          </div>
          <DataTable
            data={assignments || []}
            columns={assignmentColumns}
            searchKey={(row) => row.title}
          />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Attendance</h3>
            <Button asChild>
              <Link href="/portal/teacher/attendance">
                <Calendar className="h-4 w-4 mr-2" />
                Record Attendance
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Attendance Tracking</h3>
              <p className="text-muted-foreground mb-4">Record daily attendance for this class</p>
              <Button asChild>
                <Link href="/portal/teacher/attendance">Record Attendance</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
