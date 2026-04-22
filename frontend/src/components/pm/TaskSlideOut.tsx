"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { toast } from "sonner";

type TaskSlideOutProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any | null;
  statuses: string[];
};

const PRIORITIES = ["urgent", "high", "medium", "low", "none"];

export function TaskSlideOut({ open, onOpenChange, task, statuses }: TaskSlideOutProps) {
  const { sessionToken } = useAuth();
  const updateTask = useMutation(api.modules.pm.tasks.updateTask);
  const addComment = useMutation(api.modules.pm.tasks.addComment);
  const logTime = useMutation(api.modules.pm.timeLogs.logTime);
  const [comment, setComment] = useState("");
  const [minutes, setMinutes] = useState("60");
  const [saving, setSaving] = useState(false);

  const labels = useMemo(() => (task?.labels ?? []).join(", "), [task?.labels]);

  if (!task) return null;

  const patch = async (payload: Record<string, unknown>) => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await updateTask({
        sessionToken,
        taskId: task._id,
        ...payload,
      } as any);
      toast.success("Task updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[560px]">
        <SheetHeader>
          <SheetTitle>{task.title}</SheetTitle>
          <SheetDescription>Update task details, log time, and capture delivery context.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section className="space-y-2">
            <Label>Title</Label>
            <Input defaultValue={task.title} onBlur={(event) => void patch({ title: event.target.value })} />
          </section>

          <section className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={5}
              defaultValue={task.description}
              onBlur={(event) => void patch({ description: event.target.value })}
            />
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue={task.status} onValueChange={(value) => void patch({ status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <section className="space-y-2">
              <Label>Priority</Label>
              <Select defaultValue={task.priority} onValueChange={(value) => void patch({ priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="space-y-2">
              <Label>Assignee</Label>
              <Input
                defaultValue={task.assigneeId ?? ""}
                placeholder="user id"
                onBlur={(event) => void patch({ assigneeId: event.target.value || undefined })}
              />
            </section>
            <section className="space-y-2">
              <Label>Reviewer</Label>
              <Input
                defaultValue={task.reviewerId ?? ""}
                placeholder="user id"
                onBlur={(event) => void patch({ reviewerId: event.target.value || undefined })}
              />
            </section>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="date"
                defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
                onBlur={(event) =>
                  void patch({
                    dueDate: event.target.value
                      ? new Date(`${event.target.value}T00:00:00`).getTime()
                      : undefined,
                  })
                }
              />
            </section>
            <section className="space-y-2">
              <Label>Estimate minutes</Label>
              <Input
                type="number"
                defaultValue={task.estimateMinutes ?? ""}
                onBlur={(event) =>
                  void patch({
                    estimateMinutes: event.target.value ? Number(event.target.value) : undefined,
                  })
                }
              />
            </section>
          </div>

          <section className="space-y-2">
            <Label>Labels</Label>
            <Input
              defaultValue={labels}
              onBlur={(event) =>
                void patch({
                  labels: event.target.value
                    .split(",")
                    .map((entry) => entry.trim())
                    .filter(Boolean),
                })
              }
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Log time</p>
              <p className="text-xs text-slate-500">Capture work immediately without leaving the board.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <Input value={minutes} onChange={(event) => setMinutes(event.target.value)} type="number" />
              <Button
                disabled={saving || !sessionToken}
                onClick={async () => {
                  try {
                    await logTime({
                      sessionToken,
                      taskId: task._id,
                      durationMinutes: Number(minutes || 0),
                      date: new Date().toISOString().slice(0, 10),
                      billable: false,
                    } as any);
                    toast.success("Time logged.");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to log time.");
                  }
                }}
              >
                Log Minutes
              </Button>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Comments</p>
              <p className="text-xs text-slate-500">Use this for handoffs, blockers, and reviewer context.</p>
            </div>
            <Textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} />
            <Button
              disabled={saving || !comment.trim() || !sessionToken}
              onClick={async () => {
                try {
                  await addComment({
                    sessionToken,
                    taskId: task._id,
                    body: comment.trim(),
                  } as any);
                  setComment("");
                  toast.success("Comment added.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Failed to add comment.");
                }
              }}
            >
              Add Comment
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

