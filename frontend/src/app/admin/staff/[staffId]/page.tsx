"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Mail, Phone, UserCircle, Calendar, Briefcase } from "lucide-react";
import Link from "next/link";

export default function StaffProfilePage() {
    const { staffId } = useParams<{ staffId: string }>();
    const { isLoading, sessionToken } = useAuth();
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const staff = useQuery(
        api.modules.hr.queries.getStaffMember,
        sessionToken && staffId ? { staffId: staffId as Id<"staff">, sessionToken } : "skip"
    );
    const updateStaff = useMutation(api.modules.hr.mutations.updateStaff);

    if (isLoading || staff === undefined) return <LoadingSkeleton variant="page" />;

    if (!staff) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Staff member not found.</p>
                <Link href="/admin/staff">
                    <Button variant="outline" className="mt-4">Back to Staff</Button>
                </Link>
            </div>
        );
    }

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        active: "default",
        inactive: "secondary",
        on_leave: "outline",
        terminated: "destructive",
    };
    const staffStatus = typeof staff.status === "string" && staff.status.length > 0 ? staff.status : "unknown";
    const staffRole = typeof staff.role === "string" && staff.role.length > 0 ? staff.role : "staff_member";

    const handleEditSubmit = async (formData: FormData) => {
        setSubmitting(true);
        try {
            await updateStaff({
                id: staffId as Id<"staff">,
                firstName: String(formData.get("firstName") ?? "").trim(),
                lastName: String(formData.get("lastName") ?? "").trim(),
                email: String(formData.get("email") ?? "").trim(),
                phone: String(formData.get("phone") ?? "").trim() || undefined,
                role: String(formData.get("role") ?? "").trim(),
                department: String(formData.get("department") ?? "").trim() || undefined,
                qualification: String(formData.get("qualification") ?? "").trim() || undefined,
                status: String(formData.get("status") ?? "").trim(),
            });
            setShowEditDialog(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div className="mb-4">
                <Link href="/admin/staff" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Staff
                </Link>
            </div>

            <PageHeader
                title={`${staff.firstName} ${staff.lastName}`}
                description={`Employee ID: ${staff.employeeId}`}
                actions={
                    <Button variant="outline" onClick={() => setShowEditDialog(true)}>Edit Profile</Button>
                }
            />

            <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={UserCircle} label="Full Name" value={`${staff.firstName} ${staff.lastName}`} />
                        <InfoRow icon={Mail} label="Email" value={staff.email} />
                        <InfoRow icon={Phone} label="Phone" value={staff.phone ?? "—"} />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant={statusColors[staffStatus] ?? "outline"}>
                                {staffStatus.replace(/_/g, " ")}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Employment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={Briefcase} label="Role" value={staffRole.replace(/_/g, " ")} />
                        <InfoRow icon={Briefcase} label="Department" value={staff.department ?? "—"} />
                        <InfoRow icon={UserCircle} label="Qualification" value={staff.qualification ?? "—"} />
                        <InfoRow icon={Calendar} label="Join Date" value={staff.joinDate} />
                        <InfoRow icon={UserCircle} label="Employee ID" value={staff.employeeId} />
                    </CardContent>
                </Card>
            </div>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Staff Profile</DialogTitle>
                    </DialogHeader>
                    <form action={handleEditSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" name="firstName" defaultValue={staff.firstName} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" name="lastName" defaultValue={staff.lastName} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={staff.email} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" defaultValue={staff.phone ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select name="role" defaultValue={staffRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="principal">Principal</SelectItem>
                                        <SelectItem value="bursar">Bursar</SelectItem>
                                        <SelectItem value="hr_manager">HR Manager</SelectItem>
                                        <SelectItem value="librarian">Librarian</SelectItem>
                                        <SelectItem value="transport_manager">Transport Manager</SelectItem>
                                        <SelectItem value="receptionist">Receptionist</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input id="department" name="department" defaultValue={staff.department ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="qualification">Qualification</Label>
                                <Input id="qualification" name="qualification" defaultValue={staff.qualification ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={staffStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="on_leave">On Leave</SelectItem>
                                        <SelectItem value="terminated">Terminated</SelectItem>
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
