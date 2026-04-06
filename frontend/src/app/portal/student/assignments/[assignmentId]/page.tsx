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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, FileText, Clock, CheckCircle, Upload, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export default function AssignmentDetailPage() {
  const { user, isLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState("");

  const assignmentId = params.assignmentId as string;

  const assignment = useQuery(
    api.modules.academics.queries.getAssignment,
    assignmentId ? { assignmentId } : "skip"
  );

  const mySubmission = useQuery(
    api.modules.portal.student.queries.getMySubmission,
    (user && assignmentId) ? { assignmentId } : "skip"
  );

  const submitAssignment = useMutation(api.modules.portal.student.mutations.submitAssignment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !assignmentId) return;

    setIsSubmitting(true);
    
    try {
      const submissionData: any = {
        text: submissionText,
        submittedAt: Date.now(),
      };

      // Add file if selected
      if (selectedFile) {
        // In a real implementation, you'd upload the file to storage
        // For now, we'll simulate file upload
        submissionData.attachments = [selectedFile.name];
      }

      await submitAssignment({
        assignmentId,
        attachments: submissionData.attachments || [],
      });

      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been submitted successfully.",
      });

      router.push("/portal/student/assignments");
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  if (isLoading || !assignment) {
    return <LoadingSkeleton variant="page" />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "submitted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "graded":
        return "bg-green-100 text-green-800 border-green-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status === "pending";
  const canSubmit = assignment.status === "pending" && !isOverdue;

  return (
    <div>
      <PageHeader
        title={assignment.title}
        description={`${assignment.subject} • ${assignment.className}`}
      />

      <div className="space-y-6">
        {/* Assignment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Assignment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Subject</Label>
                <p className="text-sm">{assignment.subject}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Class</Label>
                <p className="text-sm">{assignment.className}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assigned Date</Label>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(assignment.createdAt), "PPP")}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Due Date</Label>
                <div className={`flex items-center space-x-2 text-sm ${isOverdue ? "text-red-600" : ""}`}>
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(assignment.dueDate), "PPP")}</span>
                  {isOverdue && <span className="ml-2 text-red-600 font-medium">(Overdue)</span>}
                </div>
              </div>
            </div>

            {assignment.description && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>
              </div>
            )}

            {assignment.maxGrade && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Maximum Grade</Label>
                <p className="text-sm font-medium">{assignment.maxGrade} points</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Badge 
                className={`${getStatusColor(assignment.status)}`}
                variant="outline"
              >
                <div className="flex items-center space-x-1">
                  {assignment.status === "pending" && <Clock className="h-4 w-4" />}
                  {assignment.status === "submitted" && <FileText className="h-4 w-4" />}
                  {assignment.status === "graded" && <CheckCircle className="h-4 w-4" />}
                  <span className="capitalize">{assignment.status}</span>
                </div>
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Submission Form */}
        {canSubmit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Submit Assignment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="submission-text">Submission Text</Label>
                  <Textarea
                    id="submission-text"
                    placeholder="Enter your assignment text or comments here..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    rows={4}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload">Attach File (Optional)</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Selected: {selectedFile.name}</span>
                        <span className="text-muted-foreground">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || (!submissionText.trim() && !selectedFile)}
                    className="flex-1"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Assignment"}
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
        )}

        {/* Submission Status */}
        {mySubmission && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Your Submission</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Submitted At</Label>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(mySubmission.submittedAt), "PPP")}</span>
                  </div>
                </div>
                {mySubmission.gradedAt && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Graded At</Label>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(mySubmission.gradedAt), "PPP")}</span>
                    </div>
                  </div>
                )}
              </div>

              {mySubmission.text && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Submission Text</Label>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                    {mySubmission.text}
                  </p>
                </div>
              )}

              {mySubmission.fileName && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Attached File</Label>
                  <div className="flex items-center space-x-2 text-sm p-2 bg-muted rounded">
                    <FileText className="h-4 w-4" />
                    <span>{mySubmission.fileName}</span>
                  </div>
                </div>
              )}

              {mySubmission.grade !== undefined && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Grade</Label>
                  <div className="text-2xl font-bold text-green-600">
                    {mySubmission.grade} / {assignment.maxGrade}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {mySubmission.grade >= assignment.maxGrade * 0.6 
                      ? "Good work! 🎉" 
                      : mySubmission.grade >= assignment.maxGrade * 0.4 
                      ? "Keep working hard! 💪" 
                      : "Consider seeking help 📚"}
                  </div>
                </div>
              )}

              {mySubmission.feedback && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Teacher Feedback</Label>
                  <div className="text-sm whitespace-pre-wrap bg-blue-50 p-3 rounded border border-blue-200">
                    {mySubmission.feedback}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Overdue Warning */}
        {isOverdue && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This assignment is overdue. Please contact your teacher as soon as possible to discuss submission options.
            </AlertDescription>
          </Alert>
        )}

        {/* Already Graded Notice */}
        {assignment.status === "graded" && !mySubmission && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This assignment has been graded. View your grade and feedback above.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
