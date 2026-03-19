"use client";

import { useState } from "react";
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
import { Plus, Trash2, CheckSquare, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Priority = "low" | "medium" | "high";
type Task = {
  id: string;
  title: string;
  priority: Priority;
  done: boolean;
  dueDate?: string;
  createdAt: number;
};

const priorityColors: Record<Priority, "outline" | "secondary" | "destructive"> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
};

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Review new student applications",
      priority: "high",
      done: false,
      dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      createdAt: Date.now() - 3600000,
    },
    {
      id: "2",
      title: "Approve payroll for March",
      priority: "high",
      done: false,
      dueDate: new Date(Date.now() + 172800000).toISOString().split("T")[0],
      createdAt: Date.now() - 7200000,
    },
    {
      id: "3",
      title: "Update school fee structure",
      priority: "medium",
      done: false,
      createdAt: Date.now() - 86400000,
    },
    {
      id: "4",
      title: "Send term-end report to parents",
      priority: "medium",
      done: true,
      createdAt: Date.now() - 172800000,
    },
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const handleToggle = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Task deleted" });
  };

  const handleAdd = () => {
    if (!newTitle.trim()) {
      toast({ title: "Task title is required", variant: "destructive" });
      return;
    }
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      priority: newPriority,
      done: false,
      dueDate: newDueDate || undefined,
      createdAt: Date.now(),
    };
    setTasks((prev) => [task, ...prev]);
    setNewTitle("");
    setNewPriority("medium");
    setNewDueDate("");
    setShowAddDialog(false);
    toast({ title: "Task added" });
  };

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;

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

      {/* Stats */}
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
              <p className="text-2xl font-bold">{tasks.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
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

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === "all" ? "All Tasks" : filter === "pending" ? "Pending Tasks" : "Completed Tasks"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No tasks found. Add one to get started.
            </p>
          ) : (
            filtered.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <Checkbox
                  checked={task.done}
                  onCheckedChange={() => handleToggle(task.id)}
                  id={`task-${task.id}`}
                />
                <Label
                  htmlFor={`task-${task.id}`}
                  className={`flex-1 cursor-pointer ${task.done ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title}
                </Label>
                <div className="flex items-center gap-2 shrink-0">
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      Due {task.dueDate}
                    </span>
                  )}
                  <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
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
              <Select
                value={newPriority}
                onValueChange={(v) => setNewPriority(v as Priority)}
              >
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
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
