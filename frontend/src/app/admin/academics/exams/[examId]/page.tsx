"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

const STATUSES = ["scheduled", "ongoing", "completed", "cancelled"] as const;

export default function AdminExamDetailPage({ params }: { params: { examId: string } }) {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const exams = useQuery(
    api.modules.academics.queries.getRecentExams,
    sessionToken ? { sessionToken, limit: 100 } : "skip"
  ) as any[] | undefined;
  const updateStatus = useMutation(api.modules.academics.mutations.updateExaminationStatus);

  if (isLoading || exams === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const exam = exams.find((entry) => entry._id === params.examId);
  if (!exam) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleStatusChange = async (status: (typeof STATUSES)[number]) => {
    try {
      await updateStatus({ id: params.examId as any, status });
      toast({
        title: "Exam updated",
        description: `Status changed to ${status}.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Unable to update exam",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={exam.name} description="Review exam progress and update its status" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span>{exam.className}</span>
            <Badge variant={exam.status === "completed" ? "default" : "outline"}>{exam.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{exam.date}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submissions</p>
              <p className="font-medium">{exam.submissions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected</p>
              <p className="font-medium">{exam.total}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <Button
                key={status}
                variant={status === exam.status ? "default" : "outline"}
                onClick={() => void handleStatusChange(status)}
              >
                Mark {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
