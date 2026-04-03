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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClassSchema } from "@shared/validators";

export default function CreateClassPage() {
    const { isLoading } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createClass = useMutation(api.modules.sis.mutations.createClass);

    const [form, setForm] = useState({
        name: "",
        level: "",
        stream: "",
        capacity: "",
        academicYear: "",
    });

    const updateField = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const parsed = createClassSchema.safeParse({
                name: form.name.trim(),
                level: form.level.trim() || undefined,
                stream: form.stream.trim() || undefined,
                capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
                academicYear: form.academicYear.trim() || undefined,
            });

            if (!parsed.success) {
                throw new Error(parsed.error.errors[0]?.message ?? "Class details are invalid.");
            }

            await createClass({
                ...parsed.data,
            });

            router.push("/admin/classes");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create class");
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <LoadingSkeleton variant="page" />;

    return (
        <div>
            <div className="mb-4">
                <Link href="/admin/classes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Classes
                </Link>
            </div>

            <PageHeader
                title="Create New Class"
                description="Add a new class to the school"
            />

            <form onSubmit={handleSubmit} className="mt-6">
                {error && (
                    <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Class Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Class Name *</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                placeholder="e.g. Grade 1A"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="level">Level / Grade</Label>
                            <Input
                                id="level"
                                value={form.level}
                                onChange={(e) => updateField("level", e.target.value)}
                                placeholder="e.g. Grade 1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stream">Stream</Label>
                            <Input
                                id="stream"
                                value={form.stream}
                                onChange={(e) => updateField("stream", e.target.value)}
                                placeholder="e.g. East"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity">Capacity</Label>
                            <Input
                                id="capacity"
                                type="number"
                                value={form.capacity}
                                onChange={(e) => updateField("capacity", e.target.value)}
                                placeholder="e.g. 40"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="academicYear">Academic Year</Label>
                            <Input
                                id="academicYear"
                                value={form.academicYear}
                                onChange={(e) => updateField("academicYear", e.target.value)}
                                placeholder="e.g. 2026"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-end gap-3">
                    <Link href="/admin/classes">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Creating..." : "Create Class"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
