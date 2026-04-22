"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/components/pm/TaskCard";
import { cn } from "@/lib/utils";

type KanbanBoardProps = {
  statuses: string[];
  tasks: any[];
  onOpenTask: (task: any) => void;
  onMoveTask: (task: any, nextStatus: string) => Promise<void> | void;
};

export function KanbanBoard({ statuses, tasks, onOpenTask, onMoveTask }: KanbanBoardProps) {
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return statuses.map((status) => ({
      status,
      tasks: tasks
        .filter((task) => task.status === status)
        .sort((a, b) => (a.order ?? a.position ?? 0) - (b.order ?? b.position ?? 0)),
    }));
  }, [statuses, tasks]);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="grid min-w-[1100px] grid-cols-5 gap-4">
        {grouped.map((column) => (
          <section
            key={column.status}
            onDragOver={(event) => {
              event.preventDefault();
              setDropStatus(column.status);
            }}
            onDragLeave={() => setDropStatus((current) => (current === column.status ? null : current))}
            onDrop={async (event) => {
              event.preventDefault();
              const taskId = event.dataTransfer.getData("text/task-id");
              const task = tasks.find((entry) => String(entry._id) === taskId);
              setDropStatus(null);
              setDragTaskId(null);
              if (!task || task.status === column.status) return;
              await onMoveTask(task, column.status);
            }}
            className={cn(
              "rounded-[28px] border border-slate-200 bg-slate-50/80 p-4 transition",
              dropStatus === column.status && "border-emerald-300 bg-emerald-50/80"
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{column.status}</p>
                <p className="text-xs text-slate-500">Move work here when it advances.</p>
              </div>
              <Badge variant="secondary">{column.tasks.length}</Badge>
            </div>

            <div className="space-y-3">
              {column.tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-xs text-slate-500">
                  Drop a task here.
                </div>
              ) : (
                column.tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    draggable
                    onDragStart={() => {
                      setDragTaskId(String(task._id));
                    }}
                    onDragEnd={() => {
                      setDragTaskId(null);
                      setDropStatus(null);
                    }}
                    onClick={() => onOpenTask(task)}
                  />
                ))
              )}
            </div>

            {dragTaskId && dropStatus === column.status ? (
              <div className="mt-3 rounded-2xl border border-emerald-300 bg-white px-3 py-2 text-xs text-emerald-700">
                Release to move into {column.status}.
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}

