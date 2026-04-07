"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

export default function AdminCreateAssignmentPage() {
  const { isLoading: authLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedType, setSelectedType] = useState("homework");

  const classes = useQuery(
    api.modules.sis.queries.listClasses,
    sessionToken ? { sessionToken } : "skip"
  );
  const createAssignment = useMutation(api.modules.academics.mutations.createAssignment);

  if (authLoading || classes === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      await createAssignment({
        sessionToken: sessionToken ?? undefined,
        classId: selectedClassId,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        dueDate: String(formData.get("dueDate") ?? ""),
        maxScore: Number(formData.get("maxScore") ?? 100),
        type: selectedType,
        status: "active",
      });

      toast({
        title: "Assignment created",
        description: "The assignment is ready for students.",
      });
      router.push("/admin/academics");
    } catch (error) {
      toast({
        title: "Unable to create assignment",
        description: error instanceof Error ? error.message : "Please try again.",
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
        description="Create a new assignment for a class"
      />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="title" placeholder="Assignment title" required />
            <Textarea name="description" placeholder="Assignment description" rows={4} required />

            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.data?.map((cls) => (
                  <SelectItem key={cls._id} value={cls._id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input name="dueDate" type="date" required />
            <Input name="maxScore" type="number" min="1" defaultValue="100" required />

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Assignment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homework">Homework</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/academics")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !selectedClassId}>
                {loading ? "Creating..." : "Create assignment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
