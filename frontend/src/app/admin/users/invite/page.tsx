"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";

export default function InviteUserPage() {
    const { isLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inviteUser = useMutation((api as any).users.inviteTenantUser);

    const [form, setForm] = useState({
        email: "",
        firstName: "",
        lastName: "",
        role: "teacher",
    });

    const updateField = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (!form.email) throw new Error("Email is required.");
            await inviteUser({
                email: form.email.trim().toLowerCase(),
                firstName: form.firstName.trim() || undefined,
                lastName: form.lastName.trim() || undefined,
                role: form.role,
            });
            toast({
                title: "User invited",
                description: "The user was added with a pending invitation profile.",
            });
            router.push("/admin/users");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to invite user");
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <LoadingSkeleton variant="page" />;

    return (
        <div>
            <div className="mb-4">
                <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Users
                </Link>
            </div>

            <PageHeader
                title="Invite User"
                description="Send an invitation to join your school"
            />

            <form onSubmit={handleSubmit} className="mt-6">
                {error && (
                    <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">User Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
                                <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="school_admin">School Admin</SelectItem>
                                    <SelectItem value="principal">Principal</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="bursar">Bursar</SelectItem>
                                    <SelectItem value="hr_manager">HR Manager</SelectItem>
                                    <SelectItem value="librarian">Librarian</SelectItem>
                                    <SelectItem value="transport_manager">Transport Manager</SelectItem>
                                    <SelectItem value="receptionist">Receptionist</SelectItem>
                                    <SelectItem value="parent">Parent</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-end gap-3">
                    <Link href="/admin/users">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Sending..." : "Send Invitation"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
