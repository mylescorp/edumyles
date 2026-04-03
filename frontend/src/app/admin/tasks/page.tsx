"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, CheckSquare, Clock, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Priority = "low" | "medium" | "high";
type AdminTask = {
  _id: Id<"adminTasks">;
  title: string;
  done: boolean;
  priority: Priority;
  dueDate?: string;
};

const priorityColors: Record<Priority, "outline" | "secondary" | "destructive"> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
};

export default function TasksPage() {
  const modulesApi = api as any;
  const tasks = useQuery(modulesApi.modules.tasks.queries.listTasks, {}) as AdminTask[] | undefined;
  const createTask = useMutation(modulesApi.modules.tasks.mutations.createTask);
  const toggleTask = useMutation(modulesApi.modules.tasks.mutations.toggleTask);
  const deleteTask = useMutation(modulesApi.modules.tasks.mutations.deleteTask);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [saving, setSaving] = useState(false);

  const allTasks = tasks ?? [];

  const handleToggle = async (id: Id<"adminTasks">) => {
    try {
      await toggleTask({ id });
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (id: Id<"adminTasks">) => {
    try {
      await deleteTask({ id });
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) {
      toast.error("Task title is required");
      return;
    }
    setSaving(true);
    try {
      await createTask({
        title: newTitle.trim(),
        priority: newPriority,
        dueDate: newDueDate || undefined,
      });
      setNewTitle("");
      setNewPriority("medium");
      setNewDueDate("");
      setShowAddDialog(false);
      toast.success("Task added");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const filtered = allTasks.filter((t: AdminTask) => {
    if (filter === "pending") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  const pendingCount = allTasks.filter((t: AdminTask) => !t.done).length;
  const doneCount = allTasks.filter((t: AdminTask) => t.done).length;
  const isLoading = tasks === undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Manage your personal to-do list and action items"
        actions={
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{doneCount}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{allTasks.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "done"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filter === "all" ? "All Tasks" : filter === "pending" ? "Pending Tasks" : "Completed Tasks"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No tasks found. Add one to get started.
            </p>
          ) : (
            filtered.map((task: AdminTask) => (
              <div
                key={task._id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <Checkbox
                  checked={task.done}
                  onCheckedChange={() => handleToggle(task._id)}
                  id={`task-${task._id}`}
                />
                <Label
                  htmlFor={`task-${task._id}`}
                  className={`flex-1 cursor-pointer ${task.done ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title}
                </Label>
                <div className="flex items-center gap-2 shrink-0">
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">Due {task.dueDate}</span>
                  )}
                  <Badge variant={priorityColors[task.priority as Priority]}>{task.priority}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(task._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Task Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter task description..."
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
