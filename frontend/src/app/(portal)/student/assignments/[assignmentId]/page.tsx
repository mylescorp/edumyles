"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { FileText, Calendar, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AssignmentDetail() {
    const { assignmentId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const assignments = useQuery(api.modules.portal.student.queries.getMyAssignments, {});
    const submitAssignment = useMutation(api.modules.portal.student.mutations.submitAssignment);

    const [submitting, setSubmitting] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState("");

    const assignment = assignments?.find(a => a._id === assignmentId);

    if (!assignment) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground italic">
                Loading assignment details...
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!attachmentUrl) {
            toast({ title: "Please provide an attachment URL", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            await submitAssignment({
                assignmentId: assignment._id,
                attachments: [attachmentUrl],
            });
            toast({ title: "Assignment submitted successfully!", variant: "default" });
            router.refresh();
        } catch (error: any) {
            toast({ title: "Failed to submit assignment", description: error.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={assignment.title}
                description={`Subject: ${assignment.subjectId}`}
                breadcrumbs={[
                    { label: "Assignments", href: "/portal/student/assignments" },
                    { label: assignment.title }
                ]}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-muted-foreground">
                                {assignment.description || "No description provided."}
                            </p>
                        </CardContent>
                    </Card>

                    {assignment.status !== "pending" && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {assignment.status === "graded" ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Upload className="h-5 w-5 text-blue-500" />}
                                    Your Submission
                                </CardTitle>
                                <CardDescription>
                                    Submitted on {new Date(assignment.submission?.submittedAt || 0).toLocaleString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs uppercase text-muted-foreground">Attachments</Label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {assignment.submission?.attachments.map((url, i) => (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 p-2 rounded border bg-background hover:bg-accent transition-colors"
                                                >
                                                    <FileText className="h-4 w-4 text-primary" />
                                                    <span className="text-sm truncate max-w-[200px]">{url}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>

                                    {assignment.status === "graded" && (
                                        <div className="pt-4 border-t">
                                            <Label className="text-xs uppercase text-muted-foreground">Feedback & Grade</Label>
                                            <div className="mt-2 p-4 rounded bg-background border">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-lg">Score: {assignment.submission?.marks} / {assignment.maxMarks}</span>
                                                    <Badge className="bg-green-100 text-green-800">Graded</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground italic">
                                                    "{assignment.submission?.feedback || "No feedback provided."}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {assignment.status === "pending" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Submit Assignment</CardTitle>
                                <CardDescription>
                                    Upload your work or provide a link to your submission.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="url">Attachment URL</Label>
                                        <Input
                                            id="url"
                                            placeholder="https://example.com/my-work.pdf"
                                            value={attachmentUrl}
                                            onChange={(e) => setAttachmentUrl(e.target.value)}
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            For this demo, please provide a direct link to your file.
                                        </p>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={submitting}>
                                        {submitting ? "Submitting..." : "Submit My Work"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Deadlines</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Due Date</span>
                                </div>
                                <span className={cn("font-medium", assignment.dueDate < Date.now() ? "text-destructive" : "")}>
                                    {new Date(assignment.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Max Marks</span>
                                </div>
                                <span className="font-medium">{assignment.maxMarks} pts</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Status</span>
                                </div>
                                <Badge variant={assignment.status === "pending" ? "outline" : "default"}>
                                    {assignment.status.toUpperCase()}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
