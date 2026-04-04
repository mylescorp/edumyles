"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function CreateAssignmentPage() {
    const { isLoading: authLoading, sessionToken } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedType, setSelectedType] = useState("homework");

    const classes = useQuery(
        api.modules.academics.queries.getTeacherClasses,
        sessionToken ? { sessionToken } : "skip"
    );

    const createAssignmentMutation = useMutation(api.modules.academics.mutations.createAssignment);

    if (authLoading || classes === undefined) return <LoadingSkeleton variant="page" />;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            classId: selectedClassId,
            dueDate: formData.get("dueDate") as string,
            maxScore: parseInt(formData.get("maxScore") as string),
            type: selectedType,
            status: "active",
        };

        try {
            await createAssignmentMutation(data);
            toast({
                title: "Assignment created",
                description: "The assignment has been created successfully.",
            });
            router.push("/portal/teacher/assignments");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create assignment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Create Assignment"
                description="Create a new assignment for your students"
                breadcrumbs={[
                    { label: "Assignments", href: "/portal/teacher/assignments" },
                    { label: "Create" }
                ]}
            />

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium mb-2">
                                Assignment Title
                            </label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="Enter assignment title"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium mb-2">
                                Description
                            </label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Enter assignment description"
                                rows={4}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="classId" className="block text-sm font-medium mb-2">
                                Class
                            </label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls: any) => (
                                        <SelectItem key={cls._id} value={cls._id}>
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium mb-2">
                                Due Date
                            </label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="maxScore" className="block text-sm font-medium mb-2">
                                Maximum Score
                            </label>
                            <Input
                                id="maxScore"
                                name="maxScore"
                                type="number"
                                placeholder="100"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="type" className="block text-sm font-medium mb-2">
                                Assignment Type
                            </label>
                            <Select value={selectedType} onValueChange={setSelectedType} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select assignment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="homework">Homework</SelectItem>
                                    <SelectItem value="quiz">Quiz</SelectItem>
                                    <SelectItem value="test">Test</SelectItem>
                                    <SelectItem value="project">Project</SelectItem>
                                    <SelectItem value="exam">Exam</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Create Assignment"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
