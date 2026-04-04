"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

export default function AdminCreateExamPage() {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [classId, setClassId] = useState("");
  const [className, setClassName] = useState("");

  const classes = useQuery(
    api.modules.sis.queries.listClasses,
    sessionToken ? { sessionToken } : "skip"
  ) as any[] | undefined;
  const createExamination = useMutation(api.modules.academics.mutations.createExamination);

  if (isLoading || classes === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);

    try {
      await createExamination({
        name: String(formData.get("name") ?? ""),
        classId: classId || undefined,
        className: className || undefined,
        subjectId: undefined,
        date: String(formData.get("date") ?? ""),
        startTime: String(formData.get("startTime") ?? "") || undefined,
        endTime: String(formData.get("endTime") ?? "") || undefined,
        venue: String(formData.get("venue") ?? "") || undefined,
        totalMarks: Number(formData.get("totalMarks") ?? 100),
        passMark: Number(formData.get("passMark") ?? 50),
      });

      toast({
        title: "Exam scheduled",
        description: "The examination has been created successfully.",
      });
      router.push("/admin/academics/exams");
    } catch (error) {
      toast({
        title: "Unable to schedule exam",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule Examination" description="Create a new exam session" />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Exam name</Label>
              <Input id="name" name="name" placeholder="Midterm Mathematics" required />
            </div>

            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={classId}
                onValueChange={(value) => {
                  setClassId(value);
                  const selectedClass = classes.find((entry) => entry._id === value);
                  setClassName(selectedClass?.name ?? "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((entry) => (
                    <SelectItem key={entry._id} value={entry._id}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" name="venue" placeholder="Main Hall" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start time</Label>
                <Input id="startTime" name="startTime" type="time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End time</Label>
                <Input id="endTime" name="endTime" type="time" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total marks</Label>
                <Input id="totalMarks" name="totalMarks" type="number" min="1" defaultValue="100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passMark">Pass mark</Label>
                <Input id="passMark" name="passMark" type="number" min="0" defaultValue="50" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/academics/exams")}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Scheduling..." : "Schedule exam"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
