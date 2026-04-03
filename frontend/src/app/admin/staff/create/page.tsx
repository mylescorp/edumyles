"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createStaffSchema } from "@shared/validators";

export default function CreateStaffPage() {
    const { isLoading, sessionToken } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createStaff = useMutation(api.modules.hr.mutations.createStaff);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "teacher",
        department: "",
        qualification: "",
        employeeId: `EMP-${Math.floor(Math.random() * 10000)}`,
        joinDate: new Date().toISOString().split("T")[0],
        status: "active",
    });

    const updateField = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const parsed = createStaffSchema.safeParse({
                tenantId: "tenant",
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || undefined,
                role: form.role,
                employeeId: form.employeeId.trim(),
                department: form.department.trim() || undefined,
                qualification: form.qualification.trim() || undefined,
                joinDate: form.joinDate,
                status: form.status,
            });

            if (!parsed.success) {
                throw new Error(parsed.error.errors[0]?.message ?? "Please fill in all required fields.");
            }

            await createStaff({
                sessionToken: sessionToken ?? undefined,
                firstName: parsed.data.firstName,
                lastName: parsed.data.lastName,
                email: parsed.data.email,
                phone: parsed.data.phone,
                role: parsed.data.role,
                department: parsed.data.department,
                qualification: parsed.data.qualification,
                employeeId: parsed.data.employeeId,
                joinDate: parsed.data.joinDate,
                status: parsed.data.status,
            });

            router.push("/admin/staff");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add staff");
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <LoadingSkeleton variant="page" />;

    return (
        <div>
            <div className="mb-4">
                <Link href="/admin/staff" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Staff
                </Link>
            </div>

            <PageHeader
                title="Add Staff Member"
                description="Add a new staff member to the school"
            />

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input id="firstName" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input id="lastName" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+254..." />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Employment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
                                <SelectTrigger id="role"><SelectValue /></SelectTrigger>
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
                            <Input id="department" value={form.department} onChange={(e) => updateField("department", e.target.value)} placeholder="e.g. Mathematics" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="qualification">Qualification</Label>
                            <Input id="qualification" value={form.qualification} onChange={(e) => updateField("qualification", e.target.value)} placeholder="e.g. B.Ed, M.Sc" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="employeeId">Employee ID *</Label>
                            <Input id="employeeId" value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="joinDate">Join Date</Label>
                            <Input id="joinDate" type="date" value={form.joinDate} onChange={(e) => updateField("joinDate", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="on_leave">On Leave</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/admin/staff">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Adding..." : "Add Staff Member"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
