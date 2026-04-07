"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DataTable, Column } from "@/components/shared/DataTable";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Users, UserCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { Id } from "@/convex/_generated/dataModel";

export default function ClassDetailPage() {
    const { classId } = useParams<{ classId: string }>();
    const { isLoading, sessionToken } = useAuth();
    const router = useRouter();
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const classes = useQuery(
        api.modules.sis.queries.listClasses,
        sessionToken ? { sessionToken } : "skip"
    );
    const teachers = useQuery(
        api.modules.hr.queries.listStaff,
        sessionToken ? { sessionToken, role: "teacher" } : "skip"
    );

    const students = useQuery(
        api.modules.sis.queries.listStudents,
        sessionToken && classId ? { sessionToken, classId } : "skip"
    );
    const updateClass = useMutation(api.modules.sis.mutations.updateClass);
    const deleteClass = useMutation(api.modules.sis.mutations.deleteClass);

    if (isLoading || classes === undefined) return <LoadingSkeleton variant="page" />;

    const classInfo = (classes.data as any[])?.find((c) => c._id === classId);

    if (!classInfo) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Class not found.</p>
                <Link href="/admin/classes">
                    <Button variant="outline" className="mt-4">Back to Classes</Button>
                </Link>
            </div>
        );
    }

    type StudentRow = {
        _id: string;
        firstName: string;
        lastName: string;
        admissionNumber: string;
        status: string;
        gender: string;
    };

    const studentColumns: Column<StudentRow>[] = [
        {
            key: "admissionNumber",
            header: "Adm. No.",
            cell: (row) => (
                <Link href={`/admin/students/${row._id}`} className="font-medium text-primary hover:underline">
                    {row.admissionNumber}
                </Link>
            ),
        },
        {
            key: "name",
            header: "Name",
            cell: (row) => `${row.firstName} ${row.lastName}`,
            sortable: true,
        },
        {
            key: "gender",
            header: "Gender",
            cell: (row) => row.gender,
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status}</Badge>,
        },
    ];

    const handleEditSubmit = async (formData: FormData) => {
        setSubmitting(true);
        try {
            const teacherId = String(formData.get("teacherId") ?? "").trim();
            await updateClass({
                id: classId as Id<"classes">,
                name: String(formData.get("name") ?? "").trim(),
                level: String(formData.get("level") ?? "").trim() || undefined,
                stream: String(formData.get("stream") ?? "").trim() || undefined,
                teacherId: teacherId && teacherId !== "__none__" ? teacherId : undefined,
                capacity: formData.get("capacity") ? Number(formData.get("capacity")) : undefined,
                academicYear: String(formData.get("academicYear") ?? "").trim() || undefined,
            });
            setShowEditDialog(false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClass = async () => {
        setDeleting(true);
        try {
            await deleteClass({ classId: classId as Id<"classes"> });
            setShowDeleteConfirm(false);
            router.push("/admin/classes");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="mb-4">
                <Link href="/admin/classes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Classes
                </Link>
            </div>

            <PageHeader
                title={classInfo.name}
                description={[classInfo.level, classInfo.stream, classInfo.academicYear].filter(Boolean).join(" • ") || "Class details"}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowEditDialog(true)}>Edit Class</Button>
                        <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={classInfo.studentCount > 0}>
                            Delete Class
                        </Button>
                    </div>
                }
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="flex items-center gap-3 pt-6">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-2xl font-bold">{classInfo.studentCount}</p>
                            <p className="text-sm text-muted-foreground">
                                Students {classInfo.capacity ? `/ ${classInfo.capacity} capacity` : ""}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 pt-6">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm font-medium">{classInfo.level ?? "—"}</p>
                            <p className="text-sm text-muted-foreground">Level</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 pt-6">
                        <UserCircle className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm font-medium">{classInfo.stream ?? "—"}</p>
                            <p className="text-sm text-muted-foreground">Stream</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold">Class Roster</h3>
                <DataTable
                    data={(students as StudentRow[]) ?? []}
                    columns={studentColumns}
                    searchable
                    searchPlaceholder="Search students in class..."
                    searchKey={(row) => `${row.firstName} ${row.lastName} ${row.admissionNumber}`}
                    emptyTitle="No students in this class"
                    emptyDescription="Assign students to this class from the student management page."
                />
            </div>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Class</DialogTitle>
                    </DialogHeader>
                    <form action={handleEditSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Class Name</Label>
                                <Input id="name" name="name" defaultValue={classInfo.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="level">Level</Label>
                                <Input id="level" name="level" defaultValue={classInfo.level ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stream">Stream</Label>
                                <Input id="stream" name="stream" defaultValue={classInfo.stream ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Capacity</Label>
                                <Input id="capacity" name="capacity" type="number" min="1" defaultValue={classInfo.capacity ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="academicYear">Academic Year</Label>
                                <Input id="academicYear" name="academicYear" defaultValue={classInfo.academicYear ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="teacherId">Class Teacher</Label>
                                <Select name="teacherId" defaultValue={classInfo.teacherId ?? "__none__"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Unassigned</SelectItem>
                                        {((teachers as any[]) ?? []).map((teacher) => (
                                            <SelectItem key={teacher._id} value={teacher._id}>
                                                {teacher.firstName} {teacher.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete Class"
                description={
                    classInfo.studentCount > 0
                        ? "This class still has enrolled students and cannot be deleted until it is empty."
                        : `Are you sure you want to delete ${classInfo.name}? This cannot be undone.`
                }
                onConfirm={handleDeleteClass}
                confirmLabel="Delete"
                variant="destructive"
                isLoading={deleting}
            />
        </div>
    );
}
