"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-success-bg text-success border-success",
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground border",
  },
  beta: {
    label: "Beta",
    className: "bg-warning-bg text-em-accent-dark border-warning",
  },
  deprecated: {
    label: "Deprecated",
    className: "bg-danger-bg text-danger border-danger",
  },
  installed: {
    label: "Installed",
    className: "bg-success-bg text-success border-success",
  },
  not_installed: {
    label: "Not Installed",
    className: "bg-muted text-muted-foreground border",
  },
};

interface ModuleStatusBadgeProps {
  status: string;
  className?: string;
}

export function ModuleStatusBadge({ status, className }: ModuleStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border",
  };

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
