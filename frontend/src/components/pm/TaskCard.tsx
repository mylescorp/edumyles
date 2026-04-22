"use client";

import { Badge } from "@/components/ui/badge";
import { CalendarDays, GitBranch, MessageSquare, Timer } from "lucide-react";

type TaskCardProps = {
  task: any;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
  none: "bg-slate-300",
};

export function TaskCard({ task, onClick, draggable, onDragStart, onDragEnd }: TaskCardProps) {
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 h-10 w-1.5 rounded-full ${PRIORITY_STYLES[task.priority ?? "none"] ?? PRIORITY_STYLES.none}`}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{task.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {task.description || "No description added yet."}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 uppercase">
              {task.type ?? "task"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-1 font-medium uppercase text-slate-700">
              {task.priority}
            </span>
            {task.dueDate ? (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            ) : null}
            {!!task.actualHours ? (
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" />
                {task.actualHours}h
              </span>
            ) : null}
            {!!task.githubBranch || !!task.githubIssueNumber || !!task.githubPrNumber ? (
              <span className="inline-flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5" />
                GitHub linked
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {task.commentCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

