"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, GraduationCap, UserCircle, Mail, Phone, Calendar } from "lucide-react";
import Link from "next/link";

export default function StudentProfilePage() {
    const { studentId } = useParams<{ studentId: string }>();
    const { isLoading, sessionToken } = useAuth();
    const [showGraduateConfirm, setShowGraduateConfirm] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const student = useQuery(
        api.modules.sis.queries.getStudent,
        sessionToken && studentId
            ? { studentId: studentId as Id<"students">, sessionToken }
            : "skip"
    );
    const classes = useQuery(
        api.modules.sis.queries.listClasses,
        sessionToken ? { sessionToken } : "skip"
    );

    const graduateStudent = useMutation(api.modules.sis.mutations.graduateStudent);
    const updateStudent = useMutation(api.modules.sis.mutations.updateStudent);

    if (isLoading || student === undefined) return <LoadingSkeleton variant="page" />;
    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Student not found.</p>
                <Link href="/admin/students">
                    <Button variant="outline" className="mt-4">Back to Students</Button>
                </Link>
            </div>
        );
    }

    const handleGraduate = async () => {
        await graduateStudent({ studentId: studentId as Id<"students"> });
        setShowGraduateConfirm(false);
    };

    const handleEditSubmit = async (formData: FormData) => {
        setSubmitting(true);
        try {
            const selectedClassId = String(formData.get("classId") ?? "").trim();
            await updateStudent({
                id: studentId as Id<"students">,
                firstName: String(formData.get("firstName") ?? "").trim(),
                lastName: String(formData.get("lastName") ?? "").trim(),
                dateOfBirth: String(formData.get("dateOfBirth") ?? "").trim(),
                gender: String(formData.get("gender") ?? "").trim(),
                classId: selectedClassId && selectedClassId !== "__none__" ? selectedClassId : undefined,
                status: String(formData.get("status") ?? "").trim(),
            });
            setShowEditDialog(false);
        } finally {
            setSubmitting(false);
        }
    };

    const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
        active: "default",
        graduated: "secondary",
        suspended: "destructive",
    };

    return (
        <div>
            <div className="mb-4">
                <Link href="/admin/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Students
                </Link>
            </div>

            <PageHeader
                title={`${student.firstName} ${student.lastName}`}
                description={`Admission No: ${student.admissionNumber}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                            Edit Profile
                        </Button>
                        {student.status === "active" && (
                            <Button variant="destructive" onClick={() => setShowGraduateConfirm(true)}>
                                <GraduationCap className="mr-2 h-4 w-4" />
                                Graduate
                            </Button>
                        )}
                    </div>
                }
            />

            <Tabs defaultValue="info" className="mt-6">
                <TabsList>
                    <TabsTrigger value="info">Information</TabsTrigger>
                    <TabsTrigger value="guardians">Guardians</TabsTrigger>
                    <TabsTrigger value="academics">Academics</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <InfoRow icon={UserCircle} label="Full Name" value={`${student.firstName} ${student.lastName}`} />
                                <InfoRow icon={Calendar} label="Date of Birth" value={student.dateOfBirth} />
                                <InfoRow icon={UserCircle} label="Gender" value={student.gender} />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge variant={statusColors[student.status] ?? "outline"}>{student.status}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Academic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <InfoRow icon={GraduationCap} label="Admission No." value={student.admissionNumber} />
                                <InfoRow
                                    icon={UserCircle}
                                    label="Class"
                                    value={student.class?.name ?? "Not assigned"}
                                />
                                <InfoRow
                                    icon={Calendar}
                                    label="Enrolled"
                                    value={new Date(student.enrolledAt).toLocaleDateString()}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="guardians" className="mt-4">
                    {student.guardians && student.guardians.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {(student.guardians as any[]).map((g) => (
                                <Card key={g._id}>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            {g.firstName} {g.lastName}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <InfoRow icon={UserCircle} label="Relationship" value={g.relationship} />
                                        <InfoRow icon={Mail} label="Email" value={g.email} />
                                        <InfoRow icon={Phone} label="Phone" value={g.phone} />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                No guardians linked to this student.
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="academics" className="mt-4">
                    <Card>
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            Academic records will be available once the Academics module is installed.
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConfirmDialog
                open={showGraduateConfirm}
                onOpenChange={setShowGraduateConfirm}
                title="Graduate Student"
                description={`Are you sure you want to mark ${student.firstName} ${student.lastName} as graduated? This action can be reversed later.`}
                onConfirm={handleGraduate}
                confirmLabel="Graduate"
                variant="destructive"
            />

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Student Profile</DialogTitle>
                    </DialogHeader>
                    <form action={handleEditSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" name="firstName" defaultValue={student.firstName} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" name="lastName" defaultValue={student.lastName} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={student.dateOfBirth} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select name="gender" defaultValue={student.gender}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="classId">Class</Label>
                                <Select name="classId" defaultValue={student.classId ?? "__none__"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Unassigned</SelectItem>
                                        {((classes as any[]) ?? []).map((classRow) => (
                                            <SelectItem key={classRow._id} value={classRow._id}>
                                                {classRow.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={student.status}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="transferred">Transferred</SelectItem>
                                        <SelectItem value="graduated">Graduated</SelectItem>
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
        </div>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
