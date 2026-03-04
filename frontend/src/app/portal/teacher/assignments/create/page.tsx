"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function CreateAssignmentPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const classes = useQuery(
        api.modules.academics.queries.getTeacherClasses,
        {}
    );

    const createAssignmentMutation = useMutation(api.modules.academics.mutations.createAssignment);

    if (authLoading || classes === undefined) return <LoadingSkeleton variant="page" />;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            classId: formData.get("classId") as string,
            subjectId: formData.get("subjectId") as string,
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            dueDate: formData.get("dueDate") as string,
            maxPoints: parseInt(formData.get("maxPoints") as string, 10),
            status: "active",
        };

        try {
            await createAssignmentMutation(data);
            toast({ title: "Success", description: "Assignment created successfully." });
            router.push("/portal/teacher/assignments");
        } catch (error) {
            toast({ title: "Error", description: "Failed to create assignment.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title="New Assignment"
                description="Create a new assessment for your students."
                backHref="/portal/teacher/assignments"
            />

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Class</label>
                                <Select name="classId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(cls => (
                                            <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <Select name="subjectId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="math">Mathematics</SelectItem>
                                        <SelectItem value="eng">English</SelectItem>
                                        <SelectItem value="sci">Science</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Assignment Title</label>
                            <Input name="title" placeholder="e.g. Algebra Quiz 1" required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea name="description" placeholder="Describe the assignment details..." className="h-32" required />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Due Date</label>
                                <Input name="dueDate" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Max Points</label>
                                <Input name="maxPoints" type="number" defaultValue="100" required />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Create Assignment"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
